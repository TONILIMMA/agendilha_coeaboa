-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Admins manage roles, only masters create master" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles, only masters delete master" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Create new robust policies for user_roles
CREATE POLICY "Admins and Masters can view roles"
ON public.user_roles FOR SELECT
USING (
  (user_id = auth.uid()) OR 
  public.is_admin_or_master(auth.uid())
);

CREATE POLICY "Only Masters can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.is_master(auth.uid()))
WITH CHECK (public.is_master(auth.uid()));

-- Ensure audit_logs RLS follows the "only own or all if master" rule
-- First check if RLS is enabled on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Masters can view all logs, admins only own" ON public.audit_logs;
CREATE POLICY "Masters can view all logs, admins only own"
ON public.audit_logs FOR SELECT
USING (
  public.is_master(auth.uid()) OR
  actor_id = auth.uid()
);

-- Ensure service_role can always manage everything
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.audit_logs TO service_role;
