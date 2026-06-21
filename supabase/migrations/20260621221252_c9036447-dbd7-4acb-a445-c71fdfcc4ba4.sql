CREATE POLICY "Collaborators can view all submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.collaborators c
    WHERE c.user_id = auth.uid()
      AND c.is_active = true
      AND (c.can_edit = true OR c.can_approve = true)
  )
);