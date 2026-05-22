
-- 1. is_master: remove fallback
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'master'
  )
$$;

-- 2. has_permission: require active collaborator
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE user_id = _user_id
    AND is_active = true
    AND (
      (_permission = 'submit' AND can_submit = true) OR
      (_permission = 'approve' AND can_approve = true) OR
      (_permission = 'edit' AND can_edit = true) OR
      (_permission = 'delete' AND can_delete = true)
    )
  ) OR public.has_role(_user_id, 'admin')
$$;

-- 3. follows: restrict public SELECT to owner
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;

-- 4. event-flyers: add UPDATE policy
CREATE POLICY "Users can update their own flyers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-flyers' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'event-flyers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Set search_path on remaining functions
ALTER FUNCTION public.contains_bad_words(text) SET search_path = public;
ALTER FUNCTION public.auto_moderate_submission() SET search_path = public;
ALTER FUNCTION public.moderate_review_trigger() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 6. Recreate event_ratings_summary view with security_invoker
DROP VIEW IF EXISTS public.event_ratings_summary;
CREATE VIEW public.event_ratings_summary
WITH (security_invoker = on) AS
SELECT event_id,
       round(avg(rating), 1) AS average_rating,
       count(*) AS total_reviews
FROM public.event_reviews
WHERE status = 'approved'
GROUP BY event_id;

GRANT SELECT ON public.event_ratings_summary TO anon, authenticated;
