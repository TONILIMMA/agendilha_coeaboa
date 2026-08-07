import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaEmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  onDivulgar: () => void;
}

/** Estado vazio da agenda, sempre indicando o próximo passo. */
export function AgendaEmptyState({
  hasFilters,
  onClearFilters,
  onDivulgar,
}: AgendaEmptyStateProps) {
  return (
    <div className="text-center py-16 px-6 bg-muted/10 rounded-[2rem] border-2 border-dashed border-border/60 animate-in fade-in zoom-in duration-500">
      <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-muted/5">
        <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
      </div>
      <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">
        A Ilha está descansando...
      </h3>
      <p className="text-muted-foreground text-lg font-medium max-w-md mx-auto leading-relaxed mb-8">
        {hasFilters
          ? "Não achamos nada com esses filtros. Tenta abrir mais a busca."
          : "Por enquanto não tem rolê publicado pros próximos dias. Dá uma passada depois."}
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        {hasFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="rounded-full font-bold border-2 h-11 px-8"
          >
            Limpar Filtros
          </Button>
        )}
        <Button
          variant="default"
          onClick={onDivulgar}
          className="rounded-full font-black h-12 px-8 gradient-sunset shadow-lg hover:scale-105 transition-transform"
        >
          Divulgar meu Evento
        </Button>
      </div>
    </div>
  );
}
