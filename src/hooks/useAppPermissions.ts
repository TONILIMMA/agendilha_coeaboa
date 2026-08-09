import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { handleError } from "@/lib/error-handler";

const ADMIN_PERMISSIONS: PermissionName[] = [
  "events.create",
  "events.read",
  "events.update",
  "events.approve",
  "events.cancel",
  "events.delete",
  "users.read",
  "users.update",
  "users.promote",
  "users.demote",
  "admins.invite",
  "admins.remove",
  "roles.manage",
  "audit_logs.read",
];

const collaboratorPermissionMap: Array<[keyof CollaboratorPermissions, PermissionName]> = [
  ["can_submit", "events.create"],
  ["can_approve", "events.approve"],
  ["can_edit", "events.update"],
  ["can_delete", "events.delete"],
  ["can_promote", "events.promote"], // nova permissão de divulgação
];

type CollaboratorPermissions = {
  can_submit: boolean;
  can_approve: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
};

export type PermissionName =
  | "events.create"
  | "events.read"
  | "events.update"
  | "events.approve"
  | "events.cancel"
  | "events.delete"
  | "users.read"
  | "users.update"
  | "users.promote"
  | "users.demote"
  | "admins.invite"
  | "admins.remove"
  | "roles.manage"
  | "audit_logs.read";

const PROMOTER_ALIASES = ["promoter", "promotor", "divulgador"];

/**
 * Pura: dado o resultado das 3 queries (roles, colaborador, profile),
 * devolve o conjunto final de roles e permissões. Extraído para testes.
 */
export function computePermissions(input: {
  roleNames: string[];
  collaborator: CollaboratorPermissions | null;
  profileRole: string | null;
}): { roles: string[]; permissions: Set<PermissionName> } {
  const roleNames = [...input.roleNames];
  const permissions = new Set<PermissionName>();
  const isAdminRole = roleNames.includes("admin") || roleNames.includes("master");

  if (isAdminRole) {
    ADMIN_PERMISSIONS.forEach((p) => permissions.add(p));
  }

  const collaborator = input.collaborator;
  if (collaborator?.is_active) {
    if (!roleNames.includes("collaborator")) roleNames.push("collaborator");
    permissions.add("events.read");
    collaboratorPermissionMap.forEach(([field, permission]) => {
      if (collaborator[field]) permissions.add(permission);
    });
  }

  // Normaliza os apelidos legados ("promotor"/"divulgador") para "promoter",
  // senão quem é Divulgador ficava sem permissão de criar evento.
  const profileRole = (input.profileRole ?? "").toLowerCase();
  const normalizedRole = PROMOTER_ALIASES.includes(profileRole) ? "promoter" : profileRole;
  if (normalizedRole && !roleNames.includes(normalizedRole)) {
    roleNames.push(normalizedRole);
  }
  if (normalizedRole === "promoter") {
    permissions.add("events.create");
  }

  return { roles: roleNames, permissions };
}

export function useAppPermissions() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const { data, isLoading } = useQuery({
    queryKey: ["app-permissions", userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    queryFn: async () => {
      const [rolesResponse, collaboratorResponse, profileResponse] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase
          .from("collaborators")
          .select("can_submit, can_approve, can_edit, can_delete, is_active")
          .eq("user_id", userId!)
          .maybeSingle(),
        supabase.from("profiles").select("role, user_type").eq("user_id", userId!).maybeSingle(),
      ]);

      if (rolesResponse.error) handleError(rolesResponse.error, "Erro ao carregar permissões");

      const roleNames: string[] = rolesResponse.data?.map((r) => r.role).filter(Boolean) || [];
      const profileData = profileResponse.data as { role?: string | null; user_type?: string | null } | null;
      // `role` é a fonte principal; `user_type` cobre perfis antigos sem `role`.
      const profileRole =
        profileData?.role ??
        (PROMOTER_ALIASES.includes((profileData?.user_type ?? "").toLowerCase()) ? "promoter" : null);
      return computePermissions({
        roleNames,
        collaborator: collaboratorResponse.data as CollaboratorPermissions | null,
        profileRole,
      });
    },
  });

  const permissions = data?.permissions ?? new Set<PermissionName>();
  const roles = data?.roles ?? [];
  // Considera "loading" apenas enquanto não temos a primeira resposta.
  // Não bloquear por refetches em background — isso causava "flicker" e
  // intermitências no acesso ao Painel Master.
  const loading = !!userId && isLoading && !data;

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
    canSubmit: isPromoter || isCollaborator || hasPermission("events.create"),
    canApprove: isAdmin || hasPermission("events.approve"),
    canEdit: isAdmin || isPromoter || hasPermission("events.update"),
    canDelete: isAdmin || hasPermission("events.delete"),
    loaded: !loading,
  };
}
