import { lazy, Suspense, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardKPIs } from "./DashboardKPIs";
const DashboardCharts = lazy(() =>
  import("./DashboardCharts").then((m) => ({ default: m.DashboardCharts }))
);
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
      const kpis = stats?.kpis ?? {};
      const charts = stats?.charts ?? {};
      const rankings = stats?.rankings ?? {};
      const eventsByNeighborhood = charts.eventsByNeighborhood || [];
      const eventsByCategory = charts.eventsByCategory || [];
      const placesByFavorites = charts.placesByFavorites || [];
      const artistsByFavorites = charts.artistsByFavorites || [];

      return {
        kpis,
        charts: {
          ...charts,
          eventsByNeighborhood,
          eventsByCategory,
          placesByFavorites,
          artistsByFavorites,
          usersByType: [
            { name: 'Público', value: kpis.publicUsers ?? 0 },
            { name: 'Divulgadores', value: kpis.promoters ?? 0 },
            { name: 'Admins', value: kpis.admins ?? 0 },
          ],
          eventStatusFunnel: [
            { name: 'Pendente', value: kpis.pendingEvents ?? 0 },
            { name: 'Aprovado', value: kpis.approvedEvents ?? 0 },
            { name: 'Cancelado', value: kpis.cancelledEvents ?? 0 },
          ],
          eventsByPeriod: (charts.eventsByPeriod || []).map((p: any) => ({
            name: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: p.count
          })),
          newUsersEvolution: (charts.newUsersEvolution || []).map((p: any) => ({
            name: new Date(p.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: p.count
          })),
          neighborhoodComparison: eventsByNeighborhood.map((n: any) => ({
            name: n.name,
            events: n.value,
            favorites: 0
          })),
        },
        rankings: {
          topEvents: rankings.topEvents || [],
          topEventsByViews: rankings.topEvents || [],
          topNeighborhoods: eventsByNeighborhood.map((n: any) => ({ name: n.name, count: n.value })),
          topPlaces: rankings.topPlaces || [],
          topArtists: rankings.topArtists || [],
          topPromoters: rankings.topPromoters || []
        },

        metrics: {
          approvalRate: (kpis.totalEvents ?? 0) > 0 ? Math.round(((kpis.approvedEvents ?? 0) / kpis.totalEvents) * 100) : 0,
          rejectionRate: (kpis.totalEvents ?? 0) > 0 ? Math.round(((kpis.cancelledEvents ?? 0) / kpis.totalEvents) * 100) : 0,
          avgModerationTime: "2.4h", 
          awaitingAnalysis: kpis.pendingEvents ?? 0,
          eventsWithZeroFavs: 0,
          newUsersInPeriod: kpis.totalUsers ?? 0
        },
        health: stats?.system_health,
        allNeighborhoods: eventsByNeighborhood.map((n: any) => n.name)
      };
    },
    refetchInterval: 5 * 60 * 1000, 
    retry: 2
  });

  if (isLoading) return <LoadingState message="Compilando inteligência analítica..." />;

  if (error) {
    return (
      <ErrorState 
        title="Dashboard Temporariamente Indisponível"
        message="Estamos com dificuldades para conectar ao banco de dados. A estrutura do painel permanece ativa, mas os dados analíticos não puderam ser carregados no momento."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {dashboardData?.health && (
        <section>
          <SystemHealthBlock health={dashboardData.health} />
        </section>
      )}

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
        <Suspense fallback={<LoadingState />}>
          <DashboardCharts data={dashboardData!.charts} />
        </Suspense>
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
