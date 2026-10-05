CREATE TABLE public.catalog_version (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.catalog_version TO anon, authenticated;
GRANT ALL ON public.catalog_version TO service_role;
ALTER TABLE public.catalog_version ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read catalog version" ON public.catalog_version FOR SELECT USING (true);
INSERT INTO public.catalog_version (id, version) VALUES (1, 1);

CREATE OR REPLACE FUNCTION public.bump_catalog_version()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.catalog_version SET version = version + 1, updated_at = now() WHERE id = 1;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_catalog_bump_chapters AFTER INSERT OR UPDATE OR DELETE ON public.chapters FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_version();
CREATE TRIGGER trg_catalog_bump_lessons AFTER INSERT OR UPDATE OR DELETE ON public.lessons FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_version();
CREATE TRIGGER trg_catalog_bump_exercises AFTER INSERT OR UPDATE OR DELETE ON public.exercises FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_version();
CREATE TRIGGER trg_catalog_bump_problem_chapters AFTER INSERT OR UPDATE OR DELETE ON public.problem_chapters FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_version();
CREATE TRIGGER trg_catalog_bump_problems AFTER INSERT OR UPDATE OR DELETE ON public.problems FOR EACH STATEMENT EXECUTE FUNCTION public.bump_catalog_version();