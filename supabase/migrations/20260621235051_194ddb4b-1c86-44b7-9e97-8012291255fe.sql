-- Revoke column-level SELECT on private contact fields for non-service roles.
-- This applies to ALL queries (including embedded joins and views).
REVOKE SELECT (representative_phone, representative_name)
  ON public.artist_profiles FROM anon, authenticated;

-- Owners need to read their own representative fields (ProfileSettings).
-- Expose them via a SECURITY DEFINER function gated to owner or admin/master.
CREATE OR REPLACE FUNCTION public.get_artist_private_contacts(p_artist_id uuid)
RETURNS TABLE (representative_name text, representative_phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT ap.representative_name, ap.representative_phone
    FROM public.artist_profiles ap
   WHERE ap.id = p_artist_id
     AND (
       ap.user_id = auth.uid()
       OR public.is_admin_or_master(auth.uid())
     );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_artist_private_contacts(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_artist_private_contacts(uuid) TO authenticated;