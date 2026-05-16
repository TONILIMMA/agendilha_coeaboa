-- Add moderation columns to submissions
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS age_rating TEXT DEFAULT 'Livre',
ADD COLUMN IF NOT EXISTS is_suitable_for_minors BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending_review' CHECK (moderation_status IN ('approved', 'pending_review', 'flagged', 'blocked'));

-- Create event_reports table
CREATE TABLE IF NOT EXISTS public.event_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored'))
);

-- Enable RLS on event_reports
ALTER TABLE public.event_reports ENABLE ROW LEVEL SECURITY;

-- Policies for event_reports
CREATE POLICY "Anyone can report an event" ON public.event_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view reports" ON public.event_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND (role = 'admin' OR role = 'master')
        )
    );

-- Update contains_bad_words with more terms
CREATE OR REPLACE FUNCTION public.contains_bad_words(text_to_check text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    bad_words TEXT[] := ARRAY[
        -- Offensive/Profanity
        'porra', 'caralho', 'fuder', 'foda', 'merda', 'bosta', 'pqp', 'filho da puta', 'desgraçado', 'otário', 'imbecil', 'idiota',
        -- Sexual/Adult
        'sexo', 'porn', 'putaria', 'novinha', 'safada', '🔞', 'sexy', 'orgia', 'swing', 'acompanhante', 'gp',
        -- Hate/Violence
        'matar', 'assassino', 'morra', 'racismo', 'nazismo', 'facismo',
        -- Drugs (sensitive context)
        'cocaína', 'crack', 'heroína'
    ];
    word TEXT;
BEGIN
    IF text_to_check IS NULL THEN RETURN FALSE; END IF;
    FOREACH word IN ARRAY bad_words
    LOOP
        -- Simple regex check for whole word, case insensitive
        IF text_to_check ~* ('\y' || word || '\y') THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    RETURN FALSE;
END;
$function$;

-- Trigger to auto-moderate submissions
CREATE OR REPLACE FUNCTION public.auto_moderate_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- If title or description contains bad words, set to flagged
    IF contains_bad_words(NEW.event_title) OR contains_bad_words(NEW.description) OR contains_bad_words(NEW.additional_details) THEN
        NEW.moderation_status := 'flagged';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_moderate_submission ON public.submissions;
CREATE TRIGGER trg_auto_moderate_submission
BEFORE INSERT OR UPDATE OF event_title, description, additional_details ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.auto_moderate_submission();

-- Function to handle reporting an event
CREATE OR REPLACE FUNCTION public.report_event(target_event_id UUID, report_reason TEXT, report_description TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.event_reports (event_id, user_id, reason, description)
    VALUES (target_event_id, auth.uid(), report_reason, report_description);
    
    UPDATE public.submissions 
    SET report_count = report_count + 1
    WHERE id = target_event_id;
    
    -- If report count exceeds a threshold, set to flagged
    UPDATE public.submissions
    SET moderation_status = 'flagged'
    WHERE id = target_event_id AND report_count >= 5 AND moderation_status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
