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
      // Base queries for raw data
      let submissionsQuery = supabase.from("submissions").select("*");
      let profilesQuery = supabase.from("profiles").select("*");
      let favoritesQuery = supabase.from("user_favorites").select("*");
      let artistsQuery = supabase.from("artist_profiles").select("*");
      let placesQuery = supabase.from("places").select("*");
      let rolesQuery = supabase.from("app_user_roles").select("user_id, app_roles(name)");

      // Apply Period Filter
      const now = new Date();
      let cutoffDate = null;
      if (filters.period === "week") cutoffDate = subDays(now, 7);
      else if (filters.period === "month") cutoffDate = subDays(now, 30);
      else if (filters.period === "year") cutoffDate = subDays(now, 365);

      if (cutoffDate) {
        const isoDate = cutoffDate.toISOString();
        submissionsQuery = submissionsQuery.gte("created_at", isoDate);
        profilesQuery = profilesQuery.gte("created_at", isoDate);
        favoritesQuery = favoritesQuery.gte("created_at", isoDate);
      }

      // Apply other filters
      if (filters.neighborhood !== "all") submissionsQuery = submissionsQuery.eq("address_neighborhood", filters.neighborhood);
      if (filters.category !== "all") submissionsQuery = submissionsQuery.eq("category", filters.category);
      if (filters.status !== "all") submissionsQuery = submissionsQuery.eq("status", filters.status);

      // Execute all queries in parallel
      const [
        { data: submissions = [] },
        { data: profiles = [] },
        { data: favorites = [] },
        { data: artists = [] },
        { data: places = [] },
        { data: userRoles = [] }
      ] = await Promise.all([
        submissionsQuery,
        profilesQuery,
        favoritesQuery,
        artistsQuery,
        placesQuery,
        rolesQuery
      ]);

      // Calculate KPIs
      const totalUsers = profiles.length;
      const adminsCount = userRoles.filter(ur => (ur.app_roles as any)?.name === 'admin' || (ur.app_roles as any)?.name === 'master_admin').length;
      const promotersCount = profiles.filter(p => p.role === 'promoter').length;
      const publicUsersCount = totalUsers - adminsCount - promotersCount;

      const totalEvents = submissions.length;
      const pendingEvents = submissions.filter(s => s.status === 'pending' || s.status === 'analysis').length;
      const approvedEvents = submissions.filter(s => s.status === 'approved' || s.status === 'published').length;
      const cancelledEvents = submissions.filter(s => s.status === 'rejected' || s.status === 'blocked').length;

      const neighborhoodsWithEvents = new Set(submissions.filter(s => s.status === 'approved' || s.status === 'published').map(s => s.address_neighborhood)).size;

      // Charts Data
      // 1. Users by Type
      const usersByType = [
        { name: 'Público', value: publicUsersCount },
        { name: 'Divulgadores', value: promotersCount },
        { name: 'Admins', value: adminsCount },
      ];

      // 2. Events by Neighborhood (Top 10)
      const neighborhoodCounts: Record<string, number> = {};
      submissions.forEach(s => {
        const n = s.address_neighborhood || "Não informado";
        neighborhoodCounts[n] = (neighborhoodCounts[n] || 0) + 1;
      });
      const eventsByNeighborhood = Object.entries(neighborhoodCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // 3. Events by Period
      const eventsByPeriodMap: Record<string, number> = {};
      submissions.forEach(s => {
        const date = format(new Date(s.created_at), "dd/MM");
        eventsByPeriodMap[date] = (eventsByPeriodMap[date] || 0) + 1;
      });
      const eventsByPeriod = Object.entries(eventsByPeriodMap)
        .map(([name, value]) => ({ name, value }))
        .slice(-10);

      // 4. Events by Category
      const categoryMap: Record<string, number> = {};
      submissions.forEach(s => {
        const c = s.category || "Outros";
        categoryMap[c] = (categoryMap[c] || 0) + 1;
      });
      const eventsByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

      // 5. Status Funnel
      const eventStatusFunnel = [
        { name: 'Pendente', value: pendingEvents },
        { name: 'Aprovado', value: approvedEvents },
        { name: 'Cancelado', value: cancelledEvents },
      ];

      // 6. New Users Evolution
      const newUsersMap: Record<string, number> = {};
      profiles.forEach(p => {
        const date = format(new Date(p.created_at), "dd/MM");
        newUsersMap[date] = (newUsersMap[date] || 0) + 1;
      });
      const newUsersEvolution = Object.entries(newUsersMap)
        .map(([name, value]) => ({ name, value }))
        .slice(-10);

      // Rankings
      // Top Events by Favorites
      const favCounts: Record<string, number> = {};
      favorites.forEach(f => {
        if (f.event_id) favCounts[f.event_id] = (favCounts[f.event_id] || 0) + 1;
      });
      const topEvents = Object.entries(favCounts)
        .map(([id, count]) => {
          const event = submissions.find(s => s.id === id);
          return { name: event?.event_title || "Evento Desconhecido", count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top Neighborhoods by Favorites
      const neighborhoodFavs: Record<string, number> = {};
      favorites.forEach(f => {
        const event = submissions.find(s => s.id === f.event_id);
        if (event) {
          const n = event.address_neighborhood || "Não informado";
          neighborhoodFavs[n] = (neighborhoodFavs[n] || 0) + 1;
        }
      });
      const topNeighborhoodsByFavs = Object.entries(neighborhoodFavs)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top Places by Favorites
      const placeFavs: Record<string, number> = {};
      favorites.forEach(f => {
        const event = submissions.find(s => s.id === f.event_id);
        if (event && event.location) {
          placeFavs[event.location] = (placeFavs[event.location] || 0) + 1;
        }
      });
      const topPlaces = Object.entries(placeFavs)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top Artists by Favorites
      const artistFavs: Record<string, number> = {};
      favorites.forEach(f => {
        const event = submissions.find(s => s.id === f.event_id);
        if (event && event.artist_id) {
          const artist = artists.find(a => a.id === event.artist_id);
          const name = artist?.name || "Artista Desconhecido";
          artistFavs[name] = (artistFavs[name] || 0) + 1;
        }
      });
      const topArtists = Object.entries(artistFavs)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top Promoters
      const promoterApprovedCounts: Record<string, number> = {};
      submissions.filter(s => s.status === 'approved' || s.status === 'published').forEach(s => {
        promoterApprovedCounts[s.user_id] = (promoterApprovedCounts[s.user_id] || 0) + 1;
      });
      const topPromoters = Object.entries(promoterApprovedCounts)
        .map(([uid, count]) => {
          const profile = profiles.find(p => p.user_id === uid);
          return { name: profile?.responsible_name || profile?.company_name || "Divulgador", count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Operational Metrics
      const approvalRate = totalEvents > 0 ? Math.round((approvedEvents / totalEvents) * 100) : 0;
      const rejectionRate = totalEvents > 0 ? Math.round((cancelledEvents / totalEvents) * 100) : 0;
      
      // Moderation Time (placeholder calculation for now)
      const avgModerationTime = "2.4h"; 
      const awaitingAnalysis = pendingEvents;
      const eventsWithZeroFavs = submissions.filter(s => !favCounts[s.id]).length;
      const newUsersInPeriod = profiles.length;

      // 7. Neighborhoods Comparison (Events vs Favorites)
      const neighborhoodComparison = Object.entries(neighborhoodCounts)
        .map(([name, events]) => ({
          name,
          events,
          favorites: neighborhoodFavs[name] || 0
        }))
        .sort((a, b) => (b.events + b.favorites) - (a.events + a.favorites))
        .slice(0, 8);

      return {
        kpis: {
          totalUsers,
          publicUsers: publicUsersCount,
          promoters: promotersCount,
          admins: adminsCount,
          totalEvents,
          pendingEvents,
          approvedEvents,
          cancelledEvents,
          totalFavorites: favorites.length,
          totalArtists: artists.length,
          totalPlaces: places.length,
          neighborhoodsWithEvents
        },
        charts: {
          usersByType,
          eventsByNeighborhood,
          eventsByPeriod,
          placesByFavorites: topPlaces,
          artistsByFavorites: topArtists,
          eventsByCategory,
          eventStatusFunnel,
          newUsersEvolution,
          neighborhoodComparison
        },
        rankings: {
          topEvents,
          topNeighborhoods: eventsByNeighborhood.map(n => ({ name: n.name, count: n.value })),
          topPlaces: topPlaces.slice(0, 5),
          topArtists: topArtists.slice(0, 5),
          topPromoters: topPromoters.slice(0, 5)
        },
        metrics: {
          approvalRate,
          rejectionRate,
          avgModerationTime,
          awaitingAnalysis,
          eventsWithZeroFavs,
          newUsersInPeriod
        },
        allNeighborhoods: Array.from(new Set(submissions.map(s => s.address_neighborhood))).filter(Boolean) as string[]
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
