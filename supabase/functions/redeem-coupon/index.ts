import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { code } = await req.json();
    if (!code || typeof code !== "string") throw new Error("Missing coupon code");

    const trimmedCode = code.trim().toUpperCase();

    // Atomic server-side redemption: validates code, checks max_uses under a row lock,
    // inserts the redemption, and increments used_count in a single transaction.
    const { data: result, error: rpcError } = await supabase.rpc("redeem_coupon_atomic", {
      p_code: trimmedCode,
      p_user_id: user.id,
    });

    if (rpcError) throw rpcError;

    const errorMap: Record<string, string> = {
      invalid: "Cupon invalid sau inactiv.",
      expired: "Cuponul a expirat.",
      max_uses: "Cuponul a fost deja folosit de numărul maxim de ori.",
      already_redeemed: "Ai folosit deja acest cupon.",
    };

    if (result?.error) {
      return new Response(JSON.stringify({ error: errorMap[result.error] ?? "Cupon invalid." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const couponType = result.coupon_type as string;
    const premiumUntil = new Date(result.premium_until as string);

    // Set user as premium + if teacher coupon, also set teacher status
    const profileUpdate: Record<string, any> = { is_premium: true };
    if (couponType === "teacher") {
      profileUpdate.is_teacher = true;
      profileUpdate.teacher_status = "verified";
      profileUpdate.verification_method = "coupon";
    }
    await supabase.from("profiles").update(profileUpdate).eq("user_id", user.id);


    return new Response(
      JSON.stringify({
        success: true,
        premium_until: premiumUntil.toISOString(),
        duration_days: coupon.duration_days,
        coupon_type: couponType,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
