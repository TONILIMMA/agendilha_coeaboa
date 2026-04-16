import { useState, useEffect } from "react";
import { CalendarDays, ClipboardList, LogOut, Users, Menu, X, ArrowLeft, CheckCircle, Shield, Settings, ChevronDown, UserCog, Crown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserBadge } from "@/hooks/useUserBadge";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

function RoleBadge({
  status,
  isAdmin,
  perms,
}: {
  status: "master" | "admin" | "collaborator" | "user" | null;
  isAdmin: boolean;
  perms: { loaded: boolean; canApprove: boolean; isCollaborator: boolean };
}) {
  if (status === "master") {
    return (
      <Badge
        variant="outline"
        className="text-xs gap-1 border-secondary text-secondary bg-secondary/10 font-semibold shadow-sm"
      >
        <Crown className="h-3 w-3" strokeWidth={2.5} />
        Admin Master
      </Badge>
    );
  }
  if (isAdmin) {
    return (
      <Badge variant="outline" className="text-xs gap-1 text-accent border-accent">
        <Shield className="h-3 w-3" strokeWidth={2.5} />
        Admin
      </Badge>
    );
  }
  if (perms.loaded && perms.isCollaborator) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground">
        Colaborador
      </Badge>
    );
  }
  return null;
}

export default function Header() {
  const { savedCount } = useSubmissions();
  const { user, signOut, isAdmin } = useAuth();
  const { profile } = useProfile();
  const perms = usePermissions();
  const { status } = useUserBadge();
  const isMaster = status === "master";
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
              <RoleBadge status={status} isAdmin={isAdmin} perms={perms} />
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground capitalize block">{currentDate}</span>
          </div>

          {/* Right actions */}
          {user && (() => {
            // Compute a display name with sensible fallbacks
            const fullName =
              profile.responsible_name?.trim() ||
              profile.company_name?.trim() ||
              (user.email && !user.email.endsWith("@phone.agendilha.app") ? user.email.split("@")[0] : "") ||
              profile.phone?.replace(/\D/g, "").slice(-4) ||
              "Usuário";
            const firstName = fullName.split(" ")[0];
            const roleLabel = isMaster
              ? "Admin Master"
              : isAdmin
              ? "Admin"
              : perms.isCollaborator
              ? "Colaborador"
              : "Divulgador";

            return (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* User name dropdown */}
              {hasAdminLinks ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-1.5 gap-1.5 text-xs sm:text-sm font-medium text-foreground hover:bg-accent/10"
                      aria-label="Menu do usuário"
                    >
                      <div className="relative">
                        <Avatar className={`h-6 w-6 ${isMaster ? "ring-2 ring-secondary ring-offset-1 ring-offset-background" : ""}`}>
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-[10px] font-semibold text-primary-foreground">
                            {getInitials(fullName)}
                          </AvatarFallback>
                        </Avatar>
                        {isMaster && (
                          <Crown
                            className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-secondary fill-secondary drop-shadow-sm"
                            strokeWidth={2}
                            aria-label="Admin Master"
                          />
                        )}
                      </div>
                      <span className="truncate max-w-[80px] sm:max-w-[120px]">{firstName}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground truncate">{fullName}</span>
                        {isMaster && <Crown className="h-3.5 w-3.5 text-secondary fill-secondary shrink-0" strokeWidth={2} />}
                      </div>
                      <div className={`font-normal text-[11px] mt-0.5 ${isMaster ? "text-secondary font-semibold" : "text-muted-foreground"}`}>
                        {roleLabel}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin/users")} className="cursor-pointer">
                        <Users className="h-4 w-4 mr-2" />
                        Cadastros &gt; Usuários
                      </DropdownMenuItem>
                    )}
                    {isMaster && (
                      <DropdownMenuItem onClick={() => navigate("/admin/master")} className="cursor-pointer">
                        <Crown className="h-4 w-4 mr-2 text-secondary" />
                        Painel Master
                      </DropdownMenuItem>
                    )}
                    {showCollaborators && (
                      <DropdownMenuItem onClick={() => navigate("/admin/collaborators")} className="cursor-pointer">
                        <Shield className="h-4 w-4 mr-2" />
                        Colaboradores
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin/events")} className="cursor-pointer">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Admin Eventos
                      </DropdownMenuItem>
                    )}
                    {showEventos && (
                      <DropdownMenuItem onClick={() => navigate("/eventos")} className="cursor-pointer">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Meus Eventos
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-[10px] font-semibold text-primary-foreground">
                      {getInitials(fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[100px] sm:max-w-[140px]">Olá, {firstName}</span>
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
                        <ClipboardList className="h-4 w-4 mr-1.5" />
                        <span>Envios</span>
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
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Agenda</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ver Agenda Cultural pública</TooltipContent>
              </Tooltip>

              {/* Logout (icon only — full menu lives in user dropdown) */}
              {!hasAdminLinks && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" onClick={signOut} aria-label="Sair da conta" className="text-muted-foreground px-2">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sair da conta</TooltipContent>
                </Tooltip>
              )}
            </div>
            );
          })()}
        </div>
      </header>
      {/* Decorative pumpkin/terracotta strip below the header */}
      <div className="sticky top-[var(--header-strip-offset,0)] z-40 h-1 w-full gradient-pumpkin-strip shadow-[0_2px_8px_-2px_hsl(22_70%_55%/0.25)]" aria-hidden="true" />
    </TooltipProvider>
  );
}
