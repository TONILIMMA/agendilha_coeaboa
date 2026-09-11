-- 1) Public submissions view: enforce querying user's RLS
ALTER VIEW public.public_submissions SET (security_invoker = on);

REVOKE SELECT ON public.submissions FROM anon;
GRANT SELECT (
  id, user_id, company_name, event_title, date, start_time, end_time, location,
  description, video_link, category, created_at, address_street, address_number,
  address_neighborhood, address_city, address_state, address_zip, promotion_type,
  target_audience, promotion_rules, additional_details, status, sale_price,
  maintenance_cost, subscription_info, commission, stage, concept_description,
  deleted_at, rejection_reason, predicted_duration, atrativo_name, atrativo_type,
  atrativo_style, atrativo_contact, location_type, location_contact, phone,
  legal_acceptance, legal_acceptance_date, is_highlight, views_count, shares_count,
  image_url, latitude, longitude, age_rating, is_suitable_for_minors, report_count,
  moderation_status, artist_id, ai_moderation_score, ai_moderation_labels,
  image_url_story, image_url_whatsapp, slug, short_copy, long_copy, approved_at,
  approved_by, published_at, fotos, duvidas_source, responsavel_duvidas_whatsapp,
  highlight_until, highlight_hidden
) ON public.submissions TO anon;

-- 2) atrativos: anon may read only non-PII columns
REVOKE SELECT ON public.atrativos FROM anon;
GRANT SELECT (
  id, name, type, tipo_atrativo, style, estilos, description, estabelecimento_id,
  pais, estado, cidade_regiao, logo_url, fotos, created_at, is_approved
) ON public.atrativos TO anon;

-- 3) estabelecimentos: anon may read only non-PII columns (no cnpj, no contato, no responsavel_*)
DROP VIEW IF EXISTS public.estabelecimentos_public;
CREATE VIEW public.estabelecimentos_public
WITH (security_invoker = on) AS
SELECT id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos, fotos, created_at
FROM public.estabelecimentos
WHERE is_approved = true;

GRANT SELECT ON public.estabelecimentos_public TO anon, authenticated;
GRANT ALL ON public.estabelecimentos_public TO service_role;

REVOKE SELECT ON public.estabelecimentos FROM anon;
GRANT SELECT (
  id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos, fotos,
  created_at, is_approved
) ON public.estabelecimentos TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estabelecimentos TO authenticated;
GRANT ALL ON public.estabelecimentos TO service_role;
