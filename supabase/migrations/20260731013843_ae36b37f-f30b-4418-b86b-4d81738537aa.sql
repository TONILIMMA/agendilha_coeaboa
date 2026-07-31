CREATE TABLE public.divulgador_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT,
  whatsapp TEXT,
  tipo_divulgador TEXT,
  motivo TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT divulgador_requests_status_check CHECK (status IN ('pendente','aprovado','recusado'))
);

CREATE UNIQUE INDEX divulgador_requests_one_pending
  ON public.divulgador_requests (user_id)
  WHERE status = 'pendente';

GRANT SELECT, INSERT, UPDATE ON public.divulgador_requests TO authenticated;
GRANT ALL ON public.divulgador_requests TO service_role;

ALTER TABLE public.divulgador_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select" ON public.divulgador_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin_or_master(auth.uid()));

CREATE POLICY "own_insert" ON public.divulgador_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pendente');

CREATE POLICY "admin_update" ON public.divulgador_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_master(auth.uid()))
  WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE TRIGGER trg_divulgador_requests_updated_at
  BEFORE UPDATE ON public.divulgador_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_admins_on_divulgador_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recipient RECORD;
BEGIN
  FOR recipient IN
    SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin','master')
  LOOP
    INSERT INTO public.app_notifications (user_id, type, title, body, link, entity_table, entity_id)
    VALUES (
      recipient.user_id,
      'divulgador_request_new',
      'Novo pedido pra virar Divulgador',
      COALESCE(NEW.nome, 'Alguém') || ' quer divulgar eventos',
      '/admin/users?divulgador_request=' || NEW.id::text,
      'divulgador_requests',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_divulgador_request
  AFTER INSERT ON public.divulgador_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_divulgador_request();

CREATE OR REPLACE FUNCTION public.apply_divulgador_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'aprovado' AND OLD.status IS DISTINCT FROM 'aprovado' THEN
    IF NOT public.is_admin_or_master(auth.uid()) THEN
      RAISE EXCEPTION 'Apenas administradores podem aprovar solicitações';
    END IF;
    UPDATE public.profiles SET user_type = 'divulgador' WHERE user_id = NEW.user_id;
    INSERT INTO public.app_notifications (user_id, type, title, body, link, entity_table, entity_id)
    VALUES (NEW.user_id, 'divulgador_request_approved', 'Boa! Agora você é Divulgador',
            'Já pode cadastrar e divulgar seus eventos.', '/enviar-evento',
            'divulgador_requests', NEW.id);
  ELSIF NEW.status = 'recusado' AND OLD.status IS DISTINCT FROM 'recusado' THEN
    INSERT INTO public.app_notifications (user_id, type, title, body, link, entity_table, entity_id)
    VALUES (NEW.user_id, 'divulgador_request_rejected', 'Pedido de Divulgador não aprovado',
            COALESCE(NEW.admin_notes, 'Fala com a gente pra entender o próximo passo.'), '/perfil',
            'divulgador_requests', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_apply_divulgador_request_approval
  BEFORE UPDATE ON public.divulgador_requests
  FOR EACH ROW EXECUTE FUNCTION public.apply_divulgador_request_approval();