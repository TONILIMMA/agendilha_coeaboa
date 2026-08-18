-- Enhance divulgador_requests table
ALTER TABLE public.divulgador_requests 
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS social_profile text,
ADD COLUMN IF NOT EXISTS admin_internal_notes text;

-- Update status enum if needed
ALTER TABLE public.divulgador_requests DROP CONSTRAINT IF EXISTS divulgador_requests_status_check;
ALTER TABLE public.divulgador_requests ADD CONSTRAINT divulgador_requests_status_check 
CHECK (status IN ('pendente', 'aprovado', 'ajuste', 'recusado'));

-- Enhance submissions table for event lifecycle
ALTER TABLE public.submissions 
DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('rascunho', 'em_revisao', 'aprovado', 'ajuste', 'recusado', 'cancelado', 'encerrado'));

-- Add "Trusted Divulgador" flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_trusted_divulgador boolean DEFAULT false;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.divulgador_requests TO authenticated;
GRANT ALL ON public.divulgador_requests TO service_role;
GRANT SELECT ON public.divulgador_requests TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
