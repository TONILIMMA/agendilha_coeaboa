-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "atrativos_update_authorized" ON public.atrativos;
DROP POLICY IF EXISTS "atrativos_delete_authorized" ON public.atrativos;
DROP POLICY IF EXISTS "atrativos_update_authorized_v2" ON public.atrativos;
DROP POLICY IF EXISTS "atrativos_delete_authorized_v2" ON public.atrativos;

-- Policy for UPDATING atrativos
-- Allows: admins, masters, collaborators with can_edit, or the owner/responsavel
CREATE POLICY "atrativos_update_authorized_v3"
ON public.atrativos
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master') OR 
  public.has_permission(auth.uid(), 'events.update') OR
  responsavel_id = auth.uid() OR
  created_by = auth.uid()
);

-- Policy for DELETING atrativos
-- Allows: admins, masters, or collaborators with can_delete
CREATE POLICY "atrativos_delete_authorized_v3"
ON public.atrativos
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master') OR 
  public.has_permission(auth.uid(), 'events.delete')
);

-- Grant necessary permissions
GRANT UPDATE, DELETE ON public.atrativos TO authenticated;
GRANT ALL ON public.atrativos TO service_role;
