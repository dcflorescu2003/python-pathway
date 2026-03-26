
CREATE TABLE public.admin_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read admin_emails" ON public.admin_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert admin_emails" ON public.admin_emails FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete admin_emails" ON public.admin_emails FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.admin_emails (email) VALUES ('dcflorescu2003@gmail.com');
