
-- Table: user_email_reminders
CREATE TABLE public.user_email_reminders (
  user_id UUID NOT NULL PRIMARY KEY,
  last_shown_date DATE,
  dismissed_forever BOOLEAN NOT NULL DEFAULT false,
  real_email TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_email_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own reminder state"
  ON public.user_email_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own reminder state"
  ON public.user_email_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reminder state"
  ON public.user_email_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_user_email_reminders_updated
  BEFORE UPDATE ON public.user_email_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: email_change_otps (no RLS read for users; only backend uses it via service role)
CREATE TABLE public.email_change_otps (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  new_email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_change_otps_user ON public.email_change_otps(user_id, created_at DESC);

ALTER TABLE public.email_change_otps ENABLE ROW LEVEL SECURITY;
-- No policies = no access for normal users; only service_role bypasses RLS.
