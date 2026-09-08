CREATE OR REPLACE FUNCTION public.verify_user_pin_for_reset(p_user_id UUID, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _hash TEXT;
  _fails INT;
  _ok BOOLEAN;
BEGIN
  IF p_pin IS NULL OR p_pin !~ '^\d{4}$' THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO _fails
  FROM public.pin_reset_attempts
  WHERE user_id = p_user_id AND success = false AND created_at > now() - interval '15 minutes';

  IF _fails >= 5 THEN
    RAISE EXCEPTION 'PIN bloqueado por tentativas erradas. Tente de novo em 15 minutos.';
  END IF;

  SELECT pin_hash INTO _hash FROM public.user_pins WHERE user_id = p_user_id;
  _ok := _hash IS NOT NULL AND _hash = crypt(p_pin, _hash);

  INSERT INTO public.pin_reset_attempts (user_id, success) VALUES (p_user_id, _ok);
  RETURN _ok;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_user_pin_for_reset(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_user_pin_for_reset(UUID, TEXT) TO service_role;

GRANT SELECT ON public.atrativos TO anon;
GRANT SELECT ON public.estabelecimentos TO anon;
GRANT SELECT ON public.event_reviews TO anon;
GRANT SELECT ON public.submission_atrativos TO anon;