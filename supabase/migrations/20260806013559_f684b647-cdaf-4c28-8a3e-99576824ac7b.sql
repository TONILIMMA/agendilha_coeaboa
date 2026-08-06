DROP POLICY IF EXISTS "Usuários autenticados podem ver locais" ON public.places;

CREATE POLICY "Admins e master podem ver locais"
ON public.places
FOR SELECT
TO authenticated
USING (public.is_admin_or_master(auth.uid()));