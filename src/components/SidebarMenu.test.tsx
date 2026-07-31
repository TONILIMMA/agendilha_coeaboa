import { render, screen } from '@testing-library/react';
import { SidebarMenu } from '../components/SidebarMenu';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as useUserBadgeHook from '../hooks/useUserBadge';
import * as authContext from '../contexts/AuthContext';
import * as submissionContext from '../contexts/SubmissionContext';

// Mocks
vi.mock('@/hooks/useDivulgadorStatus', () => ({
  useDivulgadorStatus: () => ({ loading: false, isAdmin: false, isDivulgador: false, profile: null, request: null, refresh: vi.fn() }),
}));
vi.mock('../hooks/useUserBadge');
vi.mock('../contexts/AuthContext');
vi.mock('../contexts/SubmissionContext');

describe('SidebarMenu Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock for SubmissionContext
    vi.mocked(submissionContext.useSubmissions).mockReturnValue({
      savedCount: 0,
      submissions: [],
      loading: false,
      fetchSubmissions: vi.fn(),
      deleteSubmission: vi.fn(),
      resubmit: vi.fn(),
      updateStatus: vi.fn(),
    } as any);

    // Default mock for AuthContext
    vi.mocked(authContext.useAuth).mockReturnValue({
      signOut: vi.fn(),
    } as any);
  });

  it('renders correctly for a common user (Público)', () => {
    vi.mocked(useUserBadgeHook.useUserBadge).mockReturnValue({
      name: 'John Doe',
      initials: 'JD',
      status: 'user',
      label: 'Público',
      loaded: true,
    });

    render(
      <MemoryRouter>
        <SidebarMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Público')).toBeInTheDocument();
    expect(screen.getByText('Explorar')).toBeInTheDocument();
    expect(screen.getByText('Artistas Locais')).toBeInTheDocument();
    expect(screen.getByText('Meus Favoritos')).toBeInTheDocument();
    
    // Should NOT show admin or master sections
    expect(screen.queryByText('Administração')).not.toBeInTheDocument();
    expect(screen.queryByText('Master')).not.toBeInTheDocument();
    expect(screen.queryByText('Painel Master')).not.toBeInTheDocument();
  });

  it('renders admin sections for Admin user', () => {
    vi.mocked(useUserBadgeHook.useUserBadge).mockReturnValue({
      name: 'Admin User',
      initials: 'AU',
      status: 'admin',
      label: 'Admin',
      loaded: true,
    });

    render(
      <MemoryRouter>
        <SidebarMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('Administração')).toBeInTheDocument();
    expect(screen.getByText('Gerenciar Eventos')).toBeInTheDocument();
    
    // Common user items excluded for admin/master should NOT be visible
    expect(screen.queryByText('Artistas Locais')).not.toBeInTheDocument();
    expect(screen.queryByText('Meus Favoritos')).not.toBeInTheDocument();
    
    // Master section should NOT be visible
    expect(screen.queryByText('Master')).not.toBeInTheDocument();
    expect(screen.queryByText('Painel Master')).not.toBeInTheDocument();
  });

  it('renders all administrative sections for Master user', () => {
    vi.mocked(useUserBadgeHook.useUserBadge).mockReturnValue({
      name: 'Master Admin',
      initials: 'MA',
      status: 'master',
      label: 'Admin Master',
      loaded: true,
    });

    render(
      <MemoryRouter>
        <SidebarMenu />
      </MemoryRouter>
    );

    expect(screen.getByText('Administração')).toBeInTheDocument();
    expect(screen.getByText('Master')).toBeInTheDocument();
    expect(screen.getByText('Painel Master')).toBeInTheDocument();
    expect(screen.getByText('Logs de Auditoria')).toBeInTheDocument();
    
    // User items excluded
    expect(screen.queryByText('Artistas Locais')).not.toBeInTheDocument();
  });
});