-- INSERT: apenas divulgadores/admins, e sempre como dono do registro
DROP POLICY IF EXISTS "Users can insert own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins/master and collaborators can insert submissions" ON public.submissions;

CREATE POLICY "Divulgadores e admins podem criar eventos"
ON public.submissions FOR INSERT TO authenticated
WITH CHECK (
  is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
    WHERE c.user_id = auth.uid() AND c.is_active = true AND c.can_submit = true
  )
  OR (auth.uid() = user_id AND public.is_promotor(auth.uid()))
);

-- UPDATE: dono divulgador pode editar seus próprios eventos
DROP POLICY IF EXISTS "Owners can update own submissions" ON public.submissions;
CREATE POLICY "Owners can update own submissions"
ON public.submissions FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND public.is_promotor(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.is_promotor(auth.uid()));

-- DELETE: dono divulgador ou admin
DROP POLICY IF EXISTS "Users can delete own submissions" ON public.submissions;
CREATE POLICY "Owners can delete own submissions"
ON public.submissions FOR DELETE TO authenticated
USING (
  (user_id = auth.uid() AND public.is_promotor(auth.uid()))
  OR is_admin_or_master(auth.uid())
);