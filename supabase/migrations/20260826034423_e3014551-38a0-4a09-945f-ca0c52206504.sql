ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS atrativo_id uuid REFERENCES public.atrativos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_atrativo_id ON public.submissions(atrativo_id);

CREATE INDEX IF NOT EXISTS idx_atrativos_name_norm ON public.atrativos (lower(name));

DROP POLICY IF EXISTS atrativos_authenticated_insert_pending ON public.atrativos;
CREATE POLICY atrativos_authenticated_insert_pending
ON public.atrativos
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    is_admin_or_master(auth.uid())
    OR (is_approved = false AND approved_at IS NULL AND approved_by IS NULL)
  )
);