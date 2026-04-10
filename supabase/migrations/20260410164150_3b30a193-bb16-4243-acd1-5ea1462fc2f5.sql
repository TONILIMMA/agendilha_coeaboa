-- Allow anonymous (public) read access to submissions for the public events page
CREATE POLICY "Public can view all submissions"
ON public.submissions
FOR SELECT
TO anon
USING (true);