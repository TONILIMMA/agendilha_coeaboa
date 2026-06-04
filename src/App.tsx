import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { AppShell } from "@/components/layout/AppShell";
import { handleError } from "@/lib/error-handler";



// Critical (above-the-fold) — keep eager
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes (code-split)
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminEvents = lazy(() => import("./pages/AdminEvents"));
const CoeABoa = lazy(() => import("./pages/CoeABoa"));
const AgendaCultural = lazy(() => import("./pages/AgendaCultural"));
const Eventos = lazy(() => import("./pages/Eventos"));
const AdminCollaborators = lazy(() => import("./pages/AdminCollaborators"));
const AdminMaster = lazy(() => import("./pages/AdminMaster"));
const Ranking = lazy(() => import("./pages/Ranking"));
const AdminPinGate = lazy(() => import("@/components/AdminPinGate"));
const SubmitEvent = lazy(() => import("./pages/SubmitEvent"));
const AdminNewsletter = lazy(() => import("./pages/AdminNewsletter"));
const ArtistProfile = lazy(() => import("./pages/ArtistProfile"));
const ArtistSetup = lazy(() => import("./pages/ArtistSetup"));
const AdminArtists = lazy(() => import("./pages/AdminArtists"));
const ArtistFeed = lazy(() => import("./pages/ArtistFeed"));
const AdminMedia = lazy(() => import("./pages/AdminMedia"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const MustChangePassword = lazy(() => import("./pages/MustChangePassword"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 404s or 403s
        if (error?.status === 404 || error?.status === 403 || error?.code === 'PGRST116') return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error) => {
        handleError(error, "Erro ao processar solicitação");
      },
    },
  },
});

// Global unhandled promise rejection handler
window.onunhandledrejection = (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Optional: Send to logging service
};

// Global error handler for non-React errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global error:", { message, source, lineno, colno, error });
  // Optional: Send to logging service
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

  if (mustChangePassword && location.pathname !== "/trocar-senha") {
    return <Navigate to="/trocar-senha" replace />;
  }

  if (masterOnly && !isMaster) {
    return <Navigate to="/agenda" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/agenda" replace />;
  }

  return <>{children}</>;
}

export const AppRoutes = () => (
  <SubmissionProvider>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing />} />
        
        {/* App Wrapper for standard pages */}
        <Route element={<AppShell maxWidth="md"><Outlet /></AppShell>}>
          <Route path="/agenda" element={<AgendaCultural />} />
          <Route path="/artistas" element={<ArtistFeed />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/configurar-artista" element={<ProtectedRoute><ArtistSetup /></ProtectedRoute>} />
          <Route path="/enviar-evento" element={<ProtectedRoute><SubmitEvent /></ProtectedRoute>} />
          <Route path="/eventos" element={<ProtectedRoute><Eventos /></ProtectedRoute>} />
        </Route>

        {/* Full width detail pages */}
        <Route element={<AppShell maxWidth="lg"><Outlet /></AppShell>}>
          <Route path="/artista/:id" element={<ArtistProfile />} />
          <Route path="/evento/:slug" element={<EventDetail />} />
        </Route>

        {/* Admin/Master Pages - Full sidebar integration */}
        <Route element={<ProtectedRoute><AppShell showSidebar={true} maxWidth="xl"><Outlet /></AppShell></ProtectedRoute>}>
          <Route path="/admin/events" element={<AdminEvents />} />
          <Route path="/admin/users" element={<AdminPinGate><AdminUsers /></AdminPinGate>} />
          <Route path="/admin/collaborators" element={<AdminCollaborators />} />
          <Route path="/master/dashboard" element={<ProtectedRoute masterOnly><AdminPinGate><AdminMaster /></AdminPinGate></ProtectedRoute>} />
          <Route path="/master/usuarios" element={<ProtectedRoute masterOnly><AdminPinGate><AdminUsers /></AdminPinGate></ProtectedRoute>} />
          <Route path="/master/logs" element={<ProtectedRoute masterOnly><AdminPinGate><AdminAuditLogs /></AdminPinGate></ProtectedRoute>} />
          <Route path="/admin/newsletter" element={<AdminNewsletter />} />
          <Route path="/admin/artists" element={<AdminArtists />} />
          <Route path="/admin/media" element={<AdminMedia />} />
          <Route path="/admin/audit" element={<ProtectedRoute masterOnly><AdminAuditLogs /></ProtectedRoute>} />
          <Route path="/ranking" element={<Ranking />} />
        </Route>

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/trocar-senha" element={<ProtectedRoute><MustChangePassword /></ProtectedRoute>} />
        <Route element={<AppShell maxWidth="md"><Outlet /></AppShell>}>
          <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
        </Route>
        <Route path="/coeaboa" element={<Navigate to="/agenda" replace />} />
        <Route path="/lp" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>

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
