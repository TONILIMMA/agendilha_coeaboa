
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can insert collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can delete collaborators" ON public.collaborators;

-- Recreate with admin OR can_approve access
CREATE POLICY "Managers can view all collaborators"
ON public.collaborators FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'approve'));

CREATE POLICY "Managers can insert collaborators"
ON public.collaborators FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'approve'));

CREATE POLICY "Managers can update collaborators"
ON public.collaborators FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'approve'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'approve'));

CREATE POLICY "Managers can delete collaborators"
ON public.collaborators FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_permission(auth.uid(), 'approve'));
