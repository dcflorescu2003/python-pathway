
CREATE OR REPLACE FUNCTION public.notify_admins_on_verification_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_admin record;
  v_contact text;
  v_school text;
  v_supabase_url text;
  v_service_key text;
BEGIN
  v_contact := COALESCE(NEW.contact_email, 'necunoscut');
  v_school := COALESCE(NEW.data->>'school_name', '');

  FOR v_admin IN
    SELECT ur.user_id, ae.email
    FROM public.user_roles ur
    LEFT JOIN public.admin_emails ae ON ae.email = (
      SELECT au.email FROM auth.users au WHERE au.id = ur.user_id
    )
    WHERE ur.role = 'admin'
  LOOP
    -- In-app notification
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      v_admin.user_id,
      'Cerere nouă de verificare profesor',
      'Metodă: ' || NEW.method || ' | Email: ' || v_contact
    );
  END LOOP;

  -- Send email via Edge Function using pg_net
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  IF v_supabase_url IS NOT NULL AND v_service_key IS NOT NULL THEN
    FOR v_admin IN
      SELECT au.email
      FROM public.user_roles ur
      JOIN auth.users au ON au.id = ur.user_id
      WHERE ur.role = 'admin' AND au.email IS NOT NULL
    LOOP
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-transactional-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object(
          'templateName', 'teacher-verification-admin',
          'recipientEmail', v_admin.email,
          'idempotencyKey', 'teacher-verify-' || NEW.id::text || '-' || v_admin.email,
          'templateData', jsonb_build_object(
            'method', NEW.method,
            'contactEmail', v_contact,
            'schoolName', v_school
          )
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;
