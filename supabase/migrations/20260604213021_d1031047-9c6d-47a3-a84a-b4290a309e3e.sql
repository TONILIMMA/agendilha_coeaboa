-- Add coverage_area to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coverage_area TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add artist specific fields to artist_profiles
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS technical_needs TEXT;
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS representative_name TEXT;
ALTER TABLE public.artist_profiles ADD COLUMN IF NOT EXISTS representative_phone TEXT;

-- Grant permissions (just in case)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.artist_profiles TO authenticated;
GRANT ALL ON public.artist_profiles TO service_role;
