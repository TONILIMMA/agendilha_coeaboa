ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS work_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS event_type_preferences TEXT[];
