-- ============ 1. event_reviews: bind reviews to their author ============
ALTER TABLE public.event_reviews
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_event_reviews_user_id ON public.event_reviews(user_id);

-- one review per user per event (legacy rows with NULL user_id are untouched)
CREATE UNIQUE INDEX IF NOT EXISTS uq_event_reviews_event_user
  ON public.event_reviews(event_id, user_id)
  WHERE user_id IS NOT NULL;

-- display name always derived from the author's profile, never client-supplied
CREATE OR REPLACE FUNCTION public.set_event_review_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  NEW.user_id := auth.uid();

  SELECT NULLIF(btrim(p.responsible_name), '')
    INTO v_name
    FROM public.profiles p
   WHERE p.id = NEW.user_id;

  NEW.user_name := COALESCE(v_name, 'Insulano');
  NEW.is_flagged := COALESCE(NEW.is_flagged, false);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_event_review_author() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_set_event_review_author ON public.event_reviews;
CREATE TRIGGER trg_set_event_review_author
  BEFORE INSERT ON public.event_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_event_review_author();

-- keep the author/display name immutable on edits
CREATE OR REPLACE FUNCTION public.keep_event_review_author()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := OLD.user_id;
  NEW.user_name := OLD.user_name;
  NEW.event_id := OLD.event_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.keep_event_review_author() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_keep_event_review_author ON public.event_reviews;
CREATE TRIGGER trg_keep_event_review_author
  BEFORE UPDATE ON public.event_reviews
  FOR EACH ROW EXECUTE FUNCTION public.keep_event_review_author();

-- policies
DROP POLICY IF EXISTS "Authenticated users can leave a review" ON public.event_reviews;
DROP POLICY IF EXISTS "Users can insert their own review" ON public.event_reviews;
DROP POLICY IF EXISTS "Users can update their own review" ON public.event_reviews;
DROP POLICY IF EXISTS "Users can delete their own review" ON public.event_reviews;
DROP POLICY IF EXISTS "Admins can moderate reviews" ON public.event_reviews;

CREATE POLICY "Users can insert their own review"
  ON public.event_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own review"
  ON public.event_reviews FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own review"
  ON public.event_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can moderate reviews"
  ON public.event_reviews FOR ALL TO authenticated
  USING (public.is_admin_or_master(auth.uid()))
  WITH CHECK (public.is_admin_or_master(auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_reviews TO authenticated;
GRANT SELECT ON public.event_reviews TO anon;
GRANT ALL ON public.event_reviews TO service_role;

-- ============ 2. artist-media storage: align insert/update/delete paths ============
CREATE OR REPLACE FUNCTION public.owns_artist_media_path(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND (
       (storage.foldername(_name))[1] = (auth.uid())::text
       OR (storage.foldername(_name))[1] IN (
            SELECT (ap.id)::text FROM public.artist_profiles ap WHERE ap.user_id = auth.uid()
          )
     );
$$;

REVOKE ALL ON FUNCTION public.owns_artist_media_path(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owns_artist_media_path(text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Artists can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Artists can update own artist-media files" ON storage.objects;
DROP POLICY IF EXISTS "Artists can delete own artist-media files" ON storage.objects;

CREATE POLICY "Artists can upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'artist-media' AND public.owns_artist_media_path(name));

CREATE POLICY "Artists can update own artist-media files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'artist-media' AND public.owns_artist_media_path(name))
  WITH CHECK (bucket_id = 'artist-media' AND public.owns_artist_media_path(name));

CREATE POLICY "Artists can delete own artist-media files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'artist-media' AND public.owns_artist_media_path(name));