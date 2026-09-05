import React from "react";
import { 
  Sparkles, 
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
  LogIn,
  Eye,
  UserPlus,
  Megaphone,
  Images,
  MessageSquare,
  Building2,
  ShoppingBag,
  Settings2
} from "lucide-react";
import { ROUTES } from "@/routes/config";

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
        path: ROUTES.AGENDA, 
        icon: CalendarDays, 
        roles: ["public_guest", "public_registered", "promoter", "admin", "master"],
        exact: true
      },
      { 
        id: "favorites", 
        label: "Meus Favoritos", 
        path: `${ROUTES.AGENDA}?view=favorites`, 
        icon: Heart, 
        roles: ["public_registered"] 
      },
      {
        id: "anuncios_destaques",
        label: "Anúncios e Destaques",
        path: ROUTES.ANUNCIOS,
        icon: ShoppingBag,
        roles: ["public_guest", "public_registered", "promoter", "admin", "master"],
        children: [
          {
            id: "ver_anuncios",
            label: "Explorar Anúncios",
            path: ROUTES.ANUNCIOS,
            icon: Eye,
            roles: ["public_guest", "public_registered", "promoter", "admin", "master"],
            exact: true
          },
          {
            id: "meus_anuncios",
            label: "Meus Anúncios",
            path: ROUTES.MEUS_ANUNCIOS,
            icon: ShoppingBag,
            roles: ["promoter", "admin", "master"]
          },
          {
            id: "planos_anuncio_admin",
            label: "Planos disponíveis",
            path: ROUTES.ADMIN_PLANOS_ANUNCIO,
            icon: LayoutDashboard,
            roles: ["admin", "master"]
          },
          {
            id: "destaques_admin",
            label: "Gestão de destaques",
            path: ROUTES.ADMIN_DESTAQUES,
            icon: Sparkles,
            roles: ["admin", "master"]
          },
          {
            id: "anuncios_admin",
            label: "Anúncios (Gestão)",
            path: ROUTES.ADMIN_ANUNCIOS,
            icon: LayoutDashboard,
            roles: ["admin", "master"]
          }
        ]
      },
      { 
        id: "artists", 
        label: "Atrativos", 
        path: ROUTES.PROMOTOR_ATRATIVOS, 
        icon: Users, 
        roles: ["promoter", "admin", "master"] 
      },
      {
        id: "estabelecimentos_explorar",
        label: "Locais/Estabelecimentos",
        path: ROUTES.PROMOTOR_ESTABELECIMENTOS,
        icon: Building2,
        roles: ["promoter", "admin", "master"]
      },
      { 
        id: "promoter_ranking", 
        label: "Ranking de Divulgadores", 
        path: ROUTES.RANKING, 
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
        path: ROUTES.MEUS_EVENTOS,
        icon: ClipboardList, 
        roles: ["promoter"] 
      },
      { 
        id: "send_event", 
        label: "Enviar Evento", 
        path: ROUTES.ENVIAR_EVENTO, 
        icon: PlusCircle, 
        roles: ["promoter"] 
      },
      {
        id: "promotor_perfil",
        label: "Perfil de Divulgador",
        path: ROUTES.PROMOTOR_PERFIL,
        icon: User,
        roles: ["promoter", "admin", "master"]
      },
      { 
        id: "manage_events", 
        label: "Gerenciar Eventos", 
        path: ROUTES.ADMIN_EVENTS, 
        icon: ShieldCheck, 
        roles: ["admin", "master"] 
      },
      { 
        id: "flyer_moderator", 
        label: "Moderador de Flyers", 
        path: ROUTES.ADMIN_MEDIA, 
        icon: Shield, 
        roles: ["admin", "master"] 
      },
      {
        id: "agenda_informa",
        label: "AgendIlha Informa",
        path: ROUTES.ADMIN_AGENDA_INFORMA,
        icon: Megaphone,
        roles: ["admin", "master"]
      },
      {
        id: "carrossel",
        label: "Carrossel WhatsApp",
        path: "/carrossel",
        icon: Images,
        roles: ["admin", "master"]
      },
      {
        id: "whatsapp_templates",
        label: "Templates WhatsApp",
        path: ROUTES.ADMIN_WHATSAPP_TEMPLATES,
        icon: MessageSquare,
        roles: ["admin", "master"]
      },
      {
        id: "configuracoes_admin",
        label: "Configurações",
        path: ROUTES.ADMIN_CONFIGURACOES,
        icon: Settings2,
        roles: ["admin", "master"]
      },
      {
        id: "atrativos_admin",
        label: "Atrativos (gestão)",
        path: ROUTES.ADMIN_ATRATIVOS,
        icon: Users,
        roles: ["admin", "master"]
      },
      {
        id: "estabelecimentos_admin",
        label: "Estabelecimentos",
        path: ROUTES.ADMIN_ESTABELECIMENTOS,
        icon: Building2,
        roles: ["admin", "master"]
      },
      {
        id: "divulgadores_admin",
        label: "Divulgadores",
        path: ROUTES.ADMIN_USERS,
        icon: Megaphone,
        roles: ["admin", "master"]
      }
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
        path: ROUTES.ADMIN_EVENTS, 
        icon: LayoutDashboard, 
        roles: ["admin"] 
      },
      { 
        id: "master_panel", 
        label: "Painel Master", 
        path: ROUTES.MASTER_DASHBOARD, 
        icon: Crown, 
        roles: ["master"],
        children: [
          { id: "master_overview", label: "Visão Geral", path: ROUTES.MASTER_DASHBOARD, icon: Eye, roles: ["master"] },
          { id: "audit_logs", label: "Logs de Auditoria", path: ROUTES.MASTER_LOGS, icon: History, roles: ["master"] }
        ]
      },
      { 
        id: "manage_users", 
        label: "Gerenciar Usuários", 
        path: ROUTES.MASTER_USUARIOS, 
        icon: Users, 
        roles: ["master"] 
      }
    ]
  },
  {
    id: "conta",
    title: "Conta",
    roles: ["public_guest", "public_registered", "promoter", "admin", "master"],
    items: [
      {
        id: "divulgador_status",
        label: "Seja Divulgador",
        path: ROUTES.DIVULGADOR_STATUS,
        icon: Megaphone,
        roles: ["public_registered"]
      },
      { 
        id: "profile", 
        label: "Meu Perfil", 
        path: ROUTES.PERFIL, 
        icon: User, 
        roles: ["public_registered", "promoter", "admin", "master"] 
      },
      { 
        id: "login", 
        label: "Entrar", 
        path: ROUTES.AUTH, 
        icon: LogIn, 
        roles: ["public_guest"] 
      },
      { 
        id: "register", 
        label: "Criar conta", 
        path: `${ROUTES.AUTH}?mode=signup`, 
        icon: UserPlus, 
        roles: ["public_guest"] 
      }
    ]
  }
];