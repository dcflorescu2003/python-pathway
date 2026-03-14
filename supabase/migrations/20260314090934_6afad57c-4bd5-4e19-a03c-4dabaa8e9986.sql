
CREATE POLICY "Admins can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (true);
