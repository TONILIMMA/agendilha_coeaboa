
-- 1) Restrict whatsapp column on artist_profiles from anonymous users
REVOKE SELECT ON public.artist_profiles FROM anon;
GRANT SELECT (
  id, user_id, name, artist_type, member_count, genre, styles, bio,
  work_description, differentials, neighborhood, city,
  avatar_url, cover_url, instagram, youtube, spotify, spotify_url, website_url,
  is_approved, is_verified, moderation_status, created_at, updated_at
) ON public.artist_profiles TO anon;

-- 2) Admin DELETE policy on artist_media
CREATE POLICY "Admins can delete any media"
ON public.artist_media
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

-- 3) Lock down password_reset_codes - explicit deny to client roles
REVOKE ALL ON public.password_reset_codes FROM anon, authenticated;
GRANT ALL ON public.password_reset_codes TO service_role;

-- 4) Storage artist-media: artists manage own folder, admins override
CREATE POLICY "Artists can update own artist-media files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'artist-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'artist-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can delete own artist-media files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'artist-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can manage artist-media files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'artist-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
)
WITH CHECK (
  bucket_id = 'artist-media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'))
);

-- 5) Fix mutable search_path on existing functions
ALTER FUNCTION public.generate_slug(text) SET search_path = public;
ALTER FUNCTION public.get_admin_dashboard_stats(text, text, text) SET search_path = public;
ALTER FUNCTION public.handle_event_automation() SET search_path = public;
ALTER FUNCTION public.normalize_phone() SET search_path = public;
