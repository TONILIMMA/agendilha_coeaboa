export const ROUTES = {
  LANDING: "/",
  AGENDA: "/agenda",
  ARTISTAS: "/artistas",
  AUTH: "/auth",
  CONFIGURAR_ARTISTA: "/configurar-artista",
  ENVIAR_EVENTO: "/enviar-evento",
  EVENTOS: "/eventos",
  EXPLORAR: "/explorar",
  ARTISTA_PROFILE: "/artista/:id",
  EVENTO_DETAIL: "/evento/:slug",
  EVENTO_IMPRIMIR: "/evento/:slug/imprimir",
  ESTABELECIMENTO_DETAIL: "/lugar/:id",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_USERS: "/admin/users",
  ADMIN_COLLABORATORS: "/admin/collaborators",
  ADMIN_ESTABELECIMENTOS: "/admin/estabelecimentos",
  ADMIN_REPORTS: "/admin/relatorios",
  ADMIN_ATRATIVOS: "/admin/atrativos",
  MASTER_DASHBOARD: "/master/dashboard",
  MASTER_USUARIOS: "/master/usuarios",
  MASTER_LOGS: "/master/logs",
  ADMIN_NEWSLETTER: "/admin/newsletter",
  ADMIN_ARTISTS: "/admin/artists",
  ADMIN_MEDIA: "/admin/media",
  ADMIN_AUDIT: "/admin/audit",
  ADMIN_AGENDA_INFORMA: "/admin/agenda-informa",
  RANKING: "/ranking",
  FORGOT_PASSWORD: "/forgot-password",
  TROCAR_SENHA: "/trocar-senha",
  CONFIGURACOES: "/configuracoes",
  PERFIL: "/perfil",
  CADASTRO: "/cadastro",
  CADASTRO_PUBLICO: "/cadastro/publico",
  CADASTRO_DIVULGADOR: "/cadastro/divulgador",
  CADASTRO_ARTISTA: "/cadastro/artista",
  CADASTRO_BANDA: "/cadastro/banda",
  CADASTRO_SUCESSO: "/cadastro/sucesso",
  CADASTRO_ATRATIVO: "/cadastro/atrativo",
  CADASTRO_ESTABELECIMENTO: "/cadastro/estabelecimento",
  CARROSSEL: "/carrossel",
  EVENTO_ENVIADO: "/evento-enviado/:id",
  MEUS_EVENTOS: "/meus-eventos",
  ADMIN_WHATSAPP_TEMPLATES: "/admin/whatsapp-templates",
  ADMIN_DESTAQUES: "/admin/destaques",
  CADASTRO_PROMOTOR: "/cadastro-promotor",
  PROMOTOR_HOME: "/promotor",
  PROMOTOR_ESTABELECIMENTOS: "/promotor/estabelecimentos",
  PROMOTOR_ATRATIVOS: "/promotor/atrativos",
  PROMOTOR_PERFIL: "/promotor/perfil",
  TERMOS: "/termos",
  PRIVACIDADE: "/privacidade",
  IMPULSIONAMENTO: "/impulsionamento-em-breve",
  DIVULGADOR_STATUS: "/divulgador/status",
};

export const VALID_ROUTES = Object.values(ROUTES);

/**
 * Checks if a path (or base path) exists in our registered routes.
 * Supports exact matches and parameter placeholders.
 */
export const routeExists = (path: string): boolean => {
  const cleanPath = path.split('?')[0]; // Remove query params
  
  return VALID_ROUTES.some(route => {
    // Exact match
    if (route === cleanPath) return true;
    
    // Handle parameter routes (e.g., /artista/:id)
    if (route.includes(':')) {
      const routeParts = route.split('/');
      const pathParts = cleanPath.split('/');
      
      if (routeParts.length !== pathParts.length) return false;
      
      return routeParts.every((part, i) => {
        return part.startsWith(':') || part === pathParts[i];
      });
    }
    
    return false;
  });
};
