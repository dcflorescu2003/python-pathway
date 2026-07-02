
DO $$
DECLARE
  v_cs uuid;
  v_m110 uuid;
  v_m111 uuid;
  v_m112 uuid;
BEGIN
  SELECT id INTO v_cs FROM public.competencies_specific WHERE code = 'CS 4.4';

  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M110', 'Folosește indentarea și structura vizuală Python', 'Aplică corect indentarea și organizarea vizuală a blocurilor de cod.', v_cs, 'A', 9, 110)
  RETURNING id INTO v_m110;

  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M111', 'Folosește input()/print() pentru interacțiune', 'Citește date de la utilizator și afișează rezultate formatate.', v_cs, 'A', 9, 111)
  RETURNING id INTO v_m111;

  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M112', 'Folosește depanare simplă (print de verificare)', 'Urmărește valorile variabilelor pentru a identifica erori.', v_cs, 'A', 9, 112)
  RETURNING id INTO v_m112;

  -- Tag ~30% lessons, ~25% exercises from Chapter 2 (ch-1778012338147), 3 rotating micros
  WITH picked_lessons AS (
    SELECT id, row_number() OVER (ORDER BY sort_order) AS rn
    FROM public.lessons WHERE chapter_id = 'ch-1778012338147'
  ), selected_lessons AS (
    SELECT id, rn FROM picked_lessons WHERE rn % 3 = 1
  ), picked_exercises AS (
    SELECT e.id, e.lesson_id,
           row_number() OVER (PARTITION BY e.lesson_id ORDER BY e.sort_order, e.id) AS ern,
           sl.rn AS lrn
    FROM public.exercises e
    JOIN selected_lessons sl ON sl.id = e.lesson_id
  ), sampled AS (
    SELECT id, (lrn + ern) AS bucket FROM picked_exercises WHERE ern % 4 = 1
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'exercise', id,
    CASE bucket % 3 WHEN 0 THEN v_m110 WHEN 1 THEN v_m111 ELSE v_m112 END,
    1.00
  FROM sampled
  ON CONFLICT DO NOTHING;

  -- Problems from cap2 – rotate across the 3 micros
  WITH nums AS (
    SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn
    FROM public.problems p WHERE p.chapter_id = 'cap2'
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'problem', id,
    CASE rn % 3 WHEN 0 THEN v_m110 WHEN 1 THEN v_m111 ELSE v_m112 END,
    1.00
  FROM nums
  ON CONFLICT DO NOTHING;
END $$;
