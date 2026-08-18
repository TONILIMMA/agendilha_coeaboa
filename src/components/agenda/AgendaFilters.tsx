import { ArrowUpDown, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryLabels } from "@/components/agenda/types";
import { cn } from "@/lib/utils";

interface AgendaFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  showFavoritesOnly: boolean;
  onToggleFavorites: () => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
}

/** Barra de busca, ordenação e filtros da lista de eventos. */
export function AgendaFilters({
  search,
  onSearchChange,
  sortOrder,
  onToggleSort,
  showFavoritesOnly,
  onToggleFavorites,
  categoryFilter,
  onCategoryChange,
}: AgendaFiltersProps) {
  return (
    <div className="mb-12 space-y-4 sm:space-y-6">
      <div className="bg-card border border-border/60 rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-8 shadow-card ring-1 ring-black/[0.02]">
        <div className="flex flex-col gap-3 sm:gap-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar shows..."
                className="pl-12 h-12 sm:h-14 text-base sm:text-lg border-none bg-muted/40 focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl sm:rounded-3xl"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="relative shrink-0">
              <Button
                variant="outline"
                onClick={onToggleSort}
                className="w-full sm:w-auto h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-3xl border-2 border-primary/10 text-primary font-bold transition-all active:scale-95 bg-card hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center gap-2"
              >
                <ArrowUpDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-300",
                    sortOrder === "desc" && "rotate-180",
                  )}
                />
                <span className="text-[10px] sm:text-xs uppercase tracking-widest">
                  {sortOrder === "asc" ? "Próximos" : "Distantes"}
                </span>
              </Button>
              <div
                className={cn(
                  "absolute -top-1.5 -right-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm",
                  sortOrder === "asc" ? "bg-primary" : "bg-secondary",
                )}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={onToggleFavorites}
              className={cn(
                "w-full sm:w-auto rounded-full h-12 px-6 gap-2 font-bold transition-all active:scale-95",
                showFavoritesOnly
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-primary/10 text-primary hover:bg-primary/5",
              )}
            >
              <Heart className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
              {showFavoritesOnly ? "Mostrando Favoritos" : "Meus Favoritos"}
            </Button>

            <div className="flex-1 w-full">
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger className="h-12 sm:h-13 border-2 border-primary/10 bg-card hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary/20 rounded-xl sm:rounded-2xl font-semibold text-sm">
                  <SelectValue placeholder="Categorias" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="all" className="font-semibold">
                    Todas as categorias
                  </SelectItem>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
