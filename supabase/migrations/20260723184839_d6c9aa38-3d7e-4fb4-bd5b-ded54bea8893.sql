
CREATE OR REPLACE FUNCTION public.prevent_user_type_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_type IS DISTINCT FROM OLD.user_type THEN
    IF NOT public.is_admin_or_master(auth.uid()) THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o tipo de perfil (user_type)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_type_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_user_type_self_escalation
BEFORE UPDATE OF user_type ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_type_self_escalation();
