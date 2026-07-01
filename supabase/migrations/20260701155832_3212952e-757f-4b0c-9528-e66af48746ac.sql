
-- Fix: master role must also be able to update/delete/insert submissions
DROP POLICY IF EXISTS "Admins and collaborators can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and collaborators can delete submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins and collaborators can insert submissions" ON public.submissions;

CREATE POLICY "Admins/master and collaborators can update submissions"
ON public.submissions FOR UPDATE
USING (
  public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = auth.uid() AND is_active = true AND (can_edit = true OR can_approve = true)
  )
)
WITH CHECK (
  public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = auth.uid() AND is_active = true AND (can_edit = true OR can_approve = true)
  )
);

CREATE POLICY "Admins/master and collaborators can delete submissions"
ON public.submissions FOR DELETE
USING (
  public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = auth.uid() AND is_active = true AND can_delete = true
  )
);

CREATE POLICY "Admins/master and collaborators can insert submissions"
ON public.submissions FOR INSERT
WITH CHECK (
  public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = auth.uid() AND is_active = true AND can_submit = true
  )
  OR auth.uid() = user_id
);
