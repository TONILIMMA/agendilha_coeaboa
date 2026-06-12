
-- =========================================================
-- Cadastro por perfil: contatos + tabelas específicas
-- =========================================================

-- Enum de tipos de perfil
DO $$ BEGIN
  CREATE TYPE public.tipo_perfil_cadastro AS ENUM ('publico', 'divulgador', 'artista');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------- contatos ----------------------
CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo_perfil public.tipo_perfil_cadastro NOT NULL,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  bairro TEXT NOT NULL,
  endereco TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contatos TO authenticated;
GRANT INSERT ON public.contatos TO anon;
GRANT ALL ON public.contatos TO service_role;

ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contatos"
  ON public.contatos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage contatos"
  ON public.contatos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE POLICY "Owner can read own contato"
  ON public.contatos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER contatos_set_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_contatos_bairro ON public.contatos(bairro);
CREATE INDEX IF NOT EXISTS idx_contatos_tipo ON public.contatos(tipo_perfil);

-- ------------------------- usuarios_publicos -------------
CREATE TABLE IF NOT EXISTS public.usuarios_publicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  interesses TEXT[] NOT NULL DEFAULT '{}',
  aceita_notificacoes BOOLEAN NOT NULL DEFAULT true,
  frequencia_notificacao TEXT NOT NULL DEFAULT 'semanal',
  origem_cadastro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_publicos TO authenticated;
GRANT INSERT ON public.usuarios_publicos TO anon;
GRANT ALL ON public.usuarios_publicos TO service_role;

ALTER TABLE public.usuarios_publicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert usuarios_publicos"
  ON public.usuarios_publicos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage usuarios_publicos"
  ON public.usuarios_publicos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE TRIGGER usuarios_publicos_set_updated_at
  BEFORE UPDATE ON public.usuarios_publicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------- divulgadores ------------------
CREATE TABLE IF NOT EXISTS public.divulgadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  cpf TEXT NOT NULL,
  nome_projeto TEXT,
  instagram TEXT,
  validado BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.divulgadores TO authenticated;
GRANT INSERT ON public.divulgadores TO anon;
GRANT ALL ON public.divulgadores TO service_role;

ALTER TABLE public.divulgadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert divulgadores"
  ON public.divulgadores FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage divulgadores"
  ON public.divulgadores FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE TRIGGER divulgadores_set_updated_at
  BEFORE UPDATE ON public.divulgadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------- artistas ----------------------
CREATE TABLE IF NOT EXISTS public.artistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  nome_artistico TEXT NOT NULL,
  categoria TEXT,
  genero TEXT,
  quantidade_integrantes INT,
  release_curto TEXT,
  instagram TEXT,
  portfolio_url TEXT,
  tempo_apresentacao TEXT,
  possui_estrutura BOOLEAN,
  necessidades_tecnicas TEXT,
  cache_faixa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.artistas TO authenticated;
GRANT INSERT ON public.artistas TO anon;
GRANT ALL ON public.artistas TO service_role;

ALTER TABLE public.artistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert artistas"
  ON public.artistas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins manage artistas"
  ON public.artistas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE TRIGGER artistas_set_updated_at
  BEFORE UPDATE ON public.artistas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------- segmentos_notificacao ---------
CREATE TABLE IF NOT EXISTS public.segmentos_notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bairro TEXT NOT NULL,
  categoria_evento TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bairro, categoria_evento)
);

GRANT SELECT ON public.segmentos_notificacao TO anon, authenticated;
GRANT ALL ON public.segmentos_notificacao TO service_role;

ALTER TABLE public.segmentos_notificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read segmentos_notificacao"
  ON public.segmentos_notificacao FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

CREATE POLICY "Admins manage segmentos_notificacao"
  ON public.segmentos_notificacao FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE TRIGGER segmentos_notificacao_set_updated_at
  BEFORE UPDATE ON public.segmentos_notificacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
