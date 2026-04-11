-- Drop the problematic policy
DROP POLICY IF EXISTS "Students can view assigned tests" ON public.tests;

-- Create a security definer function to check student access without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.student_can_view_test(p_test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_assignments ta
    JOIN public.class_members cm ON cm.class_id = ta.class_id
    WHERE ta.test_id = p_test_id
      AND cm.student_id = auth.uid()
  );
$$;

-- Recreate the policy using the function
CREATE POLICY "Students can view assigned tests"
ON public.tests
FOR SELECT
TO authenticated
USING (public.student_can_view_test(id));