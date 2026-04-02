import { CalendarDays, ClipboardList, LogOut, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import SubmissionsPanel from "@/components/SubmissionsPanel";

export default function Header() {
  const { savedCount } = useSubmissions();
  const { user, signOut, isAdmin } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-primary">📌 AgendIlha</span>
          <span className="hidden sm:inline text-sm text-muted-foreground">/ Coé a Boa?</span>
          {isAdmin && (
            <Badge variant="outline" className="text-xs text-accent border-accent">
              Admin
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user && profile.responsible_name && (
            <span className="hidden sm:inline text-sm font-medium text-foreground truncate max-w-[150px]">
              Olá, {profile.responsible_name.split(" ")[0]}
            </span>
          )}
          {user && (
            <>
              <SubmissionsPanel>
                <Button
                  size="sm"
                  className="font-display font-semibold gradient-sunset text-primary-foreground shadow-card hover:opacity-90 transition-all"
                >
                  <ClipboardList className="mr-1.5 h-4 w-4" />
                  Envios
                  {savedCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 text-xs font-medium bg-white/20 text-white">
                      {savedCount}
                    </Badge>
                  )}
                </Button>
              </SubmissionsPanel>
              {isAdmin && (
                <>
                  <Button size="sm" variant="outline" onClick={() => navigate("/admin/events")} className="text-xs">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Eventos
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate("/admin/users")} className="text-xs">
                    <Users className="h-4 w-4 mr-1" />
                    Usuários
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" onClick={signOut} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
