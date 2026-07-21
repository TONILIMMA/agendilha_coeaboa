import { describe, it, expect } from "vitest";
import { computePermissions } from "./useAppPermissions";

describe("computePermissions", () => {
  it("dá todas as permissões de admin quando role = admin", () => {
    const { roles, permissions } = computePermissions({
      roleNames: ["admin"],
      collaborator: null,
      profileRole: null,
    });
    expect(roles).toContain("admin");
    expect(permissions.has("events.approve")).toBe(true);
    expect(permissions.has("events.delete")).toBe(true);
    expect(permissions.has("audit_logs.read")).toBe(true);
  });

  it("master herda tudo de admin", () => {
    const { permissions } = computePermissions({
      roleNames: ["master"],
      collaborator: null,
      profileRole: null,
    });
    expect(permissions.has("roles.manage")).toBe(true);
  });

  it("colaborador ativo só ganha o que foi marcado", () => {
    const { roles, permissions } = computePermissions({
      roleNames: [],
      collaborator: {
        can_submit: true,
        can_approve: false,
        can_edit: true,
        can_delete: false,
        is_active: true,
      },
      profileRole: null,
    });
    expect(roles).toContain("collaborator");
    expect(permissions.has("events.create")).toBe(true);
    expect(permissions.has("events.update")).toBe(true);
    expect(permissions.has("events.approve")).toBe(false);
    expect(permissions.has("events.delete")).toBe(false);
    expect(permissions.has("events.read")).toBe(true);
  });

  it("colaborador inativo não recebe nada", () => {
    const { roles, permissions } = computePermissions({
      roleNames: [],
      collaborator: {
        can_submit: true,
        can_approve: true,
        can_edit: true,
        can_delete: true,
        is_active: false,
      },
      profileRole: null,
    });
    expect(roles).not.toContain("collaborator");
    expect(permissions.size).toBe(0);
  });

  it("promoter ganha events.create pelo profile.role", () => {
    const { roles, permissions } = computePermissions({
      roleNames: [],
      collaborator: null,
      profileRole: "promoter",
    });
    expect(roles).toContain("promoter");
    expect(permissions.has("events.create")).toBe(true);
  });

  it("usuário público sem nada não recebe permissões", () => {
    const { permissions } = computePermissions({
      roleNames: [],
      collaborator: null,
      profileRole: "user",
    });
    expect(permissions.size).toBe(0);
  });
});