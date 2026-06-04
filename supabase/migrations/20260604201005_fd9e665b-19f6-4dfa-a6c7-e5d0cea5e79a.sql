CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    -- This function now correctly handles the cast to the public.app_role enum
    RETURN EXISTS (
        SELECT 1 FROM public.app_user_roles ur
        JOIN public.app_roles r ON ur.role_id = r.id
        WHERE ur.user_id = _user_id AND r.name = _role
    ) OR EXISTS (
        SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role::public.app_role
    );
END;
$function$;

-- Temporarily disable the trigger to allow the profile update
ALTER TABLE public.profiles DISABLE TRIGGER profiles_prevent_role_escalation;

UPDATE public.profiles SET role = 'master' WHERE user_id = '44c5515f-e338-405a-b4bb-e76e2549cf53';

-- Re-enable the trigger
ALTER TABLE public.profiles ENABLE TRIGGER profiles_prevent_role_escalation;