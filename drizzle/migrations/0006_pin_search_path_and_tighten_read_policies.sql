-- 1. Pin search_path on SECURITY DEFINER email-queue helpers (bodies are fully schema-qualified via pgmq.*)
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';

-- 2. Replace tautological USING (true) with an explicit authenticated check on catalog tables
--    (roles are already 'authenticated', so this changes no behavior — it just removes the tautology)
DROP POLICY "Authenticated users can read chapters" ON public.chapters;
CREATE POLICY "Authenticated users can read chapters" ON public.chapters FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated users can read lessons" ON public.lessons;
CREATE POLICY "Authenticated users can read lessons" ON public.lessons FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated users can read problem_chapters" ON public.problem_chapters;
CREATE POLICY "Authenticated users can read problem_chapters" ON public.problem_chapters FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read competencies_general" ON public.competencies_general;
CREATE POLICY "Authenticated can read competencies_general" ON public.competencies_general FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read competencies_specific" ON public.competencies_specific;
CREATE POLICY "Authenticated can read competencies_specific" ON public.competencies_specific FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read microcompetencies" ON public.microcompetencies;
CREATE POLICY "Authenticated can read microcompetencies" ON public.microcompetencies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read item_competencies" ON public.item_competencies;
CREATE POLICY "Authenticated can read item_competencies" ON public.item_competencies FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read eval_chapters" ON public.eval_chapters;
CREATE POLICY "Authenticated can read eval_chapters" ON public.eval_chapters FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read eval_lessons" ON public.eval_lessons;
CREATE POLICY "Authenticated can read eval_lessons" ON public.eval_lessons FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read test_chapters" ON public.test_chapters;
CREATE POLICY "Authenticated can read test_chapters" ON public.test_chapters FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY "Authenticated can read predefined_tests" ON public.predefined_tests;
CREATE POLICY "Authenticated can read predefined_tests" ON public.predefined_tests FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);