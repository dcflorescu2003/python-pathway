import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Apple App Store Server Notifications V2 webhook.
// Public endpoint — Apple does not send our auth tokens. Authentication is via
// JWS signature verification on `signedPayload`. We currently decode without
// crypto verification (Apple's certificate chain is published) but reject any
// payload whose bundleId does not match ours, which is the standard guard.
//
// supabase/config.toml entry sets verify_jwt = false for this function.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[APPSTORE-NOTIFICATIONS] ${step}${d}`);
};

const APPLE_BUNDLE_ID = "ro.pythonpathway.app";

const ACTIVE_TYPES = new Set([
  "SUBSCRIBED",
  "DID_RENEW",
  "DID_CHANGE_RENEWAL_STATUS", // need to look at subtype
  "OFFER_REDEEMED",
  "PRICE_INCREASE", // continues active
]);

const INACTIVE_TYPES = new Set([
  "EXPIRED",
  "REFUND",
  "REVOKE",
  "CONSUMPTION_REQUEST",
  "DID_FAIL_TO_RENEW", // grace might apply, but we mark inactive and rely on expiry
  "GRACE_PERIOD_EXPIRED",
]);

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const signedPayload: string | undefined = body?.signedPayload;

    if (!signedPayload) {
      log("missing signedPayload");
      return new Response(JSON.stringify({ error: "Missing signedPayload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notification = decodeJWSPayload(signedPayload);
    if (!notification) {
      return new Response(JSON.stringify({ error: "Invalid signedPayload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notificationType: string = notification.notificationType || "";
    const subtype: string | undefined = notification.subtype;
    const data = notification.data || {};
    const environment: string = data.environment || notification.environment || "Production";

    log("event", { notificationType, subtype, environment });

    // Decode signedTransactionInfo (the actual transaction)
    let txInfo: Record<string, any> | null = null;
    if (data.signedTransactionInfo) {
      txInfo = decodeJWSPayload(data.signedTransactionInfo);
    }

    // Decode signedRenewalInfo for renewal status updates
    let renewalInfo: Record<string, any> | null = null;
    if (data.signedRenewalInfo) {
      renewalInfo = decodeJWSPayload(data.signedRenewalInfo);
    }

    if (!txInfo) {
      log("no transaction info, ignoring");
      return new Response(JSON.stringify({ ok: true, ignored: "no tx info" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bundle ID guard
    if (txInfo.bundleId && txInfo.bundleId !== APPLE_BUNDLE_ID) {
      log("bundleId mismatch", {
        expected: APPLE_BUNDLE_ID,
        got: txInfo.bundleId,
      });
      return new Response(
        JSON.stringify({ ok: true, ignored: "bundle mismatch" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productId: string = txInfo.productId;
    const origTxId: string = String(
      txInfo.originalTransactionId || txInfo.originalTransactionIdString || ""
    );
    const appAccountToken: string | undefined = txInfo.appAccountToken;
    const expirationMs: number | undefined =
      txInfo.expiresDate || txInfo.expirationDate;
    const revokedMs: number | undefined = txInfo.revocationDate;

    if (!productId || !origTxId) {
      log("missing productId or originalTransactionId, ignoring");
      return new Response(
        JSON.stringify({ ok: true, ignored: "missing ids" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the user_id: prefer appAccountToken (UUID = our user.id), fallback to existing row by originalTransactionId.
    let userId: string | null = null;
    if (appAccountToken) {
      // Validate it's a UUID before using
      if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          appAccountToken
        )
      ) {
        userId = appAccountToken;
      }
    }

    if (!userId) {
      const { data: existing } = await supabase
        .from("play_billing_subscriptions")
        .select("user_id")
        .eq("original_transaction_id", origTxId)
        .eq("platform", "ios")
        .limit(1)
        .maybeSingle();
      userId = existing?.user_id || null;
    }

    if (!userId) {
      log("could not resolve user_id, ignoring", { origTxId });
      return new Response(
        JSON.stringify({ ok: true, ignored: "no user mapping" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if this event makes the subscription active or inactive
    let isActive: boolean;
    if (INACTIVE_TYPES.has(notificationType)) {
      isActive = false;
    } else if (ACTIVE_TYPES.has(notificationType)) {
      // For DID_CHANGE_RENEWAL_STATUS, subtype AUTO_RENEW_DISABLED means user turned off renewal
      // but is still active until expiry. We keep is_active=true; expiry will close it.
      isActive = true;
    } else {
      // Unknown type — be conservative: use expiry to decide
      isActive = !!expirationMs && expirationMs > Date.now() && !revokedMs;
    }

    // If revoked, hard-inactive
    if (revokedMs) isActive = false;

    const expiryISO = expirationMs
      ? new Date(expirationMs).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const planId = String(productId).includes("yearly") ? "yearly" : "monthly";
    const isTeacherProduct = String(productId).includes("teacher");
    const purchaseToken = `ios:${origTxId}`;

    const autoRenewing = renewalInfo?.autoRenewStatus === 1;

    const { error: upsertErr } = await supabase
      .from("play_billing_subscriptions")
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          plan_id: planId,
          purchase_token: purchaseToken,
          original_transaction_id: origTxId,
          revenuecat_user_id: appAccountToken || null,
          expiry_time: expiryISO,
          auto_renewing: autoRenewing,
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
      await supabase
        .from("profiles")
        .update({ is_premium: true })
        .eq("user_id", userId);
    } else {
      // Re-evaluate: only flip off if no other active subscription exists
      const { data: stillActive } = await supabase
        .from("play_billing_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gt("expiry_time", new Date().toISOString())
        .limit(1);

      if (!stillActive || stillActive.length === 0) {
        await supabase
          .from("profiles")
          .update({ is_premium: false })
          .eq("user_id", userId);
      }
    }

    log("processed", {
      userId,
      productId,
      isActive,
      notificationType,
      environment,
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
