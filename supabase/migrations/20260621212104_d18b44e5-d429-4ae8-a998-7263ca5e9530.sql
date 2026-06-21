
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 5 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (name IS NULL OR length(name) <= 120)
    AND (neighborhood IS NULL OR length(neighborhood) <= 80)
  );

DROP POLICY IF EXISTS "Anyone can report an event" ON public.event_reports;
CREATE POLICY "Authenticated users can report an event"
  ON public.event_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND event_id IS NOT NULL
    AND reason IS NOT NULL
    AND length(reason) BETWEEN 3 AND 200
    AND (description IS NULL OR length(description) <= 2000)
  );

DROP POLICY IF EXISTS "Anyone can insert contatos" ON public.contatos;
CREATE POLICY "Anyone can insert contatos"
  ON public.contatos
  FOR INSERT
  WITH CHECK (
    nome IS NOT NULL
    AND length(nome) BETWEEN 2 AND 120
    AND (whatsapp IS NULL OR length(whatsapp) BETWEEN 8 AND 20)
    AND (bairro IS NULL OR length(bairro) <= 80)
  );

DROP POLICY IF EXISTS "Anyone can insert artistas" ON public.artistas;
CREATE POLICY "Anyone can insert artistas"
  ON public.artistas
  FOR INSERT
  WITH CHECK (
    contato_id IS NOT NULL
    AND nome_artistico IS NOT NULL
    AND length(nome_artistico) BETWEEN 1 AND 120
  );

DROP POLICY IF EXISTS "Anyone can insert divulgadores" ON public.divulgadores;
CREATE POLICY "Anyone can insert divulgadores"
  ON public.divulgadores
  FOR INSERT
  WITH CHECK (
    contato_id IS NOT NULL
    AND nome_projeto IS NOT NULL
    AND length(nome_projeto) BETWEEN 1 AND 120
  );

DROP POLICY IF EXISTS "Anyone can insert usuarios_publicos" ON public.usuarios_publicos;
CREATE POLICY "Anyone can insert usuarios_publicos"
  ON public.usuarios_publicos
  FOR INSERT
  WITH CHECK (
    contato_id IS NOT NULL
  );
