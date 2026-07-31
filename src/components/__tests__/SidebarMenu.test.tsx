import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SidebarMenu } from "../SidebarMenu";
import { BrowserRouter } from "react-router-dom";
import * as useAppPermissionsModule from "@/hooks/useAppPermissions";
import * as routeConfig from "@/routes/config";

// Mock hooks
vi.mock('@/hooks/useDivulgadorStatus', () => ({
  useDivulgadorStatus: () => ({ loading: false, isAdmin: false, isDivulgador: false, profile: null, request: null, refresh: vi.fn() }),
}));
vi.mock("@/hooks/useUserBadge", () => ({
  useUserBadge: () => ({ name: "Test User", initials: "TU", loaded: true }),
}));

vi.mock("@/hooks/useAppPermissions", () => ({
  useAppPermissions: vi.fn()
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "123", email: "test@example.com" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/contexts/SubmissionContext", () => ({
  useSubmissions: () => ({ savedCount: 0 }),
}));

// Mock routeExists 
vi.mock("@/routes/config", () => ({
  routeExists: vi.fn(),
  ROUTES: {
    LANDING: "/",
    AGENDA: "/agenda",
    ARTISTAS: "/artistas",
    AUTH: "/auth",
    PERFIL: "/perfil",
    ADMIN_EVENTS: "/admin/events",
    MASTER_DASHBOARD: "/master/dashboard",
  }
}));

const renderSidebar = () => {
  return render(
    <BrowserRouter>
      <SidebarMenu />
    </BrowserRouter>
  );
};

describe("SidebarMenu", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders correctly for a regular user", () => {
    vi.mocked(routeConfig.routeExists).mockReturnValue(true);
    vi.mocked(useAppPermissionsModule.useAppPermissions).mockReturnValue({
      isMaster: false,
      isAdmin: false,
      isPromoter: false,
      loading: false,
      permissions: new Set(),
      roles: [],
      hasPermission: () => false,
      hasRole: () => false,
      isCollaborator: false,
      canSubmit: false,
      canApprove: false,
      canEdit: false,
      canDelete: false,
      loaded: true
    } as any);

    renderSidebar();
    expect(screen.getByText("AgendIlha")).toBeDefined();
    expect(screen.getByText("Test User")).toBeDefined();
    expect(screen.getByText("Usuário")).toBeDefined();
    
    // Explorar items
    expect(screen.getByText("Eventos")).toBeDefined();
    expect(screen.getByText("Artistas Locais")).toBeDefined();
    
    // Admin items should NOT be visible
    expect(screen.queryByText("Painel Master")).toBeNull();
  });

  it("shows the correct role label for master", () => {
    vi.mocked(routeConfig.routeExists).mockReturnValue(true);
    vi.mocked(useAppPermissionsModule.useAppPermissions).mockReturnValue({
      isMaster: true,
      isAdmin: true,
      isPromoter: false,
      loading: false,
      permissions: new Set(),
      roles: ['master'],
      hasPermission: () => true,
      hasRole: (r) => r === 'master',
      isCollaborator: true,
      canSubmit: true,
      canApprove: true,
      canEdit: true,
      canDelete: true,
      loaded: true
    } as any);
    
    renderSidebar();
    expect(screen.getByText("Admin Master")).toBeDefined();
  });

  it("hides items whose routes do not exist", () => {
    vi.mocked(routeConfig.routeExists).mockReturnValue(false);

    vi.mocked(useAppPermissionsModule.useAppPermissions).mockReturnValue({
      isMaster: true,
      isAdmin: true,
      isPromoter: true,
      loading: false,
      permissions: new Set(),
      roles: ['master'],
      hasPermission: () => true,
      hasRole: () => true,
      isCollaborator: true,
      canSubmit: true,
      canApprove: true,
      canEdit: true,
      canDelete: true,
      loaded: true
    } as any);

    renderSidebar();
    
    // Since all routes return false for routeExists, no items should be shown
    expect(screen.queryByText("Eventos")).toBeNull();
    expect(screen.queryByText("Painel Master")).toBeNull();
  });
});
