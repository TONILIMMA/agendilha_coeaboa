import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  AlertCircle, 
  Zap,
  MousePointer2
} from "lucide-react";

interface MetricProps {
  label: string;
  value: string | number;
  icon: any;
  description: string;
}

const Metric = ({ label, value, icon: Icon, description }: MetricProps) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-white/40 border border-white/50">
    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center border border-white/60 shadow-sm text-primary">
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xl font-black text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>
    </div>
  </div>
);

interface OperationalMetricsProps {
  metrics: {
    approvalRate: number;
    rejectionRate: number;
    avgModerationTime: string;
    awaitingAnalysis: number;
    eventsWithZeroFavs: number;
    newUsersInPeriod: number;
    clickThroughRate?: number;
  };
}

export function OperationalMetrics({ metrics }: OperationalMetricsProps) {
  return (
    <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          Métricas Operacionais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Metric 
            label="Taxa de Aprovação" 
            value={`${metrics.approvalRate}%`} 
            icon={CheckCircle} 
            description="Eventos aprovados vs total"
          />
          <Metric 
            label="Taxa de Rejeição" 
            value={`${metrics.rejectionRate}%`} 
            icon={XCircle} 
            description="Eventos rejeitados vs total"
          />
          <Metric 
            label="Tempo de Moderação" 
            value={metrics.avgModerationTime} 
            icon={Clock} 
            description="Média entre cadastro e status"
          />
          <Metric 
            label="Aguardando Análise" 
            value={metrics.awaitingAnalysis} 
            icon={Search} 
            description="Status pending/analysis"
          />
          <Metric 
            label="Sem Engajamento" 
            value={metrics.eventsWithZeroFavs} 
            icon={AlertCircle} 
            description="Eventos com 0 favoritos"
          />
          <Metric 
            label="Novos Usuários" 
            value={metrics.newUsersInPeriod} 
            icon={MousePointer2} 
            description="Cadastrados no período"
          />
        </div>
      </CardContent>
    </Card>
  );
}
