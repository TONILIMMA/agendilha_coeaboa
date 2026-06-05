
-- Restrict sensitive contact columns on atrativos and places
REVOKE SELECT (contact_whatsapp) ON public.atrativos FROM authenticated, anon;
GRANT SELECT (contact_whatsapp) ON public.atrativos TO service_role;

REVOKE SELECT (contact_responsible) ON public.places FROM authenticated, anon;
GRANT SELECT (contact_responsible) ON public.places TO service_role;

-- Tighten collaborators write policies to admins only (remove circular has_permission gate)
DROP POLICY IF EXISTS "Managers can insert collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Managers can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Managers can delete collaborators" ON public.collaborators;

CREATE POLICY "Admins can insert collaborators"
  ON public.collaborators FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update collaborators"
  ON public.collaborators FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete collaborators"
  ON public.collaborators FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Keep view policies: admins see all, users see own (already in place)
DROP POLICY IF EXISTS "Managers can view all collaborators" ON public.collaborators;
CREATE POLICY "Admins can view all collaborators"
  ON public.collaborators FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
