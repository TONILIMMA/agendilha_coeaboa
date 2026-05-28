import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBadge } from "@/hooks/useUserBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  CalendarCheck,
  Loader2,
  History as HistoryIcon,
  LayoutDashboard,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MasterPanel } from "@/components/admin-dashboard/AdminDashboard";

interface AdminUser {
  id: string;
  email: string;
  responsible_name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_master: boolean;
}

export default function AdminMaster() {
  const { user, loading: authLoading } = useAuth();
  const { status, loaded: badgeLoaded } = useUserBadge();

  const [stats, setStats] = useState({ users: 0, admins: 0, approved: 0, newsletter: 0 });
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const usersList: any[] = await res.json();

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const adminsCount = (roles ?? []).filter(r => r.role === 'admin' || r.role === 'master').length;

      const { count: approvedCount } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      const { count: subsCount } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true });

      setStats({
        users: usersList.length,
        admins: adminsCount,
        approved: approvedCount ?? 0,
        newsletter: subsCount ?? 0,
      });
    } catch (e) {
      handleError(e, "Erro ao carregar dados administrativos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user && status === "master") {
      loadAll();
    }
  }, [authLoading, user, status]);

  async function bootstrapToniLima() {
    setBootstrapping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bootstrap-master`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            name: "TONI LIMA",
            phone: "21998554322",
            password: "Master@2025",
          }),
        }
      );
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Falha ao cadastrar");
      }
      toast.success("TONI LIMA cadastrado como Admin Master!");
      loadAll();
    } catch (e) {
      handleError(e, "Erro ao configurar admin padrão");
    } finally {
      setBootstrapping(false);
    }
  }

  if (authLoading || !badgeLoaded) return <LoadingState fullPage message="Autenticando acesso master..." />;
  if (!user) return <Navigate to="/auth" replace />;
  if (status !== "master" && status !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <SectionHeader 
        title="Dashboard Estratégico"
        subtitle="Monitoramento em tempo real e inteligência analítica da plataforma AgendIlha."
        rightElement={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={bootstrapToniLima}
              disabled={bootstrapping}
              variant="outline"
              size="sm"
              className="gap-2 rounded-full"
            >
              {bootstrapping ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
              Admin Padrão
            </Button>
            <Link to="/admin/audit">
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <HistoryIcon className="h-3 w-3" />
                Logs
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs defaultValue="intelligence" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-full w-full max-w-md mx-auto grid grid-cols-2">
          <TabsTrigger value="intelligence" className="rounded-full gap-2 font-bold text-xs uppercase tracking-widest">
            <LayoutDashboard className="h-4 w-4" /> Inteligência
          </TabsTrigger>
          <TabsTrigger value="management" className="rounded-full gap-2 font-bold text-xs uppercase tracking-widest">
            <Shield className="h-4 w-4" /> Gestão
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="mt-0 focus-visible:outline-none">
          <MasterPanel />
        </TabsContent>

        <TabsContent value="management" className="space-y-8 focus-visible:outline-none">
          {loading ? (
            <LoadingState message="Calculando métricas de acesso..." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, label: "Usuários", value: stats.users, color: "text-primary" },
                { icon: Shield, label: "Admins", value: stats.admins, color: "text-secondary" },
                { icon: CalendarCheck, label: "Eventos", value: stats.approved, color: "text-emerald-600" },
                { icon: LayoutDashboard, label: "Newsletter", value: stats.newsletter, color: "text-blue-600" },
              ].map((item, i) => (
                <Card key={i} className="border-border/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className={cn("h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center", item.color)}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                      <p className="text-2xl font-black">{item.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          <div className="flex justify-center py-10">
            <Link to="/admin/users">
              <Button className="rounded-full px-10 h-12 font-bold shadow-lg shadow-primary/20">
                Gerenciar Todos os Usuários
              </Button>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
