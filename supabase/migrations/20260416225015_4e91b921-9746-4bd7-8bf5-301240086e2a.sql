-- is_master helper
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'master'
    )
    OR (
      NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'master')
      AND _user_id = (
        SELECT user_id FROM public.user_roles
        WHERE role = 'admin'
        ORDER BY created_at ASC
        LIMIT 1
      )
    )
$$;

-- Replace insert policy: admins can insert admin/user; only masters can insert master
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins manage roles, only masters create master"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  (role <> 'master' AND public.has_role(auth.uid(), 'admin'))
  OR (role = 'master' AND public.is_master(auth.uid()))
);

-- Replace delete policy: only masters can remove master role
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
CREATE POLICY "Admins delete roles, only masters delete master"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  (role <> 'master' AND public.has_role(auth.uid(), 'admin'))
  OR (role = 'master' AND public.is_master(auth.uid()))
);
