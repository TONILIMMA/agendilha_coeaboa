import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserBadge } from "@/hooks/useUserBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import logoCoeABoa from "@/assets/coeaboa-logo.jpg";
import { sidebarConfig, SidebarItem, Role } from "./layout/sidebarItems";
import { routeExists } from "@/routes/config";

interface Props {
  onClose?: () => void;
}

export function SidebarMenu({ onClose }: Props) {
  const { pathname, search } = useLocation();
  const fullPath = pathname + search;
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { name, initials, loaded: badgeLoaded } = useUserBadge();
  const { isMaster, isAdmin, isPromoter, loading: permsLoading } = useAppPermissions();
  const { savedCount } = useSubmissions();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const getCurrentRole = (): Role => {
    if (!user) return "public_guest";
    if (isMaster) return "master";
    if (isAdmin) return "admin";
    if (isPromoter) return "promoter";
    return "public_registered";
  };

  const currentRole = getCurrentRole();

  const roleLabels: Record<Role, string> = {
    public_guest: "Visitante",
    public_registered: "Usuário",
    promoter: "Promotor / Divulgador",
    admin: "Administrador",
    master: "Admin Master"
  };

  const isItemActive = (item: SidebarItem) => {
    if (item.exact) return pathname === item.path;
    return fullPath === item.path || pathname.startsWith(item.path);
  };

  const filterItemsByRoleAndRoute = (items: SidebarItem[]) => {
    return items.filter(item => {
      const hasRole = item.roles.includes(currentRole);
      if (!hasRole) return false;
      return routeExists(item.path);
    });
  };

  const filteredSections = sidebarConfig.map(section => ({
    ...section,
    items: filterItemsByRoleAndRoute(section.items)
  })).filter(section => section.items.length > 0);

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border w-full max-w-[280px] shadow-xl overflow-hidden animate-in slide-in-from-left duration-300">
      {/* Header Profile */}
      <div className="p-4 md:p-6 pb-2 shrink-0">
        <div className="flex flex-col gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-2.5 group cursor-pointer px-1" onClick={() => { navigate("/"); if (onClose) onClose(); }}>
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
        
        <div className="flex flex-col gap-3 p-3 md:p-4 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground flex items-center justify-center font-display text-base font-bold shrink-0 shadow-lg ring-2 ring-white/50">
              {user ? initials : <User className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm font-bold text-foreground truncate tracking-tight">
                {user ? (badgeLoaded ? name : "Carregando...") : "Visitante"}
              </div>
              <div className="mt-1">
                <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-muted/50 text-muted-foreground border-border/50">
                  {roleLabels[currentRole]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        {filteredSections.map((section, idx) => (
          <div key={section.id} className="space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-center gap-2 px-3 mb-2.5 opacity-80">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/70">
                {section.title}
              </h3>
            </div>
            
            <div className="space-y-1">
              {section.items.map(item => (
                <SidebarNavigationItem 
                  key={item.id}
                  item={item} 
                  depth={0} 
                  pathname={pathname}
                  fullPath={fullPath}
                  savedCount={savedCount}
                  openSubmenus={openSubmenus}
                  toggleSubmenu={toggleSubmenu}
                  onClose={onClose}
                  filterFn={filterItemsByRoleAndRoute}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Sair da Conta is isolated here */}
      <div className="p-4 mt-auto border-t border-sidebar-border bg-sidebar-accent/5">
        {user ? (
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full justify-start gap-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group"
            onClick={() => {
              signOut();
              if (onClose) onClose();
            }}
          >
            <LogOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            <span className="font-bold text-sm tracking-tight">Sair da Conta</span>
          </Button>
        ) : (
          <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-[10px] text-primary/80 font-bold text-center italic">
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

function SidebarNavigationItem({ 
  item, 
  depth, 
  pathname, 
  fullPath, 
  savedCount, 
  openSubmenus, 
  toggleSubmenu, 
  onClose,
  filterFn
}: { 
  item: SidebarItem; 
  depth: number; 
  pathname: string;
  fullPath: string;
  savedCount: number;
  openSubmenus: Record<string, boolean>;
  toggleSubmenu: (id: string) => void;
  onClose?: () => void;
  filterFn: (items: SidebarItem[]) => SidebarItem[];
}) {
  const isItemActive = (it: SidebarItem) => {
    if (it.exact) return pathname === it.path;
    return fullPath === it.path || pathname.startsWith(it.path);
  };

  const Icon = item.icon;
  const isActive = isItemActive(item);
  const validChildren = item.children ? filterFn(item.children) : [];
  const hasChildren = validChildren.length > 0;
  
  // Auto-open if child is active
  useEffect(() => {
    if (hasChildren && validChildren.some(child => isItemActive(child)) && !openSubmenus[item.id]) {
      toggleSubmenu(item.id);
    }
  }, [pathname, item.id, hasChildren]);

  const isOpen = openSubmenus[item.id];
  const itemBadge = item.id === "my_submissions" && savedCount > 0 ? savedCount : item.badge;

  return (
    <div className="w-full">
      {hasChildren ? (
        <button
          onClick={() => toggleSubmenu(item.id)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
            isActive 
              ? "bg-primary/10 text-primary font-bold" 
              : "hover:bg-primary/5 text-muted-foreground hover:text-primary"
          )}
        >
          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-primary/70 group-hover:text-primary")} />
          <span className="text-sm flex-1 text-left tracking-tight font-medium">{item.label}</span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      ) : (
        <Link
          to={item.path}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
            isActive 
              ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 scale-[1.02]" 
              : "hover:bg-primary/5 text-muted-foreground hover:text-primary",
            depth > 0 && "ml-4 py-2"
          )}
          onClick={() => {
            if (onClose && !hasChildren) onClose();
          }}
        >
          <Icon className={cn("h-4 w-4 shrink-0 transition-all duration-300", isActive ? "text-primary-foreground" : "text-primary group-hover:scale-110")} />
          <span className={cn("text-sm flex-1 tracking-tight font-medium", depth > 0 ? "text-xs" : "text-sm")}>{item.label}</span>
          {itemBadge && (
            <Badge variant={isActive ? "secondary" : "default"} className="h-5 min-w-[20px] px-1.5 bg-primary/20 text-primary border-none text-[10px] font-bold">
              {itemBadge}
            </Badge>
          )}
          {isActive && depth === 0 && (
            <div className="absolute left-1 w-1 h-5 bg-white/40 rounded-full" />
          )}
        </Link>
      )}

      {hasChildren && isOpen && (
        <div className="mt-1 space-y-1 ml-4 border-l border-primary/10 pl-2 animate-in slide-in-from-top-2 duration-200">
          {validChildren.map(child => (
            <SidebarNavigationItem 
              key={child.id}
              item={child} 
              depth={depth + 1} 
              pathname={pathname}
              fullPath={fullPath}
              savedCount={savedCount}
              openSubmenus={openSubmenus}
              toggleSubmenu={toggleSubmenu}
              onClose={onClose}
              filterFn={filterFn}
            />
          ))}
        </div>
      )}
    </div>
  );
}
