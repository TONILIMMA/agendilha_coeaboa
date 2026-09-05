import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DestaqueModal } from './DestaqueModal';
import React from 'react';

vi.mock('@/data/useHighlightPackages', () => ({
  useHighlightPackages: () => ({
    data: [
      { id: 'p1', name: 'Plano Ouro 7 dias', price_cents: 3000, duration_days: 7 }
    ],
    isLoading: false
  }),
  formatPriceBRL: (v: number) => `R$ ${v / 100},00`,
  formatDuration: (d: number) => `${d} dias`
}));

vi.mock('@/data/useAppSettings', () => ({
  useAppSettings: () => ({
    data: {
      destaque_evento_titulo: 'Destacar minha festa',
      destaque_cta: 'Enviar mensagem'
    }
  }),
  settingOr: (d: any, k: string) => d?.[k],
  SETTING_KEYS: {
    destaqueEventoTitulo: 'destaque_evento_titulo',
    destaqueCta: 'destaque_cta'
  }
}));

describe('DestaqueModal', () => {
  it('deve exibir os planos ativos e o texto customizado perfeitamente', () => {
    render(<DestaqueModal open={true} onOpenChange={() => {}} />);
    expect(screen.getByText('Destacar minha festa')).toBeInTheDocument();
    expect(screen.getByText('Plano Ouro 7 dias')).toBeInTheDocument();
    expect(screen.getByText('Enviar mensagem')).toBeInTheDocument();
  });
});
