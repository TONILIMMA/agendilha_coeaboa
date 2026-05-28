
-- 1. Trigger: prevent non-admins from changing profiles.role
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can change profile role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 2. Submissions: replace profiles.role-based policies with user_roles/collaborators checks
DROP POLICY IF EXISTS "Admins and promoters can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and promoters can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and promoters can delete submissions" ON public.submissions;

CREATE POLICY "Admins and collaborators can insert submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = auth.uid() AND is_active = true AND can_submit = true
  )
);

CREATE POLICY "Admins and collaborators can update submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = auth.uid() AND is_active = true AND can_edit = true
  )
);

CREATE POLICY "Admins and collaborators can delete submissions"
ON public.submissions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = auth.uid() AND is_active = true AND can_delete = true
  )
);

-- 3. Moderation logs: use has_role
DROP POLICY IF EXISTS "Admins can view moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- 4. Artist media moderate: use has_role
DROP POLICY IF EXISTS "Admins can moderate any media" ON public.artist_media;
CREATE POLICY "Admins can moderate any media"
ON public.artist_media
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
