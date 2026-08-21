-- Add columns to atrativos table
ALTER TABLE public.atrativos 
ADD COLUMN IF NOT EXISTS contact_info text,
ADD COLUMN IF NOT EXISTS category_other text;

COMMENT ON COLUMN public.atrativos.contact_info IS 'Telefone/WhatsApp, Instagram e/ou e-mail de contato do atrativo';
COMMENT ON COLUMN public.atrativos.category_other IS 'Especificação quando a categoria for Outros';
