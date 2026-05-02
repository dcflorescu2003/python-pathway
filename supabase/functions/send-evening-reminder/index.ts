import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFCMPushes } from "../_shared/push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const messages = [
  { title: "Nu uita de Python azi 🌙", body: "Mai ai timp pentru o lecție rapidă înainte de culcare." },
  { title: "Seara cu Python? 🐍", body: "5 minute acum = ziua bifată. Hai să codăm!" },
  { title: "Înainte să dormi... ⭐", body: "Un exercițiu rapid și ai bifat ziua de azi!" },
  { title: "Ziua nu s-a terminat încă 💻", body: "O lecție scurtă te așteaptă — termină ziua cu un win." },
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

    // 14 days ago — only remind users that have been around recently
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    // Useri care NU au fost activi azi (last_activity_date < azi),
    // dar au fost activi în ultimele 14 zile,
    // și nu au primit deja reminder-ul de seară azi.
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("user_id, display_name, streak, last_evening_reminder_at, last_activity_date")
      .lt("last_activity_date", todayStr)
      .gte("last_activity_date", cutoffStr)
      .or(`last_evening_reminder_at.is.null,last_evening_reminder_at.neq.${todayStr}`);

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
