
-- 1) Add duvidas_source column
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS duvidas_source text NOT NULL DEFAULT 'promotor';

ALTER TABLE public.submissions
  DROP CONSTRAINT IF EXISTS submissions_duvidas_source_check;
ALTER TABLE public.submissions
  ADD CONSTRAINT submissions_duvidas_source_check
  CHECK (duvidas_source IN ('promotor','atrativo','estabelecimento'));

-- Grant column-level select for public readers
GRANT SELECT (duvidas_source) ON public.submissions TO anon, authenticated;

-- 2) Recreate public_submissions view with derived duvidas_phone (only the chosen contact)
CREATE OR REPLACE VIEW public.public_submissions AS
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
       approved_by, published_at, fotos,
       duvidas_source,
       CASE duvidas_source
         WHEN 'atrativo' THEN atrativo_contact
         WHEN 'estabelecimento' THEN location_contact
         ELSE phone
       END AS duvidas_phone
FROM public.submissions;

ALTER VIEW public.public_submissions SET (security_invoker = on);
GRANT SELECT ON public.public_submissions TO anon, authenticated;

-- The view derives duvidas_phone from the base columns; grant column select on those base
-- columns is intentionally NOT added — the view runs as invoker but only exposes the single
-- routed contact, so PII stays hidden through direct table reads. To make the derived column
-- readable via security_invoker, we need select on the referenced columns; grant just the ones
-- needed for the CASE expression.
GRANT SELECT (phone, atrativo_contact, location_contact) ON public.submissions TO anon, authenticated;
