
DO $$
DECLARE
  v_cs51 uuid := '2e769e95-b755-4763-8538-553e715c74c2';
  v_cs53 uuid := '4c96fbbe-6cda-4d62-8663-50796826c0c2';
  v_cs55 uuid := 'f8aad673-2d82-4ac3-80e6-2f04141561f4';
  v_m116 uuid; v_m117 uuid; v_m118 uuid;
  v_m119 uuid; v_m120 uuid; v_m121 uuid;
  v_m122 uuid; v_m123 uuid; v_m124 uuid;
BEGIN
  -- CS 5.1
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M116', 'Argumentează alegerea tipului de dată (int/float/str)', 'Justifică folosirea unui tip potrivit pentru problema dată.', v_cs51, 'A', 9, 116)
  RETURNING id INTO v_m116;
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M117', 'Argumentează alegerea structurii de control (if/for/while)', 'Explică de ce o structură se potrivește mai bine decât alta.', v_cs51, 'A', 9, 117)
  RETURNING id INTO v_m117;
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M118', 'Argumentează alegerea unei variabile acumulator', 'Justifică folosirea unei variabile de acumulare (sumă, contor, max).', v_cs51, 'A', 9, 118)
  RETURNING id INTO v_m118;

  -- CS 5.3
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M119', 'Evaluează corectitudinea unei funcții', 'Analizează dacă funcția produce rezultatul așteptat pe cazuri de test.', v_cs53, 'A', 9, 119)
  RETURNING id INTO v_m119;
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M120', 'Evaluează reutilizabilitatea unei funcții', 'Analizează cât de generală și reutilizabilă este o funcție.', v_cs53, 'A', 9, 120)
  RETURNING id INTO v_m120;
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M121', 'Evaluează claritatea semnăturii unei funcții', 'Analizează numele, parametrii și returul în raport cu scopul.', v_cs53, 'A', 9, 121)
  RETURNING id INTO v_m121;

  -- CS 5.5
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M122', 'Evaluează un program compus din mai multe subprograme', 'Analizează cum interacționează funcțiile într-un program.', v_cs55, 'A', 9, 122)
  RETURNING id INTO v_m122;
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M123', 'Evaluează efectul apelurilor de funcție asupra rezultatelor', 'Urmărește cum se propagă valorile prin apeluri succesive.', v_cs55, 'A', 9, 123)
  RETURNING id INTO v_m123;
  INSERT INTO public.microcompetencies (code, title, description, specific_id, category, grade, sort_order)
  VALUES ('M124', 'Evaluează separarea responsabilităților între funcții', 'Analizează dacă fiecare funcție are un rol clar și distinct.', v_cs55, 'A', 9, 124)
  RETURNING id INTO v_m124;

  -- Tag Chapter UI 1 (ch1 + cap1) for CS 5.1 (rotate M116/M117/M118)
  WITH picked_lessons AS (
    SELECT id, row_number() OVER (ORDER BY sort_order) AS rn
    FROM public.lessons WHERE chapter_id = 'ch1'
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
    CASE bucket % 3 WHEN 0 THEN v_m116 WHEN 1 THEN v_m117 ELSE v_m118 END, 1.00
  FROM sampled
  ON CONFLICT DO NOTHING;

  WITH nums AS (
    SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn
    FROM public.problems p WHERE p.chapter_id = 'cap1'
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'problem', id,
    CASE rn % 3 WHEN 0 THEN v_m116 WHEN 1 THEN v_m117 ELSE v_m118 END, 1.00
  FROM nums
  ON CONFLICT DO NOTHING;

  -- Tag Chapter UI 3 (ch5 + cap5) for CS 5.3 and CS 5.5 (rotate 6 micros)
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
    (ARRAY[v_m119, v_m120, v_m121, v_m122, v_m123, v_m124])[(bucket % 6) + 1], 1.00
  FROM sampled
  ON CONFLICT DO NOTHING;

  WITH nums AS (
    SELECT p.id, row_number() OVER (ORDER BY p.id) AS rn
    FROM public.problems p WHERE p.chapter_id = 'cap5'
  )
  INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
  SELECT 'problem', id,
    (ARRAY[v_m119, v_m120, v_m121, v_m122, v_m123, v_m124])[(rn % 6)::int + 1], 1.00
  FROM nums
  ON CONFLICT DO NOTHING;
END $$;
