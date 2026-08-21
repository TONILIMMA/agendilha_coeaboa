-- Re-grant permissions for the autocomplete function and views to ensure everything is visible
GRANT EXECUTE ON FUNCTION public.search_atrativos_autocomplete(text, integer, integer) TO authenticated, anon;
GRANT SELECT ON public.atrativos TO authenticated, anon;
GRANT SELECT ON public.atrativos_public TO authenticated, anon;
GRANT SELECT ON public.public_submissions TO authenticated, anon;

-- Ensure the search function is SECURITY DEFINER so it can access the base table even if the user has limited RLS
ALTER FUNCTION public.search_atrativos_autocomplete(text, integer, integer) SECURITY DEFINER;

-- Update the SELECT policy to be more inclusive for authenticated users while protecting PII
DROP POLICY IF EXISTS "atrativos_select_all_approved_or_authorized" ON public.atrativos;
CREATE POLICY "atrativos_select_v2"
ON public.atrativos FOR SELECT TO authenticated, anon
USING (
  is_approved = true
  OR (
    auth.uid() IS NOT NULL AND (
      responsavel_id = auth.uid()
      OR created_by = auth.uid()
      OR public.is_admin_or_master(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.collaborators c
         WHERE c.user_id = auth.uid() 
           AND c.is_active = true
           AND (c.can_edit = true OR c.can_delete = true OR c.can_approve = true OR c.can_submit = true)
      )
    )
  )
);
