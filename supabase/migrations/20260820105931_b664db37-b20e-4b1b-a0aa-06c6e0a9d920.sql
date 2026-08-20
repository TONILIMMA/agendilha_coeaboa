DROP POLICY IF EXISTS "atrativos_authorized_insert" ON public.atrativos;
CREATE POLICY "atrativos_admin_insert" 
ON public.atrativos 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin_or_master(auth.uid()));