-- Add status column
ALTER TABLE public.submissions
  ADD COLUMN status text NOT NULL DEFAULT 'pending'
  CONSTRAINT submissions_status_check CHECK (status IN ('pending', 'approved', 'rejected'));

-- Allow admins to update submissions (for status changes)
CREATE POLICY "Admins can update submissions"
  ON public.submissions
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
