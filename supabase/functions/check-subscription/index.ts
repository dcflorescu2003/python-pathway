import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    
    // Use anon client to validate the token via getClaims
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error(`Auth error: ${claimsError?.message || "Invalid token"}`);
    
    const userId = claimsData.claims.sub as string;
    const userEmail = claimsData.claims.email as string;
    if (!userId || !userEmail) throw new Error("User not authenticated");
    logStep("User authenticated", { email: userEmail });

    // Check coupon-based premium first
    const { data: redemptions } = await supabaseClient
      .from("coupon_redemptions")
      .select("premium_until")
      .eq("user_id", userId)
      .order("premium_until", { ascending: false })
      .limit(1);

    const latestRedemption = redemptions?.[0];
    const now = new Date();
    let couponActive = false;
    let couponEnd: string | null = null;
    let couponExpired = false;

    if (latestRedemption) {
      const premiumUntil = new Date(latestRedemption.premium_until);
      if (premiumUntil > now) {
        couponActive = true;
        couponEnd = latestRedemption.premium_until;
        logStep("Active coupon premium", { until: couponEnd });
      } else {
        // Coupon existed but expired
        couponExpired = true;
        logStep("Coupon premium expired", { expired_at: latestRedemption.premium_until });
      }
    }

    // Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    let stripeActive = false;
    let subscriptionEnd: string | null = null;

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        stripeActive = true;
        const sub = subscriptions.data[0];
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();
        logStep("Active Stripe subscription", { end: subscriptionEnd });
      }
    }

    const isPremium = stripeActive || couponActive;

    // Sync premium status to profile
    await supabaseClient.from("profiles").update({ is_premium: isPremium }).eq("user_id", userId);

    return new Response(JSON.stringify({
      subscribed: isPremium,
      subscription_end: subscriptionEnd || couponEnd,
      source: stripeActive ? "stripe" : couponActive ? "coupon" : null,
      coupon_expired: couponExpired && !stripeActive,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
