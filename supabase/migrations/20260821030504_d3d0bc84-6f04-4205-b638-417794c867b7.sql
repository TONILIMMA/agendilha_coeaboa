-- 1. Grant permissions to use the autocomplete function and base tables
GRANT EXECUTE ON FUNCTION public.search_atrativos_autocomplete(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_atrativos_autocomplete(text, integer, integer) TO anon;

GRANT SELECT ON public.atrativos TO authenticated;
GRANT SELECT ON public.atrativos TO anon;

GRANT SELECT ON public.atrativos_public TO authenticated;
GRANT SELECT ON public.atrativos_public TO anon;

-- 2. Fix the SELECT policy for 'atrativos' to ensure all users can see approved records
-- while keeping the special access for owners and admins.
DROP POLICY IF EXISTS "atrativos_select_authorized" ON public.atrativos;

CREATE POLICY "atrativos_select_all_approved_or_authorized"
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
