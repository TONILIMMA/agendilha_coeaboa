-- Ajuste nas permissões da view public_submissions para garantir acesso aos campos de atrativos
GRANT SELECT ON public.public_submissions TO authenticated;
GRANT SELECT ON public.public_submissions TO anon;

-- Certificar que as views de segurança também tenham permissões de SELECT
GRANT SELECT ON public.atrativos_public TO authenticated;
GRANT SELECT ON public.atrativos_public TO anon;

GRANT SELECT ON public.estabelecimentos_public TO authenticated;
GRANT SELECT ON public.estabelecimentos_public TO anon;

-- Corrigir a política de SELECT em public_submissions se necessário (garantir que aprovados sejam visíveis)
DROP POLICY IF EXISTS "submissions_public_select" ON public.submissions;
CREATE POLICY "submissions_public_select" ON public.submissions
FOR SELECT TO authenticated, anon
USING (status = 'aprovado' OR auth.uid() = user_id OR public.is_admin_or_master(auth.uid()));
