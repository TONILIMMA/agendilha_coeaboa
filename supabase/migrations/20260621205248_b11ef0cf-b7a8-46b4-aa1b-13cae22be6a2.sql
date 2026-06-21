
-- =====================================================================
-- SEC-02: Remove o fallback inseguro de PIN '0000'
-- =====================================================================
CREATE OR REPLACE FUNCTION public.verify_admin_pin(input_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
    stored_hash TEXT;
BEGIN
    -- Exige autenticação
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    SELECT pin_hash INTO stored_hash
    FROM public.admin_configs
    WHERE user_id = auth.uid();

    -- Sem PIN configurado => nega. O admin precisa definir um PIN via update_admin_pin.
    IF stored_hash IS NULL OR length(stored_hash) < 20 THEN
        RETURN false;
    END IF;

    -- Comparação apenas via crypt (bcrypt). Sem fallback plaintext.
    RETURN stored_hash = crypt(input_pin, stored_hash);
END;
$function$;

-- =====================================================================
-- SEC-03: Validações server-side nas tabelas públicas de cadastro
-- (CHECKs imutáveis — apenas formato/tamanho, nada de time-dependent)
-- =====================================================================

-- contatos
ALTER TABLE public.contatos
  DROP CONSTRAINT IF EXISTS contatos_nome_len_chk,
  DROP CONSTRAINT IF EXISTS contatos_whatsapp_fmt_chk,
  DROP CONSTRAINT IF EXISTS contatos_bairro_len_chk,
  DROP CONSTRAINT IF EXISTS contatos_endereco_len_chk;

ALTER TABLE public.contatos
  ADD CONSTRAINT contatos_nome_len_chk
    CHECK (char_length(btrim(nome)) BETWEEN 2 AND 120),
  ADD CONSTRAINT contatos_whatsapp_fmt_chk
    CHECK (whatsapp ~ '^\d{11}$'),
  ADD CONSTRAINT contatos_bairro_len_chk
    CHECK (bairro IS NULL OR char_length(bairro) <= 80),
  ADD CONSTRAINT contatos_endereco_len_chk
    CHECK (endereco IS NULL OR char_length(endereco) <= 200);

-- divulgadores
ALTER TABLE public.divulgadores
  DROP CONSTRAINT IF EXISTS divulgadores_cpf_fmt_chk,
  DROP CONSTRAINT IF EXISTS divulgadores_projeto_len_chk,
  DROP CONSTRAINT IF EXISTS divulgadores_instagram_len_chk,
  DROP CONSTRAINT IF EXISTS divulgadores_obs_len_chk;

ALTER TABLE public.divulgadores
  ADD CONSTRAINT divulgadores_cpf_fmt_chk
    CHECK (cpf ~ '^\d{11}$'),
  ADD CONSTRAINT divulgadores_projeto_len_chk
    CHECK (nome_projeto IS NULL OR char_length(nome_projeto) <= 120),
  ADD CONSTRAINT divulgadores_instagram_len_chk
    CHECK (instagram IS NULL OR char_length(instagram) <= 80),
  ADD CONSTRAINT divulgadores_obs_len_chk
    CHECK (observacoes IS NULL OR char_length(observacoes) <= 1000);

-- artistas
ALTER TABLE public.artistas
  DROP CONSTRAINT IF EXISTS artistas_nome_art_len_chk,
  DROP CONSTRAINT IF EXISTS artistas_genero_len_chk,
  DROP CONSTRAINT IF EXISTS artistas_release_len_chk,
  DROP CONSTRAINT IF EXISTS artistas_integrantes_chk,
  DROP CONSTRAINT IF EXISTS artistas_instagram_len_chk,
  DROP CONSTRAINT IF EXISTS artistas_portfolio_len_chk,
  DROP CONSTRAINT IF EXISTS artistas_necessidades_len_chk;

ALTER TABLE public.artistas
  ADD CONSTRAINT artistas_nome_art_len_chk
    CHECK (char_length(btrim(nome_artistico)) BETWEEN 2 AND 120),
  ADD CONSTRAINT artistas_genero_len_chk
    CHECK (genero IS NULL OR char_length(genero) <= 80),
  ADD CONSTRAINT artistas_release_len_chk
    CHECK (release_curto IS NULL OR char_length(release_curto) <= 1000),
  ADD CONSTRAINT artistas_integrantes_chk
    CHECK (quantidade_integrantes IS NULL OR (quantidade_integrantes BETWEEN 1 AND 200)),
  ADD CONSTRAINT artistas_instagram_len_chk
    CHECK (instagram IS NULL OR char_length(instagram) <= 80),
  ADD CONSTRAINT artistas_portfolio_len_chk
    CHECK (portfolio_url IS NULL OR char_length(portfolio_url) <= 500),
  ADD CONSTRAINT artistas_necessidades_len_chk
    CHECK (necessidades_tecnicas IS NULL OR char_length(necessidades_tecnicas) <= 1000);

-- usuarios_publicos
ALTER TABLE public.usuarios_publicos
  DROP CONSTRAINT IF EXISTS usuarios_publicos_interesses_chk;

ALTER TABLE public.usuarios_publicos
  ADD CONSTRAINT usuarios_publicos_interesses_chk
    CHECK (interesses IS NULL OR array_length(interesses, 1) IS NULL OR array_length(interesses, 1) <= 20);

-- =====================================================================
-- SEC-11: Restringe leitura pública das tabelas de roles/permissions
-- =====================================================================
DROP POLICY IF EXISTS "Perms viewable" ON public.app_permissions;
DROP POLICY IF EXISTS "Roles viewable" ON public.app_roles;
DROP POLICY IF EXISTS "Role perms viewable" ON public.app_role_permissions;

CREATE POLICY "Perms viewable by authenticated"
  ON public.app_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Roles viewable by authenticated"
  ON public.app_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Role perms viewable by authenticated"
  ON public.app_role_permissions FOR SELECT TO authenticated USING (true);
