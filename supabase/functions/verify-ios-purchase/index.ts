import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-IOS-PURCHASE] ${step}${d}`);
};

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
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
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
      productId,
      originalTransactionId,
      revenuecatUserId,
      expirationISO,
      entitlements,
    } = body || {};

    log("payload", {
      productId,
      hasExpiration: !!expirationISO,
      entitlementCount: entitlements ? Object.keys(entitlements).length : 0,
    });

    if (!productId) {
      return new Response(JSON.stringify({ error: "Missing productId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine expiration
    let expiryTime: string | null = expirationISO || null;
    if (!expiryTime && entitlements && typeof entitlements === "object") {
      const first = Object.values(entitlements)[0] as any;
      expiryTime = first?.expirationDate || null;
    }

    // If we still don't have an expiration but the product was purchased, give 30 days as a safe optimistic guess.
    // RevenueCat webhook will correct this.
    if (!expiryTime) {
      const days = productId.includes("yearly") ? 365 : 30;
      expiryTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    // Map productId → plan_id
    const planId = productId.includes("yearly") ? "yearly" : "monthly";

    // Use originalTransactionId as the unique purchase_token for iOS rows.
    // If missing, fall back to a synthetic token tied to user+product (still UNIQUE).
    const purchaseToken =
      originalTransactionId || `ios:${userId}:${productId}`;

    // Upsert into shared subscriptions table
    const { error: upsertErr } = await supabaseAdmin
      .from("play_billing_subscriptions")
      .upsert(
        {
          user_id: userId,
          product_id: productId,
          plan_id: planId,
          purchase_token: purchaseToken,
          original_transaction_id: originalTransactionId || null,
          revenuecat_user_id: revenuecatUserId || null,
          expiry_time: expiryTime,
          auto_renewing: true,
          is_active: true,
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

    // Also flip is_premium on the profile immediately (will be re-synced by check-subscription)
    await supabaseAdmin
      .from("profiles")
      .update({ is_premium: true })
      .eq("user_id", userId);

    log("subscription recorded", { userId, productId, expiryTime });

    return new Response(
      JSON.stringify({
        ok: true,
        product_id: productId,
        expiry_time: expiryTime,
        platform: "ios",
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
