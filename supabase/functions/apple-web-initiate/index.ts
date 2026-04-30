// Apple Sign In - Web flow: STEP 1 (initiate)
// Generează state + PKCE, salvează în DB, redirect către Apple.
// Public endpoint (verify_jwt = false).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const APPLE_WEB_CLIENT_ID = Deno.env.get("APPLE_WEB_CLIENT_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/apple-web-callback`;

const ALLOWED_RETURN_HOSTS = new Set([
  "pyroskill.info",
  "www.pyroskill.info",
  "pyro-learn.lovable.app",
]);

function isAllowedReturnTo(returnTo: string): boolean {
  try {
    const u = new URL(returnTo);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (ALLOWED_RETURN_HOSTS.has(u.hostname)) return true;
    // Lovable preview: id-preview--*.lovable.app
    if (u.hostname.endsWith(".lovable.app")) return true;
    return false;
  } catch {
    return false;
  }
}

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generatePkce() {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const code_verifier = base64UrlEncode(verifierBytes.buffer);
  const challengeBuf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(code_verifier),
  );
  const code_challenge = base64UrlEncode(challengeBuf);
  return { code_verifier, code_challenge };
}

function generateState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const returnTo = url.searchParams.get("return_to") || "https://pyroskill.info";

    if (!isAllowedReturnTo(returnTo)) {
      return new Response("Invalid return_to", { status: 400 });
    }

    const state = generateState();
    const { code_verifier, code_challenge } = await generatePkce();

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { error } = await supabase.from("apple_oauth_states").insert({
      state,
      code_verifier,
      return_to: returnTo,
    });
    if (error) {
      console.error("Failed to save oauth state", error);
      return new Response("State save failed", { status: 500 });
    }

    const params = new URLSearchParams({
      client_id: APPLE_WEB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      response_mode: "form_post",
      scope: "name email",
      state,
      code_challenge,
      code_challenge_method: "S256",
    });

    const appleUrl = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
    return Response.redirect(appleUrl, 302);
  } catch (e) {
    console.error("apple-web-initiate error", e);
    return new Response("Internal error", { status: 500 });
  }
});
