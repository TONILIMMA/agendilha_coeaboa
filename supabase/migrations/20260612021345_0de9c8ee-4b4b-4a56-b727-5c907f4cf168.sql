-- 1. Remove constraint antiga
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- 2. Normaliza dados existentes
UPDATE public.submissions SET status = 'pendente'  WHERE status IN ('pending', 'em_revisao', 'rascunho') OR status IS NULL;
UPDATE public.submissions SET status = 'aprovado'  WHERE status IN ('approved', 'publicado', 'divulgado', 'agendado_para_divulgacao');
UPDATE public.submissions SET status = 'rejeitado' WHERE status IN ('rejected', 'cancelado', 'recusado');

-- 3. Default + NOT NULL
ALTER TABLE public.submissions ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.submissions ALTER COLUMN status SET NOT NULL;

-- 4. Novo CHECK restrito a 3 valores
ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_status_check
  CHECK (status IN ('pendente', 'aprovado', 'rejeitado'));

-- 5. Colunas de moderação
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS rejected_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by  UUID,
  ADD COLUMN IF NOT EXISTS admin_notes  TEXT;

-- 6. Index
CREATE INDEX IF NOT EXISTS idx_submissions_status_date
  ON public.submissions (status, date DESC);