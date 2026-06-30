
-- Notifications table (in-app, per user)
CREATE TABLE IF NOT EXISTS public.app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  entity_table TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_unread
  ON public.app_notifications (user_id, read_at, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.app_notifications TO authenticated;
GRANT ALL ON public.app_notifications TO service_role;

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.app_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.app_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
  ON public.app_notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Enable realtime
ALTER TABLE public.app_notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'app_notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.app_notifications';
  END IF;
END $$;

-- Trigger: notify all admins+masters when a new submission is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      'submission_new',
      'Novo evento para aprovar',
      COALESCE(NEW.event_title, 'Sem título') ||
        CASE WHEN NEW.responsible_name IS NOT NULL THEN ' — ' || NEW.responsible_name ELSE '' END,
      '/admin/events?submission=' || NEW.id::text,
      'submissions',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_submission ON public.submissions;
CREATE TRIGGER trg_notify_admins_on_new_submission
  AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_new_submission();
