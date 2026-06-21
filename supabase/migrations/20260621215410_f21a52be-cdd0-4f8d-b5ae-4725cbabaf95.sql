
-- ============================================================
-- FASE 1: Pipeline editorial de eventos
-- ============================================================

-- 1) Enum do status editorial
DO $$ BEGIN
  CREATE TYPE public.editorial_status AS ENUM (
    'recebido',
    'em_revisao',
    'flyer_aprovado',
    'pronto_divulgar',
    'agendado',
    'publicado',
    'confirmado',
    'rejeitado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Colunas novas em submissions
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS editorial_status public.editorial_status NOT NULL DEFAULT 'recebido',
  ADD COLUMN IF NOT EXISTS flyer_aprovado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_channel text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_channels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS checklist_publ_canal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_visivel_agenda boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checklist_envio_registrado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS received_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS review_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS flyer_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_for_at timestamptz,
  ADD COLUMN IF NOT EXISTS editorial_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;

-- 3) Backfill: mapeia o status legado para o pipeline editorial
UPDATE public.submissions
SET editorial_status = CASE
  WHEN status = 'approved' THEN 'pronto_divulgar'::public.editorial_status
  WHEN status = 'rejected' THEN 'rejeitado'::public.editorial_status
  ELSE 'recebido'::public.editorial_status
END
WHERE editorial_status = 'recebido';

CREATE INDEX IF NOT EXISTS idx_submissions_editorial_status
  ON public.submissions (editorial_status);

-- 4) Tabela de log de publicação
CREATE TABLE IF NOT EXISTS public.event_publication_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  channel text NOT NULL,
  template_id uuid,
  copy_used text,
  responsible_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.event_publication_log TO authenticated;
GRANT ALL ON public.event_publication_log TO service_role;

ALTER TABLE public.event_publication_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publication_log_select" ON public.event_publication_log;
CREATE POLICY "publication_log_select"
  ON public.event_publication_log
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_master(auth.uid())
    OR responsible_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.submissions s
      WHERE s.id = event_publication_log.event_id
        AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "publication_log_insert" ON public.event_publication_log;
CREATE POLICY "publication_log_insert"
  ON public.event_publication_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    responsible_id = auth.uid()
    AND (
      public.is_admin_or_master(auth.uid())
      OR public.has_permission(auth.uid(), 'approve')
    )
  );

CREATE INDEX IF NOT EXISTS idx_event_publication_log_event
  ON public.event_publication_log (event_id, published_at DESC);

-- 5) Trigger de validação das transições editoriais
CREATE OR REPLACE FUNCTION public.validate_editorial_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Carimba timestamps automaticamente por etapa
  IF NEW.editorial_status IS DISTINCT FROM OLD.editorial_status THEN
    CASE NEW.editorial_status
      WHEN 'em_revisao'      THEN NEW.review_started_at      := COALESCE(NEW.review_started_at,      now());
      WHEN 'flyer_aprovado'  THEN NEW.flyer_approved_at      := COALESCE(NEW.flyer_approved_at,      now());
                                  NEW.flyer_aprovado         := true;
      WHEN 'pronto_divulgar' THEN NEW.ready_at               := COALESCE(NEW.ready_at,               now());
      WHEN 'agendado'        THEN NEW.scheduled_for_at       := COALESCE(NEW.scheduled_for_at,       now());
      WHEN 'publicado'       THEN NEW.editorial_published_at := COALESCE(NEW.editorial_published_at, now());
      WHEN 'confirmado'      THEN NEW.confirmed_at           := COALESCE(NEW.confirmed_at,           now());
      ELSE NULL;
    END CASE;
  END IF;

  -- Campos obrigatórios ao agendar
  IF NEW.editorial_status = 'agendado' THEN
    IF NEW.scheduled_channel IS NULL OR length(trim(NEW.scheduled_channel)) = 0 THEN
      RAISE EXCEPTION 'Canal de publicação obrigatório para agendar';
    END IF;
    IF NEW.scheduled_at IS NULL THEN
      RAISE EXCEPTION 'Data/hora obrigatórias para agendar';
    END IF;
    IF NEW.scheduled_at < now() - interval '1 minute' THEN
      RAISE EXCEPTION 'Data/hora de agendamento deve ser futura';
    END IF;
  END IF;

  -- Confirmação exige checklist completo + ao menos 1 canal publicado
  IF NEW.editorial_status = 'confirmado' THEN
    IF NOT (NEW.checklist_publ_canal AND NEW.checklist_visivel_agenda AND NEW.checklist_envio_registrado) THEN
      RAISE EXCEPTION 'Checklist final incompleto: marque os 3 itens antes de confirmar';
    END IF;
    IF coalesce(array_length(NEW.published_channels, 1), 0) = 0 THEN
      RAISE EXCEPTION 'Confirme apenas eventos com ao menos 1 canal publicado';
    END IF;
  END IF;

  -- Rejeição exige motivo
  IF NEW.editorial_status = 'rejeitado'
     AND (NEW.rejection_reason IS NULL OR length(trim(NEW.rejection_reason)) = 0) THEN
    RAISE EXCEPTION 'Informe o motivo da rejeição';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_editorial_transition ON public.submissions;
CREATE TRIGGER trg_validate_editorial_transition
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  WHEN (
    OLD.editorial_status IS DISTINCT FROM NEW.editorial_status
    OR OLD.checklist_publ_canal IS DISTINCT FROM NEW.checklist_publ_canal
    OR OLD.checklist_visivel_agenda IS DISTINCT FROM NEW.checklist_visivel_agenda
    OR OLD.checklist_envio_registrado IS DISTINCT FROM NEW.checklist_envio_registrado
  )
  EXECUTE FUNCTION public.validate_editorial_transition();

-- 6) RPC de métricas do pipeline (admin/master)
CREATE OR REPLACE FUNCTION public.get_pipeline_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_counts jsonb;
  v_pending_publish int;
BEGIN
  IF NOT public.is_admin_or_master(auth.uid()) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  SELECT jsonb_object_agg(editorial_status, c)
    INTO v_counts
    FROM (
      SELECT editorial_status::text, count(*) AS c
        FROM public.submissions
       WHERE deleted_at IS NULL
       GROUP BY editorial_status
    ) t;

  SELECT count(*) INTO v_pending_publish
    FROM public.submissions
   WHERE deleted_at IS NULL
     AND editorial_status = 'pronto_divulgar';

  RETURN jsonb_build_object(
    'counts', COALESCE(v_counts, '{}'::jsonb),
    'pending_publish', v_pending_publish,
    'generated_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_pipeline_metrics() TO authenticated;
