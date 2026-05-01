import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendFCMPushes } from "../_shared/push.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verifică că e admin
    const { data: claims } = await userClient.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const lessonTitle: string = String(body.lesson_title || "").trim();
    const chapterTitle: string = String(body.chapter_title || "").trim();
    const lessonId: string | undefined = body.lesson_id;

    if (!lessonTitle) {
      return new Response(JSON.stringify({ error: "lesson_title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trimite tuturor userilor
    const { data: users } = await adminClient
      .from("profiles")
      .select("user_id");

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = "Lecție nouă disponibilă! ✨";
    const bodyMsg = chapterTitle
      ? `${chapterTitle} → ${lessonTitle}`
      : lessonTitle;

    const inAppRows = users.map((u: any) => ({
      user_id: u.user_id,
      title,
      body: bodyMsg,
    }));

    const userMessages: Record<string, { title: string; body: string; data?: Record<string, string> }> = {};
    for (const u of users) {
      userMessages[u.user_id] = {
        title,
        body: bodyMsg,
        data: lessonId ? { type: "new_lesson", lesson_id: lessonId } : { type: "new_lesson" },
      };
    }

    // Insert in batches of 500
    const BATCH = 500;
    for (let i = 0; i < inAppRows.length; i += BATCH) {
      await adminClient.from("notifications").insert(inAppRows.slice(i, i + BATCH));
    }

    const pushed = await sendFCMPushes(adminClient, userMessages);

    return new Response(JSON.stringify({ notified: inAppRows.length, pushed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-new-lesson error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
