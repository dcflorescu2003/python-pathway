
DO $$
DECLARE
  v_cs22 uuid := '2738f419-347d-46d1-817e-72dc124486a2';
  v_m107 uuid;
  v_m108 uuid;
  v_m109 uuid;
BEGIN
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M107', 'Explică pașii unui algoritm de prelucrare a cifrelor', 'Descrie ce se întâmplă la fiecare iterație (extragere cifră, actualizare rezultat).', v_cs22, 'A', 9, 107)
  RETURNING id INTO v_m107;

  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M108', 'Explică evoluția stării unei liste în parcurgere', 'Descrie cum se modifică lista/variabilele acumulator pas cu pas.', v_cs22, 'A', 9, 108)
  RETURNING id INTO v_m108;

  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M109', 'Explică pașii unui algoritm de sortare', 'Descrie ce compară și ce mută la fiecare iterație (bule, selecție, inserție).', v_cs22, 'A', 9, 109)
  RETURNING id INTO v_m109;

  -- M107: Chapter 1 (ch1) + Chapter 2 (ch-1778012338147)
  -- Tag ~30% lessons, ~25% exercises per selected lesson
  WITH picked_lessons AS (
    SELECT id FROM public.lessons
    WHERE chapter_id IN ('ch1','ch-1778012338147')
    ORDER BY chapter_id, sort_order
  ), numbered AS (
    SELECT id, row_number() OVER () AS rn, count(*) OVER () AS total FROM picked_lessons
  ), selected_lessons AS (
    SELECT id FROM numbered WHERE rn % 3 = 1
  ), picked_exercises AS (
    SELECT e.id, row_number() OVER (PARTITION BY e.lesson_id ORDER BY e.sort_order, e.id) AS rn
    FROM public.exercises e
    WHERE e.lesson_id IN (SELECT id FROM selected_lessons)
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'exercise', id, v_m107, 1.00 FROM picked_exercises WHERE rn % 4 = 1
  ON CONFLICT DO NOTHING;

  -- Problems from cap1 and cap2
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'problem', p.id, v_m107, 1.00
  FROM public.problems p
  JOIN public.problem_chapters pc ON pc.id = p.chapter_id
  WHERE pc.id IN ('cap1','cap2')
  ON CONFLICT DO NOTHING;

  -- M108: Chapter 5 UI = ch3 (Liste)
  WITH picked_lessons AS (
    SELECT id FROM public.lessons WHERE chapter_id = 'ch3' ORDER BY sort_order
  ), numbered AS (
    SELECT id, row_number() OVER () AS rn FROM picked_lessons
  ), selected_lessons AS (
    SELECT id FROM numbered WHERE rn % 3 = 1
  ), picked_exercises AS (
    SELECT e.id, row_number() OVER (PARTITION BY e.lesson_id ORDER BY e.sort_order, e.id) AS rn
    FROM public.exercises e
    WHERE e.lesson_id IN (SELECT id FROM selected_lessons)
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'exercise', id, v_m108, 1.00 FROM picked_exercises WHERE rn % 4 = 1
  ON CONFLICT DO NOTHING;

  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'problem', p.id, v_m108, 1.00
  FROM public.problems p WHERE p.chapter_id = 'cap3'
  ON CONFLICT DO NOTHING;

  -- M109: Chapter 6 UI = ch4 (Generare și Sortare)
  WITH picked_lessons AS (
    SELECT id FROM public.lessons WHERE chapter_id = 'ch4' ORDER BY sort_order
  ), numbered AS (
    SELECT id, row_number() OVER () AS rn FROM picked_lessons
  ), selected_lessons AS (
    SELECT id FROM numbered WHERE rn % 3 = 1
  ), picked_exercises AS (
    SELECT e.id, row_number() OVER (PARTITION BY e.lesson_id ORDER BY e.sort_order, e.id) AS rn
    FROM public.exercises e
    WHERE e.lesson_id IN (SELECT id FROM selected_lessons)
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'exercise', id, v_m109, 1.00 FROM picked_exercises WHERE rn % 4 = 1
  ON CONFLICT DO NOTHING;

  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'problem', p.id, v_m109, 1.00
  FROM public.problems p WHERE p.chapter_id = 'cap4'
  ON CONFLICT DO NOTHING;
END $$;
