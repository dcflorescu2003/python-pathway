// Shared helper to gate scheduled (cron-triggered) edge functions behind
// a shared secret header.
//
// Usage at the top of a scheduler function:
//
//   import { checkSchedulerSecret } from "../_shared/scheduler-auth.ts";
//   const denied = checkSchedulerSecret(req, corsHeaders);
//   if (denied) return denied;
//
// Configuration:
//   - Set `SCHEDULER_SECRET` in edge function secrets.
//   - The cron job must send `x-scheduler-secret: <value>` on every call.
//   - If SCHEDULER_SECRET is not set, the check is skipped (backwards
//     compatible) but a warning is logged so it's obvious the function is
//     publicly callable.

export function checkSchedulerSecret(
  req: Request,
  corsHeaders: Record<string, string>
): Response | null {
  const secret = Deno.env.get("SCHEDULER_SECRET");

  if (!secret) {
    console.warn(
      "[scheduler-auth] SCHEDULER_SECRET not set — function is publicly callable. Set the secret and add `x-scheduler-secret` to your cron headers."
    );
    return null;
  }

  const provided = req.headers.get("x-scheduler-secret");
  if (provided !== secret) {
    console.warn("[scheduler-auth] Rejected request with missing/invalid scheduler secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return null;
}
