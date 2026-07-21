
-- Remove public (anon) access to sensitive columns of artist_profiles, atrativos, estabelecimentos.
-- 1) Drop over-permissive base-table SELECT policies (they granted anon full-column access).
DROP POLICY IF EXISTS "Public can view approved artist profiles via view" ON public.artist_profiles;
DROP POLICY IF EXISTS "atrativos_public_approved_read" ON public.atrativos;
DROP POLICY IF EXISTS "estabelecimentos_public_approved_read" ON public.estabelecimentos;

-- 2) Recreate the SELECT policies restricted to authenticated users only.
--    (Owner/admin policies already cover writes and full-column reads for owners.)
CREATE POLICY "artist_profiles_authenticated_approved_read"
  ON public.artist_profiles
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "atrativos_authenticated_approved_read"
  ON public.atrativos
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

CREATE POLICY "estabelecimentos_authenticated_approved_read"
  ON public.estabelecimentos
  FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- 3) Add anon SELECT policy scoped to approved rows...
CREATE POLICY "artist_profiles_anon_approved_read"
  ON public.artist_profiles
  FOR SELECT
  TO anon
  USING (is_approved = true);

CREATE POLICY "atrativos_anon_approved_read"
  ON public.atrativos
  FOR SELECT
  TO anon
  USING (is_approved = true);

CREATE POLICY "estabelecimentos_anon_approved_read"
  ON public.estabelecimentos
  FOR SELECT
  TO anon
  USING (is_approved = true);

-- 4) ...but enforce column-level privileges so anon can only read non-sensitive columns.
REVOKE SELECT ON public.artist_profiles FROM anon;
REVOKE SELECT ON public.atrativos FROM anon;
REVOKE SELECT ON public.estabelecimentos FROM anon;

GRANT SELECT (
  id, user_id, name, bio, genre, city, neighborhood, member_count, artist_type,
  instagram, spotify, youtube, cover_url, avatar_url, is_approved, is_verified,
  work_description, styles, differentials, spotify_url, website_url,
  moderation_status, whatsapp, created_at, updated_at
) ON public.artist_profiles TO anon;

GRANT SELECT (
  id, name, type, tipo_atrativo, style, estilos, description, contact_whatsapp,
  estabelecimento_id, pais, estado, cidade_regiao, logo_url, fotos, is_approved,
  created_at, updated_at
) ON public.atrativos TO anon;

GRANT SELECT (
  id, nome, endereco, bairro, cep, numero, complemento, tipo, tipos, contato,
  fotos, is_approved, created_at, updated_at
) ON public.estabelecimentos TO anon;
