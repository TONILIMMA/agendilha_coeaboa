import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileStatusProps {
  status: 'pending' | 'approved' | 'rejected' | 'incomplete';
  completeness: number;
  missingFields: string[];
}

export function ProfileStatus({ status, completeness, missingFields }: ProfileStatusProps) {
  const statusConfig = {
    approved: {
      label: "Aprovado",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Seu perfil está visível para toda a comunidade."
    },
    pending: {
      label: "Em Revisão",
      icon: Clock,
      className: "bg-amber-50 text-amber-700 border-amber-200",
      description: "Nossa equipe está analisando suas informações."
    },
    rejected: {
      label: "Necessita Ajustes",
      icon: AlertCircle,
      className: "bg-rose-50 text-rose-700 border-rose-200",
      description: "Seu perfil precisa de correções para ser aprovado."
    },
    incomplete: {
      label: "Incompleto",
      icon: Circle,
      className: "bg-slate-50 text-slate-700 border-slate-200",
      description: "Complete seu perfil para enviar para análise."
    }
  };

  const config = statusConfig[status] || statusConfig.incomplete;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <div className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all", config.className)}>
        <div className="p-2 bg-white/50 rounded-full shadow-sm shrink-0">
          <StatusIcon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-lg">{config.label}</h3>
            <Badge variant="outline" className="bg-white/50 border-current/20">
              {completeness}% Completo
            </Badge>
          </div>
          <p className="text-sm opacity-90 leading-relaxed">{config.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Progresso do Perfil</span>
          <span className="text-xs font-bold text-primary">{completeness}%</span>
        </div>
        <Progress value={completeness} className="h-2 rounded-full bg-muted shadow-inner" />
      </div>

      {missingFields.length > 0 && status !== 'approved' && (
        <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-primary" /> Pendências
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {missingFields.map((field, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 p-2 rounded-lg border border-white/80">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                {field}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}