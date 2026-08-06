DROP POLICY IF EXISTS "Anyone can view approved submissions" ON public.submissions;
CREATE POLICY "Anyone can view approved submissions"
ON public.submissions
FOR SELECT
TO anon, authenticated
USING (deleted_at IS NULL AND status IN ('aprovado','publicado','divulgado'));