
CREATE OR REPLACE FUNCTION public.notify_admins_on_verification_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin_id uuid;
  v_contact text;
BEGIN
  v_contact := COALESCE(NEW.contact_email, 'necunoscut');

  FOR v_admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      v_admin_id,
      'Cerere nouă de verificare profesor',
      'Metodă: ' || NEW.method || ' | Email: ' || v_contact
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_on_teacher_request
AFTER INSERT ON public.teacher_verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_verification_request();
