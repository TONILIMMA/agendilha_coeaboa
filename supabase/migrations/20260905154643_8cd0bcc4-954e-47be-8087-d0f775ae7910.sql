DROP VIEW IF EXISTS public.estabelecimentos_public;
CREATE VIEW public.estabelecimentos_public
WITH (security_invoker = on) AS
SELECT id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos, fotos, created_at
FROM public.estabelecimentos
WHERE is_approved = true;
GRANT SELECT ON public.estabelecimentos_public TO anon, authenticated;

CREATE POLICY estabelecimentos_public_select ON public.estabelecimentos
  FOR SELECT TO anon
  USING (is_approved = true);

REVOKE SELECT ON public.estabelecimentos FROM anon;
GRANT SELECT (
  id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos, fotos,
  created_at, is_approved
) ON public.estabelecimentos TO anon;