import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (s: string, d?: unknown) =>
  console.log(`[VERIFY-PLAY-PURCHASE] ${s}${d ? " - " + JSON.stringify(d) : ""}`);

const PACKAGE_NAME = "ro.pythonpathway.app";

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const enc = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const toSign = `${enc(header)}.${enc(claim)}`;

  // Import private key
  const pem = sa.private_key.replace(/\\n/g, "\n");
  const pemContents = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(toSign)
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${toSign}.${sig}`;

  const tokenRes = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  }
  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    log("started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No auth header");
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Invalid token");

    const userId = claimsData.claims.sub as string;
    if (!userId) throw new Error("No user");

    const body = await req.json();
    const { purchaseToken, productId, planId, orderId } = body;
    if (!purchaseToken || !productId) throw new Error("Missing purchaseToken or productId");

    log("verifying", { userId, productId, planId, tokenLen: purchaseToken.length, tokenPrefix: purchaseToken.slice(0, 12) });

    const saJson = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
    let expiryTime: Date;
    let autoRenewing = true;

    if (saJson) {
      // Real verification with Google Play Developer API
      const sa: ServiceAccount = JSON.parse(saJson);
      const accessToken = await getAccessToken(sa);

      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
      const playRes = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!playRes.ok) {
        const errText = await playRes.text();
        log("Play API error", { status: playRes.status, body: errText });
        throw new Error(`Play API verification failed: ${playRes.status}`);
      }

      const purchase = await playRes.json();
      log("Play API response", { state: purchase.subscriptionState });

      // Check active state
      const validStates = ["SUBSCRIPTION_STATE_ACTIVE", "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"];
      if (!validStates.includes(purchase.subscriptionState)) {
        throw new Error(`Subscription not active: ${purchase.subscriptionState}`);
      }

      const lineItems = purchase.lineItems || [];
      const expiry = lineItems[0]?.expiryTime;
      if (!expiry) throw new Error("No expiry time in Play response");
      expiryTime = new Date(expiry);
      autoRenewing = !purchase.canceledStateContext;
    } else {
      // No service account configured yet — store raw purchase optimistically
      // (will be re-verified once GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is set)
      log("No GOOGLE_PLAY_SERVICE_ACCOUNT_JSON; storing unverified");
      const days = planId === "yearly" ? 365 : 30;
      expiryTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    // Upsert subscription
    const { error: upsertErr } = await supabaseClient
      .from("play_billing_subscriptions")
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          plan_id: planId || null,
          purchase_token: purchaseToken,
          order_id: orderId || null,
          expiry_time: expiryTime.toISOString(),
          auto_renewing: autoRenewing,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "purchase_token" }
      );

    if (upsertErr) throw upsertErr;

    // Sync profile premium flag
    await supabaseClient.from("profiles").update({ is_premium: true }).eq("user_id", userId);

    return new Response(
      JSON.stringify({
        success: true,
        expiryTime: expiryTime.toISOString(),
        productId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
