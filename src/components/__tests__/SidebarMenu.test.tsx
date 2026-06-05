import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SidebarMenu } from "../SidebarMenu";
import { BrowserRouter } from "react-router-dom";
import * as useAppPermissionsModule from "@/hooks/useAppPermissions";

// Mock hooks
vi.mock("@/hooks/useUserBadge", () => ({
  useUserBadge: () => ({ name: "Test User", initials: "TU", loaded: true }),
}));

const mockPermissions = vi.spyOn(useAppPermissionsModule, 'useAppPermissions');

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "123", email: "test@example.com" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/contexts/SubmissionContext", () => ({
  useSubmissions: () => ({ savedCount: 0 }),
  SubmissionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock routeExists to always return true for testing visibility
vi.mock("@/routes/config", () => ({
  routeExists: () => true,
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
  it("renders correctly for a regular user", () => {
    renderSidebar();
    expect(screen.getByText("AgendIlha")).toBeDefined();
    expect(screen.getByText("Test User")).toBeDefined();
    expect(screen.getByText("Usuário")).toBeDefined();
    
    // Explorar items
    expect(screen.getByText("Eventos")).toBeDefined();
    expect(screen.getByText("Artistas Locais")).toBeDefined();
    
    // Admin items should NOT be visible
    expect(screen.queryByText("Painel Master")).toBeNull();
    expect(screen.queryByText("Gerenciar Eventos")).toBeNull();
  });

  it("shows the correct role label", () => {
    vi.mocked(require("@/hooks/useAppPermissions").useAppPermissions).mockReturnValue({
      isMaster: true,
      isAdmin: true,
      isPromoter: false,
      loading: false,
    });
    
    renderSidebar();
    expect(screen.getByText("Admin Master")).toBeDefined();
  });
});
