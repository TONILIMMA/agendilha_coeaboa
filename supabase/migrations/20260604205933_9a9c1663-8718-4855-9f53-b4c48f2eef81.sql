
-- 1) Public views excluding sensitive contact columns
CREATE OR REPLACE VIEW public.public_submissions
WITH (security_invoker = on) AS
SELECT id, user_id, company_name, event_title, date, start_time, end_time,
       location, description, video_link, category, created_at,
       address_street, address_number, address_neighborhood, address_city,
       address_state, address_zip, promotion_type, target_audience,
       promotion_rules, additional_details, status, sale_price,
       maintenance_cost, subscription_info, commission, stage,
       concept_description, deleted_at, rejection_reason, predicted_duration,
       atrativo_name, atrativo_type, atrativo_style, location_type,
       legal_acceptance, legal_acceptance_date, is_highlight, views_count,
       shares_count, image_url, latitude, longitude, age_rating,
       is_suitable_for_minors, report_count, moderation_status, artist_id,
       ai_moderation_score, ai_moderation_labels, image_url_story,
       image_url_whatsapp, slug, short_copy, long_copy, approved_at,
       approved_by, published_at
FROM public.submissions;

CREATE OR REPLACE VIEW public.public_artist_profiles
WITH (security_invoker = on) AS
SELECT id, user_id, name, bio, genre, city, neighborhood, member_count,
       artist_type, instagram, spotify, youtube, cover_url, avatar_url,
       is_approved, created_at, updated_at, is_verified, work_description,
       styles, differentials, spotify_url, website_url, moderation_status,
       rejection_reason
FROM public.artist_profiles;

GRANT SELECT ON public.public_submissions TO anon, authenticated;
GRANT SELECT ON public.public_artist_profiles TO anon, authenticated;

-- 2) Remove anonymous SELECT access on base tables (sensitive columns)
DROP POLICY IF EXISTS "Anyone can view published submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can view approved submissions" ON public.submissions;

CREATE POLICY "Authenticated users can view published submissions"
ON public.submissions FOR SELECT TO authenticated
USING (
  status = ANY (ARRAY['publicado'::text, 'divulgado'::text, 'agendado_para_divulgacao'::text, 'published'::text, 'approved'::text])
  OR auth.uid() = user_id
);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.artist_profiles;
CREATE POLICY "Authenticated users can view artist profiles"
ON public.artist_profiles FOR SELECT TO authenticated
USING (is_approved = true OR auth.uid() = user_id);

-- Revoke direct anon SELECT on base tables (defense-in-depth; views remain the entry point)
REVOKE SELECT ON public.submissions FROM anon;
REVOKE SELECT ON public.artist_profiles FROM anon;

-- 3) atrativos: scope insert to authenticated role
DROP POLICY IF EXISTS "Usuários autenticados podem sugerir atrativos" ON public.atrativos;
CREATE POLICY "Usuarios autenticados podem sugerir atrativos"
ON public.atrativos FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 4) event_reviews: require authentication for inserts
DROP POLICY IF EXISTS "Anyone can leave a review" ON public.event_reviews;
CREATE POLICY "Authenticated users can leave a review"
ON public.event_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
