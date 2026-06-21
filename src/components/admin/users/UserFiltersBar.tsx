import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Filter, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuickChip {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface Props {
  isMaster: boolean;
  chips: QuickChip[];
  filterSearch: string;
  setFilterSearch: (v: string) => void;
  filterType: string;
  setFilterType: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterPeriod: string;
  setFilterPeriod: (v: string) => void;
}

export function UserFiltersBar({
  isMaster,
  chips,
  filterSearch,
  setFilterSearch,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterPeriod,
  setFilterPeriod,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = filterStatus === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setFilterStatus(chip.key)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : chip.color + " hover:opacity-80"
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold",
                  active ? "bg-primary-foreground/20" : "bg-background/60"
                )}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-9"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Tipo de Usuário" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="usuario">Usuário</SelectItem>
            <SelectItem value="promotor">Promotor</SelectItem>
            <SelectItem value="divulgador">Divulgador</SelectItem>
            <SelectItem value="estabelecimento">Estabelecimento</SelectItem>
            <SelectItem value="artist">Músico / Artista</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Status/Papel" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="user">Público</SelectItem>
            <SelectItem value="collaborator">Divulgador</SelectItem>
            <SelectItem value="artist">Artista</SelectItem>
            {isMaster && (
              <>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="master">Admin Master</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={filterPeriod} onValueChange={setFilterPeriod}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Período" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o Período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}