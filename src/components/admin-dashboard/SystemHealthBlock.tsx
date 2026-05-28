import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Mail, HardDrive, RefreshCcw, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemHealthProps {
  health: {
    database: string;
    storage: string;
    newsletter: string;
    last_update: string;
  };
}

export function SystemHealthBlock({ health }: SystemHealthProps) {
  const getStatusIcon = (status: string) => {
    if (status === 'online') return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    return <XCircle className="h-4 w-4 text-rose-500" />;
  };

  const getStatusText = (status: string) => {
    if (status === 'online') return 'Operacional';
    return 'Indisponível';
  };

  return (
    <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Saúde do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Banco de Dados</div>
                <div className="text-xs font-medium">{getStatusText(health.database)}</div>
              </div>
            </div>
            {getStatusIcon(health.database)}
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Storage Flyer</div>
                <div className="text-xs font-medium">{getStatusText(health.storage)}</div>
              </div>
            </div>
            {getStatusIcon(health.storage)}
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Newsletter</div>
                <div className="text-xs font-medium">{getStatusText(health.newsletter)}</div>
              </div>
            </div>
            {getStatusIcon(health.newsletter)}
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-muted-foreground leading-none mb-1">Última Atualização</div>
                <div className="text-xs font-medium">
                  {health.last_update ? format(new Date(health.last_update), "HH:mm, dd 'de' MMM", { locale: ptBR }) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
