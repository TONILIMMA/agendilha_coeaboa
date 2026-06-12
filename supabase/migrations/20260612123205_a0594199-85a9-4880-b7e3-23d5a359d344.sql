
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL UNIQUE CHECK (kind IN ('approved','rejected')),
  body TEXT NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read templates"
  ON public.whatsapp_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage templates"
  ON public.whatsapp_templates FOR ALL
  TO authenticated
  USING (public.is_admin_or_master(auth.uid()))
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER trg_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.whatsapp_templates (kind, body) VALUES
('approved',
$tpl$Olá, {{nome}}! 👋

✅ *Seu evento foi aprovado pela curadoria do AgendIlha!*

🎉 *{{titulo}}*
📅 {{data}} às {{hora}}
📍 {{local}}

Já está publicado na Agenda Cultural:
{{url}}

Acompanhe seus envios em: {{meus_eventos_url}}$tpl$),
('rejected',
$tpl$Olá, {{nome}}.

Sobre o evento *{{titulo}}* enviado ao AgendIlha:

❌ Infelizmente ele *não foi aprovado* pela curadoria neste momento.
📝 *Observação:* {{motivo}}

Você pode revisar e reenviar a qualquer momento em:
{{meus_eventos_url}}

Qualquer dúvida, é só responder por aqui. Obrigado!$tpl$);
