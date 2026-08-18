import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as authContext from '@/contexts/AuthContext';
import * as useAppPermissionsHook from '@/hooks/useAppPermissions';
import * as useUserBadgeHook from '@/hooks/useUserBadge';
import { AppRoutes } from '@/App';

// Mocks
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useAppPermissions');
vi.mock('@/hooks/useUserBadge');
vi.mock('@/data/useDivulgadorStatus', () => ({
  useDivulgadorStatus: () => ({ loading: false, isAdmin: false, isDivulgador: false, profile: null, request: null, refresh: vi.fn() }),
}));

// Mock lazy components to speed up tests and avoid loading issues
vi.mock('@/pages/AdminEvents', () => ({ default: () => <div data-testid="admin-events">Admin Events</div> }));
vi.mock('@/pages/AdminMaster', () => ({ default: () => <div data-testid="admin-master">Admin Master Dashboard</div> }));
vi.mock('@/pages/Landing', () => ({ default: () => <div data-testid="landing">Landing Page</div> }));
vi.mock('@/pages/AgendaCultural', () => ({ default: () => <div data-testid="agenda">Agenda Page</div> }));
vi.mock('@/pages/Auth', () => ({ default: () => <div data-testid="auth">Auth Page</div> }));
vi.mock('@/components/AdminPinGate', () => ({ default: ({ children }: any) => <div data-testid="pin-gate">{children}</div> }));


describe('Admin/Master Route Protection Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AppRoutes não traz o QueryClientProvider (ele vive no App), então
  // os testes precisam fornecer um client próprio.
  const renderAt = (path: string) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  const setupMocks = (user: any, roles: string[], isAdmin: boolean, isMaster: boolean, permissions: string[] = []) => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user,
      loading: false,
      signOut: vi.fn(),
      session: user ? { access_token: 'fake-token' } : null,
    } as any);

    vi.mocked(useAppPermissionsHook.useAppPermissions).mockReturnValue({
      permissions: new Set(permissions),
      roles,
      loading: false,
      hasPermission: (p: any) => permissions.includes(p),
      hasRole: (r: any) => roles.includes(r),
      isMaster,
      isAdmin,
    } as any);

    vi.mocked(useUserBadgeHook.useUserBadge).mockReturnValue({
      name: user?.email || 'Guest',
      initials: 'G',
      status: isMaster ? 'master' : (isAdmin ? 'admin' : 'user'),
      label: isMaster ? 'Admin Master' : (isAdmin ? 'Admin' : 'Público'),
      loaded: true,
    } as any);
  };

  it('redirects unauthorized guest to auth page when accessing /admin/events', async () => {
    setupMocks(null, [], false, false);

    renderAt('/admin/events');

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toBeInTheDocument();
    });
  });

  it('redirects regular user to agenda when accessing /admin/events', async () => {
    setupMocks({ id: '1', email: 'user@test.com' }, ['user'], false, false);

    renderAt('/admin/events');

    await waitFor(() => {
      expect(screen.getByTestId('agenda')).toBeInTheDocument();
    });
  });

  it('renders AdminLayout and AdminEvents for admin user with permissions', async () => {
    setupMocks({ id: '1', email: 'admin@test.com' }, ['admin'], true, false, ['events.read']);

    renderAt('/admin/events');

    await waitFor(() => {
      expect(screen.getByTestId('admin-events')).toBeInTheDocument();
    });
    // Sidebar should be present (implied by AdminLayout rendering).
    // A seção admin hoje se chama "Operação" no sidebarConfig.
    expect(screen.getByText('Operação')).toBeInTheDocument();
  });

  it('blocks admin user from /admin/master', async () => {
    setupMocks({ id: '1', email: 'admin@test.com' }, ['admin'], true, false, ['events.read']);

    renderAt('/admin/master');

    await waitFor(() => {
      expect(screen.getByTestId('agenda')).toBeInTheDocument();
    });
  });

  it('allows master_admin to access /admin/master', async () => {
    setupMocks({ id: '1', email: 'master@test.com' }, ['master_admin'], true, true, ['roles.manage']);

    renderAt('/admin/master');

    await waitFor(() => {
      expect(screen.getByTestId('admin-master')).toBeInTheDocument();
    });
    expect(screen.getByText('Painel Master')).toBeInTheDocument();
  });
});
