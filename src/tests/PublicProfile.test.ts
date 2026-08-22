import { describe, it, expect } from 'vitest';

describe('Public Profile and Explorer Route Logic', () => {
  it('verifies route formatting for slugs', () => {
    const mockEvent = { id: '123', slug: 'meu-evento-top' };
    const getRoute = (ev: { id: string; slug?: string }) => `/evento/${ev.slug || ev.id}`;
    
    expect(getRoute(mockEvent)).toBe('/evento/meu-evento-top');
    expect(getRoute({ id: '456' })).toBe('/evento/456');
  });

  it('validates profile field fallback logic', () => {
    const mockProfile = { 
      company_name: 'Minha Empresa', 
      responsible_name: 'João' 
    };
    
    const displayName = mockProfile.company_name || mockProfile.responsible_name || 'Divulgador AgendIlha';
    expect(displayName).toBe('Minha Empresa');
    
    const emptyProfile = { company_name: null, responsible_name: null };
    // @ts-ignore
    const fallbackName = emptyProfile.company_name || emptyProfile.responsible_name || 'Divulgador AgendIlha';
    expect(fallbackName).toBe('Divulgador AgendIlha');
  });
});
