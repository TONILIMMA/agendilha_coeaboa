
-- 1) Approval columns
ALTER TABLE public.atrativos
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid;

-- Existing rows: grandfather as approved
UPDATE public.atrativos SET is_approved = true, approved_at = COALESCE(approved_at, now()) WHERE is_approved = false AND created_at < now();
UPDATE public.estabelecimentos SET is_approved = true, approved_at = COALESCE(approved_at, now()) WHERE is_approved = false AND created_at < now();

-- 2) Lock down base SELECT policies (hide internal contacts from public)
DROP POLICY IF EXISTS atrativos_public_read ON public.atrativos;
CREATE POLICY atrativos_owner_admin_read ON public.atrativos
  FOR SELECT
  USING (
    responsavel_id = auth.uid()
    OR created_by = auth.uid()
    OR public.is_admin_or_master(auth.uid())
  );

DROP POLICY IF EXISTS estabelecimentos_public_read ON public.estabelecimentos;
CREATE POLICY estabelecimentos_owner_admin_read ON public.estabelecimentos
  FOR SELECT
  USING (
    responsavel_id = auth.uid()
    OR created_by = auth.uid()
    OR public.is_admin_or_master(auth.uid())
  );

-- 3) Public views: only approved, no internal contacts
DROP VIEW IF EXISTS public.atrativos_public;
CREATE VIEW public.atrativos_public
WITH (security_invoker = on) AS
SELECT
  id, name, type, tipo_atrativo, style, estilos,
  description, contact_whatsapp, estabelecimento_id,
  pais, estado, cidade_regiao, logo_url, fotos,
  created_at
FROM public.atrativos
WHERE is_approved = true;

DROP VIEW IF EXISTS public.estabelecimentos_public;
CREATE VIEW public.estabelecimentos_public
WITH (security_invoker = on) AS
SELECT
  id, nome, endereco, bairro, cep, numero, complemento,
  tipo, tipos, contato, fotos, created_at
FROM public.estabelecimentos
WHERE is_approved = true;

-- Views need a permissive SELECT policy on the base for anon/authenticated to see approved rows.
-- Because security_invoker uses the querying role's RLS, we add a narrow policy that only exposes approved rows and never the internal columns (the view already excludes them).
CREATE POLICY atrativos_public_approved_read ON public.atrativos
  FOR SELECT
  USING (is_approved = true);

CREATE POLICY estabelecimentos_public_approved_read ON public.estabelecimentos
  FOR SELECT
  USING (is_approved = true);

-- NOTE: the second (permissive) SELECT policy above lets anon read approved base rows too,
-- which would re-expose responsavel_*. Revoke column privileges on internal fields for anon/authenticated
-- so those columns are unreadable to the public even via base table.
REVOKE SELECT ON public.atrativos FROM anon, authenticated;
REVOKE SELECT ON public.estabelecimentos FROM anon, authenticated;

-- Re-grant SELECT excluding internal contact columns
GRANT SELECT (
  id, name, type, style, description, contact_whatsapp, estabelecimento_id,
  tipo_atrativo, estilos, pais, estado, cidade_regiao, logo_url, fotos,
  is_approved, approved_at, created_at, updated_at, responsavel_id, created_by
) ON public.atrativos TO anon, authenticated;

GRANT SELECT (
  id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos,
  contato, fotos, cnpj, anotacoes, is_approved, approved_at,
  created_at, updated_at, responsavel_id, created_by
) ON public.estabelecimentos TO anon, authenticated;

-- Admin/owner still need full read via SECURITY DEFINER helpers if they need internal fields.
-- Provide helper functions that return internal contacts only to owner/admin.
CREATE OR REPLACE FUNCTION public.get_atrativo_internal(_id uuid)
RETURNS TABLE(responsavel_nome text, responsavel_telefone text, responsavel_email text, responsavel_redes text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT a.responsavel_nome, a.responsavel_telefone, a.responsavel_email, a.responsavel_redes
  FROM public.atrativos a
  WHERE a.id = _id
    AND (a.responsavel_id = auth.uid() OR a.created_by = auth.uid() OR public.is_admin_or_master(auth.uid()));
END;
$$;

CREATE OR REPLACE FUNCTION public.get_estabelecimento_internal(_id uuid)
RETURNS TABLE(responsavel_nome text, responsavel_telefone text, responsavel_email text, responsavel_redes text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT e.responsavel_nome, e.responsavel_telefone, e.responsavel_email, e.responsavel_redes
  FROM public.estabelecimentos e
  WHERE e.id = _id
    AND (e.responsavel_id = auth.uid() OR e.created_by = auth.uid() OR public.is_admin_or_master(auth.uid()));
END;
$$;

-- Grants on views
GRANT SELECT ON public.atrativos_public TO anon, authenticated;
GRANT SELECT ON public.estabelecimentos_public TO anon, authenticated;
