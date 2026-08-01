import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminEventsKpiData } from "./adminEventsHelpers";

interface AdminEventsKpisProps {
  kpis: AdminEventsKpiData;
  onSelectStatus: (status: string) => void;
}

/** Cartões de resumo da curadoria — clicar filtra a lista pelo status. */
export function AdminEventsKpis({ kpis, onSelectStatus }: AdminEventsKpisProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Card
        onClick={() => onSelectStatus("pendente")}
        className={cn(
          "cursor-pointer border-2 transition-all shadow-sm hover:shadow-md",
          kpis.pending > 0
            ? "bg-amber-50 border-amber-400 ring-2 ring-amber-200 animate-pulse"
            : "bg-card border-transparent",
        )}
      >
        <CardContent className="p-3 sm:p-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
              {kpis.pending > 0 && <AlertCircle className="h-3.5 w-3.5" />} Pendentes
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{kpis.pending}</p>
            {kpis.pending > 0 && (
              <p className="text-[10px] text-amber-700/80 font-bold mt-1">Aguardando curadoria</p>
            )}
          </div>
          <Clock3 className="h-5 w-5 text-amber-500 mt-1" />
        </CardContent>
      </Card>

      <Card onClick={() => onSelectStatus("aprovado")} className="cursor-pointer bg-card border-none shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-3 sm:p-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">Aprovados</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{kpis.approved}</p>
        </CardContent>
      </Card>

      <Card onClick={() => onSelectStatus("rejeitado")} className="cursor-pointer bg-card border-none shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-3 sm:p-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">Rejeitados</p>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{kpis.rejected}</p>
        </CardContent>
      </Card>

      <Card onClick={() => onSelectStatus("all")} className="cursor-pointer bg-card border-none shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-3 sm:p-4">
          <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">Total</p>
          <p className="text-2xl sm:text-3xl font-black text-foreground/70 mt-1">{kpis.total}</p>
        </CardContent>
      </Card>
    </div>
  );
}
