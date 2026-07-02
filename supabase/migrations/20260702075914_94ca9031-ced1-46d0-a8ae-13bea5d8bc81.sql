
-- Undo greșit
DELETE FROM public.item_competencies
WHERE microcompetency_id IN (SELECT id FROM public.microcompetencies WHERE code IN ('M102','M103'));

-- M102 pe ch3 + cap3
INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
SELECT 'exercise', se.id, m.id, 1.0
FROM (
  WITH sel_lessons AS (
    SELECT id FROM public.lessons WHERE chapter_id='ch3'
    ORDER BY random() LIMIT GREATEST(1, ((SELECT COUNT(*) FROM public.lessons WHERE chapter_id='ch3')*0.3)::int)
  )
  SELECT e.id,
    row_number() OVER (PARTITION BY e.lesson_id ORDER BY random()) AS rn,
    count(*) OVER (PARTITION BY e.lesson_id) AS cnt
  FROM public.exercises e JOIN sel_lessons sl ON sl.id=e.lesson_id
) se, public.microcompetencies m
WHERE m.code='M102' AND se.rn <= GREATEST(1, (se.cnt*0.25)::int)
ON CONFLICT DO NOTHING;

INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
SELECT 'problem', p.id, m.id, 1.0
FROM (SELECT id FROM public.problems WHERE chapter_id='cap3'
      ORDER BY random() LIMIT GREATEST(1, ((SELECT COUNT(*) FROM public.problems WHERE chapter_id='cap3')*0.25)::int)) p,
     public.microcompetencies m
WHERE m.code='M102' ON CONFLICT DO NOTHING;

-- M103 pe ch4 + cap4
INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
SELECT 'exercise', se.id, m.id, 1.0
FROM (
  WITH sel_lessons AS (
    SELECT id FROM public.lessons WHERE chapter_id='ch4'
    ORDER BY random() LIMIT GREATEST(1, ((SELECT COUNT(*) FROM public.lessons WHERE chapter_id='ch4')*0.3)::int)
  )
  SELECT e.id,
    row_number() OVER (PARTITION BY e.lesson_id ORDER BY random()) AS rn,
    count(*) OVER (PARTITION BY e.lesson_id) AS cnt
  FROM public.exercises e JOIN sel_lessons sl ON sl.id=e.lesson_id
) se, public.microcompetencies m
WHERE m.code='M103' AND se.rn <= GREATEST(1, (se.cnt*0.25)::int)
ON CONFLICT DO NOTHING;

INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
SELECT 'problem', p.id, m.id, 1.0
FROM (SELECT id FROM public.problems WHERE chapter_id='cap4'
      ORDER BY random() LIMIT GREATEST(1, ((SELECT COUNT(*) FROM public.problems WHERE chapter_id='cap4')*0.25)::int)) p,
     public.microcompetencies m
WHERE m.code='M103' ON CONFLICT DO NOTHING;

-- Micros noi pentru CS 2.1
INSERT INTO public.microcompetencies (code, title, specific_id, category, grade, sort_order)
SELECT v.code, v.title, cs.id, 'A', 9, v.so
FROM (SELECT id FROM public.competencies_specific WHERE code='CS 2.1') cs,
(VALUES
  ('M104','Explică diferența între o variabilă simplă și o listă (ce reține fiecare).', 104),
  ('M105','Explică cum sunt indexate elementele unei liste (poziție 0-based, lungime).', 105),
  ('M106','Explică modelele stivă (LIFO) și coadă (FIFO) prin analogii.', 106)
) AS v(code,title,so);

-- M104, M105, M106 pe ch3 + cap3
DO $$
DECLARE mcode text;
BEGIN
  FOREACH mcode IN ARRAY ARRAY['M104','M105','M106'] LOOP
    INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
    SELECT 'exercise', se.id, m.id, 1.0
    FROM (
      WITH sel_lessons AS (
        SELECT id FROM public.lessons WHERE chapter_id='ch3'
        ORDER BY random() LIMIT GREATEST(1, ((SELECT COUNT(*) FROM public.lessons WHERE chapter_id='ch3')*0.3)::int)
      )
      SELECT e.id,
        row_number() OVER (PARTITION BY e.lesson_id ORDER BY random()) AS rn,
        count(*) OVER (PARTITION BY e.lesson_id) AS cnt
      FROM public.exercises e JOIN sel_lessons sl ON sl.id=e.lesson_id
    ) se, public.microcompetencies m
    WHERE m.code=mcode AND se.rn <= GREATEST(1, (se.cnt*0.25)::int)
    ON CONFLICT DO NOTHING;

    INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
    SELECT 'problem', p.id, m.id, 1.0
    FROM (SELECT id FROM public.problems WHERE chapter_id='cap3'
          ORDER BY random() LIMIT GREATEST(1, ((SELECT COUNT(*) FROM public.problems WHERE chapter_id='cap3')*0.25)::int)) p,
         public.microcompetencies m
    WHERE m.code=mcode ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
