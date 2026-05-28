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
        setLoading(true);
        // Fetch everything in one parallel batch
        const [rolesResponse, permsResponse, profileResponse] = await Promise.all([
          supabase.from('app_user_roles').select('app_roles(name)').eq('user_id', user.id),
          supabase.rpc('get_user_permissions', { p_user_id: user.id }),
          supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle()
        ]);

        let roleNames = rolesResponse.data?.map(r => (r.app_roles as any)?.name).filter(Boolean) || [];
        
        // Legacy system fallback for transition period
        if (roleNames.length === 0) {
          const { data: legacyRoles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
          legacyRoles?.forEach(r => {
            if (r.role === 'master' && !roleNames.includes('master_admin')) roleNames.push('master_admin');
            if (r.role === 'admin' && !roleNames.includes('admin')) roleNames.push('admin');
          });
        }

        // Add 'promoter' or other roles from profiles if applicable
        if (profileResponse.data?.role && !roleNames.includes(profileResponse.data.role)) {
          roleNames.push(profileResponse.data.role);
        }

        setRoles(roleNames);
        if (permsResponse.data) {
          setPermissions(new Set(permsResponse.data as PermissionName[]));
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

  // Derived capability flags (replacing usePermissions legacy logic)
  const isMaster = roles.includes('master_admin') || roles.includes('master');
  const isAdmin = roles.includes('admin') || isMaster;
  const isPromoter = roles.includes('promoter');
  const isCollaborator = roles.includes('collaborator') || isAdmin;

  return {
    permissions,
    roles,
    loading,
    hasPermission,
    hasRole,
    isMaster,
    isAdmin,
    isPromoter,
    isCollaborator,
    // Explicit capability mappings from legacy usePermissions
    canSubmit: isPromoter || isCollaborator || hasPermission('events.create'),
    canApprove: isAdmin || hasPermission('events.approve'),
    canEdit: isAdmin || isPromoter || hasPermission('events.update'),
    canDelete: isAdmin || hasPermission('events.delete'),
    loaded: !loading
  };
}
