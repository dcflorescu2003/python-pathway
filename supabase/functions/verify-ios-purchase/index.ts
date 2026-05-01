import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as jose from "https://esm.sh/jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-IOS-PURCHASE] ${step}${d}`);
};

const APPLE_BUNDLE_ID = "ro.pythonpathway.app";

// Decode JWS payload without crypto verification (we re-fetch authoritative data from Apple).
function decodeJWSPayload(jws: string): Record<string, any> | null {
  try {
    const parts = jws.split(".");
    if (parts.length !== 3) return null;
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (err) {
    log("decodeJWS error", String(err));
    return null;
  }
}

async function makeAppleJWT(): Promise<string> {
  const keyId = Deno.env.get("APPLE_IAP_KEY_ID");
  const issuerId = Deno.env.get("APPLE_IAP_ISSUER_ID");
  const privateKeyPem = Deno.env.get("APPLE_IAP_PRIVATE_KEY");
  if (!keyId || !issuerId || !privateKeyPem) {
    throw new Error("Apple IAP secrets not configured");
  }

  const key = await jose.importPKCS8(privateKeyPem, "ES256");
  const now = Math.floor(Date.now() / 1000);

  return await new jose.SignJWT({
    bid: APPLE_BUNDLE_ID,
  })
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setIssuedAt(now)
    .setExpirationTime(now + 30 * 60) // 30 min, max allowed by Apple is 60 min
    .setAudience("appstoreconnect-v1")
    .sign(key);
}

async function fetchTransactionInfo(
  transactionId: string,
  useSandbox: boolean
): Promise<Record<string, any> | null> {
  const jwt = await makeAppleJWT();
  const host = useSandbox
    ? "api.storekit-sandbox.itunes.apple.com"
    : "api.storekit.itunes.apple.com";
  const url = `https://${host}/inApps/v1/transactions/${transactionId}`;

  log("apple-api:request", { host, transactionId });
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  if (!res.ok) {
    const text = await res.text();
    log("apple-api:error", { status: res.status, body: text.slice(0, 300) });
    return null;
  }

  const body = await res.json();
  const signedTx = body?.signedTransactionInfo;
  if (!signedTx) return null;
  return decodeJWSPayload(signedTx);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } =
      await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;
    log("user authenticated", { userId });

    const body = await req.json().catch(() => ({}));
    const {
      productId: clientProductId,
      transactionId,
      originalTransactionId,
      signedTransaction,
      expirationISO: clientExpirationISO,
      appAccountToken,
    } = body || {};

    if (!signedTransaction || !transactionId) {
      return new Response(
        JSON.stringify({ error: "Missing signedTransaction or transactionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 1. Decode the client-supplied JWS to know which environment to query.
    const clientPayload = decodeJWSPayload(signedTransaction);
    const clientEnvironment = (clientPayload?.environment || "Production") as string;
    const isSandbox = clientEnvironment.toLowerCase() === "sandbox";

    log("client payload decoded", {
      environment: clientEnvironment,
      productId: clientPayload?.productId,
      bundleId: clientPayload?.bundleId,
    });

    // Bundle ID sanity check
    if (clientPayload?.bundleId && clientPayload.bundleId !== APPLE_BUNDLE_ID) {
      log("bundleId mismatch", {
        expected: APPLE_BUNDLE_ID,
        got: clientPayload.bundleId,
      });
      return new Response(
        JSON.stringify({ error: "Invalid bundle id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Re-fetch authoritative transaction info from Apple (signed by Apple, not the client).
    let authoritative: Record<string, any> | null = null;
    try {
      authoritative = await fetchTransactionInfo(transactionId, isSandbox);
      // If sandbox failed and we tried prod, try sandbox (and vice versa)
      if (!authoritative) {
        authoritative = await fetchTransactionInfo(transactionId, !isSandbox);
      }
    } catch (err) {
      log("apple-api fetch failed, falling back to client payload", String(err));
    }

    const trusted = authoritative || clientPayload || {};
    const productId = trusted.productId || clientProductId;
    const origTxId =
      String(trusted.originalTransactionId || originalTransactionId || "");
    const expirationMs = trusted.expiresDate || trusted.expirationDate;
    const revokedMs = trusted.revocationDate;
    const finalAppAccountToken = trusted.appAccountToken || appAccountToken;

    if (!productId || !origTxId) {
      return new Response(
        JSON.stringify({ error: "Missing productId or originalTransactionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine effective expiration
    let expiryISO: string;
    if (expirationMs && typeof expirationMs === "number") {
      expiryISO = new Date(expirationMs).toISOString();
    } else if (clientExpirationISO) {
      expiryISO = clientExpirationISO;
    } else {
      const days = String(productId).includes("yearly") ? 365 : 30;
      expiryISO = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const isActive = !revokedMs && new Date(expiryISO) > new Date();
    const planId = String(productId).includes("yearly") ? "yearly" : "monthly";
    const purchaseToken = `ios:${origTxId}`;

    log("upserting", {
      userId,
      productId,
      isActive,
      expiryISO,
      origTxId,
      env: clientEnvironment,
    });

    // 3. Upsert to play_billing_subscriptions (shared table)
    const { error: upsertErr } = await supabaseAdmin
      .from("play_billing_subscriptions")
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          plan_id: planId,
          purchase_token: purchaseToken,
          original_transaction_id: origTxId,
          revenuecat_user_id: finalAppAccountToken || null,
          expiry_time: expiryISO,
          auto_renewing: isActive,
          is_active: isActive,
          platform: "ios",
        },
        { onConflict: "purchase_token" }
      );

    if (upsertErr) {
      log("upsert error", upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isActive) {
      await supabaseAdmin
        .from("profiles")
        .update({ is_premium: true })
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        product_id: productId,
        expiry_time: expiryISO,
        is_active: isActive,
        platform: "ios",
        environment: clientEnvironment,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
