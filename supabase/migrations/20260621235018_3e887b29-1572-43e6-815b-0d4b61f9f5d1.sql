DROP VIEW IF EXISTS public.public_artist_profiles;

CREATE VIEW public.public_artist_profiles
WITH (security_invoker = true) AS
SELECT
  id, user_id, name, bio, genre, city, neighborhood,
  member_count, artist_type, instagram, spotify, youtube,
  cover_url, avatar_url, is_approved, created_at, updated_at,
  is_verified, work_description, styles, differentials,
  spotify_url, website_url, moderation_status, rejection_reason,
  whatsapp
FROM public.artist_profiles
WHERE is_approved = true;

-- Allow the view itself to be queried by both anon and authenticated.
GRANT SELECT ON public.public_artist_profiles TO anon, authenticated;

-- security_invoker views apply caller's RLS on the underlying table, so we
-- need an RLS policy that allows reading approved profiles' public columns.
-- Existing owner + admin policies stay in place; add a permissive read for
-- approved profiles so the public view returns rows for everyone.
DROP POLICY IF EXISTS "Public can view approved artist profiles via view" ON public.artist_profiles;
CREATE POLICY "Public can view approved artist profiles via view"
ON public.artist_profiles
FOR SELECT
TO anon, authenticated
USING (is_approved = true);