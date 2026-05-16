-- Fix Function Search Path for Security (only for existing functions)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_views') THEN
        ALTER FUNCTION public.increment_views(uuid) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'increment_shares') THEN
        ALTER FUNCTION public.increment_shares(uuid) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'report_event') THEN
        ALTER FUNCTION public.report_event(uuid, text, text) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_moderate_content') THEN
        ALTER FUNCTION public.auto_moderate_content() SET search_path = public;
    END IF;
END $$;

-- Ensure RLS on profiles is not overly permissive
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Restrict artist_media moderation
DROP POLICY IF EXISTS "Artists can manage their own media" ON public.artist_media;
CREATE POLICY "Artists can manage their own media"
ON public.artist_media
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM artist_profiles 
        WHERE id = artist_media.artist_id AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM artist_profiles 
        WHERE id = artist_media.artist_id AND user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can moderate any media" ON public.artist_media;
CREATE POLICY "Admins can moderate any media"
ON public.artist_media
FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Storage Policies Review
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artist-media', 'artist-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view artist media" ON storage.objects;
CREATE POLICY "Anyone can view artist media"
ON storage.objects FOR SELECT
USING (bucket_id = 'artist-media');

DROP POLICY IF EXISTS "Artists can upload media" ON storage.objects;
CREATE POLICY "Artists can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'artist-media' 
    AND (storage.foldername(name))[1] IN (
        SELECT id::text FROM artist_profiles WHERE user_id = auth.uid()
    )
);
