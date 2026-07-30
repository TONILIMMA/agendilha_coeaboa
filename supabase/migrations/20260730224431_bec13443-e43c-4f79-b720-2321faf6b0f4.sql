-- 1) Tabela de sessões de desbloqueio do PIN (backend-controlled)
CREATE TABLE IF NOT EXISTS public.admin_pin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes'),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_pin_sessions TO authenticated;
GRANT ALL ON public.admin_pin_sessions TO service_role;

ALTER TABLE public.admin_pin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own admin pin sessions"
ON public.admin_pin_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) Auditoria de tentativas de PIN (bloqueio + log)
CREATE TABLE IF NOT EXISTS public.admin_pin_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.admin_pin_attempts TO authenticated;
GRANT ALL ON public.admin_pin_attempts TO service_role;

ALTER TABLE public.admin_pin_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own pin attempts"
ON public.admin_pin_attempts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own pin attempts"
ON public.admin_pin_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Garantir colunas de controle em admin_configs
ALTER TABLE public.admin_configs
ADD COLUMN IF NOT EXISTS requires_change BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_changed_at TIMESTAMP WITH TIME ZONE;

-- Forçar troca quando não há PIN configurado ou quando explicitamente marcado
UPDATE public.admin_configs SET requires_change = true WHERE pin_hash IS NULL;

-- 4) Função auxiliar: contar tentativas falhas recentes
CREATE OR REPLACE FUNCTION public.count_recent_failed_pin_attempts(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COUNT(*)::INTEGER
    FROM public.admin_pin_attempts
    WHERE user_id = _user_id
      AND success = false
      AND created_at > now() - interval '15 minutes';
$$;

REVOKE EXECUTE ON FUNCTION public.count_recent_failed_pin_attempts(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.count_recent_failed_pin_attempts(UUID) TO authenticated;

-- 5) Criar sessão de desbloqueio ao acertar o PIN
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
    _token_hash TEXT;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Não autenticado'::TEXT;
        RETURN;
    END IF;

    -- Verifica se é admin/master
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'master')
    ) THEN
        RETURN QUERY SELECT NULL::UUID, false, 'Acesso restrito a administradores'::TEXT;
        RETURN;
    END IF;

    -- Bloqueio temporário após 5 tentativas falhas em 15 min
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

    -- PIN ainda não configurado: exige troca obrigatória (primeiro acesso)
    IF _stored_hash IS NULL OR length(_stored_hash) < 20 THEN
        IF input_pin = '0000' THEN
            _requires_change := true;
            RETURN QUERY SELECT NULL::UUID, _requires_change, NULL::TEXT;
            RETURN;
        ELSE
            INSERT INTO public.admin_pin_attempts (user_id, success) VALUES (_user_id, false);
            RETURN QUERY SELECT NULL::UUID, false, 'PIN incorreto. Use 0000 no primeiro acesso.'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Verifica hash
    IF _stored_hash != crypt(input_pin, _stored_hash) THEN
        INSERT INTO public.admin_pin_attempts (user_id, success) VALUES (_user_id, false);
        RETURN QUERY SELECT NULL::UUID, false, 'PIN incorreto'::TEXT;
        RETURN;
    END IF;

    -- Se exige troca, não cria sessão ainda
    IF _requires_change = true THEN
        RETURN QUERY SELECT NULL::UUID, true, NULL::TEXT;
        RETURN;
    END IF;

    -- Cria sessão de desbloqueio
    _token := gen_random_uuid();
    _token_hash := crypt(_token::TEXT, gen_salt('bf'));

    INSERT INTO public.admin_pin_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
    VALUES (
        _user_id,
        _token_hash,
        now() + interval '30 minutes',
        inet_client_addr(),
        current_setting('request.headers', true)::jsonb ->> 'user-agent'
    );

    -- Limpa tentativas falhas antigas (reset após sucesso)
    DELETE FROM public.admin_pin_attempts
    WHERE user_id = _user_id AND success = false;

    RETURN QUERY SELECT _token, false, NULL::TEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_admin_pin_session(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.create_admin_pin_session(TEXT) TO authenticated;

-- 6) Verificar se sessão ainda é válida
CREATE OR REPLACE FUNCTION public.verify_admin_pin_session(input_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID;
    _stored_hash TEXT;
    _expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL OR input_token IS NULL THEN
        RETURN false;
    END IF;

    SELECT token_hash, expires_at INTO _stored_hash, _expires_at
    FROM public.admin_pin_sessions
    WHERE user_id = _user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF _stored_hash IS NULL OR _expires_at < now() THEN
        RETURN false;
    END IF;

    IF _stored_hash != crypt(input_token::TEXT, _stored_hash) THEN
        RETURN false;
    END IF;

    -- Atualiza last_verified_at para renovar uso ativo
    UPDATE public.admin_pin_sessions
    SET last_verified_at = now()
    WHERE user_id = _user_id AND token_hash = _stored_hash;

    RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_admin_pin_session(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin_session(UUID) TO authenticated;

-- 7) Revogar sessão (logout da área restrita)
CREATE OR REPLACE FUNCTION public.revoke_admin_pin_session(input_token UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL OR input_token IS NULL THEN
        RETURN;
    END IF;

    DELETE FROM public.admin_pin_sessions
    WHERE user_id = auth.uid()
      AND token_hash = crypt(input_token::TEXT, token_hash);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revoke_admin_pin_session(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.revoke_admin_pin_session(UUID) TO authenticated;

-- 8) Atualizar PIN (mantém regra de 4 dígitos e marca requires_change=false)
CREATE OR REPLACE FUNCTION public.update_admin_pin(new_pin TEXT)
RETURNS VOID
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

    IF new_pin = '0000' THEN
        RAISE EXCEPTION 'Escolha um PIN diferente do padrão 0000';
    END IF;

    INSERT INTO public.admin_configs (user_id, pin_hash, requires_change, last_changed_at)
    VALUES (auth.uid(), crypt(new_pin, gen_salt('bf')), false, now())
    ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(new_pin, gen_salt('bf')), requires_change = false, last_changed_at = now(), updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_admin_pin(TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_pin(TEXT) TO authenticated;

-- 9) Reset de PIN via senha da conta (fluxo "Esqueci o PIN")
CREATE OR REPLACE FUNCTION public.reset_admin_pin_with_password(new_pin TEXT, current_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    _user_id UUID;
    _auth_email TEXT;
    _auth_pass TEXT;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;

    IF new_pin IS NULL OR new_pin !~ '^\d{4}$' OR new_pin = '0000' THEN
        RAISE EXCEPTION 'PIN deve ter 4 dígitos numéricos e diferente do padrão';
    END IF;

    -- Recupera email e senha do auth.users para validar a senha atual
    SELECT email, encrypted_password INTO _auth_email, _auth_pass
    FROM auth.users
    WHERE id = _user_id;

    IF _auth_email IS NULL OR _auth_pass IS NULL THEN
        RAISE EXCEPTION 'Não foi possível verificar a senha';
    END IF;

    -- Valida a senha fornecida usando a mesma função do Supabase Auth
    IF _auth_pass != crypt(current_password, _auth_pass) THEN
        RAISE EXCEPTION 'Senha atual incorreta';
    END IF;

    INSERT INTO public.admin_configs (user_id, pin_hash, requires_change, last_changed_at)
    VALUES (_user_id, crypt(new_pin, gen_salt('bf')), false, now())
    ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(new_pin, gen_salt('bf')), requires_change = false, last_changed_at = now(), updated_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_admin_pin_with_password(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reset_admin_pin_with_password(TEXT, TEXT) TO authenticated;

-- 10) Master pode resetar PIN de outro admin (emergência)
CREATE OR REPLACE FUNCTION public.reset_admin_pin_as_master(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autenticado';
    END IF;

    IF NOT public.has_role(auth.uid(), 'master') THEN
        RAISE EXCEPTION 'Apenas Master pode resetar PIN de outros administradores';
    END IF;

    IF NOT public.has_role(target_user_id, 'admin') AND target_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Só é possível resetar PIN de administradores';
    END IF;

    UPDATE public.admin_configs
    SET pin_hash = NULL, requires_change = true, updated_at = now()
    WHERE user_id = target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_admin_pin_as_master(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reset_admin_pin_as_master(UUID) TO authenticated;

-- 11) Limpeza automática de sessões e tentativas antigas
CREATE OR REPLACE FUNCTION public.cleanup_admin_pin_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.admin_pin_sessions WHERE expires_at < now() - interval '24 hours';
    DELETE FROM public.admin_pin_attempts WHERE created_at < now() - interval '24 hours';
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_admin_pin_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_admin_pin_sessions() TO service_role;

-- 12) Trigger para garantir que Master sempre tenha PIN configurado
CREATE OR REPLACE FUNCTION public.ensure_master_pin_configured()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role = 'master' AND NOT EXISTS (
        SELECT 1 FROM public.admin_configs WHERE user_id = NEW.user_id AND pin_hash IS NOT NULL
    ) THEN
        INSERT INTO public.admin_configs (user_id, requires_change)
        VALUES (NEW.user_id, true)
        ON CONFLICT (user_id) DO UPDATE SET requires_change = true;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_master_pin_configured ON public.user_roles;
CREATE TRIGGER trg_ensure_master_pin_configured
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW
WHEN (NEW.role IN ('admin', 'master'))
EXECUTE FUNCTION public.ensure_master_pin_configured();
