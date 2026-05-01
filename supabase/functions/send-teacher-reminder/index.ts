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

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    // Profesori verificați
    const { data: teachers, error } = await adminClient
      .from("profiles")
      .select("user_id, last_teacher_reminder_at")
      .eq("teacher_status", "verified")
      .or(`last_teacher_reminder_at.is.null,last_teacher_reminder_at.neq.${todayStr}`);

    if (error) throw error;
    if (!teachers || teachers.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessages: Record<string, { title: string; body: string }> = {};
    const inAppRows: any[] = [];
    const updatedIds: string[] = [];

    for (const t of teachers) {
      // Caută submisii ne-evaluate >24h pentru testele acestui profesor
      const { count: pendingCount } = await adminClient
        .from("test_submissions")
        .select("id, assignment_id!inner(test_id!inner(teacher_id))", { count: "exact", head: true })
        .eq("assignment.test.teacher_id", t.user_id)
        .not("submitted_at", "is", null)
        .is("graded_at", null)
        .lt("submitted_at", oneDayAgo.toISOString());

      // Fallback simplu: găsim submisiile prin tests → assignments
      const { data: testIds } = await adminClient
        .from("tests")
        .select("id")
        .eq("teacher_id", t.user_id);

      if (!testIds || testIds.length === 0) continue;

      const { data: assignments } = await adminClient
        .from("test_assignments")
        .select("id")
        .in("test_id", testIds.map((x: any) => x.id));

      if (!assignments || assignments.length === 0) continue;

      const { count } = await adminClient
        .from("test_submissions")
        .select("id", { count: "exact", head: true })
        .in("assignment_id", assignments.map((a: any) => a.id))
        .not("submitted_at", "is", null)
        .is("graded_at", null)
        .lt("submitted_at", oneDayAgo.toISOString());

      if (!count || count === 0) continue;

      const title = "Ai teste de evaluat 📝";
      const body = `Sunt ${count} ${count === 1 ? "submisie ne-evaluată" : "submisii ne-evaluate"} de peste 24h.`;
      userMessages[t.user_id] = { title, body };
      inAppRows.push({ user_id: t.user_id, title, body });
      updatedIds.push(t.user_id);
    }

    if (inAppRows.length > 0) {
      await adminClient.from("notifications").insert(inAppRows);
    }

    await sendFCMPushes(adminClient, userMessages);

    if (updatedIds.length > 0) {
      await adminClient
        .from("profiles")
        .update({ last_teacher_reminder_at: todayStr })
        .in("user_id", updatedIds);
    }

    return new Response(JSON.stringify({ notified: inAppRows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-teacher-reminder error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
