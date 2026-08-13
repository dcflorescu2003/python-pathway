import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFCMPushes } from "../_shared/push.ts";
import { checkSchedulerSecret } from "../_shared/scheduler-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mesaje motivante pentru utilizatorii cu streak 0 (vineri seara)
const messages = [
  { title: "Weekend cu Python? 🐍", body: "Seria ta e la 0. O lecție scurtă acum și pornești din nou de la 1!" },
  { title: "Reia seria chiar azi 🔥", body: "5 minute de cod în seara asta și mâine ai deja 2 zile la rând." },
  { title: "Vineri = start nou 🚀", body: "Progresul tău e salvat. Hai să reaprindem flacăra seriei!" },
  { title: "Ți-am păstrat locul 💚", body: "Nicio zi pierdută nu contează dacă începi acum. O lecție și ești pe drum!" },
  { title: "O provocare de weekend ⭐", body: "Rezolvă o problemă în seara asta și pornește o serie nouă!" },
  { title: "Hai înapoi la cod 💻", body: "Seria ta așteaptă să fie repornită. Începe cu o lecție ușoară!" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const denied = checkSchedulerSecret(req, corsHeaders);
  if (denied) return denied;

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const sixDaysAgoStr = sixDaysAgo.toISOString().split("T")[0];

    // Elevi cu streak 0, care au avut măcar puțină activitate (xp > 0),
    // care nu au primit acest memento în ultimele 6 zile.
    const { data: users, error } = await adminClient
      .from("profiles")
      .select("user_id, display_name, xp, streak, last_friday_boost_at")
      .eq("is_teacher", false)
      .eq("streak", 0)
      .gt("xp", 0)
      .or(`last_friday_boost_at.is.null,last_friday_boost_at.lt.${sixDaysAgoStr}`);

    if (error) throw error;
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessages: Record<string, { title: string; body: string }> = {};
    const inAppRows: Array<{ user_id: string; title: string; body: string }> = [];
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
        .update({ last_friday_boost_at: todayStr })
        .in("user_id", updatedIds);
    }

    return new Response(JSON.stringify({ notified: inAppRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-friday-streak-boost error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
