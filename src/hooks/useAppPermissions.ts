import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { handleError } from "@/lib/error-handler";

const ADMIN_PERMISSIONS: PermissionName[] = [
  'events.create',
  'events.read',
  'events.update',
  'events.approve',
  'events.cancel',
  'events.delete',
  'users.read',
  'users.update',
  'users.promote',
  'users.demote',
  'admins.invite',
  'admins.remove',
  'roles.manage',
  'audit_logs.read',
];

const collaboratorPermissionMap: Array<[keyof CollaboratorPermissions, PermissionName]> = [
  ['can_submit', 'events.create'],
  ['can_approve', 'events.approve'],
  ['can_edit', 'events.update'],
  ['can_delete', 'events.delete'],
];

type CollaboratorPermissions = {
  can_submit: boolean;
  can_approve: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
};

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
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["app-permissions", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const [rolesResponse, collaboratorResponse, profileResponse] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase
          .from("collaborators")
          .select("can_submit, can_approve, can_edit, can_delete, is_active")
          .eq("user_id", userId!)
          .maybeSingle(),
        supabase.from("profiles").select("role").eq("user_id", userId!).maybeSingle(),
      ]);

      if (rolesResponse.error) handleError(rolesResponse.error, "Erro ao carregar permissões");

      const roleNames: string[] = rolesResponse.data?.map((r) => r.role).filter(Boolean) || [];
      const nextPermissions = new Set<PermissionName>();
      const isAdminRole = roleNames.includes("admin") || roleNames.includes("master");

      if (isAdminRole) {
        ADMIN_PERMISSIONS.forEach((permission) => nextPermissions.add(permission));
      }

      const collaborator = collaboratorResponse.data as CollaboratorPermissions | null;
      if (collaborator?.is_active) {
        if (!roleNames.includes("collaborator")) roleNames.push("collaborator");
        nextPermissions.add("events.read");
        collaboratorPermissionMap.forEach(([field, permission]) => {
          if (collaborator[field]) nextPermissions.add(permission);
        });
      }

      if (profileResponse.data?.role && !roleNames.includes(profileResponse.data.role)) {
        roleNames.push(profileResponse.data.role);
      }
      if (profileResponse.data?.role === "promoter") {
        nextPermissions.add("events.create");
      }

      return { roles: roleNames, permissions: nextPermissions };
    },
  });

  const permissions = data?.permissions ?? new Set<PermissionName>();
  const roles = data?.roles ?? [];
  const loading = !!userId && isLoading;

  const hasPermission = (permission: PermissionName) => permissions.has(permission);
  const hasRole = (role: string) => roles.includes(role);

  const isMaster = roles.includes("master");
  const isAdmin = roles.includes("admin") || isMaster;
  const isPromoter = roles.includes("promoter");
  const isCollaborator = roles.includes("collaborator") || isAdmin;

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
