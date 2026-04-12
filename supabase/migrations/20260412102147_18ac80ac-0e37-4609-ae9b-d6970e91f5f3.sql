
-- 1. Teacher verification requests
CREATE TABLE public.teacher_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method text NOT NULL CHECK (method IN ('invite_code', 'public_link', 'document', 'referral')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  data jsonb DEFAULT '{}'::jsonb,
  admin_notes text,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

ALTER TABLE public.teacher_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.teacher_verification_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON public.teacher_verification_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON public.teacher_verification_requests
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update requests" ON public.teacher_verification_requests
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Teacher invite codes (admin-managed)
CREATE TABLE public.teacher_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text,
  max_uses integer NOT NULL DEFAULT 10,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invite codes" ON public.teacher_invite_codes
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can check codes" ON public.teacher_invite_codes
  FOR SELECT TO authenticated USING (true);

-- 3. Teacher referral codes
CREATE TABLE public.teacher_referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  used_by uuid,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own referral codes" ON public.teacher_referral_codes
  FOR SELECT TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "Admins can view all referral codes" ON public.teacher_referral_codes
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can check referral codes" ON public.teacher_referral_codes
  FOR SELECT TO authenticated USING (true);

-- 4. Add verification_method to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_method text;

-- 5. Storage bucket for teacher documents
INSERT INTO storage.buckets (id, name, public) VALUES ('teacher-documents', 'teacher-documents', false);

CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'teacher-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'teacher-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all teacher documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'teacher-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- 6. Replace request_teacher_status with a more flexible version
CREATE OR REPLACE FUNCTION public.submit_teacher_verification(
  p_method text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_code_record record;
  v_referral_record record;
  v_request_id uuid;
BEGIN
  -- Check if already verified
  IF EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND teacher_status = 'verified') THEN
    RETURN jsonb_build_object('error', 'Already verified');
  END IF;

  -- Check if pending request exists
  IF EXISTS (SELECT 1 FROM teacher_verification_requests WHERE user_id = auth.uid() AND status = 'pending') THEN
    RETURN jsonb_build_object('error', 'Request already pending');
  END IF;

  IF p_method = 'invite_code' THEN
    -- Validate invite code
    SELECT * INTO v_code_record FROM teacher_invite_codes
      WHERE code = (p_data->>'code') AND is_active = true AND used_count < max_uses;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Invalid or expired invite code');
    END IF;

    -- Auto-approve
    INSERT INTO teacher_verification_requests (user_id, method, status, data, reviewed_at)
      VALUES (auth.uid(), 'invite_code', 'approved', p_data, now())
      RETURNING id INTO v_request_id;

    UPDATE teacher_invite_codes SET used_count = used_count + 1 WHERE id = v_code_record.id;
    UPDATE profiles SET teacher_status = 'verified', is_teacher = true, verification_method = 'invite_code' WHERE user_id = auth.uid();

    -- Generate 2 referral codes
    INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
      (auth.uid(), 'REF-' || substr(md5(random()::text), 1, 8)),
      (auth.uid(), 'REF-' || substr(md5(random()::text || '2'), 1, 8));

    RETURN jsonb_build_object('status', 'approved', 'message', 'Verified via invite code');

  ELSIF p_method = 'referral' THEN
    -- Validate referral code
    SELECT * INTO v_referral_record FROM teacher_referral_codes
      WHERE code = (p_data->>'code') AND used_by IS NULL;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Invalid or already used referral code');
    END IF;

    -- Auto-approve
    INSERT INTO teacher_verification_requests (user_id, method, status, data, reviewed_at)
      VALUES (auth.uid(), 'referral', 'approved', p_data, now())
      RETURNING id INTO v_request_id;

    UPDATE teacher_referral_codes SET used_by = auth.uid(), used_at = now() WHERE id = v_referral_record.id;
    UPDATE profiles SET teacher_status = 'verified', is_teacher = true, verification_method = 'referral' WHERE user_id = auth.uid();

    -- Generate 2 referral codes for new teacher
    INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
      (auth.uid(), 'REF-' || substr(md5(random()::text), 1, 8)),
      (auth.uid(), 'REF-' || substr(md5(random()::text || '2'), 1, 8));

    RETURN jsonb_build_object('status', 'approved', 'message', 'Verified via referral');

  ELSIF p_method IN ('public_link', 'document') THEN
    -- Pending review
    INSERT INTO teacher_verification_requests (user_id, method, status, data)
      VALUES (auth.uid(), p_method, 'pending', p_data)
      RETURNING id INTO v_request_id;

    UPDATE profiles SET teacher_status = 'pending', is_teacher = true WHERE user_id = auth.uid();

    RETURN jsonb_build_object('status', 'pending', 'message', 'Request submitted for review');
  ELSE
    RETURN jsonb_build_object('error', 'Invalid method');
  END IF;
END;
$$;

-- 7. Function to approve a verification request (for admin use via TeacherApproval)
CREATE OR REPLACE FUNCTION public.approve_teacher_request(
  p_request_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_request FROM teacher_verification_requests WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or not pending'; END IF;

  UPDATE teacher_verification_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = p_notes
    WHERE id = p_request_id;

  UPDATE profiles
    SET teacher_status = 'verified', is_teacher = true, verification_method = v_request.method
    WHERE user_id = v_request.user_id;

  -- Generate referral codes
  INSERT INTO teacher_referral_codes (teacher_id, code) VALUES
    (v_request.user_id, 'REF-' || substr(md5(random()::text), 1, 8)),
    (v_request.user_id, 'REF-' || substr(md5(random()::text || '2'), 1, 8));
END;
$$;

-- 8. Function to reject a verification request
CREATE OR REPLACE FUNCTION public.reject_teacher_request(
  p_request_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE teacher_verification_requests
    SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), admin_notes = p_notes
    WHERE id = p_request_id AND status = 'pending';

  UPDATE profiles SET teacher_status = NULL, is_teacher = false
    WHERE user_id = (SELECT user_id FROM teacher_verification_requests WHERE id = p_request_id);
END;
$$;
