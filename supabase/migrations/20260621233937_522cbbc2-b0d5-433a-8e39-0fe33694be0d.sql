-- Force PostgREST schema reload and install auto-reload event trigger
NOTIFY pgrst, 'reload schema';

CREATE OR REPLACE FUNCTION public.pgrst_watch()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

DROP EVENT TRIGGER IF EXISTS pgrst_watch;
CREATE EVENT TRIGGER pgrst_watch
ON ddl_command_end
EXECUTE PROCEDURE public.pgrst_watch();