DROP VIEW IF EXISTS public.atrativos_public;
CREATE VIEW public.atrativos_public
WITH (security_invoker = on) AS
SELECT id, name, type, tipo_atrativo, style, estilos, description,
       estabelecimento_id, pais, estado, cidade_regiao, logo_url, fotos, created_at
FROM public.atrativos
WHERE is_approved = true;
GRANT SELECT ON public.atrativos_public TO anon, authenticated;