
-- Create tests table
CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  time_limit_minutes integer,
  variant_mode text NOT NULL DEFAULT 'shuffle' CHECK (variant_mode IN ('shuffle', 'manual')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can insert own tests" ON public.tests
  FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can select own tests" ON public.tests
  FOR SELECT TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own tests" ON public.tests
  FOR UPDATE TO authenticated USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own tests" ON public.tests
  FOR DELETE TO authenticated USING (teacher_id = auth.uid());

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON public.tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create test_items table
CREATE TABLE public.test_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  variant text NOT NULL DEFAULT 'both' CHECK (variant IN ('A', 'B', 'both')),
  sort_order integer NOT NULL DEFAULT 0,
  source_type text NOT NULL CHECK (source_type IN ('exercise', 'problem', 'custom')),
  source_id text,
  custom_data jsonb,
  points integer NOT NULL DEFAULT 10
);

ALTER TABLE public.test_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own test items" ON public.test_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_items.test_id AND t.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_items.test_id AND t.teacher_id = auth.uid()));

-- Create test_assignments table
CREATE TABLE public.test_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.teacher_classes(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  due_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.test_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own test assignments" ON public.test_assignments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_assignments.test_id AND t.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_assignments.test_id AND t.teacher_id = auth.uid()));

CREATE POLICY "Students can see assignments for their classes" ON public.test_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_members cm WHERE cm.class_id = test_assignments.class_id AND cm.student_id = auth.uid()));

-- Create test_submissions table
CREATE TABLE public.test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.test_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  variant text NOT NULL DEFAULT 'A' CHECK (variant IN ('A', 'B')),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  submitted_at timestamp with time zone,
  total_score numeric DEFAULT 0,
  max_score numeric DEFAULT 0,
  auto_graded boolean NOT NULL DEFAULT false
);

ALTER TABLE public.test_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own submissions" ON public.test_submissions
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions" ON public.test_submissions
  FOR UPDATE TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can view own submissions" ON public.test_submissions
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their tests" ON public.test_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.test_assignments ta
    JOIN public.tests t ON t.id = ta.test_id
    WHERE ta.id = test_submissions.assignment_id AND t.teacher_id = auth.uid()
  ));

-- Create test_answers table
CREATE TABLE public.test_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.test_submissions(id) ON DELETE CASCADE,
  test_item_id uuid NOT NULL REFERENCES public.test_items(id) ON DELETE CASCADE,
  answer_data jsonb,
  score numeric DEFAULT 0,
  max_points numeric DEFAULT 0,
  feedback text,
  ai_reviewed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.test_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own answers" ON public.test_answers
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.test_submissions ts WHERE ts.id = test_answers.submission_id AND ts.student_id = auth.uid()));

CREATE POLICY "Students can update own answers" ON public.test_answers
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_submissions ts WHERE ts.id = test_answers.submission_id AND ts.student_id = auth.uid()));

CREATE POLICY "Students can view own answers" ON public.test_answers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.test_submissions ts WHERE ts.id = test_answers.submission_id AND ts.student_id = auth.uid()));

CREATE POLICY "Teachers can view answers for their tests" ON public.test_answers
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.test_submissions ts
    JOIN public.test_assignments ta ON ta.id = ts.assignment_id
    JOIN public.tests t ON t.id = ta.test_id
    WHERE ts.id = test_answers.submission_id AND t.teacher_id = auth.uid()
  ));

-- RPC function to get test items for students (hides custom_data solutions)
CREATE OR REPLACE FUNCTION public.get_test_items_for_student(p_assignment_id uuid, p_variant text)
RETURNS TABLE (
  id uuid,
  test_id uuid,
  sort_order integer,
  source_type text,
  source_id text,
  points integer,
  question text,
  item_type text,
  options jsonb,
  blanks jsonb,
  lines jsonb,
  pairs jsonb,
  statement text,
  code_template text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id uuid;
BEGIN
  -- Get test_id from assignment
  SELECT ta.test_id INTO v_test_id
  FROM public.test_assignments ta
  JOIN public.class_members cm ON cm.class_id = ta.class_id
  WHERE ta.id = p_assignment_id AND cm.student_id = auth.uid();
  
  IF v_test_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    ti.id,
    ti.test_id,
    ti.sort_order,
    ti.source_type,
    ti.source_id,
    ti.points,
    -- For custom items, extract question safely
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'question')::text
      ELSE NULL
    END as question,
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'type')::text
      ELSE NULL
    END as item_type,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'options'
      ELSE NULL
    END as options,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'blanks'
      ELSE NULL
    END as blanks,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'lines'
      ELSE NULL
    END as lines,
    CASE 
      WHEN ti.source_type = 'custom' THEN ti.custom_data->'pairs'
      ELSE NULL
    END as pairs,
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'statement')::text
      ELSE NULL
    END as statement,
    CASE 
      WHEN ti.source_type = 'custom' THEN (ti.custom_data->>'code_template')::text
      ELSE NULL
    END as code_template
  FROM public.test_items ti
  WHERE ti.test_id = v_test_id
    AND (ti.variant = p_variant OR ti.variant = 'both')
  ORDER BY ti.sort_order;
END;
$$;
