import React from "react";
import { StatusBadge } from "./ui/StatusBadge";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  CalendarDays, 
  Users, 
  Heart, 
  LayoutDashboard, 
  Shield, 
  History, 
  Mail, 
  LogOut,
  ChevronRight,
  ClipboardList,
  User,
  Settings,
  ShieldCheck,
  Crown,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserBadge, UserStatus } from "@/hooks/useUserBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { usePermissions } from "@/hooks/usePermissions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import logoCoeABoa from "@/assets/coeaboa-logo.jpg";

interface SidebarItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  roles?: string[];
  excludeRoles?: string[];
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
  roles?: string[];
}

interface Props {
  onClose?: () => void;
}

export function SidebarMenu({ onClose }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { status, name, initials, label, loaded: badgeLoaded } = useUserBadge();
  const { isMaster, isAdmin, isCollaborator, loading: permsLoading } = usePermissions();
  const { signOut } = useAuth();
  const { savedCount } = useSubmissions();

  const sections: SidebarSection[] = [
    {
      title: "Explorar",
      items: [
        { label: "Eventos", path: "/agenda", icon: CalendarDays },
        { 
          label: "Artistas Locais", 
          path: "/artistas", 
          icon: Users,
          excludeRoles: ["admin", "master", "master_admin"] 
        },
        { 
          label: "Meus Favoritos", 
          path: "/agenda?view=favorites", 
          icon: Heart,
          excludeRoles: ["admin", "master", "master_admin"]
        },
      ]
    },
    {
      title: "Administração",
      roles: ["admin", "master", "master_admin"],
      items: [
        { label: "Gerenciar Eventos", path: "/admin/events", icon: ShieldCheck },
        { label: "Gerenciar Usuários", path: "/admin/users", icon: User },
        { label: "Moderador de Flyers", path: "/admin/media", icon: Shield },
      ]
    },
    {
      title: "Master",
      roles: ["master", "master_admin"],
      items: [
        { label: "Visão Geral", path: "/admin/master", icon: Crown },
        { label: "Ranking Divulgadores", path: "/ranking", icon: Trophy },
        { label: "Newsletter", path: "/admin/newsletter", icon: Mail },
        { label: "Logs de Auditoria", path: "/admin/audit", icon: History },
      ]
    },
    {
      title: "Conta",
      items: [
        { 
          label: "Meus Envios", 
          path: "/envios", 
          icon: ClipboardList, 
          badge: savedCount > 0 ? savedCount : undefined 
        },
        { label: "Configurações", path: "/configurar-artista", icon: Settings },
      ]
    }
  ];

  const filteredSections = sections.filter(section => {
    if (!section.roles) return true;
    // Map "master_admin" from status to "master" to match section roles
    const effectiveStatus = status === "master" ? "master_admin" : status;
    return effectiveStatus && (section.roles.includes(effectiveStatus) || (effectiveStatus === "master_admin" && section.roles.includes("master")));
  }).map(section => ({
    ...section,
    items: section.items.filter(item => {
      const effectiveStatus = status === "master" ? "master_admin" : status;
      if (item.roles && (!effectiveStatus || !(item.roles.includes(effectiveStatus) || (effectiveStatus === "master_admin" && item.roles.includes("master"))))) return false;
      if (item.excludeRoles && effectiveStatus && (item.excludeRoles.includes(effectiveStatus) || (effectiveStatus === "master_admin" && item.excludeRoles.includes("master")))) return false;
      return true;
    })
  })).filter(section => section.items.length > 0);

  const getStatusIcon = (s: UserStatus) => {
    switch (s) {
      case "master": return Crown;
      case "admin": return Shield;
      case "collaborator": return ShieldCheck;
      default: return User;
    }
  };

  const StatusIcon = getStatusIcon(status);

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-64 shadow-xl">
      {/* Header Profile */}
      <div className="p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2 group cursor-pointer px-1" onClick={() => navigate("/")}>
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <img src={logoCoeABoa} alt="AgendIlha" className="h-7 w-7 rounded-full" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-black text-primary tracking-tighter">AgendIlha</span>
              <span className="text-[9px] text-secondary font-black uppercase tracking-widest opacity-80">Coé a Boa?</span>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />
        </div>
        
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/50 border border-border shadow-sm mb-4">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center font-display text-sm font-bold shrink-0 shadow-inner">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-sm font-bold text-foreground truncate">
              {badgeLoaded ? name : "Carregando..."}
            </div>
            {status && (
              <div className="mt-0.5">
                <StatusBadge role={status} />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
              {section.title}
            </h3>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                    isActive 
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 scale-[1.02]" 
                      : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
                  )}
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-300", isActive ? "text-primary-foreground" : "text-primary group-hover:scale-110")} />
                  <span className="text-sm flex-1 tracking-tight">{item.label}</span>
                  {item.badge && (
                    <Badge variant={isActive ? "secondary" : "default"} className="h-5 min-w-[20px] px-1.5 bg-primary/20 text-primary border-none text-[10px] font-bold">
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && <div className="absolute left-0 w-1 h-4 bg-white rounded-full -ml-1" />}
                </Link>

              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-sidebar-border bg-sidebar-accent/20">
        <Button 
          variant="ghost" 
          size="lg" 
          className="w-full justify-start gap-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => {
                    signOut();
                    if (onClose) onClose();
                  }}
        >
          <LogOut className="h-4 w-4" />
          <span className="font-bold text-sm">Sair da Conta</span>
        </Button>
        <div className="mt-4 text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">
            © {new Date().getFullYear()} AgendIlha · Coé a Boa?
          </p>
        </div>
      </div>
    </div>
  );
}
