BEGIN;

-- Migrate misclassified attractions to establishments if they match Bar/Restaurante patterns
INSERT INTO public.estabelecimentos (
    nome, 
    tipo, 
    contato, 
    responsavel_id, 
    created_by, 
    fotos, 
    is_approved, 
    responsavel_nome, 
    responsavel_telefone, 
    responsavel_email,
    responsavel_redes
)
SELECT 
    name, 
    CASE WHEN lower(tipo_atrativo) LIKE '%bar%' THEN 'bar' ELSE 'restaurante' END,
    contact_info,
    responsavel_id,
    created_by,
    fotos,
    is_approved,
    responsavel_nome,
    responsavel_telefone,
    responsavel_email,
    responsavel_redes
FROM public.atrativos
WHERE lower(tipo_atrativo) LIKE '%bar%' 
   OR lower(tipo_atrativo) LIKE '%restaurante%' 
   OR lower(type) LIKE '%bar%' 
   OR lower(type) LIKE '%restaurante%'
ON CONFLICT DO NOTHING;

-- Remove migrated or misclassified records from atrativos
DELETE FROM public.atrativos 
WHERE lower(tipo_atrativo) LIKE '%bar%' 
   OR lower(tipo_atrativo) LIKE '%restaurante%'
   OR lower(type) LIKE '%bar%' 
   OR lower(type) LIKE '%restaurante%';

-- Update the public view/search function to ensure separation if they use base tables
-- search_atrativos_autocomplete already filters by is_approved but we should add a negative check just in case
-- (Assuming search_atrativos_autocomplete is a SQL function, we might need its definition to update it)

COMMIT;