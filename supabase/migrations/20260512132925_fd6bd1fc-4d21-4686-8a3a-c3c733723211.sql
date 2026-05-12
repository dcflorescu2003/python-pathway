
CREATE TABLE public.test_chapters (
  id text PRIMARY KEY,
  title text NOT NULL,
  icon text NOT NULL DEFAULT '📘',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.test_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read test_chapters"
  ON public.test_chapters FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage test_chapters"
  ON public.test_chapters FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.predefined_tests
  ADD COLUMN chapter_id text REFERENCES public.test_chapters(id) ON DELETE SET NULL;

INSERT INTO public.test_chapters (id, title, icon, sort_order)
VALUES ('recapitulare', 'Recapitulare', '📘', 0);

UPDATE public.predefined_tests SET chapter_id = 'recapitulare' WHERE chapter_id IS NULL;
