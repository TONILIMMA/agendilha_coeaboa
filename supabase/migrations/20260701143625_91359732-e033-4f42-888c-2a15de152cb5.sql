ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}'::text[];