-- Adicionar coluna image_url à tabela submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Criar bucket de storage para flyers se não existir
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-flyers', 'event-flyers', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que qualquer um visualize os flyers
CREATE POLICY "Flyers are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'event-flyers');

-- Política para permitir que usuários autenticados façam upload de flyers
CREATE POLICY "Authenticated users can upload flyers" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'event-flyers' AND auth.role() = 'authenticated');

-- Política para permitir que o dono do arquivo o apague
CREATE POLICY "Users can delete their own flyers" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'event-flyers' AND auth.uid()::text = (storage.foldername(name))[1]);
