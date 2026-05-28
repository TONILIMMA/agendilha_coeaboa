
-- 1. Fix has_app_permission search_path
CREATE OR REPLACE FUNCTION public.has_app_permission(p_user_id uuid, p_permission_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_user_roles ur
        JOIN public.app_role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.app_permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id AND p.name = p_permission_name
    );
END;
$function$;

-- Also fix other SECURITY DEFINER functions that miss search_path
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN ARRAY(
        SELECT p.name
        FROM public.app_user_roles ur
        JOIN public.app_role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.app_permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_admin_pin(input_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT pin_hash INTO stored_hash
    FROM public.admin_configs
    WHERE user_id = auth.uid();

    IF stored_hash IS NULL THEN
        RETURN input_pin = '0000';
    END IF;

    RETURN stored_hash = crypt(input_pin, stored_hash) OR (stored_hash = '0000' AND input_pin = '0000');
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_admin_pin(new_pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.admin_configs (user_id, pin_hash)
    VALUES (auth.uid(), crypt(new_pin, gen_salt('bf')))
    ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(new_pin, gen_salt('bf')), updated_at = now();
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_administrative_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.audit_logs (
        actor_id, action, resource_type, resource_id, previous_value, new_value
    ) VALUES (
        auth.uid(), TG_OP, TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NULL;
END;
$function$;

-- 2. Lock down app_roles writes (master_admin only via legacy is_master fallback)
CREATE POLICY "Only masters can insert roles" ON public.app_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can update roles" ON public.app_roles
  FOR UPDATE TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can delete roles" ON public.app_roles
  FOR DELETE TO authenticated
  USING (public.is_master(auth.uid()));

-- 3. Lock down app_permissions writes
CREATE POLICY "Only masters can insert permissions" ON public.app_permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can update permissions" ON public.app_permissions
  FOR UPDATE TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can delete permissions" ON public.app_permissions
  FOR DELETE TO authenticated
  USING (public.is_master(auth.uid()));

-- 4. Lock down app_role_permissions writes
CREATE POLICY "Only masters can insert role permissions" ON public.app_role_permissions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can update role permissions" ON public.app_role_permissions
  FOR UPDATE TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can delete role permissions" ON public.app_role_permissions
  FOR DELETE TO authenticated
  USING (public.is_master(auth.uid()));

-- 5. Lock down app_user_roles writes (prevent privilege escalation)
CREATE POLICY "Only masters can assign roles to users" ON public.app_user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can update user roles" ON public.app_user_roles
  FOR UPDATE TO authenticated
  USING (public.is_master(auth.uid()))
  WITH CHECK (public.is_master(auth.uid()));
CREATE POLICY "Only masters can revoke user roles" ON public.app_user_roles
  FOR DELETE TO authenticated
  USING (public.is_master(auth.uid()));

-- 6. Fix location_requests
DROP POLICY IF EXISTS "Usuários autenticados podem solicitar novas localidades" ON public.location_requests;
CREATE POLICY "Users can submit location requests for themselves"
  ON public.location_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view location requests"
  ON public.location_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_master(auth.uid()));

-- 7. Fix user_activity_logs
DROP POLICY IF EXISTS "Users can insert their own activity" ON public.user_activity_logs;
CREATE POLICY "Users can insert their own activity"
  ON public.user_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);
CREATE POLICY "Users can view their own activity"
  ON public.user_activity_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
