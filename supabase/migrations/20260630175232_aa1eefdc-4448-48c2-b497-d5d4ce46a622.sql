CREATE OR REPLACE FUNCTION public.notify_admins_on_new_atrativo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient RECORD;
BEGIN
  FOR recipient IN
    SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin','master')
  LOOP
    INSERT INTO public.app_notifications (user_id, type, title, body, link, entity_table, entity_id)
    VALUES (
      recipient.user_id,
      'atrativo_new',
      'Novo atrativo cadastrado',
      COALESCE(NEW.name, 'Sem título'),
      '/admin/atrativos?id=' || NEW.id::text,
      'atrativos',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_admins_on_new_atrativo() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_atrativo ON public.atrativos;
CREATE TRIGGER trg_notify_admins_on_new_atrativo
AFTER INSERT ON public.atrativos
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_new_atrativo();