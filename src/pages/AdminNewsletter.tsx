import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Search, Download, Mail, Filter } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { useNewsletterSubscribers } from "@/data";

export default function AdminNewsletter() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");

  const { data: subscribers = [], isLoading: loading, error } = useNewsletterSubscribers();
  if (error) toast.error("Erro ao carregar inscritos");

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    subscribers.forEach(s => {
      if (s.neighborhood) set.add(s.neighborhood);
    });
    return Array.from(set).sort();
  }, [subscribers]);

  const filtered = useMemo(() => {
    return subscribers.filter(s => {
      const matchSearch = (s.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (s.email || "").toLowerCase().includes(search.toLowerCase());
      const matchNeighborhood = neighborhoodFilter === "all" || s.neighborhood === neighborhoodFilter;
      return matchSearch && matchNeighborhood;
    });
  }, [subscribers, search, neighborhoodFilter]);

  const exportToCSV = () => {
    const headers = ["Nome", "E-mail", "Bairro", "Data de Inscrição"];
    const rows = filtered.map(s => [
      s.name || "—",
      s.email,
      s.neighborhood || "—",
      new Date(s.created_at).toLocaleDateString("pt-BR")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inscritos-newsletter-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportação concluída!");
  };

  if (authLoading) return <LoadingState fullPage message="Carregando..." />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <SectionHeader 
        title="Inscritos na Newsletter" 
        subtitle="Base de dados de contatos interessados em receber a agenda cultural."
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

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            className="pl-10 h-11 rounded-xl bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-11 rounded-xl bg-background">
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
      </div>

      {loading ? (
        <LoadingState message="Buscando lista de inscritos..." />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={Mail}
          title="Nenhum inscrito encontrado"
          description="A base de newsletter está vazia ou os filtros aplicados não retornaram resultados."
        />
      ) : (
        <Card className="border-border overflow-hidden rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Inscrito</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">E-mail</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Bairro</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Inscrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((subscriber) => (
                  <TableRow key={subscriber.id} className="hover:bg-muted/30 transition-colors border-border">
                    <TableCell className="font-medium py-4">
                      {subscriber.name || <span className="text-muted-foreground italic">Não informado</span>}
                    </TableCell>
                    <TableCell className="py-4 font-mono text-xs">{subscriber.email}</TableCell>
                    <TableCell className="py-4">
                      {subscriber.neighborhood ? (
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50 border-none">
                          {subscriber.neighborhood}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Não informado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-4">
                      {new Date(subscriber.created_at).toLocaleDateString("pt-BR")}
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
