CREATE TABLE public.submission_atrativos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  atrativo_id uuid REFERENCES public.atrativos(id) ON DELETE SET NULL,
  name text NOT NULL,
  whatsapp text,
  email text,
  category text,
  category_other text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_submission_atrativos_submission ON public.submission_atrativos(submission_id);
CREATE INDEX idx_submission_atrativos_atrativo ON public.submission_atrativos(atrativo_id);

GRANT SELECT ON public.submission_atrativos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_atrativos TO authenticated;
GRANT ALL ON public.submission_atrativos TO service_role;

ALTER TABLE public.submission_atrativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submission_atrativos_select" ON public.submission_atrativos
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.submissions s
  WHERE s.id = submission_atrativos.submission_id
    AND (
      s.status = 'aprovado'
      OR s.user_id = auth.uid()
      OR public.is_admin_or_master(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.collaborators c
        WHERE c.user_id = auth.uid() AND c.is_active = true
          AND (c.can_edit OR c.can_approve OR c.can_submit)
      )
    )
));

CREATE POLICY "submission_atrativos_write" ON public.submission_atrativos
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.submissions s
  WHERE s.id = submission_atrativos.submission_id
    AND (
      s.user_id = auth.uid()
      OR public.is_admin_or_master(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.collaborators c
        WHERE c.user_id = auth.uid() AND c.is_active = true
          AND (c.can_edit OR c.can_approve)
      )
    )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.submissions s
  WHERE s.id = submission_atrativos.submission_id
    AND (
      s.user_id = auth.uid()
      OR public.is_admin_or_master(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.collaborators c
        WHERE c.user_id = auth.uid() AND c.is_active = true
          AND (c.can_edit OR c.can_approve)
      )
    )
));

CREATE TRIGGER trg_submission_atrativos_updated_at
BEFORE UPDATE ON public.submission_atrativos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();