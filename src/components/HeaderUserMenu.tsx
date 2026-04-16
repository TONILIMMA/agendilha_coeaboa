import { Link, useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon, Settings, Shield, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBadge } from "@/hooks/useUserBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const statusIcon = {
  master: Crown,
  admin: Shield,
  collaborator: UserIcon,
  user: UserIcon,
} as const;

const statusStyles = {
  master:
    "bg-secondary/15 text-secondary border-secondary/30",
  admin:
    "bg-primary/10 text-primary border-primary/25",
  collaborator:
    "bg-foreground/[0.06] text-foreground/75 border-foreground/15",
  user: "bg-muted text-muted-foreground border-border",
} as const;

interface Props {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export function HeaderUserMenu({ variant = "desktop", onNavigate }: Props) {
  const { user, signOut } = useAuth();
  const { name, initials, status, label, loaded } = useUserBadge();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className={variant === "mobile" ? "flex flex-col gap-2.5" : "flex items-center gap-1.5"}>
        <Link to="/auth" onClick={onNavigate}>
          <Button
            size={variant === "mobile" ? "lg" : "sm"}
            variant={variant === "mobile" ? "outline" : "ghost"}
            className={
              variant === "mobile"
                ? "w-full rounded-full bg-white/70"
                : "text-foreground/75 hover:text-foreground rounded-full px-4"
            }
          >
            Entrar
          </Button>
        </Link>
        <Link to="/coeaboa" onClick={onNavigate}>
          <Button
            size={variant === "mobile" ? "lg" : "sm"}
            className={
              variant === "mobile"
                ? "w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                : "rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4"
            }
          >
            Ver agenda
          </Button>
        </Link>
      </div>
    );
  }

  const Icon = status ? statusIcon[status] : UserIcon;
  const badgeStyle = status ? statusStyles[status] : statusStyles.user;
  const showStatusBadge = status === "master" || status === "admin";

  const handleLogout = async () => {
    await signOut();
    onNavigate?.();
    navigate("/");
  };

  if (variant === "mobile") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 rounded-2xl glass">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm font-medium">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-sm font-medium text-foreground truncate">
              {loaded ? name : "Carregando..."}
            </div>
            {showStatusBadge && (
              <div
                className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[9px] tracking-wider uppercase ${badgeStyle}`}
              >
                <Icon className="h-2.5 w-2.5" strokeWidth={2} />
                {label}
              </div>
            )}
          </div>
        </div>
        <Link to="/coeaboa" onClick={onNavigate}>
          <Button size="lg" className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            Ver agenda
          </Button>
        </Link>
        <Button
          size="lg"
          variant="outline"
          className="w-full rounded-full bg-white/70"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Sair
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-white/50 transition-colors group">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-xs font-medium">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="font-display text-[13px] font-medium text-foreground max-w-[140px] truncate">
              {loaded ? name.split(" ")[0] : "..."}
            </span>
            {showStatusBadge && (
              <span
                className={`mt-0.5 inline-flex items-center gap-1 px-1.5 py-0 rounded-full border font-mono text-[8px] tracking-wider uppercase ${badgeStyle}`}
              >
                <Icon className="h-2 w-2" strokeWidth={2.5} />
                {label}
              </span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl glass border-white/40 shadow-elevated p-2">
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm font-medium text-foreground truncate">{name}</div>
              {status && (
                <div
                  className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono text-[9px] tracking-wider uppercase ${badgeStyle}`}
                >
                  <Icon className="h-2.5 w-2.5" strokeWidth={2} />
                  {label}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
          <Link to="/coeaboa">
            <UserIcon className="h-4 w-4 mr-2" />
            Minha área
          </Link>
        </DropdownMenuItem>
        {(status === "admin" || status === "master") && (
          <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
            <Link to="/admin/users">
              <Settings className="h-4 w-4 mr-2" />
              Painel admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="rounded-xl cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
