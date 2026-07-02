
DO $$
DECLARE
  v_cs uuid := '321a267d-495e-42d2-b9eb-5e42902c1388';
  v_m113 uuid;
  v_m114 uuid;
  v_m115 uuid;
BEGIN
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M113', 'Analizează definirea și apelul unei funcții', 'Identifică parametri, argumente, valoare returnată.', v_cs, 'A', 9, 113)
  RETURNING id INTO v_m113;

  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M114', 'Analizează domeniul de vizibilitate al variabilelor', 'Distinge variabile locale vs globale în funcții.', v_cs, 'A', 9, 114)
  RETURNING id INTO v_m114;

  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M115', 'Analizează descompunerea unei probleme în subprograme', 'Împarte o problemă în funcții mai mici, reutilizabile.', v_cs, 'A', 9, 115)
  RETURNING id INTO v_m115;

  WITH picked_lessons AS (
    SELECT id, row_number() OVER (ORDER BY sort_order) AS rn
    FROM public.lessons WHERE chapter_id = 'ch5'
  ), selected_lessons AS (
    SELECT id, rn FROM picked_lessons WHERE rn % 3 = 1
  ), picked_exercises AS (
    SELECT e.id, row_number() OVER (PARTITION BY e.lesson_id ORDER BY e.sort_order, e.id) AS ern, sl.rn AS lrn
    FROM public.exercises e JOIN selected_lessons sl ON sl.id = e.lesson_id
  ), sampled AS (
    SELECT id, (lrn + ern) AS bucket FROM picked_exercises WHERE ern % 4 = 1
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'exercise', id,
    CASE bucket % 3 WHEN 0 THEN v_m113 WHEN 1 THEN v_m114 ELSE v_m115 END, 1.00
  FROM sampled
  ON CONFLICT DO NOTHING;

  WITH nums AS (
    SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn
    FROM public.problems p WHERE p.chapter_id = 'cap5'
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'problem', id,
    CASE rn % 3 WHEN 0 THEN v_m113 WHEN 1 THEN v_m114 ELSE v_m115 END, 1.00
  FROM nums
  ON CONFLICT DO NOTHING;
END $$;
