import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFCMPushes } from "../_shared/push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Useri care au ajuns la 5/5 vieți în ultimele 30 minute (din trigger)
    // și nu sunt premium (premium are ∞ vieți, nu are sens)
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("user_id, lives, last_life_refill_at, is_premium")
      .eq("lives", 5)
      .eq("is_premium", false)
      .gte("last_life_refill_at", thirtyMinAgo.toISOString())
      .lte("last_life_refill_at", now.toISOString());

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessages: Record<string, { title: string; body: string }> = {};
    const inAppRows: any[] = [];

    for (const u of users) {
      const title = "Vieți pline! ❤️";
      const body = "Ai 5/5 vieți. Hai să le folosim într-o lecție!";
      userMessages[u.user_id] = { title, body };
      inAppRows.push({ user_id: u.user_id, title, body });
    }

    if (inAppRows.length > 0) {
      await adminClient.from("notifications").insert(inAppRows);
    }

    await sendFCMPushes(adminClient, userMessages);

    return new Response(JSON.stringify({ notified: inAppRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-lives-refilled error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
