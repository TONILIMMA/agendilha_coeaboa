-- Etapa 5: índices de performance nas consultas mais quentes do app
CREATE INDEX IF NOT EXISTS idx_submissions_status_date
  ON public.submissions (status, date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_editorial_status
  ON public.submissions (editorial_status) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_slug
  ON public.submissions (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_user_created
  ON public.submissions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_atrativos_approved
  ON public.atrativos (is_approved, name);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_approved
  ON public.estabelecimentos (is_approved, nome);
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_unread
  ON public.app_notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_audit_log_event
  ON public.event_audit_log (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_reviews_event
  ON public.event_reviews (event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_user
  ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_artist_media_artist_order
  ON public.artist_media (artist_id, display_order);

-- Resolve o usuário pelo e-mail sintético do telefone sem varrer a lista de contas.
CREATE OR REPLACE FUNCTION public.resolve_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.resolve_user_id_by_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_user_id_by_email(text) TO service_role;