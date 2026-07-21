-- Remove blanket public/authenticated SELECT policies that exposed PII columns on base tables.
-- Public reads must go through the security_invoker views (public_artist_profiles, atrativos_public, estabelecimentos_public)
-- which exclude sensitive contact/PII fields. Owner and admin SELECT policies remain in place.

DROP POLICY IF EXISTS "artist_profiles_anon_approved_read" ON public.artist_profiles;
DROP POLICY IF EXISTS "artist_profiles_authenticated_approved_read" ON public.artist_profiles;

DROP POLICY IF EXISTS "atrativos_anon_approved_read" ON public.atrativos;
DROP POLICY IF EXISTS "atrativos_authenticated_approved_read" ON public.atrativos;

DROP POLICY IF EXISTS "estabelecimentos_anon_approved_read" ON public.estabelecimentos;
DROP POLICY IF EXISTS "estabelecimentos_authenticated_approved_read" ON public.estabelecimentos;

-- Ensure anon/authenticated can still SELECT from the safe public views.
GRANT SELECT ON public.public_artist_profiles TO anon, authenticated;
GRANT SELECT ON public.atrativos_public TO anon, authenticated;
GRANT SELECT ON public.estabelecimentos_public TO anon, authenticated;