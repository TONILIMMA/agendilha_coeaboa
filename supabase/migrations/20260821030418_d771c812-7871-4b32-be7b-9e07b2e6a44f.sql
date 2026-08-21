-- Fix RLS SELECT policies for atrativos and estabelecimentos to allow collaborators to see records they are authorized to manage.

-- 1) ATRATIVOS
DROP POLICY IF EXISTS "atrativos_owner_admin_read" ON public.atrativos;

CREATE POLICY "atrativos_select_authorized"
ON public.atrativos FOR SELECT TO authenticated
USING (
  responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() 
       AND c.is_active = true
       AND (c.can_edit = true OR c.can_delete = true OR c.can_approve = true OR c.can_submit = true)
  )
);

-- 2) ESTABELECIMENTOS
DROP POLICY IF EXISTS "estabelecimentos_owner_admin_read" ON public.estabelecimentos;
DROP POLICY IF EXISTS "estabelecimentos_owner_or_admin_update" ON public.estabelecimentos;
DROP POLICY IF EXISTS "estabelecimentos_admin_delete" ON public.estabelecimentos;

CREATE POLICY "estabelecimentos_select_authorized"
ON public.estabelecimentos FOR SELECT TO authenticated
USING (
  responsavel_id = auth.uid()
  OR created_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.collaborators c
     WHERE c.user_id = auth.uid() 
       AND c.is_active = true
       AND (c.can_edit = true OR c.can_delete = true OR c.can_approve = true OR c.can_submit = true)
  )
);

CREATE POLICY "estabelecimentos_update_authorized"
ON public.estabelecimentos FOR UPDATE TO authenticated
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

CREATE POLICY "estabelecimentos_delete_authorized"
ON public.estabelecimentos FOR DELETE TO authenticated
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
