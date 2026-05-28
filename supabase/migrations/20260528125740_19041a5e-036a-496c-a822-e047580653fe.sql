-- 1. Create permissions table
CREATE TABLE public.app_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create roles table
CREATE TABLE public.app_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Junction table for role-permissions
CREATE TABLE public.app_role_permissions (
    role_id UUID REFERENCES public.app_roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.app_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. User roles assignment table
CREATE TABLE public.app_user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.app_roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- 5. Audit logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Seed initial permissions
INSERT INTO public.app_permissions (name, description) VALUES
('events.create', 'Permissão para criar eventos'),
('events.read', 'Permissão para ler eventos (incluindo rascunhos)'),
('events.update', 'Permissão para atualizar eventos'),
('events.approve', 'Permissão para aprovar eventos pendentes'),
('events.cancel', 'Permissão para cancelar eventos'),
('events.delete', 'Permissão para excluir eventos'),
('users.read', 'Permissão para ver lista de usuários'),
('users.update', 'Permissão para editar dados de usuários'),
('users.promote', 'Permissão para promover usuários a admin'),
('users.demote', 'Permissão para remover privilégios de admin'),
('admins.invite', 'Permissão para convidar novos administradores'),
('admins.remove', 'Permissão para remover administradores'),
('roles.manage', 'Permissão para gerenciar papéis e permissões'),
('audit_logs.read', 'Permissão para ler logs de auditoria');

-- 7. Seed initial roles
INSERT INTO public.app_roles (name, description) VALUES
('master_admin', 'Administrador total do sistema'),
('admin', 'Administrador operacional'),
('user', 'Usuário padrão da plataforma');

-- 8. Assign all permissions to master_admin
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'master_admin';

-- 9. Assign specific permissions to admin role
INSERT INTO public.app_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.app_roles r, public.app_permissions p
WHERE r.name = 'admin' AND p.name IN (
    'events.read', 'events.update', 'events.approve', 'events.cancel',
    'users.read'
);

-- 10. Security & Helper Functions (unique name)
CREATE OR REPLACE FUNCTION public.has_app_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.app_user_roles ur
        JOIN public.app_role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.app_permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id AND p.name = p_permission_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Migration from legacy user_roles if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') THEN
        -- Migrate 'admin'
        INSERT INTO public.app_user_roles (user_id, role_id)
        SELECT ur.user_id, r.id FROM public.user_roles ur, public.app_roles r
        WHERE ur.role = 'admin' AND r.name = 'admin'
        ON CONFLICT DO NOTHING;
        
        -- Migrate 'master'
        INSERT INTO public.app_user_roles (user_id, role_id)
        SELECT ur.user_id, r.id FROM public.user_roles ur, public.app_roles r
        WHERE ur.role = 'master' AND r.name = 'master_admin'
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 12. Enable RLS and Grants
ALTER TABLE public.app_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.app_permissions TO authenticated;
GRANT SELECT ON public.app_roles TO authenticated;
GRANT SELECT ON public.app_role_permissions TO authenticated;
GRANT SELECT ON public.app_user_roles TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

GRANT ALL ON public.app_permissions TO service_role;
GRANT ALL ON public.app_roles TO service_role;
GRANT ALL ON public.app_role_permissions TO service_role;
GRANT ALL ON public.app_user_roles TO service_role;
GRANT ALL ON public.audit_logs TO service_role;

-- Policies
CREATE POLICY "Perms viewable" ON public.app_permissions FOR SELECT USING (true);
CREATE POLICY "Roles viewable" ON public.app_roles FOR SELECT USING (true);
CREATE POLICY "Role perms viewable" ON public.app_role_permissions FOR SELECT USING (true);
CREATE POLICY "Users see own roles" ON public.app_user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_app_permission(auth.uid(), 'users.read'));
CREATE POLICY "Audit logs viewable" ON public.audit_logs FOR SELECT USING (public.has_app_permission(auth.uid(), 'audit_logs.read'));

-- 13. Audit Log Trigger Function
CREATE OR REPLACE FUNCTION public.log_administrative_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        resource_type,
        resource_id,
        previous_value,
        new_value
    ) VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id::text
            ELSE NEW.id::text
        END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Apply triggers to sensitive tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'submissions') THEN
        DROP TRIGGER IF EXISTS audit_submissions_changes ON public.submissions;
        CREATE TRIGGER audit_submissions_changes
        AFTER INSERT OR UPDATE OR DELETE ON public.submissions
        FOR EACH ROW EXECUTE FUNCTION public.log_administrative_action();
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;
        CREATE TRIGGER audit_profiles_changes
        AFTER INSERT OR UPDATE OR DELETE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.log_administrative_action();
    END IF;
END $$;
