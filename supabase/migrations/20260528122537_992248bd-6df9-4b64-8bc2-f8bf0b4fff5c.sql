
-- 1. Drop unused plaintext pin_code column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pin_code;

-- 2. Tighten event-flyers INSERT policy to enforce path ownership
DROP POLICY IF EXISTS "Authenticated users can upload flyers" ON storage.objects;
CREATE POLICY "Users can upload flyers to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-flyers'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. Restrict public access to artist_media: only approved media is public.
-- Artists keep full access to their own media via the existing "Artists can manage their own media" ALL policy.
DROP POLICY IF EXISTS "Artist media is viewable by everyone" ON public.artist_media;
CREATE POLICY "Approved artist media is viewable by everyone"
ON public.artist_media
FOR SELECT
USING (is_approved = true AND COALESCE(moderation_status, 'approved') <> 'rejected');
