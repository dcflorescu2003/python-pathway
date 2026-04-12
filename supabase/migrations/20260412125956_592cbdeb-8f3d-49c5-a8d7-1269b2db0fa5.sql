
-- Update request_teacher_status: set 'unverified' instead of 'pending'
CREATE OR REPLACE FUNCTION public.request_teacher_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (teacher_status IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'Teacher status already set';
  END IF;

  UPDATE public.profiles 
  SET teacher_status = 'unverified', is_teacher = true
  WHERE user_id = auth.uid();
END;
$function$;

-- Update submit_teacher_verification: require 'unverified' status, transition to pending/verified
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
BEGIN
  v_contact_email := p_data->>'contact_email';

  -- Get current status
  SELECT teacher_status INTO v_current_status FROM profiles WHERE user_id = auth.uid();

  -- Check if already verified
  IF v_current_status = 'verified' THEN
    RETURN jsonb_build_object('error', 'Already verified');
  END IF;

  -- Must be unverified to submit (not pending, not null)
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('error', 'Must become a teacher first');
  END IF;

  -- Check if pending request exists
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
    UPDATE profiles SET teacher_status = 'verified', is_teacher = true, verification_method = 'invite_code' WHERE user_id = auth.uid();

    INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
      (auth.uid(), 'REF-' || substr(md5(random()::text), 1, 8)),
      (auth.uid(), 'REF-' || substr(md5(random()::text || '2'), 1, 8));

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
    UPDATE profiles SET teacher_status = 'verified', is_teacher = true, verification_method = 'referral' WHERE user_id = auth.uid();

    INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
      (auth.uid(), 'REF-' || substr(md5(random()::text), 1, 8)),
      (auth.uid(), 'REF-' || substr(md5(random()::text || '2'), 1, 8));

    RETURN jsonb_build_object('status', 'approved', 'message', 'Verified via referral');

  ELSIF p_method IN ('public_link', 'document') THEN
    INSERT INTO teacher_verification_requests (user_id, method, status, data, contact_email)
      VALUES (auth.uid(), p_method, 'pending', p_data, v_contact_email)
      RETURNING id INTO v_request_id;

    UPDATE profiles SET teacher_status = 'pending', is_teacher = true WHERE user_id = auth.uid();

    RETURN jsonb_build_object('status', 'pending', 'message', 'Request submitted for review');
  ELSE
    RETURN jsonb_build_object('error', 'Invalid method');
  END IF;
END;
$function$;

-- Update reject_teacher_request: reset to 'unverified' instead of null
CREATE OR REPLACE FUNCTION public.reject_teacher_request(p_request_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE teacher_verification_requests
    SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = p_notes
    WHERE id = p_request_id AND status = 'pending';

  -- Reset to unverified so teacher keeps basic access but can re-apply
  UPDATE profiles SET teacher_status = 'unverified'
    WHERE user_id = (SELECT user_id FROM teacher_verification_requests WHERE id = p_request_id);
END;
$function$;
