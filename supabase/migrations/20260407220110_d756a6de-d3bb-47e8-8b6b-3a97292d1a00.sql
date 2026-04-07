
-- Fix coupons: restrict mutations to admins only
DROP POLICY IF EXISTS "Admins can delete coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can insert coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON public.coupons;

CREATE POLICY "Admins can delete coupons" ON public.coupons
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert coupons" ON public.coupons
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons" ON public.coupons
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix challenges: broken self-referencing condition
DROP POLICY IF EXISTS "Students can see challenges" ON public.challenges;

CREATE POLICY "Students can see challenges" ON public.challenges
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_members cm
      WHERE cm.class_id = challenges.class_id
        AND cm.student_id = auth.uid()
    )
  );

-- Fix admin_emails: restrict SELECT to admins only
DROP POLICY IF EXISTS "Anyone can read admin_emails" ON public.admin_emails;

CREATE POLICY "Admins can read admin_emails" ON public.admin_emails
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Fix completed_lessons: change public role policies to authenticated
DROP POLICY IF EXISTS "Users can insert their own completed lessons" ON public.completed_lessons;
DROP POLICY IF EXISTS "Users can update their own completed lessons" ON public.completed_lessons;
DROP POLICY IF EXISTS "Users can view their own completed lessons" ON public.completed_lessons;

CREATE POLICY "Users can insert their own completed lessons" ON public.completed_lessons
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed lessons" ON public.completed_lessons
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own completed lessons" ON public.completed_lessons
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fix notifications: restrict INSERT to own user
DROP POLICY IF EXISTS "Authenticated insert notifications" ON public.notifications;

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
