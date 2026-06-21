-- 1. Tighten artist_profiles SELECT: only owner + admin/master can read full row.
DROP POLICY IF EXISTS "Authenticated users can view artist profiles" ON public.artist_profiles;

CREATE POLICY "Owner can view own artist profile"
ON public.artist_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins and masters can view all artist profiles"
ON public.artist_profiles
FOR SELECT
TO authenticated
USING (public.is_admin_or_master(auth.uid()));

-- 2. Public-safe view now includes whatsapp (intentional booking contact).
--    Excludes representative_name, representative_phone, technical_needs.
CREATE OR REPLACE VIEW public.public_artist_profiles AS
SELECT
  id, user_id, name, bio, genre, city, neighborhood,
  member_count, artist_type, instagram, spotify, youtube,
  cover_url, avatar_url, is_approved, created_at, updated_at,
  is_verified, work_description, styles, differentials,
  spotify_url, website_url, moderation_status, rejection_reason,
  whatsapp
FROM public.artist_profiles
WHERE is_approved = true;

GRANT SELECT ON public.public_artist_profiles TO anon, authenticated;

-- 3. Fix mutable search_path on pgrst_watch.
CREATE OR REPLACE FUNCTION public.pgrst_watch()
RETURNS event_trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

NOTIFY pgrst, 'reload schema';