
-- Agenda pública: filtra por status IN (aprovado, publicado) AND deleted_at IS NULL, ordena por date
CREATE INDEX IF NOT EXISTS idx_submissions_active_date
  ON public.submissions (date DESC)
  WHERE deleted_at IS NULL AND status IN ('aprovado','publicado');

-- Admin dashboards e listagens ordenadas por criação
CREATE INDEX IF NOT EXISTS idx_submissions_created_at
  ON public.submissions (created_at DESC)
  WHERE deleted_at IS NULL;

-- Moderação/flags
CREATE INDEX IF NOT EXISTS idx_submissions_moderation_status
  ON public.submissions (moderation_status)
  WHERE deleted_at IS NULL;

-- Pipeline metrics: WHERE deleted_at IS NULL GROUP BY editorial_status
CREATE INDEX IF NOT EXISTS idx_submissions_editorial_active
  ON public.submissions (editorial_status)
  WHERE deleted_at IS NULL;

-- Notificações do sino: por usuário, ordenadas por created_at DESC
CREATE INDEX IF NOT EXISTS idx_app_notifications_user_created
  ON public.app_notifications (user_id, created_at DESC);
