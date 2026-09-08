DROP VIEW IF EXISTS public.public_artist_profiles;

CREATE VIEW public.public_artist_profiles
WITH (security_invoker = true) AS
SELECT
  id, user_id, name, bio, genre, city, neighborhood,
  member_count, artist_type, instagram, whatsapp, spotify, youtube,
  cover_url, avatar_url, is_approved, created_at, updated_at,
  is_verified, work_description, styles, differentials,
  spotify_url, website_url, moderation_status, rejection_reason,
  contact_email
FROM public.artist_profiles
WHERE is_approved = true;

GRANT SELECT ON public.public_artist_profiles TO anon, authenticated;