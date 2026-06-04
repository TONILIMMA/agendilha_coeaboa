-- Fix verify_admin_pin to include extensions in search_path for pgcrypto functions
CREATE OR REPLACE FUNCTION public.verify_admin_pin(input_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT pin_hash INTO stored_hash
    FROM public.admin_configs
    WHERE user_id = auth.uid();

    -- If no PIN is set in admin_configs, the default is '0000'
    IF stored_hash IS NULL THEN
        RETURN input_pin = '0000';
    END IF;

    -- Compare the input with the stored hash using crypt
    RETURN stored_hash = crypt(input_pin, stored_hash) OR (stored_hash = '0000' AND input_pin = '0000');
END;
$function$;

-- Fix update_admin_pin to include extensions in search_path for pgcrypto functions
CREATE OR REPLACE FUNCTION public.update_admin_pin(new_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
BEGIN
    INSERT INTO public.admin_configs (user_id, pin_hash)
    VALUES (auth.uid(), crypt(new_pin, gen_salt('bf')))
    ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = now();
END;
$function$;