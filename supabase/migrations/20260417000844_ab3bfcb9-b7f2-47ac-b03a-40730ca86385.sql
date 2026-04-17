-- Restrict public (anonymous) access to only approved events.
-- Authenticated non-admin users can only see their own submissions (existing policy).
DROP POLICY IF EXISTS "Public can view all submissions" ON public.submissions;

CREATE POLICY "Public can view approved submissions"
ON public.submissions
FOR SELECT
TO anon
USING (status = 'approved' AND deleted_at IS NULL);