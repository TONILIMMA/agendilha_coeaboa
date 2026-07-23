ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS local_tipo text;

COMMENT ON COLUMN public.submissions.local_tipo IS 'Tipo do local/estabelecimento onde o evento acontece (bar, restaurante, casa_show, praca, clube, espaco_cultural, outro).';