-- Adicionar novos campos na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nick_name TEXT,
ADD COLUMN IF NOT EXISTS home_location TEXT,
ADD COLUMN IF NOT EXISTS pin_code TEXT; -- Já existia conceitualmente, mas garantindo

-- Adicionar novos campos na tabela submissions
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS predicted_duration TEXT,
ADD COLUMN IF NOT EXISTS atrativo_name TEXT,
ADD COLUMN IF NOT EXISTS atrativo_type TEXT,
ADD COLUMN IF NOT EXISTS atrativo_style TEXT,
ADD COLUMN IF NOT EXISTS atrativo_contact TEXT,
ADD COLUMN IF NOT EXISTS location_type TEXT,
ADD COLUMN IF NOT EXISTS location_contact TEXT,
ADD COLUMN IF NOT EXISTS legal_acceptance BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legal_acceptance_date TIMESTAMP WITH TIME ZONE;

-- Criar tabela de locais/regiões do portal (se não existir)
CREATE TABLE IF NOT EXISTS public.portal_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir alguns dados iniciais para portal_locations se estiver vazia
INSERT INTO public.portal_locations (name) 
SELECT name FROM (VALUES ('Bancários'), ('Cocotá'), ('Freguesia'), ('Galeão'), ('Jardim Guanabara'), ('Jardim Carioca'), ('Moneró'), ('Pitangueiras'), ('Portuguesa'), ('Praia da Bandeira'), ('Ribeira'), ('Tauá'), ('Zumbi')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.portal_locations LIMIT 1);

-- Criar tabela para registrar pedidos de novas localidades
CREATE TABLE IF NOT EXISTS public.location_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    requested_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de atrativos para reaproveitamento
CREATE TABLE IF NOT EXISTS public.atrativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT,
    style TEXT,
    contact_whatsapp TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de locais (estabelecimentos/praças) para reaproveitamento
CREATE TABLE IF NOT EXISTS public.places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    address TEXT,
    type TEXT, -- Área pública ou Estabelecimento comercial
    contact_responsible TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.portal_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atrativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Qualquer um pode ver localidades do portal" ON public.portal_locations FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem solicitar novas localidades" ON public.location_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Qualquer um pode ver atrativos" ON public.atrativos FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem sugerir atrativos" ON public.atrativos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Qualquer um pode ver locais" ON public.places FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem sugerir locais" ON public.places FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
