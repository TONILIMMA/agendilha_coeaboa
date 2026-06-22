-- Desativa filtro de profanidade no envio de eventos (fase de testes)
DROP TRIGGER IF EXISTS trg_auto_moderate_submission ON public.submissions;

-- Mantém a função no banco para reativação futura (basta recriar o trigger).
-- Para reativar:
-- CREATE TRIGGER trg_auto_moderate_submission
-- BEFORE INSERT OR UPDATE ON public.submissions
-- FOR EACH ROW EXECUTE FUNCTION public.auto_moderate_submission();