
-- 1) PROFILES (promotor): campos extras de contato/endereço
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS whatsapp_phone text;

-- 2) ESTABELECIMENTOS: dados complementares
ALTER TABLE public.estabelecimentos
  ADD COLUMN IF NOT EXISTS tipos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS anotacoes text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS responsavel_telefone text,
  ADD COLUMN IF NOT EXISTS responsavel_email text,
  ADD COLUMN IF NOT EXISTS responsavel_redes text,
  ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}'::text[];

-- 3) ATRATIVOS: dados complementares
ALTER TABLE public.atrativos
  ADD COLUMN IF NOT EXISTS tipo_atrativo text,
  ADD COLUMN IF NOT EXISTS estilos text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS pais text DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS estado text,
  ADD COLUMN IF NOT EXISTS cidade_regiao text,
  ADD COLUMN IF NOT EXISTS membros_equipe text,
  ADD COLUMN IF NOT EXISTS responsavel_nome text,
  ADD COLUMN IF NOT EXISTS responsavel_telefone text,
  ADD COLUMN IF NOT EXISTS responsavel_email text,
  ADD COLUMN IF NOT EXISTS responsavel_redes text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS fotos text[] DEFAULT '{}'::text[];

-- 4) SUBMISSIONS (evento): aceite de termos (age_rating já existe)
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
