import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardRankings } from "./DashboardRankings";
import { OperationalMetrics } from "./OperationalMetrics";
import { SystemHealthBlock } from "./SystemHealthBlock";
import { Loader2, LayoutDashboard, Database, TrendingUp, Shield, AlertCircle, RefreshCcw, Activity } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    period: "month",
    neighborhood: "all",
    category: "all",
    status: "all",
    userType: "all",
  });

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-dashboard-data", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats", {
        p_period: filters.period,
        p_neighborhood: filters.neighborhood,
        p_category: filters.category
      });

      if (error) {
        console.error("Dashboard RPC Error:", error);
        throw error;
      }
      
      const stats = data as any;

      return {
        kpis: stats.kpis,
        charts: {
          ...stats.charts,
          usersByType: [
            { name: 'Público', value: stats.kpis.publicUsers },
            { name: 'Divulgadores', value: stats.kpis.promoters },
            { name: 'Admins', value: stats.kpis.admins },
          ],
          eventStatusFunnel: [
            { name: 'Pendente', value: stats.kpis.pendingEvents },
            { name: 'Aprovado', value: stats.kpis.approvedEvents },
            { name: 'Cancelado', value: stats.kpis.cancelledEvents },
          ],
          eventsByPeriod: (stats.charts.eventsByPeriod || []).map((p: any) => ({
            name: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: p.count
          })),
          newUsersEvolution: (stats.charts.newUsersEvolution || []).map((p: any) => ({
            name: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: p.count
          })),
          neighborhoodComparison: (stats.charts.eventsByNeighborhood || []).map((n: any) => ({
            name: n.name,
            events: n.value,
            favorites: 0 // Placeholder
          })),
          eventsByCategory: [
            { name: 'Música', value: 0 },
            { name: 'Gastronomia', value: 0 },
            { name: 'Cultura', value: 0 },
            { name: 'Outros', value: 0 },
          ] // Placeholder or add to RPC if needed
        },
        rankings: {
          topEvents: stats.rankings.topEvents || [],
          topEventsByViews: stats.rankings.topEvents || [], // Reusing views for now
          topNeighborhoods: (stats.charts.eventsByNeighborhood || []).map((n: any) => ({ name: n.name, count: n.value })),
          topPlaces: stats.rankings.topPlaces || [],
          topArtists: stats.rankings.topArtists || [],
          topPromoters: stats.rankings.topPromoters || []
        },
        metrics: {
          approvalRate: stats.kpis.totalEvents > 0 ? Math.round((stats.kpis.approvedEvents / stats.kpis.totalEvents) * 100) : 0,
          rejectionRate: stats.kpis.totalEvents > 0 ? Math.round((stats.kpis.cancelledEvents / stats.kpis.totalEvents) * 100) : 0,
          avgModerationTime: "2.4h", 
          awaitingAnalysis: stats.kpis.pendingEvents,
          eventsWithZeroFavs: 0,
          newUsersInPeriod: stats.kpis.totalUsers
        },
        health: stats.system_health,
        allNeighborhoods: (stats.charts.eventsByNeighborhood || []).map((n: any) => n.name)
      };
    },
    refetchInterval: 5 * 60 * 1000, 
    retry: 2
  });

  if (isLoading) {
    return (
      <div className="space-y-10 animate-fade-in pb-10">
        <section className="space-y-4">
          <Skeleton className="h-20 w-full" />
        </section>
        <section className="space-y-6">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 min-w-[200px] flex-1" />
            ))}
          </div>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[300px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <Alert variant="destructive" className="bg-rose-50 border-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertTitle className="text-rose-800 font-bold">Instabilidade na conexão</AlertTitle>
          <AlertDescription className="text-rose-700">
            Não foi possível carregar os dados analíticos no momento. Isso pode ser uma falha temporária ou permissão insuficiente.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center py-10 gap-4 bg-white/40 rounded-2xl border border-dashed border-slate-200">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">O painel master requer conectividade total com o banco de dados.</p>
            {user?.email?.includes('master') || user?.id && (
              <p className="text-[10px] font-mono text-rose-400 max-w-md mx-auto">
                Erro Técnico: {(error as any)?.message || "Internal RPC Failure"}
              </p>
            )}
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      <section>
        <SystemHealthBlock health={dashboardData!.health} />
      </section>

      <section>
        <DashboardFilters 
          filters={filters} 
          setFilters={setFilters} 
          neighborhoods={dashboardData?.allNeighborhoods || []} 
        />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Activity className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Resumo Executivo</h2>
        </div>
        <DashboardKPIs stats={dashboardData!.kpis} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Descoberta e Engajamento</h2>
        </div>
        <DashboardCharts data={dashboardData!.charts} />
        <DashboardRankings data={dashboardData!.rankings} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Operação Administrativa</h2>
        </div>
        <OperationalMetrics metrics={dashboardData!.metrics} />
      </section>
    </div>
  );
}

