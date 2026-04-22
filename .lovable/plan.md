

## Plan: Fix `send-push` edge function authentication

### Problem

The `send-push` edge function uses `supabase.auth.getClaims(token)` which is not available in the imported `@supabase/supabase-js@2` version. This causes a silent 401 error on every call. The client-side code catches the error silently (`catch (e) { console.error(...) }`), so no visible error appears — but no push notification is ever sent.

Evidence: zero `send-push` HTTP entries in edge logs despite the in-app notification insert succeeding (confirming the mutation runs).

### Fix

**File: `supabase/functions/send-push/index.ts`**

Replace the `getClaims` authentication block (lines 87-95) with `supabase.auth.getUser()`:

```typescript
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: corsHeaders,
  });
}
```

This uses the standard, always-available `getUser()` method which validates the JWT via the Authorization header already passed to the client.

### Verification

After deploying, call `send-push` via `curl_edge_functions` with a real student ID from `device_tokens` to confirm FCM delivery works end-to-end.

### Files modified

- `supabase/functions/send-push/index.ts` -- replace `getClaims` with `getUser`

