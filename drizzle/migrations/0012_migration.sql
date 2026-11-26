ALTER TABLE public.test_submissions
  ADD COLUMN IF NOT EXISTS device_token text,
  ADD COLUMN IF NOT EXISTS device_label text,
  ADD COLUMN IF NOT EXISTS device_unlock_allowed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS device_change_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS device_blocked_at timestamptz;

CREATE OR REPLACE FUNCTION public.protect_submission_device_columns()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF coalesce(current_setting('pyro.device_rpc', true), '') = '1' THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.device_token := NULL; NEW.device_label := NULL;
    NEW.device_unlock_allowed := false; NEW.device_change_count := 0; NEW.device_blocked_at := NULL;
    RETURN NEW;
  END IF;
  NEW.device_token := OLD.device_token;
  NEW.device_label := OLD.device_label;
  NEW.device_unlock_allowed := OLD.device_unlock_allowed;
  NEW.device_change_count := OLD.device_change_count;
  NEW.device_blocked_at := OLD.device_blocked_at;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_protect_submission_device ON public.test_submissions;
CREATE TRIGGER trg_protect_submission_device
BEFORE INSERT OR UPDATE ON public.test_submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_submission_device_columns();

-- Student: claim or verify the device for a submission. Returns 'ok' or 'locked'.
CREATE OR REPLACE FUNCTION public.claim_submission_device(p_submission_id uuid, p_token text, p_label text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_token IS NULL OR length(p_token) < 16 THEN RAISE EXCEPTION 'Invalid token'; END IF;
  SELECT student_id, submitted_at, device_token, device_unlock_allowed INTO v
    FROM public.test_submissions WHERE id = p_submission_id;
  IF v IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF v.student_id <> auth.uid() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF v.submitted_at IS NOT NULL THEN RETURN 'ok'; END IF;

  PERFORM set_config('pyro.device_rpc', '1', true);
  IF v.device_token IS NULL THEN
    UPDATE public.test_submissions SET device_token = p_token, device_label = left(p_label, 120)
     WHERE id = p_submission_id;
    RETURN 'ok';
  ELSIF v.device_token = p_token THEN
    RETURN 'ok';
  ELSIF v.device_unlock_allowed THEN
    UPDATE public.test_submissions
       SET device_token = p_token, device_label = left(p_label, 120),
           device_unlock_allowed = false, device_blocked_at = NULL,
           device_change_count = device_change_count + 1
     WHERE id = p_submission_id;
    RETURN 'ok';
  ELSE
    UPDATE public.test_submissions SET device_blocked_at = now() WHERE id = p_submission_id;
    RETURN 'locked';
  END IF;
END; $$;

-- Teacher / co-teacher: allow the student to continue on a new device.
CREATE OR REPLACE FUNCTION public.allow_submission_new_device(p_submission_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_assignment uuid; v_submitted timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT assignment_id, submitted_at INTO v_assignment, v_submitted
    FROM public.test_submissions WHERE id = p_submission_id;
  IF v_assignment IS NULL THEN RAISE EXCEPTION 'Submission not found'; END IF;
  IF NOT public.can_grade_assignment(v_assignment, auth.uid()) AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF v_submitted IS NOT NULL THEN RAISE EXCEPTION 'Already submitted'; END IF;
  PERFORM set_config('pyro.device_rpc', '1', true);
  UPDATE public.test_submissions SET device_unlock_allowed = true WHERE id = p_submission_id;
END; $$;

REVOKE ALL ON FUNCTION public.claim_submission_device(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.allow_submission_new_device(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_submission_device(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allow_submission_new_device(uuid) TO authenticated;