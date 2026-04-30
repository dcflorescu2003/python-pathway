// Apple Sign In - Web flow: STEP 2 (callback)
// Apple POST-uiește aici cu form_post. Validăm state, schimbăm code pe id_token,
// validăm id_token, găsim/creăm user, generăm magic link, redirect către frontend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SignJWT, jwtVerify, createRemoteJWKSet, importPKCS8 } from "https://esm.sh/jose@5.9.6";

const APPLE_TEAM_ID = Deno.env.get("APPLE_TEAM_ID")!;
const APPLE_KEY_ID = Deno.env.get("APPLE_KEY_ID")!;
const APPLE_PRIVATE_KEY = Deno.env.get("APPLE_PRIVATE_KEY")!;
const APPLE_WEB_CLIENT_ID = Deno.env.get("APPLE_WEB_CLIENT_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/apple-web-callback`;

const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

function normalizePrivateKey(raw: string): string {
  // Permite cazul în care secretul e copiat cu \n literali în loc de newline-uri reale.
  return raw.replace(/\\n/g, "\n").trim();
}

async function generateClientSecret(): Promise<string> {
  const pem = normalizePrivateKey(APPLE_PRIVATE_KEY);
  const privateKey = await importPKCS8(pem, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: APPLE_KEY_ID })
    .setIssuer(APPLE_TEAM_ID)
    .setIssuedAt(now)
    .setExpirationTime(now + 5 * 60)
    .setAudience("https://appleid.apple.com")
    .setSubject(APPLE_WEB_CLIENT_ID)
    .sign(privateKey);
}

function errorRedirect(returnTo: string, message: string): Response {
  const url = new URL(returnTo);
  url.pathname = "/auth/apple-finish";
  url.hash = `error=${encodeURIComponent(message)}`;
  return Response.redirect(url.toString(), 302);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const formData = await req.formData();
    const code = formData.get("code")?.toString();
    const state = formData.get("state")?.toString();
    const appleError = formData.get("error")?.toString();

    if (!state) return new Response("Missing state", { status: 400 });

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Recuperează state + verifier
    const { data: stateRow, error: stateErr } = await supabase
      .from("apple_oauth_states")
      .select("code_verifier, return_to, created_at")
      .eq("state", state)
      .maybeSingle();

    if (stateErr || !stateRow) {
      console.error("State lookup failed", stateErr);
      return new Response("Invalid state", { status: 400 });
    }

    // Șterge state-ul (one-time use)
    await supabase.from("apple_oauth_states").delete().eq("state", state);

    // TTL 10 minute
    const createdAt = new Date(stateRow.created_at).getTime();
    if (Date.now() - createdAt > 10 * 60 * 1000) {
      return errorRedirect(stateRow.return_to, "State expired");
    }

    if (appleError) {
      return errorRedirect(stateRow.return_to, `Apple error: ${appleError}`);
    }

    if (!code) {
      return errorRedirect(stateRow.return_to, "Missing authorization code");
    }

    // Generează client_secret JWT și schimbă code-ul pe id_token
    const clientSecret = await generateClientSecret();
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APPLE_WEB_CLIENT_ID,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code_verifier: stateRow.code_verifier,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Apple token exchange failed", tokenRes.status, text);
      return errorRedirect(stateRow.return_to, "Token exchange failed");
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token as string | undefined;
    if (!idToken) {
      return errorRedirect(stateRow.return_to, "No id_token from Apple");
    }

    // Validează id_token (semnătură + iss + aud + exp)
    let payload;
    try {
      const result = await jwtVerify(idToken, APPLE_JWKS, {
        issuer: "https://appleid.apple.com",
        audience: APPLE_WEB_CLIENT_ID,
      });
      payload = result.payload;
    } catch (e) {
      console.error("id_token validation failed", e);
      return errorRedirect(stateRow.return_to, "Invalid id_token");
    }

    const email = (payload.email as string | undefined)?.toLowerCase();
    const sub = payload.sub as string | undefined;

    if (!email || !sub) {
      return errorRedirect(stateRow.return_to, "Missing email/sub in token");
    }

    // Caută user existent după email
    const { data: usersList, error: listErr } =
      await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) {
      console.error("listUsers failed", listErr);
      return errorRedirect(stateRow.return_to, "User lookup failed");
    }

    let user = usersList.users.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (!user) {
      const { data: created, error: createErr } =
        await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { provider: "apple", apple_sub: sub },
          app_metadata: { provider: "apple", providers: ["apple"] },
        });
      if (createErr || !created.user) {
        console.error("createUser failed", createErr);
        return errorRedirect(stateRow.return_to, "User create failed");
      }
      user = created.user;
    }

    // Generează magic link pentru sesiune
    const { data: linkData, error: linkErr } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("generateLink failed", linkErr);
      return errorRedirect(stateRow.return_to, "Session generation failed");
    }

    const tokenHash = linkData.properties.hashed_token;

    const finishUrl = new URL(stateRow.return_to);
    finishUrl.pathname = "/auth/apple-finish";
    finishUrl.hash = `token_hash=${encodeURIComponent(tokenHash)}&type=magiclink`;

    return Response.redirect(finishUrl.toString(), 302);
  } catch (e) {
    console.error("apple-web-callback fatal error", e);
    return new Response("Internal error", { status: 500 });
  }
});
