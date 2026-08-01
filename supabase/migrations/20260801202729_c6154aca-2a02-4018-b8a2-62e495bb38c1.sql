-- 1) PIN de recuperação para qualquer usuário
CREATE TABLE IF NOT EXISTS public.user_pins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  last_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.user_pins TO service_role;
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy: o hash do PIN só é lido/escrito por funções SECURITY DEFINER.

CREATE TABLE IF NOT EXISTS public.pin_reset_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.pin_reset_attempts TO service_role;
ALTER TABLE public.pin_reset_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_pin_reset_attempts_user_time
  ON public.pin_reset_attempts (user_id, created_at DESC);

CREATE TRIGGER trg_user_pins_updated_at
  BEFORE UPDATE ON public.user_pins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Status do PIN do usuário logado
CREATE OR REPLACE FUNCTION public.user_pin_status()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_pins
    WHERE user_id = auth.uid() AND length(pin_hash) >= 20
  );
$$;

REVOKE ALL ON FUNCTION public.user_pin_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_pin_status() TO authenticated;

-- 3) Definir / trocar o próprio PIN confirmando a senha da conta
CREATE OR REPLACE FUNCTION public.set_user_pin(new_pin TEXT, current_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _user_id UUID;
  _auth_pass TEXT;
  _is_admin BOOLEAN;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF new_pin IS NULL OR new_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'O PIN deve ter exatamente 4 números';
  END IF;

  IF new_pin IN ('0000', '1111', '1234') THEN
    RAISE EXCEPTION 'Escolha um PIN menos previsível';
  END IF;

  SELECT encrypted_password INTO _auth_pass FROM auth.users WHERE id = _user_id;
  IF _auth_pass IS NULL OR _auth_pass <> crypt(current_password, _auth_pass) THEN
    RAISE EXCEPTION 'Senha atual incorreta';
  END IF;

  INSERT INTO public.user_pins (user_id, pin_hash, last_changed_at)
  VALUES (_user_id, crypt(new_pin, gen_salt('bf')), now())
  ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = EXCLUDED.pin_hash, last_changed_at = now(), updated_at = now();

  DELETE FROM public.pin_reset_attempts WHERE user_id = _user_id AND success = false;

  -- Admins usam o mesmo PIN no gate do painel
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'master')
  ) INTO _is_admin;

  IF _is_admin THEN
    INSERT INTO public.admin_configs (user_id, pin_hash, requires_change, last_changed_at)
    VALUES (_user_id, crypt(new_pin, gen_salt('bf')), false, now())
    ON CONFLICT (user_id) DO UPDATE
      SET pin_hash = EXCLUDED.pin_hash, requires_change = false, last_changed_at = now(), updated_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_pin(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_pin(TEXT, TEXT) TO authenticated;

-- 4) Conferência do PIN na recuperação de senha (somente servidor)
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
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Uso restrito ao servidor';
  END IF;

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

-- 5) Sincroniza o PIN do gate admin com o PIN de recuperação
CREATE OR REPLACE FUNCTION public.sync_admin_pin_to_user_pin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pin_hash IS NOT NULL AND length(NEW.pin_hash) >= 20 THEN
    INSERT INTO public.user_pins (user_id, pin_hash, last_changed_at)
    VALUES (NEW.user_id, NEW.pin_hash, now())
    ON CONFLICT (user_id) DO UPDATE
      SET pin_hash = EXCLUDED.pin_hash, last_changed_at = now(), updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_admin_pin_to_user_pin ON public.admin_configs;
CREATE TRIGGER trg_sync_admin_pin_to_user_pin
  AFTER INSERT OR UPDATE OF pin_hash ON public.admin_configs
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_pin_to_user_pin();

-- Popula com os PINs de admin já existentes
INSERT INTO public.user_pins (user_id, pin_hash, last_changed_at)
SELECT user_id, pin_hash, COALESCE(last_changed_at, now())
FROM public.admin_configs
WHERE pin_hash IS NOT NULL AND length(pin_hash) >= 20
ON CONFLICT (user_id) DO NOTHING;