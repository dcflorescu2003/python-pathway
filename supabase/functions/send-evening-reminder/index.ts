import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFCMPushes } from "../_shared/push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const messages = [
  { title: "Mai ai timp pentru o lecție rapidă 🌙", body: "Ziua nu se termină fără un pic de Python." },
  { title: "Seara cu Python? 🐍", body: "5 minute acum = streak păstrat. Hai să codăm!" },
  { title: "Înainte să dormi... ⭐", body: "Un exercițiu rapid și ai bifat ziua de azi!" },
  { title: "Closing time? Nu chiar! 💻", body: "O lecție scurtă te așteaptă — termină ziua cu un win." },
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

    // Useri activi azi (last_activity_date = azi) care încă nu au primit reminder seara
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("user_id, display_name, streak, last_evening_reminder_at")
      .eq("last_activity_date", todayStr)
      .or(`last_evening_reminder_at.is.null,last_evening_reminder_at.neq.${todayStr}`);

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filtrează userii care au făcut deja >= 3 lecții azi
    const userIds = users.map((u: any) => u.user_id);
    const { data: lessonsToday } = await adminClient
      .from("completed_lessons")
      .select("user_id")
      .in("user_id", userIds)
      .gte("completed_at", todayStr + "T00:00:00.000Z");

    const lessonCounts: Record<string, number> = {};
    for (const l of lessonsToday ?? []) {
      lessonCounts[l.user_id] = (lessonCounts[l.user_id] || 0) + 1;
    }

    const toNotify = users.filter((u: any) => (lessonCounts[u.user_id] || 0) < 3);
    if (toNotify.length === 0) {
      return new Response(JSON.stringify({ notified: 0, message: "All active users have done 3+ lessons" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessages: Record<string, { title: string; body: string }> = {};
    const inAppRows: any[] = [];
    const updatedIds: string[] = [];

    for (const u of toNotify) {
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
        .update({ last_evening_reminder_at: todayStr })
        .in("user_id", updatedIds);
    }

    return new Response(JSON.stringify({ notified: inAppRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-evening-reminder error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
