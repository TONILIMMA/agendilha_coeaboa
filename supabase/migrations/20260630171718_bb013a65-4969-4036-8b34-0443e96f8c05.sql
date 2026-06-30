
CREATE TABLE public.estabelecimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  endereco text,
  bairro text,
  cep text,
  numero text,
  complemento text,
  tipo text,
  contato text,
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX estabelecimentos_nome_lower_idx ON public.estabelecimentos (lower(nome));
CREATE INDEX estabelecimentos_responsavel_idx ON public.estabelecimentos (responsavel_id);

GRANT SELECT ON public.estabelecimentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estabelecimentos TO authenticated;
GRANT ALL ON public.estabelecimentos TO service_role;

ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estabelecimentos_public_read"
  ON public.estabelecimentos FOR SELECT
  USING (true);

CREATE POLICY "estabelecimentos_authenticated_insert"
  ON public.estabelecimentos FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
  );

CREATE POLICY "estabelecimentos_owner_or_admin_update"
  ON public.estabelecimentos FOR UPDATE
  TO authenticated
  USING (
    responsavel_id = auth.uid()
    OR created_by = auth.uid()
    OR public.is_admin_or_master(auth.uid())
  )
  WITH CHECK (
    responsavel_id = auth.uid()
    OR created_by = auth.uid()
    OR public.is_admin_or_master(auth.uid())
  );

CREATE POLICY "estabelecimentos_admin_delete"
  ON public.estabelecimentos FOR DELETE
  TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER estabelecimentos_set_updated_at
  BEFORE UPDATE ON public.estabelecimentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS estabelecimento_id uuid REFERENCES public.estabelecimentos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS submissions_estabelecimento_idx ON public.submissions (estabelecimento_id);
