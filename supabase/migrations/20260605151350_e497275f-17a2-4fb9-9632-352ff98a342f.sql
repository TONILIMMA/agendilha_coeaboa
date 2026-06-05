
-- 1. Restrict atrativos SELECT to authenticated users
DROP POLICY IF EXISTS "Qualquer um pode ver atrativos" ON public.atrativos;
CREATE POLICY "Usuários autenticados podem ver atrativos"
  ON public.atrativos FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.atrativos FROM anon;

-- 2. Restrict places SELECT to authenticated users
DROP POLICY IF EXISTS "Qualquer um pode ver locais" ON public.places;
CREATE POLICY "Usuários autenticados podem ver locais"
  ON public.places FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.places FROM anon;

-- 3. Enforce user_name on event_reviews via trigger
CREATE OR REPLACE FUNCTION public.enforce_review_user_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    NEW.user_name := 'Anônimo';
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(responsible_name, ''), NULLIF(company_name, ''))
    INTO v_name
    FROM public.profiles
   WHERE user_id = auth.uid()
   LIMIT 1;

  NEW.user_name := COALESCE(v_name, 'Anônimo');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_user_name ON public.event_reviews;
CREATE TRIGGER trg_enforce_review_user_name
  BEFORE INSERT ON public.event_reviews
  FOR EACH ROW EXECUTE FUNCTION public.enforce_review_user_name();

-- 4. Standardize artist_media admin DELETE policy to use typed has_role overload
DROP POLICY IF EXISTS "Admins can delete any media" ON public.artist_media;
CREATE POLICY "Admins can delete any media"
  ON public.artist_media FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master'::app_role)
  );

-- 5. Fix mutable search_path on is_admin_or_master
CREATE OR REPLACE FUNCTION public.is_admin_or_master(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role IN ('admin', 'master')
  );
END;
$$;
