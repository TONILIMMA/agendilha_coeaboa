import { useState } from "react";
import { cn } from "@/lib/utils";

import { Navigate, Link } from "react-router-dom";
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
import { callEdge } from "@/lib/edge";
import { useAdminMasterStats } from "@/data";

export default function AdminMaster() {
  const { user, loading: authLoading } = useAuth();
  const { status, loaded: badgeLoaded } = useUserBadge();

  const [bootstrapping, setBootstrapping] = useState(false);

  const isMaster = !authLoading && !!user && status === "master";
  const {
    data: stats = { users: 0, admins: 0, approved: 0, newsletter: 0 },
    isLoading: loading,
    refetch: refetchStats,
    error: statsError,
  } = useAdminMasterStats(isMaster);
  if (statsError) handleError(statsError, "Erro ao carregar dados administrativos");

  async function bootstrapToniLima() {
    setBootstrapping(true);
    try {
      await callEdge("bootstrap-master", {
        name: "TONI LIMA",
        phone: "21998554322",
        password: "Master@2025",
      });
      toast.success("TONI LIMA cadastrado como Admin Master!");
      refetchStats();
    } catch (e) {
      handleError(e, "Erro ao configurar admin padrão");
    } finally {
      setBootstrapping(false);
    }
  }

  if (authLoading || !badgeLoaded) return <LoadingState fullPage message="Autenticando acesso master..." />;
  if (!user) return <Navigate to="/auth" replace />;
  if (status !== "master") return <Navigate to="/" replace />;

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
            <Link to="/master/logs">
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <HistoryIcon className="h-3 w-3" />
                Logs
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs defaultValue="intelligence" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-full w-full max-w-sm mx-auto grid grid-cols-2 h-10 sm:h-12">
          <TabsTrigger value="intelligence" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 px-3">
            <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Inteligência</span><span className="xs:hidden">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 px-3">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Gestão</span><span className="xs:hidden">Acesso</span>
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
