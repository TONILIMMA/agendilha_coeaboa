
-- 1) Enforce 4-digit PIN server-side
CREATE OR REPLACE FUNCTION public.update_admin_pin(new_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;
    IF new_pin IS NULL OR new_pin !~ '^\d{4}$' THEN
        RAISE EXCEPTION 'PIN deve conter exatamente 4 dígitos numéricos';
    END IF;
    INSERT INTO public.admin_configs (user_id, pin_hash)
    VALUES (auth.uid(), crypt(new_pin, gen_salt('bf')))
    ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_pin(input_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    IF input_pin IS NULL OR input_pin !~ '^\d{4}$' THEN
        RETURN false;
    END IF;

    SELECT pin_hash INTO stored_hash
    FROM public.admin_configs
    WHERE user_id = auth.uid();

    IF stored_hash IS NULL OR length(stored_hash) < 20 THEN
        RETURN false;
    END IF;

    RETURN stored_hash = crypt(input_pin, stored_hash);
END;
$$;

-- 2) Audit trigger for phone changes on profiles
CREATE OR REPLACE FUNCTION public.log_profile_phone_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
        INSERT INTO public.audit_logs (
            actor_id, action, resource_type, resource_id, previous_value, new_value
        ) VALUES (
            auth.uid(),
            'UPDATE_PHONE',
            'profiles',
            NEW.user_id::text,
            jsonb_build_object('phone', OLD.phone),
            jsonb_build_object('phone', NEW.phone)
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_profile_phone_change ON public.profiles;
CREATE TRIGGER trg_log_profile_phone_change
AFTER UPDATE OF phone ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_profile_phone_change();
