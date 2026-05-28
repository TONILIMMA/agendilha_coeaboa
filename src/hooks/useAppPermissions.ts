import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PermissionName = 
  | 'events.create'
  | 'events.read'
  | 'events.update'
  | 'events.approve'
  | 'events.cancel'
  | 'events.delete'
  | 'users.read'
  | 'users.update'
  | 'users.promote'
  | 'users.demote'
  | 'admins.invite'
  | 'admins.remove'
  | 'roles.manage'
  | 'audit_logs.read';

export function useAppPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Set<PermissionName>>(new Set());
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions(new Set());
      setRoles([]);
      setLoading(false);
      return;
    }

    async function loadPermissions() {
      try {
        // Fetch user roles
        const { data: userRolesData } = await supabase
          .from('app_user_roles')
          .select('app_roles(name)')
          .eq('user_id', user.id);

        const roleNames = userRolesData?.map(r => (r.app_roles as any)?.name).filter(Boolean) || [];
        setRoles(roleNames);

        // Fetch user permissions via RPC for efficiency and security
        const { data: permsData } = await supabase
          .rpc('get_user_permissions', { p_user_id: user.id });

        if (permsData) {
          setPermissions(new Set(permsData as PermissionName[]));
        }
      } catch (error) {
        console.error("Error loading permissions:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [user]);

  const hasPermission = (permission: PermissionName) => permissions.has(permission);
  const hasRole = (role: string) => roles.includes(role);

  return {
    permissions,
    roles,
    loading,
    hasPermission,
    hasRole,
    isMaster: roles.includes('master_admin'),
    isAdmin: roles.includes('admin') || roles.includes('master_admin'),
  };
}
