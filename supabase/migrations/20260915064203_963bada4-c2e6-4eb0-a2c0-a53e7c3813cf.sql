-- Expiră automat premiumul acordat manual (inclusiv Profesor AI gratuit)
CREATE OR REPLACE FUNCTION public.expire_manual_premium()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  PERFORM set_config('app.bypass_profile_protection', 'true', true);

  WITH updated AS (
    UPDATE public.profiles
    SET premium_manual = false,
        premium_manual_until = NULL,
        premium_manual_by = NULL,
        is_premium = false
    WHERE premium_manual = true
      AND premium_manual_until IS NOT NULL
      AND premium_manual_until < now()
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM updated;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_manual_premium() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_manual_premium() TO service_role;

-- La aprobarea unui profesor: Profesor AI gratuit până la 31 decembrie 2026 + notificare
CREATE OR REPLACE FUNCTION public.approve_teacher_request(p_request_id uuid, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_free_until timestamptz := '2026-12-31 23:59:59+02'::timestamptz;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_request FROM teacher_verification_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or not pending'; END IF;

  UPDATE teacher_verification_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = p_notes
    WHERE id = p_request_id;

  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles
    SET teacher_status = 'verified',
        is_teacher = true,
        verification_method = v_request.method,
        is_premium = true,
        premium_manual = true,
        premium_manual_until = GREATEST(COALESCE(premium_manual_until, v_free_until), v_free_until),
        premium_manual_by = auth.uid()
    WHERE user_id = v_request.user_id;

  INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
    (v_request.user_id, 'REF-' || substr(md5(random()::text), 1, 8)),
    (v_request.user_id, 'REF-' || substr(md5(random()::text || '2'), 1, 8));

  INSERT INTO notifications (user_id, title, body, link)
  VALUES (
    v_request.user_id,
    'Abonament Profesor AI gratuit',
    'Contul tău de profesor a fost verificat. Ai primit gratuit abonamentul Profesor AI până la 31 decembrie 2026, după care se anulează automat. Nu se face nicio plată.',
    '/cont'
  );
END;
$$;

-- Curățare zilnică a premiumului manual expirat
SELECT cron.schedule(
  'expire-manual-premium-daily',
  '10 0 * * *',
  $$SELECT public.expire_manual_premium();$$
);