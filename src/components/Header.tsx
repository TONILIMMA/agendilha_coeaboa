import { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, LogOut, Users, Menu, X, ArrowLeft, CheckCircle, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import SubmissionsPanel from "@/components/SubmissionsPanel";

function useCurrentDate() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Header() {
  const { savedCount } = useSubmissions();
  const { user, signOut, isAdmin } = useAuth();
  const { profile } = useProfile();
  const permissions = usePermissions();
  const navigate = useNavigate();
  const currentDate = useCurrentDate();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-auto max-w-5xl items-center justify-between px-4 py-2">
        {/* Left: Brand + date */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {!isHome && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate("/")}
                className="h-8 w-8 text-primary shrink-0"
                aria-label="Voltar à página inicial"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <span className="font-display text-lg font-bold text-primary">📌 AgendIlha</span>
            <span className="hidden sm:inline text-sm text-muted-foreground">/ Coé a Boa?</span>
            {isAdmin && (
              <Badge variant="outline" className="text-xs text-accent border-accent">
                Admin
              </Badge>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] text-muted-foreground capitalize block">{currentDate}</span>
        </div>

        {/* Right: Desktop actions */}
        {user && (
          <div className="hidden sm:flex items-center gap-2">
            {profile.responsible_name && (
              <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                Olá, {profile.responsible_name.split(" ")[0]}
              </span>
            )}
            <SubmissionsPanel>
              <Button
                size="sm"
                className="font-display font-semibold gradient-sunset text-primary-foreground shadow-card hover:opacity-90 transition-all"
              >
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Envios
                {savedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-xs font-medium bg-white/20 text-white">
                    {savedCount}
                  </Badge>
                )}
              </Button>
            </SubmissionsPanel>
            <Button size="sm" variant="outline" onClick={() => navigate("/agenda")} className="text-xs">
              <CheckCircle className="h-4 w-4 mr-1" />
              Agenda
            </Button>
            {(isAdmin || permissions.isCollaborator) && (
              <Button size="sm" variant="outline" onClick={() => navigate("/eventos")} className="text-xs">
                <CalendarDays className="h-4 w-4 mr-1" />
                Eventos
              </Button>
            )}
            {isAdmin && (
              <>
                <Button size="sm" variant="outline" onClick={() => navigate("/admin/events")} className="text-xs">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  Admin Eventos
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/admin/users")} className="text-xs">
                  <Users className="h-4 w-4 mr-1" />
                  Usuários
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate("/admin/collaborators")} className="text-xs">
                  <Shield className="h-4 w-4 mr-1" />
                  Colaboradores
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Right: Mobile hamburger */}
        {user && (
          <div className="flex sm:hidden items-center gap-2">
            {profile.responsible_name && (
              <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                Olá, {profile.responsible_name.split(" ")[0]}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMenuOpen((v) => !v)}
              className="text-foreground"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {user && menuOpen && (
        <div className="sm:hidden border-t border-border bg-card px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <SubmissionsPanel>
            <Button
              size="sm"
              className="w-full justify-start font-display font-semibold gradient-sunset text-primary-foreground shadow-card hover:opacity-90 transition-all"
              onClick={() => setMenuOpen(false)}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Envios
              {savedCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs font-medium bg-white/20 text-white">
                  {savedCount}
                </Badge>
              )}
            </Button>
          </SubmissionsPanel>

          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start text-xs"
            onClick={() => { navigate("/agenda"); setMenuOpen(false); }}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Agenda
          </Button>

          {(isAdmin || permissions.isCollaborator) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start text-xs"
              onClick={() => { navigate("/eventos"); setMenuOpen(false); }}
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Eventos
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={() => { navigate("/admin/events"); setMenuOpen(false); }}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Admin Eventos
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={() => { navigate("/admin/users"); setMenuOpen(false); }}
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start text-xs"
                onClick={() => { navigate("/admin/collaborators"); setMenuOpen(false); }}
              >
                <Shield className="h-4 w-4 mr-2" />
                Colaboradores
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => { signOut(); setMenuOpen(false); }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      )}
    </header>
  );
}
