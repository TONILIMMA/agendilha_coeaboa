import { useState } from "react";
import { cn } from "@/lib/utils";

import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
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
  Music2,
  ChevronDown,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MasterPanel } from "@/components/admin-dashboard/AdminDashboard";
import { MasterArtistsPanel } from "@/components/admin-master/MasterArtistsPanel";
import { MasterRegistrationsPanel } from "@/components/admin-master/MasterRegistrationsPanel";
import { useAdminMasterStats } from "@/data";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminMaster() {
  const { user, loading: authLoading } = useAuth();
  const { isMaster, loading: permsLoading } = useAppPermissions();

  const canLoadMasterData = !authLoading && !permsLoading && !!user && isMaster;
  const {
    data: stats = { users: 0, admins: 0, approved: 0, newsletter: 0 },
    isLoading: loading,
    refetch: refetchStats,
    error: statsError,
  } = useAdminMasterStats(canLoadMasterData);
  if (statsError) handleError(statsError, "Erro ao carregar dados administrativos");

  const { data: artistsCount = 0 } = useQuery({
    enabled: canLoadMasterData,
    queryKey: ["master-artists-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("artist_profiles")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (authLoading || permsLoading) return <LoadingState fullPage message="Autenticando acesso master..." />;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <SectionHeader 
        title="Dashboard Estratégico"
        subtitle="Monitoramento em tempo real e inteligência analítica da plataforma AgendIlha."
        rightElement={
          <div className="flex flex-wrap gap-2">
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
        <TabsList className="bg-muted/50 p-1 rounded-full w-full max-w-2xl mx-auto grid grid-cols-4 h-10 sm:h-12">
          <TabsTrigger value="intelligence" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 px-3">
            <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Inteligência</span><span className="xs:hidden">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="management" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 px-3">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Gestão</span><span className="xs:hidden">Acesso</span>
          </TabsTrigger>
          <TabsTrigger value="musicos" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 px-3">
            <Music2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Músicos</span><span className="xs:hidden">Música</span>
          </TabsTrigger>
          <TabsTrigger value="cadastros" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest py-2 px-3">
            <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> <span className="hidden xs:inline">Cadastros</span><span className="xs:hidden">Base</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="mt-0 focus-visible:outline-none">
          <MasterPanel />
        </TabsContent>

        <TabsContent value="management" className="space-y-8 focus-visible:outline-none">
          {loading ? (
            <LoadingState message="Calculando métricas de acesso..." />
          ) : (
            <ManagementCards
              items={[
                {
                  icon: Users,
                  label: "Usuários",
                  value: stats.users,
                  color: "text-primary",
                  description: "Total de contas registradas na plataforma.",
                  actions: [
                    { label: "Gerenciar usuários", to: "/admin/users" },
                    { label: "Ver logs de acesso", to: "/master/logs" },
                  ],
                },
                {
                  icon: Shield,
                  label: "Admins",
                  value: stats.admins,
                  color: "text-secondary",
                  description: "Contas com privilégios administrativos ativos.",
                  actions: [
                    { label: "Promover/Revogar admins", to: "/admin/users" },
                  ],
                },
                {
                  icon: CalendarCheck,
                  label: "Eventos",
                  value: stats.approved,
                  color: "text-emerald-600",
                  description: "Eventos aprovados e publicados.",
                  actions: [
                    { label: "Gerenciar eventos", to: "/admin/events" },
                    { label: "Aprovar pendentes", to: "/admin/events?status=pending" },
                  ],
                },
                {
                  icon: LayoutDashboard,
                  label: "Newsletter",
                  value: stats.newsletter,
                  color: "text-blue-600",
                  description: "Inscritos recebendo a newsletter semanal.",
                  actions: [
                    { label: "Ver inscritos", to: "/admin/newsletter" },
                  ],
                },
                {
                  icon: Music2,
                  label: "Músicos",
                  value: artistsCount,
                  color: "text-purple-600",
                  description: "Perfis de artistas cadastrados.",
                  actions: [
                    { label: "Painel de músicos", to: "/master/musicos" },
                  ],
                },
              ]}
            />
          )}
          
          <div className="flex justify-center py-10">
            <Link to="/admin/users">
              <Button className="rounded-full px-10 h-12 font-bold shadow-lg shadow-primary/20">
                Gerenciar Todos os Usuários
              </Button>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="musicos" className="mt-0 focus-visible:outline-none">
          <MasterArtistsPanel />
        </TabsContent>

        <TabsContent value="cadastros" className="mt-0 focus-visible:outline-none">
          <MasterRegistrationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type ManagementItem = {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
  description: string;
  actions: { label: string; to: string }[];
};

function ManagementCards({ items }: { items: ManagementItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <Card
            key={i}
            className={cn(
              "border-border/50 transition-all cursor-pointer hover:shadow-md hover:border-primary/40",
              isOpen && "shadow-lg border-primary/60 ring-1 ring-primary/30 sm:col-span-2 lg:col-span-5"
            )}
            onClick={() => setOpenIndex(isOpen ? null : i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenIndex(isOpen ? null : i);
              }
            }}
            aria-expanded={isOpen}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0", item.color)}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                  <p className="text-2xl font-black">{item.value}</p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
              {isOpen && (
                <div className="mt-5 pt-5 border-t border-border/60 space-y-4 animate-fade-in">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.actions.map((a) => (
                      <Link key={a.to + a.label} to={a.to} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="rounded-full gap-2">
                          {a.label}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
