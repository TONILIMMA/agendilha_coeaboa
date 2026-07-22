ALTER TABLE public.artist_profiles
  ADD COLUMN IF NOT EXISTS members text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS contact_email text;