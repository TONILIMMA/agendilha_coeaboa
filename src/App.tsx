import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubmissionProvider } from "@/contexts/SubmissionContext";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import AdminUsers from "./pages/AdminUsers";
import AdminEvents from "./pages/AdminEvents";
import CoeABoa from "./pages/CoeABoa";
import AgendaCultural from "./pages/AgendaCultural";
import Eventos from "./pages/Eventos";
import AdminCollaborators from "./pages/AdminCollaborators";
import AdminMaster from "./pages/AdminMaster";
import Ranking from "./pages/Ranking";
import AdminPinGate from "@/components/AdminPinGate";
import NotFound from "./pages/NotFound";
 import Landing from "./pages/Landing";
 import SubmitEvent from "./pages/SubmitEvent";
 import AdminNewsletter from "./pages/AdminNewsletter";
 import ArtistProfile from "./pages/ArtistProfile";
 import ArtistSetup from "./pages/ArtistSetup";
 import AdminArtists from "./pages/AdminArtists";
       <Route path="/artista/:id" element={<ArtistProfile />} />
       <Route
         path="/configurar-artista"
         element={
           <ProtectedRoute>
             <ArtistSetup />
           </ProtectedRoute>
         }
       />
       <Route
         path="/admin/artists"
         element={
           <ProtectedRoute>
             <Header />
             <AdminArtists />
           </ProtectedRoute>
         }
       />

import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}

const AppRoutes = () => (
  <SubmissionProvider>
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Landing />} />
      <Route path="/agenda" element={<><Header /><AgendaCultural /></>} />
      <Route path="/auth" element={<><Header /><Auth /></>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Envio de Evento */}
      <Route
        path="/enviar-evento"
        element={
          <ProtectedRoute>
            <SubmitEvent />
          </ProtectedRoute>
        }
      />

      {/* Administrativas */}
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute>
            <Header />
            <AdminEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminPinGate>
              <Header />
              <AdminUsers />
            </AdminPinGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/collaborators"
        element={
          <ProtectedRoute>
            <Header />
            <AdminCollaborators />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/master"
        element={
          <ProtectedRoute>
            <AdminPinGate>
              <Header />
              <AdminMaster />
            </AdminPinGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/newsletter"
        element={
          <ProtectedRoute>
            <AdminNewsletter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ranking"
        element={
          <ProtectedRoute>
            <Header />
            <Ranking />
          </ProtectedRoute>
        }
      />

      {/* Auxiliares / Legado */}
      <Route path="/coeaboa" element={<Navigate to="/agenda" replace />} />
      <Route path="/lp" element={<Navigate to="/" replace />} />
      <Route
        path="/eventos"
        element={
          <ProtectedRoute>
            <Header />
            <Eventos />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </SubmissionProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
