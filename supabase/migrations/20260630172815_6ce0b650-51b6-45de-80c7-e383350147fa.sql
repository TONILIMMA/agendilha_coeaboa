
-- Helper: is_promotor reads profiles.user_type
CREATE OR REPLACE FUNCTION public.is_promotor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id
      AND (user_type = 'promotor' OR user_type = 'divulgador')
  ) OR public.is_admin_or_master(_user_id);
$$;

GRANT EXECUTE ON FUNCTION public.is_promotor(uuid) TO authenticated, anon;

-- Tighten estabelecimentos insert: only promotor/admin/master may create,
-- and they become responsavel_id automatically via app code.
DROP POLICY IF EXISTS estabelecimentos_authenticated_insert ON public.estabelecimentos;
CREATE POLICY estabelecimentos_promotor_insert ON public.estabelecimentos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND public.is_promotor(auth.uid())
    AND (created_by IS NULL OR created_by = auth.uid())
  );

-- Extend atrativos for ownership + linkage
ALTER TABLE public.atrativos
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estabelecimento_id uuid REFERENCES public.estabelecimentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_atrativos_responsavel ON public.atrativos(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_atrativos_estab ON public.atrativos(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_atrativos_nome_lower ON public.atrativos(lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atrativos TO authenticated;
GRANT SELECT ON public.atrativos TO anon;
GRANT ALL ON public.atrativos TO service_role;

-- Reset atrativos policies for promotor-owned writes
DROP POLICY IF EXISTS "Usuarios autenticados podem sugerir atrativos" ON public.atrativos;
DROP POLICY IF EXISTS "Usuários autenticados podem ver atrativos" ON public.atrativos;
DROP POLICY IF EXISTS atrativos_public_read ON public.atrativos;
DROP POLICY IF EXISTS atrativos_promotor_insert ON public.atrativos;
DROP POLICY IF EXISTS atrativos_owner_update ON public.atrativos;
DROP POLICY IF EXISTS atrativos_owner_delete ON public.atrativos;

CREATE POLICY atrativos_public_read ON public.atrativos
  FOR SELECT USING (true);

CREATE POLICY atrativos_promotor_insert ON public.atrativos
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_promotor(auth.uid())
    AND (created_by IS NULL OR created_by = auth.uid())
    AND (responsavel_id IS NULL OR responsavel_id = auth.uid() OR public.is_admin_or_master(auth.uid()))
  );

CREATE POLICY atrativos_owner_update ON public.atrativos
  FOR UPDATE TO authenticated
  USING (responsavel_id = auth.uid() OR created_by = auth.uid() OR public.is_admin_or_master(auth.uid()))
  WITH CHECK (responsavel_id = auth.uid() OR created_by = auth.uid() OR public.is_admin_or_master(auth.uid()));

CREATE POLICY atrativos_owner_delete ON public.atrativos
  FOR DELETE TO authenticated
  USING (responsavel_id = auth.uid() OR created_by = auth.uid() OR public.is_admin_or_master(auth.uid()));

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_atrativos_updated_at ON public.atrativos;
CREATE TRIGGER trg_atrativos_updated_at
  BEFORE UPDATE ON public.atrativos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
