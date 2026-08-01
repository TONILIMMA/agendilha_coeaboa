import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryLabels, statusConfig, type AdminEventsKpiData } from "./adminEventsHelpers";

interface AdminEventsFiltersProps {
  kpis: AdminEventsKpiData;
  search: string;
  statusFilter: string;
  categoryFilter: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onClear: () => void;
}

/** Chips rápidos de status + busca e selects de status/categoria. */
export function AdminEventsFilters({
  kpis, search, statusFilter, categoryFilter,
  onSearchChange, onStatusChange, onCategoryChange, onClear,
}: AdminEventsFiltersProps) {
  const chips = [
    { key: "all",       label: "Todos",     count: kpis.total },
    { key: "pendente",  label: "Pendente",  count: kpis.pending,  cls: "border-amber-300 data-[active=true]:bg-amber-500 data-[active=true]:text-white data-[active=true]:border-amber-500" },
    { key: "aprovado",  label: "Aprovado",  count: kpis.approved, cls: "border-emerald-300 data-[active=true]:bg-emerald-500 data-[active=true]:text-white data-[active=true]:border-emerald-500" },
    { key: "rejeitado", label: "Rejeitado", count: kpis.rejected, cls: "border-rose-300 data-[active=true]:bg-rose-500 data-[active=true]:text-white data-[active=true]:border-rose-500" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mr-1">Filtro rápido:</span>
        {chips.map((chip) => (
          <button
            key={chip.key}
            data-active={statusFilter === chip.key}
            onClick={() => onStatusChange(chip.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
              "bg-card text-foreground hover:bg-muted",
              "data-[active=true]:shadow-sm",
              chip.cls || "data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:border-foreground",
            )}
          >
            {chip.label}
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-foreground/5 text-[10px] font-black">
              {chip.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-card border border-border p-2 rounded-2xl shadow-sm">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, empresa, local ou responsável..."
            className="pl-10 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="md:col-span-3">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="h-11 bg-muted/30 border-none"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-11 bg-muted/30 border-none"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1 flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  onClick={onClear}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Limpar Filtros</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </>
  );
}
