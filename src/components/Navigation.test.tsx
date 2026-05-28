import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as authContext from '@/contexts/AuthContext';
import * as useAppPermissionsHook from '@/hooks/useAppPermissions';
import * as useUserBadgeHook from '@/hooks/useUserBadge';
import { AppRoutes } from '@/App';

// Mocks
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/useAppPermissions');
vi.mock('@/hooks/useUserBadge');

// Mock lazy components to speed up tests and avoid loading issues
vi.mock('@/pages/AdminEvents', () => ({ default: () => <div data-testid="admin-events">Admin Events</div> }));
vi.mock('@/pages/AdminMaster', () => ({ default: () => <div data-testid="admin-master">Admin Master Dashboard</div> }));
vi.mock('@/pages/Landing', () => ({ default: () => <div data-testid="landing">Landing Page</div> }));
vi.mock('@/pages/AgendaCultural', () => ({ default: () => <div data-testid="agenda">Agenda Page</div> }));
vi.mock('@/pages/Auth', () => ({ default: () => <div data-testid="auth">Auth Page</div> }));

describe('Admin/Master Route Protection Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AppRoutes />
      </MemoryRouter>

    );

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toBeInTheDocument();
    });
  });

  it('redirects regular user to agenda when accessing /admin/events', async () => {
    setupMocks({ id: '1', email: 'user@test.com' }, ['user'], false, false);

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AppRoutes />
      </MemoryRouter>

    );

    await waitFor(() => {
      expect(screen.getByTestId('agenda')).toBeInTheDocument();
    });
  });

  it('renders AdminLayout and AdminEvents for admin user with permissions', async () => {
    setupMocks({ id: '1', email: 'admin@test.com' }, ['admin'], true, false, ['events.read']);

    render(
      <MemoryRouter initialEntries={['/admin/events']}>
        <AppRoutes />
      </MemoryRouter>

    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-events')).toBeInTheDocument();
    });
    // Sidebar should be present (implied by AdminLayout rendering)
    expect(screen.getByText('Administração')).toBeInTheDocument();
  });

  it('blocks admin user from /admin/master', async () => {
    setupMocks({ id: '1', email: 'admin@test.com' }, ['admin'], true, false, ['events.read']);

    render(
      <MemoryRouter initialEntries={['/admin/master']}>
        <AppRoutes />
      </MemoryRouter>

    );

    await waitFor(() => {
      expect(screen.getByTestId('agenda')).toBeInTheDocument();
    });
  });

  it('allows master_admin to access /admin/master', async () => {
    setupMocks({ id: '1', email: 'master@test.com' }, ['master_admin'], true, true, ['roles.manage']);

    render(
      <MemoryRouter initialEntries={['/admin/master']}>
        <AppRoutes />
      </MemoryRouter>

    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-master')).toBeInTheDocument();
    });
    expect(screen.getByText('Master')).toBeInTheDocument();
  });
});
