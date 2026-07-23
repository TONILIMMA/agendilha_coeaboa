ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS responsavel_tipo text,
  ADD COLUMN IF NOT EXISTS responsavel_perfil jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.submissions.responsavel_tipo IS 'Tipo do responsável pelo evento: artista | estabelecimento | produtor | outro';
COMMENT ON COLUMN public.submissions.responsavel_perfil IS 'Perfil extra opcional do responsável (nome_artistico, estilo_musical, link_principal, nome_estabelecimento, categoria_local, endereco_resumido). Reaproveitado em futuras divulgações.';