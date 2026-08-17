import { QueryCache, QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubmissionProvider } from "@/contexts/SubmissionContext";
import Header from "@/components/Header";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { useAppPermissions, PermissionName } from "@/hooks/usePermissions";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { ROUTES } from "@/routes/config";
import { PromotorRoute } from "@/components/auth/PromotorRoute";

// Critical (above-the-fold) — keep eager
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes (code-split)
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const AgendaCultural = lazy(() => import("./pages/AgendaCultural"));
const Eventos = lazy(() => import("./pages/Eventos"));
const Explorar = lazy(() => import("./pages/Explorar"));
const AdminCollaborators = lazy(() => import("./pages/AdminCollaborators"));
const AdminMaster = lazy(() => import("./pages/AdminMaster"));
const Ranking = lazy(() => import("./pages/Ranking"));
const SubmitEvent = lazy(() => import("./pages/SubmitEvent"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const ArtistSetup = lazy(() => import("./pages/ArtistSetup"));
const AdminArtists = lazy(() => import("./pages/AdminArtists"));
const ArtistFeed = lazy(() => import("./pages/ArtistFeed"));
const AdminMedia = lazy(() => import("./pages/AdminMedia"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AdminAgendaInforma = lazy(() => import("./pages/AdminAgendaInforma"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const PrintEvent = lazy(() => import("./pages/PrintEvent"));
const EstabelecimentoDetail = lazy(() => import("./pages/EstabelecimentoDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const MustChangePassword = lazy(() => import("./pages/MustChangePassword"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const CadastroEscolha = lazy(() => import("./pages/cadastro/CadastroEscolha"));
const CadastroPublico = lazy(() => import("./pages/cadastro/CadastroPublico"));
const CadastroArtista = lazy(() => import("./pages/cadastro/CadastroArtista"));
const CadastroBanda = lazy(() => import("./pages/cadastro/CadastroBanda"));
const CadastroSucesso = lazy(() => import("./pages/cadastro/CadastroSucesso"));
const Carrossel = lazy(() => import("./pages/Carrossel"));
const EventoEnviado = lazy(() => import("./pages/EventoEnviado"));
const MeusEventos = lazy(() => import("./pages/MeusEventos"));
const AdminWhatsAppTemplates = lazy(() => import("./pages/AdminWhatsAppTemplates"));
const AdminEstabelecimentos = lazy(() => import("./pages/AdminEstabelecimentos"));
const AdminAtrativos = lazy(() => import("./pages/AdminAtrativos"));
const CadastroPromotor = lazy(() => import("./pages/cadastro/CadastroPromotor"));
const PromotorEstabelecimentos = lazy(() => import("./pages/promotor/PromotorEstabelecimentos"));
const PromotorAtrativos = lazy(() => import("./pages/promotor/PromotorAtrativos"));
const PromotorPerfil = lazy(() => import("./pages/PromotorPerfil"));
const TermosPage = lazy(() => import("./pages/PlaceholderInfo").then(m => ({ default: m.TermosPage })));
const PrivacidadePage = lazy(() => import("./pages/PlaceholderInfo").then(m => ({ default: m.PrivacidadePage })));
const ImpulsionamentoPage = lazy(() => import("./pages/PlaceholderInfo").then(m => ({ default: m.ImpulsionamentoPage })));
const StatusDivulgador = lazy(() => import("./pages/divulgador/StatusDivulgador"));

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Só avisa via toast se a query já tinha dado certo antes (evita duplicar
      // com o InlineError/estado vazio no primeiro load).
      if (query.state.data !== undefined) {
        handleError(error, {
          fallback: "Não deu pra atualizar os dados. Tenta de novo.",
          context: `query:${String(query.queryKey?.[0] ?? "unknown")}`,
        });
      } else {
        logger.error(`[query:${String(query.queryKey?.[0] ?? "unknown")}] load failed`, error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      // Se a mutation tem onError próprio, não duplica a mensagem.
      if (mutation.options.onError) return;
      handleError(error, { fallback: "Não deu pra completar a ação. Tenta de novo." });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: unknown) => {
        const e = error as { status?: number; code?: string } | null;
        if (e?.status === 404 || e?.status === 403 || e?.code === 'PGRST116') return false;
        return failureCount < 2;
      },
    },
  },
});

// Global unhandled promise rejection handler
window.onunhandledrejection = (event) => {
  logger.error("Unhandled promise rejection:", event.reason);
};

// Global error handler for non-React errors
window.onerror = (message, source, lineno, colno, error) => {
  logger.error("Global error:", { message, source, lineno, colno, error });
};


const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function ProtectedRoute({ 
  children, 
  requiredPermission,
  masterOnly
}: { 
  children: React.ReactNode; 
  requiredPermission?: PermissionName;
  masterOnly?: boolean;
}) {
  const { user, loading: authLoading, mustChangePassword } = useAuth();
  const { hasPermission, isMaster, loading: permsLoading } = useAppPermissions();
  const location = useLocation();
  
  if (authLoading || permsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (mustChangePassword && location.pathname !== ROUTES.TROCAR_SENHA) {
    return <Navigate to={ROUTES.TROCAR_SENHA} replace />;
  }

  if (masterOnly && !isMaster) {
    return <Navigate to={ROUTES.AGENDA} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={ROUTES.AGENDA} replace />;
  }

  return <>{children}</>;
}

export const AppRoutes = () => (
  <SubmissionProvider>
    <SectionErrorBoundary context="AppRoutes">
      <Suspense fallback={<PageFallback />}>
        <Routes>
        {/* Públicas */}
        <Route path={ROUTES.LANDING} element={<Landing />} />
        <Route path={ROUTES.EXPLORAR} element={<Explorar />} />
        <Route path={ROUTES.EVENTO_IMPRIMIR} element={<PrintEvent />} />

        {/* Cadastro por perfil (sem AppShell, fullscreen mobile-first) */}
        <Route path={ROUTES.CADASTRO} element={<CadastroEscolha />} />
        <Route path={ROUTES.CADASTRO_PUBLICO} element={<CadastroPublico />} />
        <Route path={ROUTES.CADASTRO_DIVULGADOR} element={<CadastroPromotor />} />
        <Route path={ROUTES.CADASTRO_ARTISTA} element={<CadastroArtista />} />
        <Route path={ROUTES.CADASTRO_BANDA} element={<ProtectedRoute><CadastroBanda /></ProtectedRoute>} />
        <Route path={ROUTES.CADASTRO_SUCESSO} element={<CadastroSucesso />} />
        <Route path={ROUTES.CADASTRO_PROMOTOR} element={<CadastroPromotor />} />
        
        {/* App Wrapper for standard pages */}
        <Route element={<AppShell maxWidth="md"><Outlet /></AppShell>}>
          <Route path={ROUTES.AGENDA} element={<AgendaCultural />} />
          <Route path={ROUTES.ARTISTAS} element={<ArtistFeed />} />
          <Route path={ROUTES.AUTH} element={<Auth />} />
          <Route path={ROUTES.CONFIGURAR_ARTISTA} element={<ProtectedRoute><ArtistSetup /></ProtectedRoute>} />
          <Route path={ROUTES.ENVIAR_EVENTO} element={<PromotorRoute><SubmitEvent /></PromotorRoute>} />
          <Route path={ROUTES.EVENTOS} element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
          <Route path={ROUTES.MEUS_EVENTOS} element={<ProtectedRoute><MeusEventos /></ProtectedRoute>} />
          <Route path={ROUTES.EVENTO_ENVIADO} element={<ProtectedRoute><EventoEnviado /></ProtectedRoute>} />
        </Route>

        {/* Full width detail pages */}
        <Route element={<AppShell maxWidth="lg"><Outlet /></AppShell>}>
          <Route path={ROUTES.ARTISTA_PROFILE} element={<ArtistProfile />} />
          <Route path={ROUTES.EVENTO_DETAIL} element={<EventDetail />} />
          <Route path={ROUTES.ESTABELECIMENTO_DETAIL} element={<EstabelecimentoDetail />} />
        </Route>

        {/* Admin Pages - Full sidebar integration */}
        <Route element={<ProtectedRoute requiredPermission="events.read"><AppShell showSidebar={true} maxWidth="xl"><Outlet /></AppShell></ProtectedRoute>}>
          <Route path={ROUTES.ADMIN_EVENTS} element={<AdminEvents />} />
          <Route path={ROUTES.ADMIN_USERS} element={<AdminUsers />} />
          <Route path={ROUTES.ADMIN_COLLABORATORS} element={<AdminCollaborators />} />
          <Route path={ROUTES.ADMIN_NEWSLETTER} element={<AdminNewsletter />} />
          <Route path={ROUTES.ADMIN_ARTISTS} element={<AdminArtists />} />
          <Route path={ROUTES.ADMIN_MEDIA} element={<AdminMedia />} />
          <Route path={ROUTES.ADMIN_AGENDA_INFORMA} element={<AdminAgendaInforma />} />
          <Route path={ROUTES.ADMIN_WHATSAPP_TEMPLATES} element={<AdminWhatsAppTemplates />} />
          <Route path={ROUTES.ADMIN_ESTABELECIMENTOS} element={<AdminEstabelecimentos />} />
          <Route path={ROUTES.ADMIN_ATRATIVOS} element={<AdminAtrativos />} />
        </Route>

        {/* Promotor area — guarded by user_type=divulgador (admins/masters incluídos) */}
        <Route element={<PromotorRoute><AppShell maxWidth="lg"><Outlet /></AppShell></PromotorRoute>}>
          <Route path={ROUTES.PROMOTOR_HOME} element={<Navigate to={ROUTES.PROMOTOR_ESTABELECIMENTOS} replace />} />
          <Route path={ROUTES.PROMOTOR_ESTABELECIMENTOS} element={<PromotorEstabelecimentos />} />
          <Route path={ROUTES.PROMOTOR_ATRATIVOS} element={<PromotorAtrativos />} />
          <Route path={ROUTES.PROMOTOR_PERFIL} element={<PromotorPerfil />} />
        </Route>

        {/* Master Pages - isolated from regular admin permissions */}
        <Route element={<ProtectedRoute masterOnly><AppShell showSidebar={true} maxWidth="xl"><Outlet /></AppShell></ProtectedRoute>}>
          <Route path={ROUTES.MASTER_DASHBOARD} element={<AdminMaster />} />
          <Route path={ROUTES.MASTER_USUARIOS} element={<AdminUsers />} />
          <Route path={ROUTES.MASTER_LOGS} element={<AdminAuditLogs />} />
          <Route path={ROUTES.ADMIN_AUDIT} element={<AdminAuditLogs />} />
          <Route path={ROUTES.RANKING} element={<Ranking />} />
        </Route>

        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.TROCAR_SENHA} element={<ProtectedRoute><MustChangePassword /></ProtectedRoute>} />
        <Route element={<AppShell maxWidth="md"><Outlet /></AppShell>}>
          <Route path={ROUTES.CONFIGURACOES} element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path={ROUTES.PERFIL} element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
          <Route path={ROUTES.TERMOS} element={<TermosPage />} />
          <Route path={ROUTES.PRIVACIDADE} element={<PrivacidadePage />} />
          <Route path={ROUTES.IMPULSIONAMENTO} element={<ImpulsionamentoPage />} />
        </Route>
        <Route path="/coeaboa" element={<Navigate to={ROUTES.AGENDA} replace />} />
        <Route path="/lp" element={<Navigate to={ROUTES.LANDING} replace />} />
        {/* Defensive: bare /master and /admin should land on a real page */}
        <Route path="/master" element={<Navigate to={ROUTES.MASTER_DASHBOARD} replace />} />
        <Route path="/admin/master" element={<Navigate to={ROUTES.MASTER_DASHBOARD} replace />} />
        <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_EVENTS} replace />} />
        <Route path="/carrossel" element={<Carrossel />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </SectionErrorBoundary>

  </SubmissionProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </AppErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>

);

export default App;
