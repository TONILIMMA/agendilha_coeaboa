-- 1. Security hardening for verify_admin_pin
-- Keep parameter name input_pin (standard for this function)
CREATE OR REPLACE FUNCTION public.verify_admin_pin(input_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT pin_hash INTO stored_hash
    FROM public.admin_configs
    WHERE user_id = auth.uid();

    -- If no PIN is set, we return false. Admin must set a PIN via update_admin_pin first.
    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN stored_hash = crypt(input_pin, stored_hash);
END;
$function$;

-- 2. Revoke public execute on sensitive functions
REVOKE EXECUTE ON FUNCTION public.verify_admin_pin(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_admin_pin(text) FROM public;
GRANT EXECUTE ON FUNCTION public.update_admin_pin(text) TO authenticated;

-- 3. Update is_master and has_role with search_path, keeping original parameter names to avoid 42P13/2BP01
-- Original parameters were likely _user_id and _role based on earlier logs/context
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_user_roles ur
        JOIN public.app_roles r ON ur.role_id = r.id
        WHERE ur.user_id = _user_id AND r.name = 'master_admin'
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'master'
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_user_roles ur
        JOIN public.app_roles r ON ur.role_id = r.id
        WHERE ur.user_id = _user_id AND r.name = _role
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    );
END;
$function$;
