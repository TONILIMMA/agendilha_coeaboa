DROP VIEW IF EXISTS public.estabelecimentos_public;
CREATE VIEW public.estabelecimentos_public
WITH (security_invoker = on) AS
SELECT id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos, contato, fotos, created_at
FROM public.estabelecimentos
WHERE is_approved = true;
GRANT SELECT ON public.estabelecimentos_public TO anon, authenticated;
GRANT SELECT (contato) ON public.estabelecimentos TO anon;