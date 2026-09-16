import { Link, useLocation } from "react-router-dom";
import { CalendarDays, Compass, Heart, Home, Menu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onMenuClick: () => void;
}

const items = [
  { label: "Início", icon: Home, path: "/", match: (p: string) => p === "/" },
  { label: "Eventos", icon: Compass, path: "/explorar", match: (p: string) => p.startsWith("/explorar") },
  { label: "Agenda", icon: CalendarDays, path: "/agenda", match: (p: string, s: string) => p === "/agenda" && !s.includes("favorites") },
  { label: "Coé a Boa?", icon: Sparkles, path: "/coe-a-boa", match: (p: string) => p.startsWith("/coe-a-boa") },
  { label: "Favoritos", icon: Heart, path: "/agenda?view=favorites", match: (_p: string, s: string) => s.includes("favorites") },
];

/**
 * Barra de navegação inferior — só no mobile.
 * Fica escondida em telas que já têm barra de ação fixa (detalhe do evento, impressão).
 */
export function MobileTabBar({ onMenuClick }: Props) {
  const { pathname, search } = useLocation();

  const hidden =
    pathname.startsWith("/evento/") ||
    pathname.startsWith("/enviar-evento") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/cadastro");

  if (hidden) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-6">
        {items.map((item) => {
          const active = item.match(pathname, search);
          const Icon = item.icon;
          return (
            <li key={item.label} className="min-w-0">
              <Link
                to={item.path}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 px-1 transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", active && "fill-primary/10")} />
                <span className="w-full truncate text-center text-[10px] font-semibold leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menu"
            className="flex h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-muted-foreground transition-colors active:text-primary"
          >
            <Menu className="h-5 w-5 shrink-0" />
            <span className="w-full truncate text-center text-[10px] font-semibold leading-none">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Espaçador para o conteúdo não ficar embaixo da barra inferior. */
export function MobileTabBarSpacer() {
  return <div className="md:hidden h-14 pb-[env(safe-area-inset-bottom)]" aria-hidden="true" />;
}