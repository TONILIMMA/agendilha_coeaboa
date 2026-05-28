import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardRankings } from "./DashboardRankings";
import { OperationalMetrics } from "./OperationalMetrics";
import { SystemHealthBlock } from "./SystemHealthBlock";
import { Activity, TrendingUp, Shield } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/contexts/AuthContext";

export function MasterPanel() {
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

      if (error) throw error;
      
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
            favorites: 0
          })),
        },
        rankings: {
          topEvents: stats.rankings.topEvents || [],
          topEventsByViews: stats.rankings.topEvents || [],
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

  if (isLoading) return <LoadingState message="Compilando inteligência analítica..." />;

  if (error) {
    return (
      <ErrorState 
        title="Ocorreu uma falha no carregamento"
        message={`Não foi possível conectar ao serviço de inteligência: ${(error as any)?.message || "Internal RPC Error"}`}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
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
          <Activity className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Resumo Executivo</h2>
        </div>
        <DashboardKPIs stats={dashboardData!.kpis} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Descoberta e Engajamento</h2>
        </div>
        <DashboardCharts data={dashboardData!.charts} />
        <DashboardRankings data={dashboardData!.rankings} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Operação Administrativa</h2>
        </div>
        <OperationalMetrics metrics={dashboardData!.metrics} />
      </section>
    </div>
  );
}
