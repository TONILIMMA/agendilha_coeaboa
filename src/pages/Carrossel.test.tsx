import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Carrossel from './Carrossel';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          neq: () => ({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: '1', event_title: 'Rolê Destaque 1', is_highlight: true },
                { id: '2', event_title: 'Rolê Destaque 2', is_highlight: true }
              ],
              error: null
            })
          })
        })
      })
    })
  }
}));

describe('Carrossel', () => {
  it('deve renderizar e carregar os eventos destacados corretamente', async () => {
    render(<BrowserRouter><Carrossel /></BrowserRouter>);
    await waitFor(() => {
      expect(document.body.textContent).toContain('Rolê Destaque 1');
    });
  });
});
