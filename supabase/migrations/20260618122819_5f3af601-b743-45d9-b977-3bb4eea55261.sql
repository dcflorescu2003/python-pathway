
-- 1. Remove broad SELECT exposure on teacher invite/referral codes
DROP POLICY IF EXISTS "Authenticated can check codes" ON public.teacher_invite_codes;
DROP POLICY IF EXISTS "Authenticated can check referral codes" ON public.teacher_referral_codes;

-- 2. Scope Realtime subscriptions on the `notifications` topic to the owning user.
-- The expected topic format is `notifications:<user_id>`.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can subscribe to own notifications topic" ON realtime.messages;
CREATE POLICY "Users can subscribe to own notifications topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Only allow channels for this user's notifications, or non-notifications topics
  (
    realtime.topic() IS NULL
  ) OR (
    realtime.topic() NOT LIKE 'notifications:%'
  ) OR (
    realtime.topic() = 'notifications:' || auth.uid()::text
  )
);
