import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Public webhook — no JWT (RevenueCat does not send Supabase auth tokens).
// Authenticated via shared bearer secret REVENUECAT_WEBHOOK_AUTH that you also paste
// into RevenueCat Dashboard → Project Settings → Integrations → Webhook → "Authorization Header".
//
// supabase/config.toml entry sets verify_jwt = false for this function.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REVENUECAT-WEBHOOK] ${step}${d}`);
};

const ACTIVE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
]);
const INACTIVE_EVENTS = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
  "SUBSCRIPTION_PAUSED",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate shared secret
    const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
    const actual = req.headers.get("Authorization");
    if (!expected) {
      log("missing REVENUECAT_WEBHOOK_AUTH secret");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (actual !== expected && actual !== `Bearer ${expected}`) {
      log("auth rejected");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body?.event;
    if (!event?.type) {
      return new Response(JSON.stringify({ error: "Missing event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType: string = event.type;
    const productId: string | undefined =
      event.product_id || event.product_identifier;
    const appUserId: string | undefined = event.app_user_id; // = supabase user.id (we set it on init)
    const originalAppUserId: string | undefined = event.original_app_user_id;
    const expirationMs: number | undefined =
      event.expiration_at_ms || event.expirationAtMs;
    const purchasedMs: number | undefined =
      event.purchased_at_ms || event.purchasedAtMs;
    const originalTransactionId: string | undefined =
      event.original_transaction_id;
    const store: string = event.store || "APP_STORE";

    log("event received", {
      type: eventType,
      productId,
      appUserId,
      store,
    });

    // Only handle iOS events here. Android continues to use verify-play-purchase.
    if (store !== "APP_STORE") {
      return new Response(
        JSON.stringify({ ok: true, ignored: "non-ios event" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = appUserId || originalAppUserId;
    if (!userId) {
      log("no app_user_id, skipping");
      return new Response(
        JSON.stringify({ ok: true, ignored: "no user id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const expiryISO = expirationMs
      ? new Date(expirationMs).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const planId = productId?.includes("yearly") ? "yearly" : "monthly";
    const purchaseToken =
      originalTransactionId || `ios:${userId}:${productId || "unknown"}`;

    if (ACTIVE_EVENTS.has(eventType)) {
      const { error } = await supabase
        .from("play_billing_subscriptions")
        .upsert(
          {
            user_id: userId,
            product_id: productId || "unknown",
            plan_id: planId,
            purchase_token: purchaseToken,
            original_transaction_id: originalTransactionId || null,
            revenuecat_user_id: originalAppUserId || appUserId || null,
            expiry_time: expiryISO,
            auto_renewing: true,
            is_active: true,
            platform: "ios",
          },
          { onConflict: "purchase_token" }
        );
      if (error) {
        log("upsert active error", error);
        throw error;
      }

      await supabase
        .from("profiles")
        .update({ is_premium: true })
        .eq("user_id", userId);

      log("activated", { userId, productId, expiryISO });
    } else if (INACTIVE_EVENTS.has(eventType)) {
      // Mark inactive but keep row for audit
      await supabase
        .from("play_billing_subscriptions")
        .update({ is_active: false, auto_renewing: false })
        .eq("purchase_token", purchaseToken);

      // Re-evaluate is_premium: only flip off if no other active subscription exists
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

      log("deactivated", { userId, eventType });
    } else {
      log("unhandled event type", { eventType });
    }

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
