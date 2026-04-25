-- Auto-tag existing exercises and manual_exercises with microcompetencies
-- based on lesson title heuristics (chapter + keywords).
-- Idempotent thanks to UNIQUE (item_type, item_id, microcompetency_id).

DO $$
DECLARE
  v_pattern text;
  v_codes text[];
  v_mapping record;
BEGIN
  -- Each row: (lesson title ILIKE pattern, microcompetency codes)
  FOR v_mapping IN
    SELECT * FROM (VALUES
      -- ===== Cap. 1 — Recapitulare & Fundamente =====
      ('%gândir%computațional%', ARRAY['M1','M5','M7']),
      ('%gândire computațional%', ARRAY['M1','M5','M7']),
      ('%descompunere%problem%', ARRAY['M5','M7']),
      ('%pseudocod%', ARRAY['M8','M9']),
      ('%limbaj natural%', ARRAY['M8','M9']),
      ('%recunoa%tipar%', ARRAY['M6','M7']),
      ('%abstractiz%', ARRAY['M7']),
      ('%ce este un algoritm%', ARRAY['M1','M9']),
      ('%introducere în algoritm%', ARRAY['M1','M9']),
      ('%date de intrare%', ARRAY['M2','M3']),
      ('%date de manevră%', ARRAY['M4']),
      ('%etapele elaborării%', ARRAY['M10','M11']),
      ('%testarea algoritmilor%', ARRAY['M15','M16']),
      ('%urmărirea valorilor%', ARRAY['M17','M24']),
      ('%tipuri de erori%', ARRAY['M12','M13','M14']),
      ('%variabile%', ARRAY['M18','M19','M20']),
      ('%atribuir%', ARRAY['M19','M20']),
      ('%citir%afi%', ARRAY['M22','M23']),
      ('%citrea%afi%', ARRAY['M22','M23']),
      ('%tipuri de date%', ARRAY['M21']),
      ('%operatori aritmetici%', ARRAY['M25','M28','M29']),
      ('%operatori relaționali%', ARRAY['M26']),
      ('%operatori logici%', ARRAY['M27','M35']),
      ('%expresi%', ARRAY['M28','M30']),

      -- if/elif/else, while, for
      ('%if/elif/else%', ARRAY['M31','M32','M33','M34','M36']),
      ('%structura if%', ARRAY['M31','M32','M33','M36']),
      ('%structura while%', ARRAY['M37','M38','M39','M42']),
      ('%structura for%', ARRAY['M40','M41','M42']),
      ('%condiții și bucle%', ARRAY['M31','M34','M37','M40','M42']),
      ('%bucle imbricate%', ARRAY['M40','M42']),
      ('%probleme cu numere%', ARRAY['M25','M28','M40']),
      ('%test recapitulativ%', ARRAY['M17','M19','M31','M40']),

      -- ===== Cap. 2 — Prelucrări numerice =====
      ('%cifrele unui număr%', ARRAY['M43','M44','M45','M46','M47']),
      ('%cifre%', ARRAY['M43','M47']),
      ('%cifre avansate%', ARRAY['M48','M49','M50','M51']),
      ('%divizor%', ARRAY['M52','M53']),
      ('%divizori complec%', ARRAY['M52','M53','M54']),
      ('%algoritmul lui euclid%', ARRAY['M56','M57']),
      ('%descompunere în factori%', ARRAY['M54','M58']),
      ('%conversii între baze%', ARRAY['M59','M60']),
      ('%baze de numera%', ARRAY['M59','M60']),
      ('%test%prelucrări numeric%', ARRAY['M44','M52','M56','M59']),

      -- ===== Cap. 3 — Liste =====
      ('%modelul conceptual de listă%', ARRAY['M61']),
      ('%stiv%coad%', ARRAY['M67','M68']),
      ('%lista de frecven%', ARRAY['M70']),
      ('%parcurgere liniară%', ARRAY['M64','M65']),
      ('%clasa list%', ARRAY['M62','M63','M66']),
      ('%metode ale clasei list%', ARRAY['M66']),
      ('%operații cu li%', ARRAY['M62','M63','M64','M65','M66']),
      ('%practică%list%', ARRAY['M64','M65','M66']),
      ('%test%list%', ARRAY['M61','M64','M65','M67']),

      -- ===== Cap. 4 — Sortare/Generare =====
      ('%bubble%', ARRAY['M71','M72']),
      ('%selection%', ARRAY['M71','M73']),
      ('%insertion%', ARRAY['M71','M74']),
      ('%sortare%', ARRAY['M71','M72','M73','M74']),
      ('%generare%', ARRAY['M75','M76','M77']),
      ('%permut%', ARRAY['M76']),
      ('%combin%', ARRAY['M77']),
      ('%aranjam%', ARRAY['M77']),

      -- ===== Cap. 5 — Subprograme =====
      ('%funcți%', ARRAY['M78','M79','M80','M81']),
      ('%subprogram%', ARRAY['M78','M79','M80']),
      ('%parametri%', ARRAY['M80','M81']),
      ('%return%', ARRAY['M82']),
      ('%recursi%', ARRAY['M88','M89','M90']),

      -- ===== Cap. 6 — Fișiere & Interfețe =====
      ('%fișier%', ARRAY['M91','M92','M93','M94']),
      ('%fisier%', ARRAY['M91','M92','M93','M94']),
      ('%tkinter%', ARRAY['M95','M96','M97','M98','M99']),
      ('%interfa%', ARRAY['M96','M97','M98']),
      ('%mini%aplica%', ARRAY['M100'])
    ) AS t(pattern, codes)
  LOOP
    v_pattern := v_mapping.pattern;
    v_codes := v_mapping.codes;

    -- Curriculum exercises
    INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
    SELECT 'exercise', e.id, m.id, 1.0
    FROM public.exercises e
    JOIN public.lessons l ON l.id = e.lesson_id
    JOIN public.microcompetencies m ON m.code = ANY(v_codes)
    WHERE l.title ILIKE v_pattern
    ON CONFLICT (item_type, item_id, microcompetency_id) DO NOTHING;

    -- Manual exercises
    INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
    SELECT 'manual_exercise', me.id, m.id, 1.0
    FROM public.manual_exercises me
    JOIN public.manual_lessons ml ON ml.id = me.lesson_id
    JOIN public.microcompetencies m ON m.code = ANY(v_codes)
    WHERE ml.title ILIKE v_pattern
    ON CONFLICT (item_type, item_id, microcompetency_id) DO NOTHING;

    -- Eval exercises (if eval_lessons share similar titles)
    INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
    SELECT 'eval_exercise', ee.id, m.id, 1.0
    FROM public.eval_exercises ee
    JOIN public.eval_lessons el ON el.id = ee.lesson_id
    JOIN public.microcompetencies m ON m.code = ANY(v_codes)
    WHERE el.title ILIKE v_pattern
    ON CONFLICT (item_type, item_id, microcompetency_id) DO NOTHING;
  END LOOP;
END $$;

-- Tag problems by chapter title (problem_chapters)
INSERT INTO public.item_competencies (item_type, item_id, microcompetency_id, weight)
SELECT 'problem', p.id, m.id, 1.0
FROM public.problems p
JOIN public.problem_chapters pc ON pc.id = p.chapter_id
JOIN public.microcompetencies m ON (
  (pc.title ILIKE '%prelucr%numeric%' AND m.code IN ('M43','M44','M52','M54','M56'))
  OR (pc.title ILIKE '%list%' AND m.code IN ('M62','M63','M64','M65'))
  OR (pc.title ILIKE '%sort%' AND m.code IN ('M71','M72'))
  OR (pc.title ILIKE '%subprogram%' AND m.code IN ('M78','M80','M82'))
  OR (pc.title ILIKE '%fișier%' AND m.code IN ('M91','M92','M93'))
  OR (pc.title ILIKE '%recursi%' AND m.code IN ('M88','M89'))
)
ON CONFLICT (item_type, item_id, microcompetency_id) DO NOTHING;