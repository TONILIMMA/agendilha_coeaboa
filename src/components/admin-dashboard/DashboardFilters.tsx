import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardFiltersProps {
  filters: {
    period: string;
    neighborhood: string;
    category: string;
    status: string;
    userType: string;
  };
  setFilters: (filters: any) => void;
  neighborhoods: string[];
}

export function DashboardFilters({ filters, setFilters, neighborhoods }: DashboardFiltersProps) {
  const resetFilters = () => {
    setFilters({
      period: "month",
      neighborhood: "all",
      category: "all",
      status: "all",
      userType: "all",
    });
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
      <CardContent className="p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 mr-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">Filtros</span>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[120px]">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Período</Label>
          <Select value={filters.period} onValueChange={(v) => updateFilter("period", v)}>
            <SelectTrigger className="h-9 bg-white/50 border-white/60 text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
              <SelectItem value="all">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[150px]">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bairro</Label>
          <Select value={filters.neighborhood} onValueChange={(v) => updateFilter("neighborhood", v)}>
            <SelectTrigger className="h-9 bg-white/50 border-white/60 text-xs">
              <SelectValue placeholder="Bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Bairros</SelectItem>
              {neighborhoods.map(n => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[150px]">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoria</Label>
          <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
            <SelectTrigger className="h-9 bg-white/50 border-white/60 text-xs">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="musica">Música</SelectItem>
              <SelectItem value="gastronomia">Gastronomia</SelectItem>
              <SelectItem value="cultura">Cultura / Arte</SelectItem>
              <SelectItem value="esporte">Esporte</SelectItem>
              <SelectItem value="promocoes">Promoções</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1 min-w-[120px]">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
          <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="h-9 bg-white/50 border-white/60 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 text-xs text-muted-foreground hover:text-foreground"
          onClick={resetFilters}
        >
          <X className="h-3 w-3 mr-1.5" /> Limpar
        </Button>
      </CardContent>
    </Card>
  );
}
