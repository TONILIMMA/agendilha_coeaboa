-- 1. Performance: Add missing indices on foreign key columns
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_artist_id ON public.submissions(artist_id);
CREATE INDEX IF NOT EXISTS idx_location_requests_user_id ON public.location_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_audit_log_event_id ON public.event_audit_log(event_id);
CREATE INDEX IF NOT EXISTS idx_event_audit_log_user_id ON public.event_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_event_id ON public.event_reports(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reports_user_id ON public.event_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_user_id ON public.follows(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_target_id ON public.follows(target_id);
CREATE INDEX IF NOT EXISTS idx_artist_media_artist_id ON public.artist_media(artist_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_entity_id ON public.user_activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON public.moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_id ON public.moderation_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_app_user_roles_user_id ON public.app_user_roles(user_id);

-- 2. Security: Secure and consolidate has_role functions
-- Update the existing UUID, TEXT version to be SECURITY DEFINER and have search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        -- System A (legacy user_roles)
        SELECT 1 FROM public.user_roles 
        WHERE user_id = _user_id AND role::text = _role
        UNION
        -- System B (app_user_roles)
        SELECT 1 FROM public.app_user_roles ur 
        JOIN public.app_roles r ON ur.role_id = r.id 
        WHERE ur.user_id = _user_id AND r.name = _role
    );
END;
$$;

-- 3. Security: Ensure all SECURITY DEFINER functions have search_path
-- These are critical for security to prevent search path hijacking
ALTER FUNCTION public.is_admin_or_master(UUID) SET search_path = public;
ALTER FUNCTION public.is_master(UUID) SET search_path = public;
ALTER FUNCTION public.has_permission(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.has_app_permission(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.get_user_permissions(UUID) SET search_path = public;
ALTER FUNCTION public.log_administrative_action() SET search_path = public;

-- 4. Security: Add RLS policy for password_reset_codes to satisfy linter
-- We allow no access to authenticated or anon, effectively making it service_role only.
DROP POLICY IF EXISTS "Restrict all access" ON public.password_reset_codes;
CREATE POLICY "Restrict all access" ON public.password_reset_codes FOR ALL USING (false);

-- 5. Quality: Ensure updated_at triggers use search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
