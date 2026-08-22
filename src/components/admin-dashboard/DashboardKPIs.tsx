import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIProps {
  label: string;
  value: number | string;
  icon: any;
  tone: string;
  variation?: number;
  description?: string;
  onClick?: () => void;
}

const KPICard = ({ label, value, icon: Icon, tone, variation, description, onClick }: KPIProps) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const handleInteraction = (e: React.MouseEvent) => {
    // If it's a mobile device or if we want to toggle expansion, do that.
    // But if we have an onClick (like navigation), we should handle it.
    if (onClick) {
      e.stopPropagation();
      onClick();
    } else {
      setExpanded(!expanded);
    }
  };

  return (
    <Card 
      className={cn(
        "bg-white/60 backdrop-blur-md border-white/40 shadow-sm transition-all duration-300 overflow-hidden cursor-pointer group",
        expanded ? "ring-2 ring-primary/20 scale-[1.02] shadow-md" : "hover:scale-[1.01]"
      )}
      onClick={handleInteraction}
    >
      <CardContent className="p-0">
        <div className="p-5 flex items-center gap-4 relative">
          <div className={cn("h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", tone)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-black flex items-center justify-between">
              <span className="truncate">{label}</span>
              {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </div>
            <div className="flex items-end gap-2">
              <div className="text-2xl font-black text-foreground tracking-tighter">
                {value}
              </div>
              {variation !== undefined && (
                <div className={cn("text-[10px] font-black flex items-center gap-0.5 mb-1", variation >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {variation >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(variation)}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        {expanded && (
          <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description || `Total de registros contabilizados na base de ${label.toLowerCase()}.`}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <KPICard icon={Users} label="Total Usuários" value={stats.totalUsers} tone="text-blue-600 bg-blue-50 border-blue-100" description="Soma de todos os perfis cadastrados: Público, Divulgadores e Administradores." onClick={() => navigate("/admin/users")} />
      <KPICard icon={Users} label="Público" value={stats.publicUsers} tone="text-indigo-600 bg-indigo-50 border-indigo-100" description="Usuários que utilizam a agenda para busca e salvamento de favoritos." onClick={() => navigate("/admin/users?type=usuario")} />
      <KPICard icon={Users} label="Divulgadores" value={stats.promoters} tone="text-violet-600 bg-violet-50 border-violet-100" description="Produtores e estabelecimentos com permissão para publicar eventos." onClick={() => navigate("/admin/users?type=divulgador")} />
      <KPICard icon={Shield} label="Admins" value={stats.admins} tone="text-slate-600 bg-slate-50 border-slate-100" description="Corpo administrativo com acesso total às ferramentas de gestão." onClick={() => navigate("/admin/users?role=admin")} />
      <KPICard icon={CalendarCheck} label="Total Eventos" value={stats.totalEvents} tone="text-primary bg-primary/10 border-primary/20" description="Volume total de submissões recebidas pela plataforma desde o início." onClick={() => navigate("/admin/events")} />
      <KPICard icon={Clock} label="Pendentes" value={stats.pendingEvents} tone="text-amber-600 bg-amber-50 border-amber-100" description="Eventos aguardando análise da curadoria para publicação ou ajuste." onClick={() => navigate("/admin/events?status=pending")} />
      <KPICard icon={CheckCircle} label="Aprovados" value={stats.approvedEvents} tone="text-emerald-600 bg-emerald-50 border-emerald-100" description="Eventos validados e visíveis para o público na agenda cultural." onClick={() => navigate("/admin/events?status=approved")} />
      <KPICard icon={XCircle} label="Cancelados" value={stats.cancelledEvents} tone="text-rose-600 bg-rose-50 border-rose-100" description="Eventos que foram rejeitados pela curadoria ou cancelados pelo autor." onClick={() => navigate("/admin/events?status=cancelled")} />
      <KPICard icon={Star} label="Favoritos" value={stats.totalFavorites} tone="text-orange-600 bg-orange-50 border-orange-100" description="Total de marcações de interesse realizadas pelos usuários nos eventos." />
      <KPICard icon={Music} label="Artistas" value={stats.totalArtists} tone="text-purple-600 bg-purple-50 border-purple-100" description="Base de músicos, bandas e artistas locais cadastrados como atrativos." onClick={() => navigate("/admin/artists")} />
      <KPICard icon={Building2} label="Estabelecimentos" value={stats.totalPlaces} tone="text-cyan-600 bg-cyan-50 border-cyan-100" description="Casas de show, bares e locais físicos parceiros da AgendIlha." onClick={() => navigate("/admin/estabelecimentos")} />
      <KPICard icon={MapPin} label="Bairros Ativos" value={stats.neighborhoodsWithEvents} tone="text-red-600 bg-red-50 border-red-100" description="Número de bairros diferentes que possuem ao menos um evento ativo." />
    </div>
  );
}
