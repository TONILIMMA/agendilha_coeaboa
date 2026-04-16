import { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, LogOut, Users, Menu, X, ArrowLeft, CheckCircle, Shield, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import SubmissionsPanel from "@/components/SubmissionsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function RoleBadge({ isAdmin, perms }: { isAdmin: boolean; perms: { loaded: boolean; canApprove: boolean; isCollaborator: boolean } }) {
  if (isAdmin) {
    return <Badge variant="outline" className="text-xs text-accent border-accent">Admin</Badge>;
  }
  if (perms.loaded && perms.canApprove) {
    return <Badge variant="outline" className="text-xs text-primary border-primary">Master</Badge>;
  }
  if (perms.loaded && perms.isCollaborator) {
    return <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground">Colaborador</Badge>;
  }
  return null;
}

export default function Header() {
  const { savedCount } = useSubmissions();
  const { user, signOut, isAdmin } = useAuth();
  const { profile } = useProfile();
  const perms = usePermissions();
  const navigate = useNavigate();
  const currentDate = useCurrentDate();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const showEventos = isAdmin || (perms.loaded && perms.isCollaborator);
  const showCollaborators = isAdmin || (perms.loaded && perms.canApprove);
  const hasAdminLinks = showEventos || isAdmin || showCollaborators;

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-auto max-w-5xl items-center justify-between px-4 py-2 gap-2">
          {/* Left: Brand + date */}
          <div className="flex flex-col min-w-0 shrink">
            <div className="flex items-center gap-1.5 flex-wrap">
              {!isHome && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => navigate("/")} className="h-7 w-7 text-primary shrink-0" aria-label="Voltar">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voltar à página inicial</TooltipContent>
                </Tooltip>
              )}
              <span className="font-display text-base sm:text-lg font-bold text-primary whitespace-nowrap">📌 AgendIlha</span>
              <span className="hidden sm:inline text-sm text-muted-foreground">/ Coé a Boa?</span>
              <RoleBadge isAdmin={isAdmin} perms={perms} />
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground capitalize block">{currentDate}</span>
          </div>

          {/* Right actions */}
          {user && (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {profile.responsible_name && (
                <span className="hidden sm:inline text-sm font-medium text-foreground truncate max-w-[120px]">
                  Olá, {profile.responsible_name.split(" ")[0]}
                </span>
              )}

              {/* Envios */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SubmissionsPanel>
                      <Button
                        size="sm"
                        aria-label="Ver meus envios"
                        className="font-display font-semibold gradient-sunset text-primary-foreground shadow-card hover:opacity-90 transition-all text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <ClipboardList className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Envios</span>
                        {savedCount > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs font-medium bg-white/20 text-white">
                            {savedCount}
                          </Badge>
                        )}
                      </Button>
                    </SubmissionsPanel>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Meus envios e rascunhos</TooltipContent>
              </Tooltip>

              {/* Agenda */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => navigate("/agenda")} aria-label="Agenda Cultural" className="text-xs px-2 sm:px-3">
                    <CheckCircle className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Agenda</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver Agenda Cultural pública</TooltipContent>
              </Tooltip>

              {/* Admin dropdown (hamburger) */}
              {hasAdminLinks && (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="px-2 gap-1" aria-label="Menu administrativo">
                          <Menu className="h-4 w-4" />
                          <span className="hidden sm:inline text-xs">Admin</span>
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Painel administrativo</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Administração</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {showEventos && (
                      <DropdownMenuItem onClick={() => navigate("/eventos")} className="cursor-pointer">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Eventos
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate("/admin/events")} className="cursor-pointer">
                          <CalendarDays className="h-4 w-4 mr-2" />
                          Admin Eventos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/admin/users")} className="cursor-pointer">
                          <Users className="h-4 w-4 mr-2" />
                          Usuários
                        </DropdownMenuItem>
                      </>
                    )}
                    {showCollaborators && (
                      <DropdownMenuItem onClick={() => navigate("/admin/collaborators")} className="cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        Colaboradores
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Logout */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sair da conta" className="text-muted-foreground px-2">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sair da conta</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
