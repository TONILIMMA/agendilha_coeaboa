-- List of common offensive terms in Portuguese (simplified for example)
CREATE OR REPLACE FUNCTION public.contains_bad_words(text_to_check TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    bad_words TEXT[] := ARRAY['porra', 'caralho', 'fuder', 'foda', 'merda', 'bosta', 'pqp', 'filho da puta', 'desgraçado', 'otário', 'imbecil', 'idiota'];
    word TEXT;
BEGIN
    FOREACH word IN ARRAY bad_words
    LOOP
        IF text_to_check ~* ('\y' || word || '\y') THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to moderate reviews before insert
CREATE OR REPLACE FUNCTION public.moderate_review_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF public.contains_bad_words(NEW.comment) THEN
        NEW.status := 'pending';
        NEW.is_flagged := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_moderate_review
BEFORE INSERT ON public.event_reviews
FOR EACH ROW
EXECUTE FUNCTION public.moderate_review_trigger();
