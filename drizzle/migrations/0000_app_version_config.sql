CREATE TABLE public.app_version_config (
  platform text PRIMARY KEY CHECK (platform IN ('android','ios')),
  latest_version text NOT NULL DEFAULT '1.232',
  min_supported_version text NOT NULL DEFAULT '1.0',
  store_url text NOT NULL DEFAULT '',
  release_notes text,
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_version_config TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_version_config TO authenticated;
GRANT ALL ON public.app_version_config TO service_role;
ALTER TABLE public.app_version_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read version config" ON public.app_version_config FOR SELECT USING (true);
CREATE POLICY "Admins insert version config" ON public.app_version_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update version config" ON public.app_version_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_app_version_config_updated BEFORE UPDATE ON public.app_version_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.app_version_config (platform, latest_version, min_supported_version, store_url) VALUES
 ('android','1.232','1.0','https://play.google.com/store/apps/details?id=ro.pythonpathway.app'),
 ('ios','1.232','1.0','https://apps.apple.com/us/app/pyro/id6762510941');