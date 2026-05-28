import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubmissionProvider } from "@/contexts/SubmissionContext";
import Header from "@/components/Header";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { useAppPermissions, PermissionName } from "@/hooks/useAppPermissions";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";


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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function ProtectedRoute({ 
  children, 
  requiredPermission,
  masterOnly
}: { 
  children: React.ReactNode; 
  requiredPermission?: PermissionName;
  masterOnly?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
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

  if (masterOnly && !isMaster) {
    return <Navigate to="/agenda" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/agenda" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => (
  <SubmissionProvider>
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/agenda" element={<><Header /><AgendaCultural /></>} />
        <Route path="/artistas" element={<><Header /><ArtistFeed /></>} />
        <Route path="/auth" element={<><Header /><Auth /></>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/artista/:id" element={<ArtistProfile />} />

        {/* Envio de Evento / Artista */}
        <Route path="/configurar-artista" element={<ProtectedRoute><ArtistSetup /></ProtectedRoute>} />
        <Route path="/enviar-evento" element={<ProtectedRoute><SubmitEvent /></ProtectedRoute>} />

        {/* Administrativas */}
        <Route path="/admin/events" element={
          <ProtectedRoute requiredPermission="events.read"><Header /><AdminEvents /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute requiredPermission="users.read"><AdminPinGate><Header /><AdminUsers /></AdminPinGate></ProtectedRoute>
        } />
        <Route path="/admin/collaborators" element={
          <ProtectedRoute requiredPermission="users.read"><Header /><AdminCollaborators /></ProtectedRoute>
        } />
        <Route path="/admin/master" element={
          <ProtectedRoute masterOnly={true} requiredPermission="roles.manage"><AdminPinGate><Header /><AdminMaster /></AdminPinGate></ProtectedRoute>
        } />
        <Route path="/admin/newsletter" element={
          <ProtectedRoute requiredPermission="users.read"><AdminNewsletter /></ProtectedRoute>
        } />
        <Route path="/admin/artists" element={
          <ProtectedRoute requiredPermission="users.read"><Header /><AdminArtists /></ProtectedRoute>
        } />
        <Route path="/admin/media" element={
          <ProtectedRoute requiredPermission="events.read"><Header /><AdminMedia /></ProtectedRoute>
        } />
        <Route path="/admin/audit" element={
          <ProtectedRoute masterOnly={true} requiredPermission="audit_logs.read"><AdminAuditLogs /></ProtectedRoute>
        } />
        <Route path="/ranking" element={<ProtectedRoute><Header /><Ranking /></ProtectedRoute>} />

        {/* Auxiliares / Legado */}
        <Route path="/coeaboa" element={<Navigate to="/agenda" replace />} />
        <Route path="/lp" element={<Navigate to="/" replace />} />
        <Route path="/eventos" element={<ProtectedRoute><Header /><Eventos /></ProtectedRoute>} />
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
