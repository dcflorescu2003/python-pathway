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

    const todayStr = new Date().toISOString().split("T")[0];

    // Profesori care nu sunt verificați (unverified sau pending) și care nu au primit deja memento azi
    const { data: teachers, error } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("is_teacher", true)
      .in("teacher_status", ["unverified", "pending"])
      .or(`last_unverified_teacher_reminder_at.is.null,last_unverified_teacher_reminder_at.neq.${todayStr}`);

    if (error) throw error;
    if (!teachers || teachers.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = "Verifică-ți contul de profesor 🎓";
    const body = "Verifică-ți contul pentru a debloca accesul complet la baza de testare.";

    const userMessages: Record<string, { title: string; body: string }> = {};
    for (const t of teachers) {
      userMessages[t.user_id] = { title, body };
    }

    await sendFCMPushes(adminClient, userMessages);

    await adminClient
      .from("profiles")
      .update({ last_unverified_teacher_reminder_at: todayStr })
      .in("user_id", teachers.map((t: any) => t.user_id));

    return new Response(JSON.stringify({ notified: teachers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-unverified-teacher-reminder error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
