-- Drop existing constraint to allow new statuses
ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- Add new columns for automation
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS short_copy TEXT,
ADD COLUMN IF NOT EXISTS long_copy TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Update existing status values to new mandatory format
UPDATE public.submissions SET status = 'rascunho' WHERE status = 'draft';
UPDATE public.submissions SET status = 'pendente' WHERE status = 'pending';
UPDATE public.submissions SET status = 'em_revisao' WHERE status = 'analysis';
UPDATE public.submissions SET status = 'aprovado' WHERE status = 'approved';
UPDATE public.submissions SET status = 'publicado' WHERE status = 'published';
UPDATE public.submissions SET status = 'cancelado' WHERE status = 'rejected';
UPDATE public.submissions SET status = 'pendente' WHERE status = 'pending_review';

-- Add new constraint
ALTER TABLE public.submissions ADD CONSTRAINT submissions_status_check 
CHECK (status = ANY (ARRAY['rascunho', 'pendente', 'em_revisao', 'aprovado', 'publicado', 'agendado_para_divulgacao', 'divulgado', 'cancelado']));

-- Create index for performance on slug searches
CREATE INDEX IF NOT EXISTS idx_submissions_slug ON public.submissions(slug);

-- Update RLS policies to include new public statuses
DROP POLICY IF EXISTS "Anyone can view published submissions" ON public.submissions;
CREATE POLICY "Anyone can view published submissions" 
ON public.submissions 
FOR SELECT 
USING (status IN ('publicado', 'divulgado', 'agendado_para_divulgacao') OR auth.uid() = user_id);

-- Helper function to generate slug from title (without unaccent if not sure)
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Simple slugify: lowercase and replace spaces/non-alphanumeric with hyphen
  base_slug := lower(title);
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  new_slug := base_slug;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.submissions WHERE slug = new_slug) LOOP
    new_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to handle automation when status changes to 'aprovado' or 'publicado'
CREATE OR REPLACE FUNCTION public.handle_event_automation()
RETURNS TRIGGER AS $$
DECLARE
  event_url TEXT;
  event_date TEXT;
BEGIN
  -- Only trigger if status changes to one that implies automation or if slug is missing
  IF (NEW.status IN ('aprovado', 'publicado', 'divulgado') AND (OLD.status IS NULL OR OLD.status != NEW.status OR NEW.slug IS NULL)) THEN
    
    -- Generate slug if not present
    IF NEW.slug IS NULL THEN
      NEW.slug := public.generate_slug(NEW.event_title);
    END IF;

    -- Set timestamps
    IF NEW.status = 'aprovado' AND NEW.approved_at IS NULL THEN
      NEW.approved_at := now();
    END IF;
    
    IF NEW.status = 'publicado' AND NEW.published_at IS NULL THEN
      NEW.published_at := now();
      IF NEW.approved_at IS NULL THEN
        NEW.approved_at := now();
      END IF;
    END IF;

    -- Generate copies
    event_url := 'https://agendilha.lovable.app/evento/' || NEW.slug;
    event_date := COALESCE(NEW.date, 'Data a definir');
    
    NEW.short_copy := '🗓️ *' || NEW.event_title || '*\n⏰ ' || event_date || ' às ' || COALESCE(NEW.start_time, '--:--') || '\n📍 ' || COALESCE(NEW.location, 'Local a confirmar') || '\n\n🔗 Saiba mais: ' || event_url;
    
    NEW.long_copy := '🚀 *NOVO EVENTO: ' || NEW.event_title || '*\n\n' || 
                    COALESCE(NEW.description, '') || '\n\n' ||
                    '📅 *Data:* ' || event_date || '\n' ||
                    '🕒 *Horário:* ' || COALESCE(NEW.start_time, '') || ' às ' || COALESCE(NEW.end_time, '--:--') || '\n' ||
                    '📍 *Local:* ' || COALESCE(NEW.location, '') || '\n' ||
                    '🏷️ *Categoria:* ' || COALESCE(NEW.category, '') || '\n\n' ||
                    '✨ Garanta sua presença e veja todos os detalhes aqui:\n' || event_url || '\n\n' ||
                    '#AgendIlha #Evento #Cultura #Lazer';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tr_event_automation ON public.submissions;
CREATE TRIGGER tr_event_automation
BEFORE INSERT OR UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_event_automation();
