-- 1) Status do PIN do admin logado (informa se precisa configurar pela primeira vez)
CREATE OR REPLACE FUNCTION public.admin_pin_status()
RETURNS TABLE(is_admin BOOLEAN, has_pin BOOLEAN, requires_change BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID;
    _is_admin BOOLEAN;
    _hash TEXT;
    _req BOOLEAN;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RETURN QUERY SELECT false, false, false;
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'master')
    ) INTO _is_admin;

    IF NOT _is_admin THEN
        RETURN QUERY SELECT false, false, false;
        RETURN;
    END IF;

    SELECT pin_hash, requires_change INTO _hash, _req
    FROM public.admin_configs
    WHERE user_id = _user_id;

    RETURN QUERY SELECT true, (_hash IS NOT NULL AND length(_hash) >= 20), COALESCE(_req, true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_pin_status() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_pin_status() TO authenticated;

-- 2) Configuração inicial de PIN: só quando ainda não existe PIN
CREATE OR REPLACE FUNCTION public.setup_admin_pin(new_pin TEXT)
RETURNS TABLE(session_token UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    _user_id UUID;
    _hash TEXT;
    _token UUID;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, 'Não autenticado'::TEXT;
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'master')
    ) THEN
        RETURN QUERY SELECT NULL::UUID, 'Acesso restrito a administradores'::TEXT;
        RETURN;
    END IF;

    IF new_pin IS NULL OR new_pin !~ '^\d{4}$' THEN
        RETURN QUERY SELECT NULL::UUID, 'PIN deve conter exatamente 4 dígitos numéricos'::TEXT;
        RETURN;
    END IF;

    IF new_pin IN ('0000', '1111', '1234') THEN
        RETURN QUERY SELECT NULL::UUID, 'Escolha um PIN menos previsível'::TEXT;
        RETURN;
    END IF;

    SELECT pin_hash INTO _hash FROM public.admin_configs WHERE user_id = _user_id;

    IF _hash IS NOT NULL AND length(_hash) >= 20 THEN
        RETURN QUERY SELECT NULL::UUID, 'Você já tem um PIN. Use a troca de PIN ou "Esqueci o PIN".'::TEXT;
        RETURN;
    END IF;

    INSERT INTO public.admin_configs (user_id, pin_hash, requires_change, last_changed_at)
    VALUES (_user_id, crypt(new_pin, gen_salt('bf')), false, now())
    ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(new_pin, gen_salt('bf')), requires_change = false, last_changed_at = now(), updated_at = now();

    _token := gen_random_uuid();
    INSERT INTO public.admin_pin_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (
        _user_id,
        crypt(_token::TEXT, gen_salt('bf')),
        now() + interval '30 minutes',
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb ->> 'user-agent'
    );

    RETURN QUERY SELECT _token, NULL::TEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.setup_admin_pin(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.setup_admin_pin(TEXT) TO authenticated;

-- 3) Sessão de PIN: sem fallback 0000
CREATE OR REPLACE FUNCTION public.create_admin_pin_session(input_pin TEXT)
RETURNS TABLE(session_token UUID, requires_change BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    _user_id UUID;
    _stored_hash TEXT;
    _requires_change BOOLEAN;
    _failed_count INTEGER;
    _token UUID;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Não autenticado'::TEXT;
        RETURN;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'master')
    ) THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Acesso restrito a administradores'::TEXT;
        RETURN;
    END IF;

    _failed_count := public.count_recent_failed_pin_attempts(_user_id);
    IF _failed_count >= 5 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Muitas tentativas. Tente novamente em 15 minutos.'::TEXT;
        RETURN;
    END IF;

    IF input_pin IS NULL OR input_pin !~ '^\d{4}$' THEN
        INSERT INTO public.admin_pin_attempts (user_id, success) VALUES (_user_id, false);
        RETURN QUERY SELECT NULL::UUID, false, 'PIN deve ter 4 dígitos numéricos'::TEXT;
        RETURN;
    END IF;

    SELECT pin_hash, requires_change INTO _stored_hash, _requires_change
    FROM public.admin_configs
    WHERE user_id = _user_id;

    -- Sem PIN configurado: exige o fluxo de configuração inicial (sem PIN padrão)
    IF _stored_hash IS NULL OR length(_stored_hash) < 20 THEN
        RETURN QUERY SELECT NULL::UUID, false, 'PIN ainda não configurado. Defina seu PIN pessoal.'::TEXT;
        RETURN;
    END IF;

    IF _stored_hash != crypt(input_pin, _stored_hash) THEN
        INSERT INTO public.admin_pin_attempts (user_id, success) VALUES (_user_id, false);
        RETURN QUERY SELECT NULL::UUID, false, 'PIN incorreto'::TEXT;
        RETURN;
    END IF;

    IF _requires_change = true THEN
        RETURN QUERY SELECT NULL::UUID, true, NULL::TEXT;
        RETURN;
    END IF;

    _token := gen_random_uuid();
    INSERT INTO public.admin_pin_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (
        _user_id,
        crypt(_token::TEXT, gen_salt('bf')),
        now() + interval '30 minutes',
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb ->> 'user-agent'
    );

    DELETE FROM public.admin_pin_attempts
    WHERE user_id = _user_id AND success = false;

    RETURN QUERY SELECT _token, false, NULL::TEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_admin_pin_session(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_pin_session(TEXT) TO authenticated;

-- 4) Troca de PIN exige o PIN atual
DROP FUNCTION IF EXISTS public.update_admin_pin(TEXT);

CREATE OR REPLACE FUNCTION public.update_admin_pin(current_pin TEXT, new_pin TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    _user_id UUID;
    _stored_hash TEXT;
    _failed_count INTEGER;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'master')
    ) THEN
        RAISE EXCEPTION 'Acesso restrito a administradores';
    END IF;

    IF new_pin IS NULL OR new_pin !~ '^\d{4}$' THEN
        RAISE EXCEPTION 'PIN deve conter exatamente 4 dígitos numéricos';
    END IF;

    IF new_pin IN ('0000', '1111', '1234') THEN
        RAISE EXCEPTION 'Escolha um PIN menos previsível';
    END IF;

    SELECT pin_hash INTO _stored_hash FROM public.admin_configs WHERE user_id = _user_id;

    IF _stored_hash IS NULL OR length(_stored_hash) < 20 THEN
        RAISE EXCEPTION 'PIN ainda não configurado. Use a configuração inicial de PIN.';
    END IF;

    _failed_count := public.count_recent_failed_pin_attempts(_user_id);
    IF _failed_count >= 5 THEN
        RAISE EXCEPTION 'Muitas tentativas. Tente novamente em 15 minutos.';
    END IF;

    IF current_pin IS NULL OR _stored_hash != crypt(current_pin, _stored_hash) THEN
        INSERT INTO public.admin_pin_attempts (user_id, success) VALUES (_user_id, false);
        RAISE EXCEPTION 'PIN atual incorreto';
    END IF;

    UPDATE public.admin_configs
    SET pin_hash = crypt(new_pin, gen_salt('bf')),
        requires_change = false,
        last_changed_at = now(),
        updated_at = now()
    WHERE user_id = _user_id;

    DELETE FROM public.admin_pin_attempts WHERE user_id = _user_id AND success = false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_admin_pin(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_pin(TEXT, TEXT) TO authenticated;

-- 5) Esqueci o PIN: continua exigindo senha da conta, e bloqueia PINs previsíveis
CREATE OR REPLACE FUNCTION public.reset_admin_pin_with_password(new_pin TEXT, current_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    _user_id UUID;
    _auth_pass TEXT;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'master')
    ) THEN
        RAISE EXCEPTION 'Acesso restrito a administradores';
    END IF;

    IF new_pin IS NULL OR new_pin !~ '^\d{4}$' OR new_pin IN ('0000', '1111', '1234') THEN
        RAISE EXCEPTION 'PIN deve ter 4 dígitos numéricos e não pode ser previsível';
    END IF;

    SELECT encrypted_password INTO _auth_pass FROM auth.users WHERE id = _user_id;

    IF _auth_pass IS NULL THEN
        RAISE EXCEPTION 'Não foi possível verificar a senha';
    END IF;

    IF _auth_pass != crypt(current_password, _auth_pass) THEN
        RAISE EXCEPTION 'Senha atual incorreta';
    END IF;

    INSERT INTO public.admin_configs (user_id, pin_hash, requires_change, last_changed_at)
    VALUES (_user_id, crypt(new_pin, gen_salt('bf')), false, now())
    ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(new_pin, gen_salt('bf')), requires_change = false, last_changed_at = now(), updated_at = now();

    DELETE FROM public.admin_pin_attempts WHERE user_id = _user_id AND success = false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_admin_pin_with_password(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reset_admin_pin_with_password(TEXT, TEXT) TO authenticated;