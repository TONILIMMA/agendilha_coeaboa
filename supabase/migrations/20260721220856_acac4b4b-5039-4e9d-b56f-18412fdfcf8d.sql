
-- Convert public_submissions view to security_invoker=on and lock down PII via column grants + policy.

ALTER VIEW public.public_submissions SET (security_invoker = on);

-- Column-level SELECT grants: only safe columns are readable by anon/authenticated on the base table.
-- (Owner/admin policies on the base table continue to grant them full-row visibility via other roles/paths.)
GRANT SELECT (
  id, user_id, company_name, event_title, date, start_time, end_time, location,
  description, video_link, category, created_at, address_street, address_number,
  address_neighborhood, address_city, address_state, address_zip, promotion_type,
  target_audience, promotion_rules, additional_details, status, sale_price,
  maintenance_cost, subscription_info, commission, stage, concept_description,
  deleted_at, rejection_reason, predicted_duration, atrativo_name, atrativo_type,
  atrativo_style, location_type, legal_acceptance, legal_acceptance_date,
  is_highlight, views_count, shares_count, image_url, latitude, longitude,
  age_rating, is_suitable_for_minors, report_count, moderation_status, artist_id,
  ai_moderation_score, ai_moderation_labels, image_url_story, image_url_whatsapp,
  slug, short_copy, long_copy, approved_at, approved_by, published_at, fotos
) ON public.submissions TO anon, authenticated;

-- RLS policy: allow anonymous/authenticated readers to see published, non-deleted submissions.
-- Column-level grants above ensure PII columns (email, phone, responsible_name, atrativo_contact, etc.) remain hidden.
DROP POLICY IF EXISTS "Public can view published submissions (safe columns)" ON public.submissions;
CREATE POLICY "Public can view published submissions (safe columns)"
  ON public.submissions
  FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND status IN ('aprovado', 'publicado', 'divulgado')
  );
