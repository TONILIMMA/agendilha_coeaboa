-- 1) Regra única: quem pode criar/divulgar eventos
CREATE OR REPLACE FUNCTION public.can_create_events(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL
     AND (
       public.is_admin_or_master(_user_id)
       OR EXISTS (
         SELECT 1 FROM public.profiles p
          WHERE p.user_id = _user_id
            AND lower(coalesce(p.user_type, '')) IN ('divulgador', 'promotor')
       )
       OR EXISTS (
         SELECT 1 FROM public.collaborators c
          WHERE c.user_id = _user_id
            AND c.is_active = true
            AND c.can_submit = true
       )
     );
$$;

REVOKE ALL ON FUNCTION public.can_create_events(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_create_events(uuid) TO authenticated, service_role;

-- 2) Consolida SUBMISSIONS
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Master admins can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Collaborators can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Divulgadores e admins podem criar eventos" ON public.submissions;
DROP POLICY IF EXISTS "Owners can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins/master and collaborators can update submissions" ON public.submissions;
DROP POLICY IF EXISTS "Owners can delete own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins/master and collaborators can delete submissions" ON public.submissions;

CREATE POLICY "submissions_select_owner_admin_collab"
ON public.submissions FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() AND c.is_active = true
       AND (c.can_edit = true OR c.can_approve = true OR c.can_submit = true)
  )
);

CREATE POLICY "submissions_insert_authorized"
ON public.submissions FOR INSERT TO authenticated
WITH CHECK (
  public.can_create_events(auth.uid())
  AND (user_id = auth.uid() OR public.is_admin_or_master(auth.uid()))
);

CREATE POLICY "submissions_update_owner_admin_collab"
ON public.submissions FOR UPDATE TO authenticated
USING (
  (user_id = auth.uid() AND public.can_create_events(auth.uid()))
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() AND c.is_active = true
       AND (c.can_edit = true OR c.can_approve = true)
  )
)
WITH CHECK (
  (user_id = auth.uid() AND public.can_create_events(auth.uid()))
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() AND c.is_active = true
       AND (c.can_edit = true OR c.can_approve = true)
  )
);

CREATE POLICY "submissions_delete_owner_admin_collab"
ON public.submissions FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() AND c.is_active = true AND c.can_delete = true
  )
);

-- 3) Consolida ESTABELECIMENTOS
DROP POLICY IF EXISTS "estabelecimentos_owner_admin_read" ON public.estabelecimentos;
DROP POLICY IF EXISTS "estabelecimentos_promotor_insert" ON public.estabelecimentos;

CREATE POLICY "estabelecimentos_owner_admin_read"
ON public.estabelecimentos FOR SELECT TO authenticated
USING (
  responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
);

CREATE POLICY "estabelecimentos_authorized_insert"
ON public.estabelecimentos FOR INSERT TO authenticated
WITH CHECK (
  public.can_create_events(auth.uid())
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_admin_or_master(auth.uid()))
);

-- 4) Consolida ATRATIVOS
DROP POLICY IF EXISTS "atrativos_owner_admin_read" ON public.atrativos;
DROP POLICY IF EXISTS "atrativos_promotor_insert" ON public.atrativos;

CREATE POLICY "atrativos_owner_admin_read"
ON public.atrativos FOR SELECT TO authenticated
USING (
  responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
);

CREATE POLICY "atrativos_authorized_insert"
ON public.atrativos FOR INSERT TO authenticated
WITH CHECK (
  public.can_create_events(auth.uid())
  AND (created_by IS NULL OR created_by = auth.uid() OR public.is_admin_or_master(auth.uid()))
  AND (responsavel_id IS NULL OR responsavel_id = auth.uid() OR public.is_admin_or_master(auth.uid()))
);