
-- 1) Reescreve has_role(uuid, text) para usar SOMENTE user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = _role
  )
$$;

-- 2) Reescreve is_master para usar SOMENTE user_roles
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'master'
  )
$$;

-- 3) Revoga EXECUTE de funções internas/triggers que NÃO devem ser chamadas via API
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.log_administrative_action()',
    'public.normalize_phone()',
    'public.divulgadores_hash_cpf()',
    'public.auto_moderate_submission()',
    'public.auto_moderate_content()',
    'public.handle_updated_at()',
    'public.handle_event_automation()',
    'public.validate_editorial_transition()',
    'public.pgrst_watch()',
    'public.handle_new_user()',
    'public.update_updated_at_column()',
    'public.moderate_review_trigger()',
    'public.enforce_review_user_name()',
    'public.prevent_role_self_escalation()',
    'public.cleanup_expired_reset_codes()',
    'public._cpf_hash(text)',
    'public.generate_slug(text)',
    'public.update_admin_pin(text)',
    'public.contains_bad_words(text)',
    'public.get_user_permissions(uuid)',
    'public.has_app_permission(uuid, text)'
  ]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- 4) Funções de verificação de papel: só authenticated (nada de anon)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_master(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_master(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_master(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_master(uuid) TO authenticated;

-- 5) update_admin_pin / verify_admin_pin: só authenticated
REVOKE EXECUTE ON FUNCTION public.update_admin_pin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_admin_pin(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_admin_pin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_pin(text) TO authenticated;

-- 6) report_event / get_artist_private_contacts: só authenticated
REVOKE EXECUTE ON FUNCTION public.report_event(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_event(uuid, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_artist_private_contacts(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_artist_private_contacts(uuid) TO authenticated;

-- 7) Dashboard / pipeline metrics: só authenticated (a função já checa admin/master internamente)
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(text, text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_pipeline_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pipeline_metrics() TO authenticated;

-- 8) increment_views/shares: continuam acessíveis por anon (portal público)
GRANT EXECUTE ON FUNCTION public.increment_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shares(uuid) TO anon, authenticated;

-- 9) Storage: remove listagem ampla dos buckets públicos
-- Mantém leitura individual por nome (objects continuam acessíveis via URL pública direta);
-- bloqueia LIST que expõe inventário.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        qual ILIKE '%event-flyers%'
        OR qual ILIKE '%artist-media%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Recria leitura pública restrita a objetos individuais (sem listagem ampla):
-- A leitura pública via URL pública do Supabase continua funcionando porque ela
-- usa o endpoint /object/public que bypassa RLS quando o bucket é public.
-- Aqui apenas garantimos que LIST via API autenticada exija owner.
CREATE POLICY "event-flyers owners can list"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'event-flyers' AND owner = auth.uid());

CREATE POLICY "artist-media owners can list"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'artist-media' AND owner = auth.uid());
