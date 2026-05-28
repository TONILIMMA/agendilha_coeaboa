import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import { 
  CalendarDays, 
  ClipboardList, 
  Heart,
  LogOut, 
  Users, 
  Menu, 
  X, 
  ArrowLeft, 
  CheckCircle, 
  Shield, 
  Settings, 
  ChevronDown, 
  UserCog, 
  Crown, 
  Trophy, 
  Megaphone, 
  Sun, 
  Moon 
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
 import logoCoeABoa from "@/assets/coeaboa-logo.jpg";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
 import { useAuth } from "@/contexts/AuthContext";
 import { useTheme } from "@/hooks/useTheme";
import { useProfile } from "@/hooks/useProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserBadge } from "@/hooks/useUserBadge";
 import { Badge } from "@/components/ui/badge";
  import { HeaderUserMenu } from "@/components/HeaderUserMenu";
 import { SidebarMenu } from "@/components/SidebarMenu";
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
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";

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
   status: "master" | "admin" | "collaborator" | "artist" | "user" | null;
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

export default function Header({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { savedCount } = useSubmissions();
  const [favoritesCount, setFavoritesCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem("agendilha_favorites");
      if (saved) {
        setFavoritesCount(JSON.parse(saved).length);
      }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, []);
   const { user, signOut, isAdmin } = useAuth();
   const { theme, toggleTheme } = useTheme();
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
   const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/master") || pathname === "/ranking";
 
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
        <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/90 backdrop-blur-xl border-b border-white/40 shadow-sm" : "bg-transparent border-b border-transparent"}`}>
          <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-8">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0" aria-label="AgendIlha - Página Inicial">
              <img src={logoCoeABoa} alt="AgendIlha" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full ring-2 ring-primary/10 shadow-sm group-hover:scale-105 transition-transform" />
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg sm:text-xl font-black tracking-tight text-primary">AgendIlha</span>
                <span className="text-[9px] sm:text-[10px] text-secondary font-black uppercase tracking-[0.15em]">Coé a Boa?</span>
              </div>
            </Link>

             {/* Desktop Nav */}
             <div className="hidden md:flex items-center gap-4">
               <Link to="/agenda" className="text-sm font-bold text-foreground/70 hover:text-primary transition-colors">Eventos</Link>
               <Link to="/artistas" className="text-sm font-bold text-foreground/70 hover:text-primary transition-colors">Artistas</Link>
              <Link to="/agenda?view=favorites" className="relative group">
                <Heart className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-primary text-[10px] font-black text-white rounded-full flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Link>
               <Button 
                 size="sm" 
                 onClick={() => {
                   if (user) {
                     navigate("/enviar-evento");
                   } else {
                     navigate("/auth?redirect=/enviar-evento");
                   }
                 }}
                 className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-lg px-6 h-10 border-2 border-primary transition-transform active:scale-95"
               >
                 Divulgar
               </Button>
              <HeaderUserMenu variant="desktop" hideContext={true} />
            </div>

             {/* Mobile Nav Trigger */}
             <div className="flex md:hidden items-center gap-2">
               <Button 
                 size="sm" 
                 onClick={() => {
                   if (user) {
                     navigate("/enviar-evento");
                   } else {
                     navigate("/auth?redirect=/enviar-evento");
                   }
                 }}
                 className="rounded-full bg-primary text-primary-foreground font-black shadow-md px-4 h-9 text-[10px] uppercase tracking-widest"
               >
                 Divulgar
               </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onMobileMenuToggle} 
                className="h-10 w-10 rounded-full bg-white/50 border border-white/40 shadow-sm"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </Button>

            </div>
          </div>
        </header>
      );
    }
 
    // Public view for agenda - responsive & polished
    if (isAgenda) {
      return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-sm">
          <div className="mx-auto flex h-16 sm:h-18 max-w-5xl items-center justify-between px-4 sm:px-6 gap-2">
             <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 hover:opacity-80 transition-opacity group shrink-0" aria-label="AgendIlha - Página Inicial">
              <img src={logoCoeABoa} alt="AgendIlha" className="h-8 w-8 sm:h-9 sm:w-9 rounded-full ring-2 ring-primary/5 shadow-sm" />
              <div className="flex flex-col leading-[1]">
                <span className="font-display text-lg sm:text-xl font-black text-primary tracking-tight">AgendIlha</span>
                <span className="text-[9px] sm:text-[10px] text-secondary font-black uppercase tracking-[0.15em]">Coé a Boa?</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {(isAdmin || perms.isCollaborator) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    if (user) {
                      navigate("/enviar-evento");
                    } else {
                      navigate("/auth?redirect=/enviar-evento");
                    }
                  }}
                  className="rounded-full text-[10px] sm:text-xs font-black border-2 border-primary/20 text-primary hover:bg-primary/5 transition-all shadow-sm px-4 sm:px-6 h-9 sm:h-10 uppercase tracking-widest active:scale-95"
                >
                  Divulgar
                </Button>
              )}
              
              <HeaderUserMenu variant="desktop" hideContext={true} />
            </div>
          </div>
          <div className="h-1 w-full gradient-pumpkin-strip opacity-90" />
        </header>
      );
    }
  const showEventos = isAdmin || (perms.loaded && perms.isCollaborator);
  const showCollaborators = isAdmin || (perms.loaded && perms.canApprove);
   const hasAdminLinks = showEventos || isAdmin || showCollaborators;
 
   // Final fallback header (Admin Area / Protected pages / Other)
   return (
     <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 gap-2">
          {/* Left: Brand + date */}
          <div className="flex items-center gap-3">
             {/* Mobile menu trigger */}
             <div className="flex md:hidden items-center">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={onMobileMenuToggle} 
                 className="h-10 w-10 text-primary hover:bg-primary/5 active:scale-90 transition-all"
               >
                 <Menu className="h-6 w-6" />
               </Button>
             </div>

             <div className="flex items-center gap-2">
               {/* Brand: Hide on desktop if sidebar is potentially visible */}
               <div className={cn(
                 "flex items-center gap-2 transition-all duration-300",
                 (isAdminArea || isMaster || isAdmin) && user && "md:hidden"
               )}>
                 <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                   <img src={logoCoeABoa} alt="AgendIlha" className="h-7 w-7 rounded-full shadow-sm" />
                   <div className="flex flex-col leading-none">
                     <span className="font-display text-base sm:text-lg font-black text-primary tracking-tight">AgendIlha</span>
                     <span className="text-[8px] text-secondary font-black uppercase tracking-widest opacity-80">Coé a Boa?</span>
                   </div>
                 </Link>
               </div>
               
               <div className="hidden sm:flex flex-col ml-2">
                 <span className="text-[10px] text-muted-foreground capitalize leading-none mb-0.5">{currentDate}</span>
                 {isAdminArea && <RoleBadge status={status} isAdmin={isAdmin} perms={perms} />}
               </div>
             </div>
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
             <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">

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
               {(isAdmin || perms.isCollaborator) && (
                 <Button 
                   size="sm" 
                   onClick={() => navigate("/enviar-evento")} 
                   className="font-display font-semibold gradient-sunset text-primary-foreground shadow-card hover:opacity-90 transition-all text-xs sm:text-sm px-2 sm:px-3"
                 >
                   <Megaphone className="h-4 w-4 mr-1.5" />
                   <span className="hidden sm:inline">Enviar Evento</span>
                   <span className="sm:hidden">Enviar</span>
                 </Button>
               )}

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
