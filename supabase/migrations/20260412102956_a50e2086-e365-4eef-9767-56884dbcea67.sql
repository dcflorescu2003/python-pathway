-- Add coupon_type to coupons table
ALTER TABLE public.coupons ADD COLUMN coupon_type text NOT NULL DEFAULT 'student';

-- Add coupon_type to redemptions for tracking
ALTER TABLE public.coupon_redemptions ADD COLUMN coupon_type text NOT NULL DEFAULT 'student';