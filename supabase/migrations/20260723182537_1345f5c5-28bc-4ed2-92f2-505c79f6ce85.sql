
CREATE TABLE public.submission_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'whatsapp' CHECK (request_type IN ('whatsapp','authorization','both')),
  current_whatsapp TEXT,
  proposed_whatsapp TEXT,
  revoke_authorization BOOLEAN NOT NULL DEFAULT false,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado','cancelado')),
  decision_notes TEXT,
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scr_submission ON public.submission_change_requests(submission_id);
CREATE INDEX idx_scr_status ON public.submission_change_requests(status);
CREATE INDEX idx_scr_requested_by ON public.submission_change_requests(requested_by);

GRANT SELECT, INSERT, UPDATE ON public.submission_change_requests TO authenticated;
GRANT ALL ON public.submission_change_requests TO service_role;

ALTER TABLE public.submission_change_requests ENABLE ROW LEVEL SECURITY;

-- Autor do evento vê os próprios pedidos; admin/master veem tudo.
CREATE POLICY "scr_select_own_or_admin"
ON public.submission_change_requests
FOR SELECT
TO authenticated
USING (
  requested_by = auth.uid()
  OR public.is_admin_or_master(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = submission_id AND s.user_id = auth.uid()
  )
);

-- Autor do evento cria pedido pro próprio evento.
CREATE POLICY "scr_insert_own_submission"
ON public.submission_change_requests
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
    OR public.is_admin_or_master(auth.uid())
  )
);

-- Autor pode cancelar próprio pedido pendente; admin/master decidem.
CREATE POLICY "scr_update_admin_or_cancel"
ON public.submission_change_requests
FOR UPDATE
TO authenticated
USING (
  public.is_admin_or_master(auth.uid())
  OR (requested_by = auth.uid() AND status = 'pendente')
)
WITH CHECK (
  public.is_admin_or_master(auth.uid())
  OR (requested_by = auth.uid() AND status IN ('pendente','cancelado'))
);

CREATE TRIGGER update_scr_updated_at
BEFORE UPDATE ON public.submission_change_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifica todos os admins/masters ao criar um pedido.
CREATE OR REPLACE FUNCTION public.notify_admins_on_change_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient RECORD;
  v_title TEXT;
BEGIN
  SELECT event_title INTO v_title FROM public.submissions WHERE id = NEW.submission_id;
  FOR recipient IN
    SELECT DISTINCT user_id FROM public.user_roles WHERE role IN ('admin','master')
  LOOP
    INSERT INTO public.app_notifications (user_id, type, title, body, link, entity_table, entity_id)
    VALUES (
      recipient.user_id,
      'change_request_new',
      'Nova solicitação de alteração',
      COALESCE(v_title, 'Evento') || ' — ' ||
        CASE NEW.request_type
          WHEN 'whatsapp' THEN 'alterar WhatsApp'
          WHEN 'authorization' THEN 'revisar autorização'
          ELSE 'WhatsApp + autorização'
        END,
      '/admin/events?change_request=' || NEW.id::text,
      'submission_change_requests',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admins_on_change_request
AFTER INSERT ON public.submission_change_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_change_request();
