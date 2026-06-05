import React from "react";
import { 
  CalendarDays, 
  Users, 
  Heart, 
  Shield, 
  History, 
  ClipboardList,
  User,
  ShieldCheck,
  Crown,
  Trophy,
  PlusCircle,
  LayoutDashboard,
  UserPlus,
  LogIn,
  Eye,
  Settings,
  Activity
} from "lucide-react";

export type Role = "public_guest" | "public_registered" | "promoter" | "admin" | "master";

export interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string | number;
  roles: Role[];
  exact?: boolean;
  children?: SidebarItem[];
}

export interface SidebarSection {
  id: string;
  title: string;
  roles: Role[];
  items: SidebarItem[];
}

export const sidebarConfig: SidebarSection[] = [
  {
    id: "explorar",
    title: "Explorar",
    roles: ["public_guest", "public_registered", "promoter", "admin", "master"],
    items: [
      { 
        id: "events", 
        label: "Eventos", 
        path: "/agenda", 
        icon: CalendarDays, 
        roles: ["public_guest", "public_registered", "promoter", "admin", "master"],
        exact: true
      },
      { 
        id: "favorites", 
        label: "Meus Favoritos", 
        path: "/agenda?view=favorites", 
        icon: Heart, 
        roles: ["public_registered"] 
      },
      { 
        id: "artists", 
        label: "Artistas Locais", 
        path: "/artistas", 
        icon: Users, 
        roles: ["public_guest", "public_registered"] 
      },
      { 
        id: "promoter_ranking", 
        label: "Ranking de Promotores", 
        path: "/ranking", 
        icon: Trophy, 
        roles: ["admin", "master"] 
      },
    ]
  },
  {
    id: "operacao",
    title: "Operação",
    roles: ["promoter", "admin", "master"],
    items: [
      { 
        id: "my_submissions", 
        label: "Meus Envios", 
        path: "/envios", 
        icon: ClipboardList, 
        roles: ["promoter"] 
      },
      { 
        id: "send_event", 
        label: "Enviar Evento", 
        path: "/enviar-evento", 
        icon: PlusCircle, 
        roles: ["promoter"] 
      },
      { 
        id: "manage_events", 
        label: "Gerenciar Eventos", 
        path: "/admin/events", 
        icon: ShieldCheck, 
        roles: ["admin", "master"] 
      },
      { 
        id: "flyer_moderator", 
        label: "Moderador de Flyers", 
        path: "/admin/media", 
        icon: Shield, 
        roles: ["admin", "master"] 
      },
    ]
  },
  {
    id: "governanca",
    title: "Governança",
    roles: ["admin", "master"],
    items: [
      { 
        id: "admin_dashboard", 
        label: "Dashboard Admin", 
        path: "/admin/events", 
        icon: LayoutDashboard, 
        roles: ["admin"] 
      },
      { 
        id: "master_panel", 
        label: "Painel Master", 
        path: "/master/dashboard", 
        icon: Crown, 
        roles: ["master"],
        children: [
          { id: "master_overview", label: "Visão Geral", path: "/master/dashboard", icon: Eye, roles: ["master"] },
          { id: "audit_logs", label: "Logs de Auditoria", path: "/master/logs", icon: History, roles: ["master"] }
        ]
      },
      { 
        id: "manage_users", 
        label: "Gerenciar Usuários", 
        path: "/master/usuarios", 
        icon: Users, 
        roles: ["master"] 
      },
    ]
  },
  {
    id: "conta",
    title: "Conta",
    roles: ["public_guest", "public_registered", "promoter", "admin", "master"],
    items: [
      { 
        id: "profile", 
        label: "Meu Perfil", 
        path: "/perfil", 
        icon: User, 
        roles: ["public_registered", "promoter", "admin", "master"] 
      },
      { 
        id: "login", 
        label: "Entrar", 
        path: "/auth", 
        icon: LogIn, 
        roles: ["public_guest"] 
      },
      { 
        id: "register", 
        label: "Criar conta", 
        path: "/auth?mode=signup", 
        icon: UserPlus, 
        roles: ["public_guest"] 
      },
    ]
  }
];
