import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Calendar, Filter, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { PublicFormLinks } from "@/components/admin/PublicFormLinks";
import { useSubmissions } from "@/data/useSubmissions";
import { exportRowsToCsv } from "@/lib/csv";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminReports() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { isMaster, loading: permsLoading } = useAppPermissions();
  const [search, setSearch] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const { data: eventsRaw = [], isLoading: loading } = useSubmissions();
  const events = eventsRaw as any[];
  
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    events.forEach(e => {
      if (e.address_neighborhood) set.add(e.address_neighborhood);
    });
    return Array.from(set).sort();
  }, [events]);

  const filtered = useMemo(() => {
    return events
      .filter(e => {
        const matchSearch = (e.event_title || "").toLowerCase().includes(search.toLowerCase()) || 
                            (e.atrativo_name || "").toLowerCase().includes(search.toLowerCase());
        const matchNeighborhood = neighborhoodFilter === "all" || e.address_neighborhood === neighborhoodFilter;
        const matchDate = !dateFilter || e.date === dateFilter;
        const isPublic = e.status === 'aprovado';
        
        return isPublic && matchSearch && matchNeighborhood && matchDate;
      })
      .sort((a, b) => {
        return (a.start_time || "").localeCompare(b.start_time || "");
      });
  }, [events, search, neighborhoodFilter, dateFilter]);

  const exportToCSV = () => {
    exportRowsToCsv(
      `relatorio-parceiros-${new Date().toISOString().split("T")[0]}.csv`,
      ["Evento", "Data", "Horário", "Bairro", "Local", "Atrativo"],
      filtered.map((e) => [
        e.event_title || "—",
        e.date ? format(parseISO(e.date), "dd/MM/yyyy") : "—",
        e.start_time || "—",
        e.address_neighborhood || "—",
        e.location || "—",
        e.atrativo_name || "—",
      ])
    );
    toast.success("Exportação concluída!");
  };

  if (authLoading || permsLoading) return <LoadingState fullPage message="Carregando..." />;
  if (!user || (!isAdmin && !isMaster)) return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4">
      <SectionHeader 
        title="Relatório de Parceiros" 
        subtitle="Listagem curada de eventos por região e data para coordenação administrativa."
        rightElement={
          <Button 
            onClick={exportToCSV} 
            variant="outline" 
            className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5 font-bold"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      <PublicFormLinks />



      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar evento ou atração..."
            className="pl-10 h-11 rounded-xl bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
            <SelectTrigger className="h-11 rounded-xl bg-background">
              <SelectValue placeholder="Região / Bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Regiões</SelectItem>
              {neighborhoods.map(n => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input 
            type="date"
            className="h-11 rounded-xl bg-background"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Gerando relatório..." />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={Filter}
          title="Nenhum evento encontrado"
          description="Ajuste os filtros de região ou data para visualizar os eventos."
        />
      ) : (
        <Card className="border-border overflow-hidden rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Evento</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4 text-center">Data/Hora</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Região</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Local</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((event) => (
                  <TableRow key={event.id} className="hover:bg-muted/30 transition-colors border-border">
                    <TableCell className="py-4">
                      <div className="font-bold text-sm">{event.event_title || event.atrativo_name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-medium">{event.atrativo_name}</div>
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <div className="text-sm font-mono">
                        {event.date ? format(parseISO(event.date), "dd/MM") : "--"}
                      </div>
                      <Badge variant="secondary" className="text-[9px] font-black bg-primary/10 text-primary border-none">
                        {event.start_time || "S/H"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
                        {event.address_neighborhood || "ILHA"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-xs font-medium">{event.location}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{event.address_street}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}