import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  CalendarCheck, 
  Star, 
  Music, 
  MapPin, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  Building2,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface KPIProps {
  label: string;
  value: number | string;
  icon: any;
  tone: string;
  variation?: number;
}

const KPICard = ({ label, value, icon: Icon, tone, variation }: KPIProps) => (
  <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm transition-transform hover:scale-[1.01]">
    <CardContent className="p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
          {label}
        </div>
        <div className="flex items-end gap-2">
          <div className="text-2xl font-display font-semibold text-foreground">
            {value}
          </div>
          {variation !== undefined && (
            <div className={`text-[10px] font-bold flex items-center gap-0.5 mb-1 ${variation >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(variation)}%
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

interface DashboardKPIsProps {
  stats: {
    totalUsers: number;
    publicUsers: number;
    promoters: number;
    admins: number;
    totalEvents: number;
    pendingEvents: number;
    approvedEvents: number;
    cancelledEvents: number;
    totalFavorites: number;
    totalArtists: number;
    totalPlaces: number;
    neighborhoodsWithEvents: number;
  };
}

export function DashboardKPIs({ stats }: DashboardKPIsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <KPICard icon={Users} label="Total Usuários" value={stats.totalUsers} tone="text-blue-600 bg-blue-50 border-blue-100" />
      <KPICard icon={Users} label="Público" value={stats.publicUsers} tone="text-indigo-600 bg-indigo-50 border-indigo-100" />
      <KPICard icon={Users} label="Divulgadores" value={stats.promoters} tone="text-violet-600 bg-violet-50 border-violet-100" />
      <KPICard icon={Shield} label="Admins" value={stats.admins} tone="text-slate-600 bg-slate-50 border-slate-100" />
      <KPICard icon={CalendarCheck} label="Total Eventos" value={stats.totalEvents} tone="text-primary bg-primary/10 border-primary/20" />
      <KPICard icon={Clock} label="Pendentes" value={stats.pendingEvents} tone="text-amber-600 bg-amber-50 border-amber-100" />
      <KPICard icon={CheckCircle} label="Aprovados" value={stats.approvedEvents} tone="text-emerald-600 bg-emerald-50 border-emerald-100" />
      <KPICard icon={XCircle} label="Cancelados" value={stats.cancelledEvents} tone="text-rose-600 bg-rose-50 border-rose-100" />
      <KPICard icon={Star} label="Favoritos" value={stats.totalFavorites} tone="text-orange-600 bg-orange-50 border-orange-100" />
      <KPICard icon={Music} label="Artistas" value={stats.totalArtists} tone="text-purple-600 bg-purple-50 border-purple-100" />
      <KPICard icon={Building2} label="Estabelecimentos" value={stats.totalPlaces} tone="text-cyan-600 bg-cyan-50 border-cyan-100" />
      <KPICard icon={MapPin} label="Bairros Ativos" value={stats.neighborhoodsWithEvents} tone="text-red-600 bg-red-50 border-red-100" />
    </div>
  );
}
