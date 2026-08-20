-- Align atrativos RLS with estabelecimentos and submissions to allow collaborators to edit
DROP POLICY IF EXISTS atrativos_owner_update ON public.atrativos;
DROP POLICY IF EXISTS atrativos_owner_delete ON public.atrativos;

CREATE POLICY "atrativos_update_authorized"
ON public.atrativos FOR UPDATE TO authenticated
USING (
  responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() 
       AND c.is_active = true
       AND c.can_edit = true
  )
)
WITH CHECK (
  responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() 
       AND c.is_active = true
       AND c.can_edit = true
  )
);

CREATE POLICY "atrativos_delete_authorized"
ON public.atrativos FOR DELETE TO authenticated
USING (
  responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() 
       AND c.is_active = true
       AND c.can_delete = true
  )
);
