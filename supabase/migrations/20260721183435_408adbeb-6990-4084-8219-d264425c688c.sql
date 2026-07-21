
-- Revoga EXECUTE público em funções de trigger e utilitários internos que
-- nunca devem ser chamadas via API PostgREST. Elas continuam funcionando
-- porque triggers rodam como owner e políticas RLS chamam via SECURITY DEFINER.
DO $$
DECLARE
  fn text;
  targets text[] := ARRAY[
    'public.handle_new_user()',
    'public.handle_updated_at()',
    'public.update_updated_at_column()',
    'public.normalize_phone()',
    'public.handle_event_automation()',
    'public.validate_editorial_transition()',
    'public.moderate_review_trigger()',
    'public.notify_admins_on_new_submission()',
    'public.notify_admins_on_new_atrativo()',
    'public.enforce_review_user_name()',
    'public.prevent_role_self_escalation()',
    'public.divulgadores_hash_cpf()',
    'public._cpf_hash(text)',
    'public.auto_moderate_submission()',
    'public.auto_moderate_content()',
    'public.log_administrative_action()',
    'public.pgrst_watch()',
    'public.cleanup_expired_reset_codes()'
  ];
BEGIN
  FOREACH fn IN ARRAY targets LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      -- silencia se a função não existir mais nesse ambiente
      NULL;
    END;
  END LOOP;
END $$;
