import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role to delete user data and auth user
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user is a teacher and clean teacher data first
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_teacher")
      .eq("user_id", userId)
      .single();

    if (profile?.is_teacher) {
      // Delete test answers for this teacher's tests
      const { data: tests } = await adminClient.from("tests").select("id").eq("teacher_id", userId);
      const testIds = tests?.map(t => t.id) || [];
      if (testIds.length > 0) {
        const { data: assignments } = await adminClient.from("test_assignments").select("id").in("test_id", testIds);
        const assignmentIds = assignments?.map(a => a.id) || [];
        if (assignmentIds.length > 0) {
          const { data: submissions } = await adminClient.from("test_submissions").select("id").in("assignment_id", assignmentIds);
          const submissionIds = submissions?.map(s => s.id) || [];
          if (submissionIds.length > 0) {
            await adminClient.from("test_answers").delete().in("submission_id", submissionIds);
          }
          await adminClient.from("test_submissions").delete().in("assignment_id", assignmentIds);
        }
        await adminClient.from("test_items").delete().in("test_id", testIds);
        await adminClient.from("test_assignments").delete().in("test_id", testIds);
        await adminClient.from("tests").delete().eq("teacher_id", userId);
      }

      // Delete classes and related data
      const { data: classes } = await adminClient.from("teacher_classes").select("id").eq("teacher_id", userId);
      const classIds = classes?.map(c => c.id) || [];
      if (classIds.length > 0) {
        await adminClient.from("challenges").delete().in("class_id", classIds);
        await adminClient.from("class_members").delete().in("class_id", classIds);
      }
      await adminClient.from("teacher_classes").delete().eq("teacher_id", userId);

      // Delete verification data
      const { data: requests } = await adminClient.from("teacher_verification_requests").select("id").eq("user_id", userId);
      const requestIds = requests?.map(r => r.id) || [];
      if (requestIds.length > 0) {
        await adminClient.from("teacher_verification_messages").delete().in("request_id", requestIds);
      }
      await adminClient.from("teacher_verification_requests").delete().eq("user_id", userId);
      await adminClient.from("teacher_referral_codes").delete().eq("teacher_id", userId);
    }

    // Delete user data from all tables
    await adminClient.from("completed_lessons").delete().eq("user_id", userId);
    await adminClient.from("coupon_redemptions").delete().eq("user_id", userId);
    await adminClient.from("notifications").delete().eq("user_id", userId);
    await adminClient.from("device_tokens").delete().eq("user_id", userId);
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
