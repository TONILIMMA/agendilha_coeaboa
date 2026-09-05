-- 1) Atrativos: remove PII do acesso anônimo via privilégios por coluna
REVOKE SELECT ON public.atrativos FROM anon;
GRANT SELECT (
  id, name, type, tipo_atrativo, style, estilos, description,
  estabelecimento_id, pais, estado, cidade_regiao, logo_url, fotos,
  created_at, is_approved
) ON public.atrativos TO anon;

-- 2) Avaliações: identidade da conta não fica pública
REVOKE SELECT ON public.event_reviews FROM anon;
GRANT SELECT (
  id, event_id, rating, comment, user_name, created_at, is_flagged, status
) ON public.event_reviews TO anon;

-- 3) Atrativos de um evento: contatos não ficam públicos
REVOKE SELECT ON public.submission_atrativos FROM anon;
GRANT SELECT (
  id, submission_id, atrativo_id, name, category, category_other,
  display_order, created_at, updated_at
) ON public.submission_atrativos TO anon;

-- 4) View pública de eventos passa a respeitar RLS de quem consulta
ALTER VIEW public.public_submissions SET (security_invoker = on);
DROP POLICY IF EXISTS submissions_public_select ON public.submissions;
CREATE POLICY submissions_public_select ON public.submissions
  FOR SELECT TO anon, authenticated
  USING (
    (status IN ('aprovado', 'publicado', 'divulgado') AND deleted_at IS NULL)
    OR auth.uid() = user_id
    OR public.is_admin_or_master(auth.uid())
  );

-- 5) Função de validação com caminho de busca fixo
ALTER FUNCTION public.enforce_artist_representative_name() SET search_path = public;