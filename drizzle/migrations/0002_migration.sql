CREATE TABLE public.web_ads_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  publisher_id text NOT NULL DEFAULT '',
  site_id text NOT NULL DEFAULT 'pyroskill.info',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.web_ads_config TO anon, authenticated;
GRANT UPDATE ON public.web_ads_config TO authenticated;
GRANT ALL ON public.web_ads_config TO service_role;
ALTER TABLE public.web_ads_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "web_ads_config public read" ON public.web_ads_config FOR SELECT USING (true);
CREATE POLICY "web_ads_config admin update" ON public.web_ads_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.web_ads_config (id) VALUES (1);