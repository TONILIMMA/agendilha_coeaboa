CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.is_admin_or_master(_user_id)
  OR EXISTS (
    SELECT 1
    FROM public.collaborators
    WHERE user_id = _user_id
      AND is_active = true
      AND (
        (_permission = 'submit' AND can_submit = true) OR
        (_permission = 'approve' AND can_approve = true) OR
        (_permission = 'edit' AND can_edit = true) OR
        (_permission = 'delete' AND can_delete = true)
      )
  )
$function$;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.collaborators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.collaborators TO service_role;
GRANT ALL ON public.submissions TO service_role;

DROP POLICY IF EXISTS "Admins can view all collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can insert collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can delete collaborators" ON public.collaborators;

CREATE POLICY "Admins and masters can view all collaborators"
ON public.collaborators
FOR SELECT
TO authenticated
USING (public.is_admin_or_master(auth.uid()));

CREATE POLICY "Admins and masters can insert collaborators"
ON public.collaborators
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY "Admins and masters can update collaborators"
ON public.collaborators
FOR UPDATE
TO authenticated
USING (public.is_admin_or_master(auth.uid()))
WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY "Admins and masters can delete collaborators"
ON public.collaborators
FOR DELETE
TO authenticated
USING (public.is_admin_or_master(auth.uid()));

NOTIFY pgrst, 'reload schema';