import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  CalendarDays, 
  Users, 
  Heart, 
  Shield, 
  History, 
  LogOut,
  ClipboardList,
  User,
  ShieldCheck,
  Crown,
  Trophy,
  Star,
  PlusCircle,
  LayoutDashboard,
  Search,
  UserPlus,
  LogIn
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserBadge } from "@/hooks/useUserBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import logoCoeABoa from "@/assets/coeaboa-logo.jpg";

type Role = "public_guest" | "public_registered" | "promoter" | "admin" | "master";

interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  roles: Role[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface Props {
  onClose?: () => void;
}

export function SidebarMenu({ onClose }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { status, name, initials, label: roleLabel, loaded: badgeLoaded } = useUserBadge();
  const { isMaster, isAdmin, isPromoter, loading: permsLoading } = usePermissions();
  const { savedCount } = useSubmissions();

  // Map system status to our Sidebar roles
  const getCurrentRole = (): Role => {
    if (!user) return "public_guest";
    if (isMaster) return "master";
    if (isAdmin) return "admin";
    if (isPromoter) return "promoter";
    return "public_registered";
  };

  const currentRole = getCurrentRole();

  const allItems: SidebarItem[] = [
    // Explorar
    { id: "events", label: "Eventos", path: "/agenda", icon: CalendarDays, roles: ["public_guest", "public_registered", "promoter", "admin", "master"] },
    { id: "favorites", label: "Meus Favoritos", path: "/agenda?view=favorites", icon: Heart, roles: ["public_registered"] },
    { id: "artists", label: "Artistas Locais", path: "/artistas", icon: Users, roles: ["public_guest", "public_registered"] },
    
    // Operação
    { id: "my_submissions", label: "Meus Envios", path: "/envios", icon: ClipboardList, roles: ["promoter"], badge: savedCount > 0 ? savedCount : undefined },
    { id: "send_event", label: "Enviar Evento", path: "/enviar-evento", icon: PlusCircle, roles: ["promoter"] },
    { id: "manage_events", label: "Gerenciar Eventos", path: "/admin/events", icon: ShieldCheck, roles: ["admin", "master"] },
    { id: "flyer_moderator", label: "Moderador de Flyers", path: "/admin/media", icon: Shield, roles: ["admin", "master"] },
    
    // Governança
    { id: "admin_dashboard", label: "Dashboard Admin", path: "/admin/events", icon: LayoutDashboard, roles: ["admin"] },
    { id: "master_panel", label: "Painel Master", path: "/master/dashboard", icon: Crown, roles: ["master"] },
    { id: "manage_users", label: "Gerenciar Usuários", path: "/master/usuarios", icon: Users, roles: ["master"] },
    { id: "audit_logs", label: "Logs de Auditoria", path: "/master/logs", icon: History, roles: ["master"] },
    { id: "promoter_ranking", label: "Ranking Divulgadores", path: "/ranking", icon: Trophy, roles: ["master"] },
    
    // Conta (Filtered separately for Guest)
    { id: "profile", label: "Meu Perfil", path: "/perfil", icon: User, roles: ["public_registered", "promoter", "admin", "master"] },
    { id: "login", label: "Entrar", path: "/auth", icon: LogIn, roles: ["public_guest"] },
    { id: "register", label: "Criar conta", path: "/auth?mode=signup", icon: UserPlus, roles: ["public_guest"] },
  ];

  const sections: SidebarSection[] = [
    {
      title: "Explorar",
      items: allItems.filter(item => ["events", "favorites", "artists"].includes(item.id) && item.roles.includes(currentRole))
    },
    {
      title: "Operação",
      items: allItems.filter(item => ["my_submissions", "send_event", "manage_events", "flyer_moderator"].includes(item.id) && item.roles.includes(currentRole))
    },
    {
      title: "Governança",
      items: allItems.filter(item => ["admin_dashboard", "master_panel", "manage_users", "audit_logs", "promoter_ranking"].includes(item.id) && item.roles.includes(currentRole))
    },
    {
      title: "Conta",
      items: allItems.filter(item => ["profile", "login", "register"].includes(item.id) && item.roles.includes(currentRole))
    }
  ].filter(section => section.items.length > 0);

  const getStatusBadge = () => {
    if (!user) return (
      <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest gap-1 border bg-muted text-muted-foreground border-border">
        <Search className="h-2.5 w-2.5" />
        Visitante
      </Badge>
    );

    const variants: Record<string, string> = {
      master: "bg-secondary text-secondary-foreground border-secondary shadow-lg shadow-secondary/20",
      admin: "bg-accent text-accent-foreground border-accent shadow-md shadow-accent/10",
      collaborator: "bg-primary/20 text-primary border-primary/30",
    };

    const icons: Record<string, React.ElementType> = {
      master: Star,
      admin: ShieldCheck,
      collaborator: User,
      user: Heart,
      artist: Users
    };

    const Icon = icons[status || "user"] || User;

    return (
      <Badge variant="outline" className={cn("px-2 py-0.5 text-[10px] font-black uppercase tracking-widest gap-1 border animate-in fade-in slide-in-from-top-1", variants[status || "user"] || "bg-muted text-muted-foreground border-border")}>
        <Icon className="h-2.5 w-2.5" />
        {roleLabel || "Usuário"}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-64 shadow-xl">
      {/* Header Profile */}
      <div className="p-6 pb-2">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2.5 group cursor-pointer px-1" onClick={() => navigate("/")}>
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all">
              <img src={logoCoeABoa} alt="AgendIlha" className="h-8 w-8 rounded-full ring-2 ring-white/20" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-black text-primary tracking-tighter">AgendIlha</span>
              <span className="text-[10px] text-secondary font-black uppercase tracking-widest opacity-90">Coé a Boa?</span>
            </div>
          </div>
          <Separator className="bg-sidebar-border/50" />
        </div>
        
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground flex items-center justify-center font-display text-base font-bold shrink-0 shadow-lg ring-2 ring-white/50">
              {user ? initials : <User className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm font-bold text-foreground truncate tracking-tight">
                {user ? (badgeLoaded ? name : "Carregando...") : "Visitante"}
              </div>
              <div className="mt-1">
                {getStatusBadge()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        {sections.map((section, idx) => {
          return (
            <div key={section.title} className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-center gap-2 px-3 mb-2.5 opacity-80">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">
                  {section.title}
                </h3>
              </div>
              
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path || (item.path.includes('?') && pathname + useLocation().search === item.path);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                        isActive 
                          ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 scale-[1.02]" 
                          : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
                      )}
                      onClick={() => {
                        if (onClose) onClose();
                      }}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-all duration-300", isActive ? "text-primary-foreground" : "text-primary group-hover:scale-110")} />
                      <span className="text-sm flex-1 tracking-tight font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant={isActive ? "secondary" : "default"} className="h-5 min-w-[20px] px-1.5 bg-primary/20 text-primary border-none text-[10px] font-bold">
                          {item.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <div className="absolute left-1 w-1 h-5 bg-white/40 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-sidebar-border bg-sidebar-accent/10">
        {user ? (
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full justify-start gap-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
            onClick={() => {
              signOut();
              if (onClose) onClose();
            }}
          >
            <LogOut className="h-4 w-4" />
            <span className="font-bold text-sm tracking-tight">Sair da Conta</span>
          </Button>
        ) : (
          <div className="px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium text-center italic">
              Entre para salvar favoritos e enviar eventos!
            </p>
          </div>
        )}
        <div className="mt-4 text-center">
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground/30">
            © {new Date().getFullYear()} AgendIlha · Coé a Boa?
          </p>
        </div>
      </div>
    </div>
  );
}
