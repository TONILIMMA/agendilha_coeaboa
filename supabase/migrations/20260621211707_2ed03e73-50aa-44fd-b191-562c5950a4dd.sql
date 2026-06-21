
-- Revoga EXECUTE de funções SECURITY DEFINER que servem apenas a TRIGGERS
-- ou são helpers internos. Triggers chamam funções como owner (postgres),
-- então revogar EXECUTE de PUBLIC/anon/authenticated NÃO quebra triggers.
-- Isso fecha os warnings 0028/0029 do linter para essas funções.

REVOKE EXECUTE ON FUNCTION public.log_administrative_action() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_review_user_name() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.divulgadores_hash_cpf() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_moderate_submission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_moderate_content() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_event_automation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.moderate_review_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_phone() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_role_self_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._cpf_hash(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.contains_bad_words(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_slug(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_reset_codes() FROM PUBLIC, anon, authenticated;

-- Funções de admin / configuração: apenas service_role (chamada via edge function)
REVOKE EXECUTE ON FUNCTION public.update_admin_pin(text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_admin_pin(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.verify_admin_pin(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.verify_admin_pin(text) TO authenticated, service_role;

-- Funções RPC públicas/autenticadas mantêm EXECUTE explícito (idempotente)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_app_permission(uuid, text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master(uuid)                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_event(uuid, text, text)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_views(uuid)             TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shares(uuid)            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(text, text, text) TO authenticated;
