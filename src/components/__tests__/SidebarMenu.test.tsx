import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SidebarMenu } from "../SidebarMenu";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubmissionProvider } from "@/contexts/SubmissionContext";

// Mock hooks
vi.mock("@/hooks/useUserBadge", () => ({
  useUserBadge: () => ({ name: "Test User", initials: "TU", loaded: true }),
}));

vi.mock("@/hooks/useAppPermissions", () => ({
  useAppPermissions: () => ({
    isMaster: false,
    isAdmin: false,
    isPromoter: false,
    loading: false,
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "123", email: "test@example.com" },
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
