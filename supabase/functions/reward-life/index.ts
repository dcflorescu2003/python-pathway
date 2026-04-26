import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_ADS_PER_DAY = 2;
const LIVES_PER_AD = 5;
const MAX_LIVES = 5;

const log = (...args: unknown[]) => console.log("[REWARD-LIFE]", ...args);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      log("Missing/invalid Authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized: missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const token = authHeader.replace("Bearer ", "");
    const anon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData?.user?.id) {
      log("Auth failed", userErr?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    log("User authenticated", userId);

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("lives, is_premium, ads_watched_today, ads_last_reset")
      .eq("user_id", userId)
      .single();

    if (profileErr || !profile) {
      log("Profile not found", profileErr?.message);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.is_premium) {
      return new Response(
        JSON.stringify({ error: "Premium users have unlimited lives" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    let watchedToday = profile.ads_watched_today ?? 0;
    if (profile.ads_last_reset !== today) {
      watchedToday = 0;
    }

    if (watchedToday >= MAX_ADS_PER_DAY) {
      return new Response(
        JSON.stringify({
          error: "Daily ad limit reached",
          remaining: 0,
          maxPerDay: MAX_ADS_PER_DAY,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newLives = Math.min(MAX_LIVES, (profile.lives ?? 0) + LIVES_PER_AD);
    const nowIso = new Date().toISOString();

    const { error: updateErr } = await admin
      .from("profiles")
      .update({
        lives: newLives,
        lives_updated_at: nowIso,
        ads_watched_today: watchedToday + 1,
        ads_last_reset: today,
      })
      .eq("user_id", userId);

    if (updateErr) {
      log("Update failed", updateErr.message);
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    log("Lives granted", { userId, newLives, watchedToday: watchedToday + 1 });

    return new Response(
      JSON.stringify({
        success: true,
        lives: newLives,
        livesUpdatedAt: nowIso,
        adsWatchedToday: watchedToday + 1,
        remaining: MAX_ADS_PER_DAY - (watchedToday + 1),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    log("Unhandled error", (err as Error).message);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
