
-- Grant internal columns back to authenticated (owner/admin will read via app RLS logic).
-- anon remains without access to these columns.
GRANT SELECT (responsavel_nome, responsavel_telefone, responsavel_email, responsavel_redes)
  ON public.atrativos TO authenticated;

GRANT SELECT (responsavel_nome, responsavel_telefone, responsavel_email, responsavel_redes)
  ON public.estabelecimentos TO authenticated;
