
CREATE OR REPLACE FUNCTION public.redeem_coupon_atomic(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon record;
  v_updated_count int;
  v_premium_until timestamptz;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Lock the row while validating so concurrent redemptions serialize
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = upper(trim(p_code))
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid');
  END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  -- Atomic guard: only bump if there is capacity left
  UPDATE public.coupons
     SET used_count = used_count + 1
   WHERE id = v_coupon.id
     AND used_count < max_uses;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object('error', 'max_uses');
  END IF;

  v_premium_until := now() + (v_coupon.duration_days || ' days')::interval;

  BEGIN
    INSERT INTO public.coupon_redemptions (coupon_id, user_id, premium_until, coupon_type)
    VALUES (v_coupon.id, p_user_id, v_premium_until, COALESCE(v_coupon.coupon_type, 'student'));
  EXCEPTION WHEN unique_violation THEN
    -- Roll back the counter bump since the user already had this coupon
    UPDATE public.coupons SET used_count = used_count - 1 WHERE id = v_coupon.id;
    RETURN jsonb_build_object('error', 'already_redeemed');
  END;

  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'coupon_type', COALESCE(v_coupon.coupon_type, 'student'),
    'duration_days', v_coupon.duration_days,
    'premium_until', v_premium_until
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_coupon_atomic(text, uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon_atomic(text, uuid) TO service_role;
