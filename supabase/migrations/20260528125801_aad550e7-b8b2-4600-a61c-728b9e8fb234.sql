CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT p.name 
        FROM public.app_user_roles ur
        JOIN public.app_role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.app_permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
