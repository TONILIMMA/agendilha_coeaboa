
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS responsavel_duvidas_whatsapp text;

GRANT SELECT (responsavel_duvidas_whatsapp) ON public.submissions TO anon, authenticated;

DROP VIEW IF EXISTS public.public_submissions;

CREATE VIEW public.public_submissions AS
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
       COALESCE(
         responsavel_duvidas_whatsapp,
         CASE duvidas_source
           WHEN 'atrativo' THEN atrativo_contact
           WHEN 'estabelecimento' THEN location_contact
           ELSE phone
         END
       ) AS duvidas_phone,
       responsavel_duvidas_whatsapp
FROM public.submissions;

ALTER VIEW public.public_submissions SET (security_invoker = on);
GRANT SELECT ON public.public_submissions TO anon, authenticated;
