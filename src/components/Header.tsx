import { useState, useEffect } from "react";
 import { CalendarDays, ClipboardList, LogOut, Users, Menu, X, ArrowLeft, CheckCircle, Shield, Settings, ChevronDown, UserCog, Crown, Trophy, Megaphone } from "lucide-react";
 import { useNavigate, useLocation, Link } from "react-router-dom";
 import logoCoeABoa from "@/assets/coeaboa-logo.jpg";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserBadge } from "@/hooks/useUserBadge";
 import { Badge } from "@/components/ui/badge";
 import { HeaderUserMenu } from "@/components/HeaderUserMenu";
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
  const { status, name: badgeName } = useUserBadge();
  const isMaster = status === "master";
  const navigate = useNavigate();
  const currentDate = useCurrentDate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
   const isHome = pathname === "/" || pathname === "/lp" || pathname === "/landing";
   const isAgenda = pathname === "/agenda";
   const isSubmit = pathname === "/enviar-evento";
   const isAdminArea = pathname.startsWith("/admin");
 
   // Home / Landing - Transparent floating style
   const [scrolled, setScrolled] = useState(false);
   useEffect(() => {
     if (!isHome) return;
     const onScroll = () => setScrolled(window.scrollY > 12);
     window.addEventListener("scroll", onScroll, { passive: true });
     onScroll();
     return () => window.removeEventListener("scroll", onScroll);
   }, [isHome]);
 
    if (isHome) {
      return (
        <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "glass border-b border-white/40" : "bg-transparent border-b border-transparent"}`}>
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <img src={logoCoeABoa} alt="Coé a Boa?" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-1 ring-foreground/10" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">AgendIlha</span>
                <span className="text-[9px] sm:text-xs text-secondary/70 font-bold uppercase tracking-widest">Coé a Boa?</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/agenda" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground font-bold h-9">Ver agenda</Button>
              </Link>
              <Link to="/enviar-evento">
                <Button size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-sm px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm border-2 border-primary">Divulgar</Button>
              </Link>
               <HeaderUserMenu variant="desktop" hideContext={true} />
            </div>
          </div>
        </header>
      );
    }
 
    // Public view for agenda - clean and minimal
    if (isAgenda) {
      return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 gap-2">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity group shrink-0">
              <img src={logoCoeABoa} alt="Coé a Boa?" className="h-7 w-7 rounded-full ring-1 ring-primary/20" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-base font-black text-primary tracking-tight">AgendIlha</span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Coé a Boa?</span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button size="sm" variant="ghost" className="text-xs font-bold hover:bg-primary/5 text-foreground/80 px-2 h-8 hidden xs:flex" onClick={() => navigate("/")}>
                Início
              </Button>
              <Button size="sm" variant="outline" className="rounded-full text-[10px] sm:text-xs font-black border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm h-8 sm:h-9 px-3 sm:px-4" onClick={() => navigate("/enviar-evento")}>
                Divulgar
              </Button>
              <HeaderUserMenu variant="desktop" hideContext={true} />
            </div>
          </div>
          <div className="h-1 w-full gradient-pumpkin-strip" />
        </header>
      );
    }
  const showEventos = isAdmin || (perms.loaded && perms.isCollaborator);
  const showCollaborators = isAdmin || (perms.loaded && perms.canApprove);
   const hasAdminLinks = showEventos || isAdmin || showCollaborators;
 
   // Final fallback header (Admin Area / Protected pages)
   return (
     <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-auto max-w-5xl items-center justify-between px-4 py-2 gap-2">
          {/* Left: Brand + date */}
          <div className="flex flex-col min-w-0 shrink">
            <div className="flex items-center gap-1.5 flex-wrap">
               {!isHome && !isAgenda && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => navigate("/")} className="h-7 w-7 text-primary shrink-0" aria-label="Voltar">
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Voltar à página inicial</TooltipContent>
                </Tooltip>
              )}
                 <Link to="/" className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-1.5 hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-1.5">
                    <img src={logoCoeABoa} alt="Coé a Boa?" className="h-5 w-5 rounded-full" />
                    <span className="font-display text-base sm:text-xl font-black text-primary whitespace-nowrap tracking-tight">AgendIlha</span>
                  </div>
                  <span className="text-[10px] sm:text-sm text-muted-foreground font-medium opacity-70">Coé a Boa?</span>
                </Link>
                {isAdmin && isAdminArea && <RoleBadge status={status} isAdmin={isAdmin} perms={perms} />}
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground capitalize block">{currentDate}</span>
          </div>

          {/* Right actions - hide specific ones on public agenda */}
          {user && !isAgenda && (() => {
            // Use centralized name resolution from useUserBadge (profile → company → collaborator → metadata → email/phone)
            const fullName = badgeName && badgeName !== "Usuário" ? badgeName : "Divulgador";
            const firstName = fullName.split(" ")[0];
            const roleLabel = isMaster
              ? "Admin Master"
              : isAdmin
              ? "Admin"
              : perms.isCollaborator
              ? "Divulgador"
              : "Divulgador";

            // Role-aware icon for the trigger
            const RoleIcon = isMaster ? Crown : isAdmin ? Shield : UserCog;
            const roleAccent = isMaster
              ? "text-secondary"
              : isAdmin
              ? "text-accent"
              : "text-muted-foreground";

            return (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

               {/* Enviar Evento CTA */}
               <Button 
                 size="sm" 
                 onClick={() => navigate("/enviar-evento")} 
                 className="font-display font-semibold gradient-sunset text-primary-foreground shadow-card hover:opacity-90 transition-all text-xs sm:text-sm px-2 sm:px-3"
               >
                 <Megaphone className="h-4 w-4 mr-1.5" />
                 <span className="hidden sm:inline">Enviar Evento</span>
                 <span className="sm:hidden">Enviar</span>
               </Button>

              {/* User dropdown — moved to the far right */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:bg-primary/10 hover:text-primary"
                    aria-label={`Menu do ${roleLabel}`}
                  >
                    <div className="relative">
                      <Avatar className={`h-6 w-6 ${isMaster ? "ring-2 ring-secondary ring-offset-1 ring-offset-background" : isAdmin ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""}`}>
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-[10px] font-semibold text-primary-foreground">
                          {getInitials(fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <RoleIcon
                        className={`absolute -top-1.5 -right-1.5 h-3.5 w-3.5 ${roleAccent} ${isMaster ? "fill-secondary" : ""} drop-shadow-sm`}
                        strokeWidth={2}
                        aria-label={roleLabel}
                      />
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

                  {/* Admin & Master: Eventos */}
                  {(isAdmin || isMaster) && (
                    <DropdownMenuItem onClick={() => navigate("/admin/events")} className="cursor-pointer">
                      <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                      Eventos
                    </DropdownMenuItem>
                  )}

                  {/* Master only: Usuários */}
                  {isMaster && (
                    <DropdownMenuItem onClick={() => navigate("/admin/users")} className="cursor-pointer">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      Usuários
                    </DropdownMenuItem>
                  )}

                  {/* Master only: Ranking */}
                  {isMaster && (
                    <DropdownMenuItem onClick={() => navigate("/ranking")} className="cursor-pointer">
                      <Trophy className="h-4 w-4 mr-2 text-secondary" />
                      Ranking
                    </DropdownMenuItem>
                  )}

                  {(isAdmin || isMaster) && <DropdownMenuSeparator />}

                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Logout is inside the user dropdown above */}
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
