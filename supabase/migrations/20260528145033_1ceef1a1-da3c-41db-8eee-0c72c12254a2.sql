ALTER TABLE public.artist_profiles 
ADD COLUMN IF NOT EXISTS work_description TEXT,
ADD COLUMN IF NOT EXISTS styles TEXT[],
ADD COLUMN IF NOT EXISTS differentials TEXT,
ADD COLUMN IF NOT EXISTS spotify_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'incomplete')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update status options and constraints if needed, but the check above is already restrictive enough.
