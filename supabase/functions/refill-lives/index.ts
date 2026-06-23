import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkSchedulerSecret } from "../_shared/scheduler-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-scheduler-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = checkSchedulerSecret(req, corsHeaders);
  if (denied) return denied;

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Refill free, non-premium users who hit 0 lives more than 30 min ago.
    // The mark_lives_refilled trigger will set last_life_refill_at, which the
    // send-lives-refilled cron picks up to notify users.
    const cutoffIso = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const { data, error } = await admin
      .from("profiles")
      .update({ lives: 5, lives_updated_at: nowIso })
      .eq("lives", 0)
      .eq("is_premium", false)
      .lt("lives_updated_at", cutoffIso)
      .select("user_id");

    if (error) throw error;

    const refilled = data?.length ?? 0;
    console.log(`[refill-lives] refilled ${refilled} profiles`);

    return new Response(JSON.stringify({ refilled }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("refill-lives error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
