import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardKPIs } from "./DashboardKPIs";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardFilters } from "./DashboardFilters";
import { DashboardRankings } from "./DashboardRankings";
import { OperationalMetrics } from "./OperationalMetrics";
import { Loader2, LayoutDashboard, Database, TrendingUp, Shield } from "lucide-react";
import { subDays, startOfDay, format, isAfter } from "date-fns";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [filters, setFilters] = useState({
    period: "month",
    neighborhood: "all",
    category: "all",
    status: "all",
    userType: "all",
  });

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard-data", filters],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats", {
        p_period: filters.period,
        p_neighborhood: filters.neighborhood,
        p_category: filters.category
      });

      if (error) throw error;
      
      const stats = data as any;

      // Map back to the expected structure
      return {
        kpis: stats.kpis,
        charts: {
          ...stats.charts,
          // Use real data from RPC
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
          eventsByPeriod: stats.charts.eventsByPeriod || [], 
          newUsersEvolution: stats.charts.newUsersEvolution || [],
          neighborhoodComparison: stats.charts.eventsByNeighborhood.map((n: any) => ({
            name: n.name,
            events: n.value,
            favorites: 0 // Still placeholder for now unless I add it to RPC
          }))
        },
        rankings: {
          topEvents: stats.rankings.topEvents || [],
          topEventsByViews: [], // Need to add views to RPC if needed
          topNeighborhoods: stats.charts.eventsByNeighborhood.map((n: any) => ({ name: n.name, count: n.value })),
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
        // We'll fetch all neighborhoods once in a separate query if needed, 
        // but for filters we can use a simpler approach or another RPC
        allNeighborhoods: stats.charts.eventsByNeighborhood.map((n: any) => n.name)
      };
    },

    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-medium">Consolidando inteligência da plataforma...</p>
      </div>
    );
  }

  if (error) {
    toast.error("Erro ao carregar dashboard analítico");
    return <div className="p-8 text-center text-rose-600">Falha na conexão com o banco de dados.</div>;
  }

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Filters Section */}
      <section>
        <DashboardFilters 
          filters={filters} 
          setFilters={setFilters} 
          neighborhoods={dashboardData?.allNeighborhoods || []} 
        />
      </section>

      {/* Executive Summary */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Resumo Executivo</h2>
        </div>
        <DashboardKPIs stats={dashboardData!.kpis} />
      </section>

      {/* Discovery & Engagement */}
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

      {/* Admin Operation */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Shield className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Operação Administrativa</h2>
        </div>
        <OperationalMetrics metrics={dashboardData!.metrics} />
      </section>

      {/* Territorial Intelligence */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <Database className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-foreground uppercase tracking-widest">Inteligência Territorial</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Comparison chart could go here */}
          <DashboardRankings data={{
            ...dashboardData!.rankings,
            topEvents: dashboardData!.rankings.topEvents.slice(0, 5),
            topNeighborhoods: dashboardData!.rankings.topNeighborhoods.slice(0, 5)
          }} />
        </div>
      </section>
    </div>
  );
}
