CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  description text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_public_read" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "app_settings_admin_insert" ON public.app_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY "app_settings_admin_update" ON public.app_settings
  FOR UPDATE TO authenticated USING (public.is_admin_or_master(auth.uid()))
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY "app_settings_admin_delete" ON public.app_settings
  FOR DELETE TO authenticated USING (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (key, value, description) VALUES
  ('team_whatsapp', '', 'WhatsApp oficial da equipe para contratação de destaques'),
  ('destaque_evento_titulo', 'Destaque sua publicação para maior visibilidade', 'Título do modal de destaque de rolês'),
  ('destaque_evento_texto', 'Contrate o destaque e seu flyer ficará em evidência no carrossel de até 10 eventos, aumentando alcance e público.', 'Texto do modal de destaque de rolês'),
  ('destaque_anuncio_titulo', 'Destaque sua publicação para maior visibilidade', 'Título do modal de destaque de anúncios'),
  ('destaque_anuncio_texto', 'Contrate um destaque e seu anúncio ficará em evidência no carrossel de até 10 destaques, aumentando alcance e vendas.', 'Texto do modal de destaque de anúncios'),
  ('destaque_cta', 'Destacar publicação', 'Texto do botão de contratação do destaque');