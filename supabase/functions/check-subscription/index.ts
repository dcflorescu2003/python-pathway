import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Check coupon-based premium (latest active redemption)
    const { data: redemptions } = await supabaseClient
      .from("coupon_redemptions")
      .select("premium_until, coupon_type")
      .eq("user_id", userId)
      .order("premium_until", { ascending: false })
      .limit(1);

    const latestRedemption = redemptions?.[0];
    const now = new Date();
    let couponActive = false;
    let couponEnd: string | null = null;
    let couponExpired = false;
    let couponType: string | null = null;

    if (latestRedemption) {
      const premiumUntil = new Date(latestRedemption.premium_until);
      couponType = latestRedemption.coupon_type || "student";
      if (premiumUntil > now) {
        couponActive = true;
        couponEnd = latestRedemption.premium_until;
        logStep("Active coupon premium", { until: couponEnd, type: couponType });
      } else {
        couponExpired = true;
        logStep("Coupon premium expired", { expired_at: latestRedemption.premium_until, type: couponType });
      }
    }

    // Check Stripe subscription
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    let stripeActive = false;
    let subscriptionEnd: string | null = null;
    let productId: string | null = null;

    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });

      if (subscriptions.data.length > 0) {
        stripeActive = true;
        const sub = subscriptions.data[0];

        if (sub.items?.data?.[0]?.price?.product) {
          const prod = sub.items.data[0].price.product;
          productId = typeof prod === "string" ? prod : prod.id;
        }

        let periodEnd: number | null = null;
        if (typeof sub.current_period_end === "number") {
          periodEnd = sub.current_period_end;
        } else if (sub.items?.data?.[0] && typeof sub.items.data[0].current_period_end === "number") {
          periodEnd = sub.items.data[0].current_period_end;
        }

        subscriptionEnd = periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null;

        logStep("Active Stripe subscription", {
          subscription_id: sub.id,
          end: subscriptionEnd,
          product_id: productId,
        });
      }
    }

    const isPremium = stripeActive || couponActive;

    // Sync profile: if coupon expired and no stripe, downgrade premium
    const profileUpdate: Record<string, any> = { is_premium: isPremium };
    if (couponExpired && !stripeActive && !couponActive) {
      // If expired teacher coupon, only remove teacher status if verification was via coupon
      // Teachers verified through other methods (invite_code, document, referral) keep their status
      if (couponType === "teacher") {
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("verification_method")
          .eq("user_id", userId)
          .single();
        
        if (profile?.verification_method === "coupon") {
          profileUpdate.is_teacher = false;
          profileUpdate.teacher_status = null;
          profileUpdate.verification_method = null;
          logStep("Teacher coupon expired, removing teacher status (was coupon-verified)");
        } else {
          logStep("Teacher coupon expired, keeping teacher status (verified via " + profile?.verification_method + ")");
        }
      }
    }
    await supabaseClient.from("profiles").update(profileUpdate).eq("user_id", userId);

    // Calculate days remaining for coupon
    let couponDaysRemaining: number | null = null;
    if (couponActive && couponEnd) {
      couponDaysRemaining = Math.ceil((new Date(couponEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return new Response(JSON.stringify({
      subscribed: isPremium,
      subscription_end: subscriptionEnd || couponEnd,
      source: stripeActive ? "stripe" : couponActive ? "coupon" : null,
      coupon_expired: couponExpired && !stripeActive,
      coupon_type: couponType,
      coupon_days_remaining: couponDaysRemaining,
      product_id: productId,
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
