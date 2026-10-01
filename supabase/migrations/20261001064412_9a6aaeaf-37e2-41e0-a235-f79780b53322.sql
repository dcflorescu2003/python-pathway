CREATE OR REPLACE FUNCTION public.submit_teacher_verification(p_method text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_code_record record;
  v_referral_record record;
  v_request_id uuid;
  v_contact_email text;
  v_current_status text;
  v_free_until timestamptz := '2026-12-31 23:59:59+02'::timestamptz;
BEGIN
  v_contact_email := p_data->>'contact_email';

  SELECT teacher_status INTO v_current_status FROM profiles WHERE user_id = auth.uid();

  IF v_current_status = 'verified' THEN
    RETURN jsonb_build_object('error', 'Already verified');
  END IF;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('error', 'Must become a teacher first');
  END IF;

  IF EXISTS (SELECT 1 FROM teacher_verification_requests WHERE user_id = auth.uid() AND status = 'pending') THEN
    RETURN jsonb_build_object('error', 'Request already pending');
  END IF;

  IF p_method = 'invite_code' THEN
    SELECT * INTO v_code_record FROM teacher_invite_codes
      WHERE code = (p_data->>'code') AND is_active = true AND used_count < max_uses;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Invalid or expired invite code');
    END IF;

    INSERT INTO teacher_verification_requests (user_id, method, status, data, reviewed_at, contact_email)
      VALUES (auth.uid(), 'invite_code', 'approved', p_data, now(), v_contact_email)
      RETURNING id INTO v_request_id;

    UPDATE teacher_invite_codes SET used_count = used_count + 1 WHERE id = v_code_record.id;

    PERFORM set_config('app.bypass_profile_protection', 'true', true);
    UPDATE profiles SET teacher_status = 'verified', is_teacher = true, verification_method = 'invite_code',
        is_premium = true,
        premium_manual = true,
        premium_manual_until = GREATEST(COALESCE(premium_manual_until, v_free_until), v_free_until)
      WHERE user_id = auth.uid();

    INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
      (auth.uid(), 'REF-' || substr(md5(random()::text), 1, 8)),
      (auth.uid(), 'REF-' || substr(md5(random()::text || '2'), 1, 8));

    INSERT INTO notifications (user_id, title, body, link) VALUES (
      auth.uid(),
      'Abonament Profesor AI gratuit',
      'Contul tău de profesor a fost verificat. Ai primit gratuit abonamentul Profesor AI până la 31 decembrie 2026, după care se anulează automat. Nu se face nicio plată.',
      '/cont'
    );

    RETURN jsonb_build_object('status', 'approved', 'message', 'Verified via invite code');

  ELSIF p_method = 'referral' THEN
    SELECT * INTO v_referral_record FROM teacher_referral_codes
      WHERE code = (p_data->>'code') AND used_by IS NULL;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Invalid or already used referral code');
    END IF;

    INSERT INTO teacher_verification_requests (user_id, method, status, data, reviewed_at, contact_email)
      VALUES (auth.uid(), 'referral', 'approved', p_data, now(), v_contact_email)
      RETURNING id INTO v_request_id;

    UPDATE teacher_referral_codes SET used_by = auth.uid(), used_at = now() WHERE id = v_referral_record.id;

    PERFORM set_config('app.bypass_profile_protection', 'true', true);
    UPDATE profiles SET teacher_status = 'verified', is_teacher = true, verification_method = 'referral',
        is_premium = true,
        premium_manual = true,
        premium_manual_until = GREATEST(COALESCE(premium_manual_until, v_free_until), v_free_until)
      WHERE user_id = auth.uid();

    INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
      (auth.uid(), 'REF-' || substr(md5(random()::text), 1, 8)),
      (auth.uid(), 'REF-' || substr(md5(random()::text || '2'), 1, 8));

    INSERT INTO notifications (user_id, title, body, link) VALUES (
      auth.uid(),
      'Abonament Profesor AI gratuit',
      'Contul tău de profesor a fost verificat. Ai primit gratuit abonamentul Profesor AI până la 31 decembrie 2026, după care se anulează automat. Nu se face nicio plată.',
      '/cont'
    );

    RETURN jsonb_build_object('status', 'approved', 'message', 'Verified via referral');

  ELSIF p_method IN ('public_link', 'document') THEN
    INSERT INTO teacher_verification_requests (user_id, method, status, data, contact_email)
      VALUES (auth.uid(), p_method, 'pending', p_data, v_contact_email)
      RETURNING id INTO v_request_id;

    PERFORM set_config('app.bypass_profile_protection', 'true', true);
    UPDATE profiles SET teacher_status = 'pending', is_teacher = true WHERE user_id = auth.uid();

    RETURN jsonb_build_object('status', 'pending', 'message', 'Request submitted for review');
  ELSE
    RETURN jsonb_build_object('error', 'Invalid method');
  END IF;
END;
$function$;

-- Backfill: toți profesorii verificați fără Premium manual
DO $$
DECLARE
  v_free_until timestamptz := '2026-12-31 23:59:59+02'::timestamptz;
  r record;
BEGIN
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  FOR r IN SELECT user_id FROM public.profiles
           WHERE is_teacher AND teacher_status = 'verified' AND premium_manual = false
  LOOP
    UPDATE public.profiles
      SET is_premium = true, premium_manual = true, premium_manual_until = v_free_until
      WHERE user_id = r.user_id;
    INSERT INTO public.notifications (user_id, title, body, link) VALUES (
      r.user_id,
      'Abonament Profesor AI gratuit',
      'Contul tău de profesor a fost verificat. Ai primit gratuit abonamentul Profesor AI până la 31 decembrie 2026, după care se anulează automat. Nu se face nicio plată.',
      '/cont'
    );
  END LOOP;
END $$;