import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AdminDestaques from './AdminDestaques';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin123' } })
}));

vi.mock('@/hooks/useAppPermissions', () => ({
  useAppPermissions: () => ({ isAdmin: true, loading: false })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      const plans = [
        { id: '1', name: 'Plano Master', price_cents: 5000, duration_days: 14, is_active: true, display_order: 1 }
      ];
      const empty = { data: [], error: null };
      const withData = (data: unknown[]) => ({ data, error: null });
      return {
        select: () => ({
          order: vi.fn().mockResolvedValue(withData(table === 'highlight_packages' ? plans : [])),
          eq: () => ({
            not: () => ({
              order: vi.fn().mockResolvedValue(empty)
            })
          })
        })
      };
    }
  }
}));

vi.mock('@/components/destaque/HighlightedEventsPanel', () => ({
  HighlightedEventsPanel: () => <div data-testid="mocked-panel">Rolês listados mock</div>
}));

describe('AdminDestaques', () => {
  it('deve renderizar a estrutura com as tabulações e planos mockados', async () => {
    render(<BrowserRouter><AdminDestaques /></BrowserRouter>);
    expect(await screen.findByText('Destaques')).toBeInTheDocument();
    expect(await screen.findByText(/Plano Master/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Rolês em destaque/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mocked-panel')).toBeInTheDocument();
    });
  });
});
