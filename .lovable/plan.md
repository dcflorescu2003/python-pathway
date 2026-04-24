## Plan

1. Audit and harden the email/password auth flow
- Keep the normal login path strictly separated from the forgot-password path.
- Refactor the auth screen so the recovery modal has its own explicit submit handler and cannot be triggered by any implicit form submission, autofill side effect, or stale state.
- Add defensive resets when the recovery modal opens/closes so the recovery email action only runs after a deliberate click on the recovery submit button.

2. Add temporary diagnostics around auth actions
- Instrument the login and recovery handlers so we can see exactly which action fires at runtime: sign-in vs password recovery.
- Log the auth event locally in a safe way during testing so we can confirm whether a login tap is incorrectly reaching the recovery code.
- Remove or reduce the extra diagnostics after confirming the fix.

3. Verify backend auth email routing
- Inspect the project’s managed auth email configuration and confirm that password recovery emails are only mapped to recovery events.
- If there is a custom auth email hook/template issue, correct that mapping so sign-in attempts never generate recovery emails.
- If the project is still using default auth emails, verify the backend auth settings for any unexpected recovery-trigger behavior.

4. Validate end-to-end
- Test three cases separately:
  - normal email/password login
  - wrong password login
  - explicit forgot-password flow
- Confirm that only the explicit forgot-password flow sends a recovery email and that normal login sends none.

## What I already confirmed
- The current frontend login code uses `signInWithPassword(...)` in `src/hooks/useAuth.tsx`.
- The only place that calls `resetPasswordForEmail(...)` is the forgot-password form in `src/pages/AuthPage.tsx`.
- I did not find any second recovery trigger elsewhere in the app code.
- That means there is very likely either:
  - an unintended UI/runtime trigger reaching the forgot-password handler, or
  - a backend auth email-routing/configuration issue.

## Technical details
- Files most likely involved:
  - `src/pages/AuthPage.tsx`
  - `src/hooks/useAuth.tsx`
  - managed auth email configuration in Lovable Cloud
- No database schema changes should be needed.
- The fix will focus on auth flow isolation, runtime tracing, and auth email configuration verification.