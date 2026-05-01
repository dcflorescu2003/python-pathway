import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFCMPushes } from "../_shared/push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const messages = [
  { title: "Te-am pierdut? 💚", body: "A trecut o săptămână fără tine. Python te așteaptă cu lecții noi!" },
  { title: "Reîncepe de unde ai rămas 🐍", body: "Progresul tău e salvat. Doar 5 minute și ești înapoi pe drum!" },
  { title: "Săptămâna asta e a ta! ⭐", body: "Reia ritmul cu o lecție scurtă. Mai poți recupera!" },
  { title: "Hai să restartăm! 🚀", body: "Ai nevoie doar de o lecție ca să te reapuci de Python." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const sevenDaysAgoMidnight = new Date(today);
    sevenDaysAgoMidnight.setDate(sevenDaysAgoMidnight.getDate() - 7);

    // Useri inactivi de >7 zile, care au cel puțin 1 lecție făcută vreodată (xp > 0)
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("user_id, display_name, xp, last_activity_date, last_weekly_reminder_at")
      .lt("last_activity_date", sevenDaysAgoStr)
      .gt("xp", 0)
      .or(`last_weekly_reminder_at.is.null,last_weekly_reminder_at.lt.${sevenDaysAgoStr}`);

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessages: Record<string, { title: string; body: string }> = {};
    const inAppRows: any[] = [];
    const updatedIds: string[] = [];

    for (const u of users) {
      const tpl = messages[Math.floor(Math.random() * messages.length)];
      userMessages[u.user_id] = { title: tpl.title, body: tpl.body };
      inAppRows.push({ user_id: u.user_id, title: tpl.title, body: tpl.body });
      updatedIds.push(u.user_id);
    }

    if (inAppRows.length > 0) {
      await adminClient.from("notifications").insert(inAppRows);
    }

    await sendFCMPushes(adminClient, userMessages);

    if (updatedIds.length > 0) {
      await adminClient
        .from("profiles")
        .update({ last_weekly_reminder_at: todayStr })
        .in("user_id", updatedIds);
    }

    return new Response(JSON.stringify({ notified: inAppRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-weekly-comeback error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
