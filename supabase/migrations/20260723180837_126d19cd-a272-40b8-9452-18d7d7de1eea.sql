CREATE OR REPLACE FUNCTION public.handle_event_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  event_url TEXT;
  event_date TEXT;
  has_min_fields BOOLEAN;
BEGIN
  IF (NEW.status IN ('aprovado', 'publicado', 'divulgado') AND (OLD.status IS NULL OR OLD.status != NEW.status OR NEW.slug IS NULL)) THEN

    IF NEW.slug IS NULL AND NEW.event_title IS NOT NULL AND length(trim(NEW.event_title)) > 0 THEN
      NEW.slug := public.generate_slug(NEW.event_title);
    END IF;

    IF NEW.status = 'aprovado' AND NEW.approved_at IS NULL THEN
      NEW.approved_at := now();
    END IF;

    IF NEW.status = 'publicado' AND NEW.published_at IS NULL THEN
      NEW.published_at := now();
      IF NEW.approved_at IS NULL THEN
        NEW.approved_at := now();
      END IF;
    END IF;

    -- Só gera copies/cards quando os 4 campos mínimos estão preenchidos.
    -- Evita criar comunicações incompletas mesmo em fluxos de agendamento.
    has_min_fields := NEW.event_title IS NOT NULL AND length(trim(NEW.event_title)) > 0
                  AND NEW.date IS NOT NULL AND length(trim(NEW.date)) > 0
                  AND NEW.start_time IS NOT NULL AND length(trim(NEW.start_time)) > 0
                  AND NEW.location IS NOT NULL AND length(trim(NEW.location)) > 0;

    IF has_min_fields AND NEW.slug IS NOT NULL THEN
      event_url := 'https://agendilha.lovable.app/evento/' || NEW.slug;
      event_date := NEW.date;

      NEW.short_copy := '🗓️ *' || NEW.event_title || '*' || chr(10) ||
                        '⏰ ' || event_date || ' às ' || NEW.start_time || chr(10) ||
                        '📍 ' || NEW.location || chr(10) || chr(10) ||
                        '🔗 Saiba mais: ' || event_url;

      NEW.long_copy := '🚀 *NOVO EVENTO: ' || NEW.event_title || '*' || chr(10) || chr(10) ||
                       COALESCE(NEW.description, '') || chr(10) || chr(10) ||
                       '📅 *Data:* ' || event_date || chr(10) ||
                       '🕒 *Horário:* ' || NEW.start_time || ' às ' || COALESCE(NEW.end_time, '--:--') || chr(10) ||
                       '📍 *Local:* ' || NEW.location || chr(10) ||
                       '🏷️ *Categoria:* ' || COALESCE(NEW.category, '') || chr(10) || chr(10) ||
                       '✨ Garanta sua presença e veja todos os detalhes aqui:' || chr(10) || event_url || chr(10) || chr(10) ||
                       '#AgendIlha #Evento #Cultura #Lazer';
    ELSE
      -- Campos incompletos: não sobrescreve com placeholders — mantém em branco.
      NEW.short_copy := NULL;
      NEW.long_copy := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;