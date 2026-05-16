import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Loader2, Search, Download, Mail } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

export default function AdminNewsletter() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");

  async function fetchSubscribers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar inscritos");
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchSubscribers();
  }, [isAdmin]);

  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    subscribers.forEach(s => {
      if (s.neighborhood) set.add(s.neighborhood);
    });
    return Array.from(set).sort();
  }, [subscribers]);

  const stats = useMemo(() => {
    const neighborhoodCounts: Record<string, number> = {};
    subscribers.forEach(s => {
      const n = s.neighborhood || "Não informado";
      neighborhoodCounts[n] = (neighborhoodCounts[n] || 0) + 1;
    });
    return neighborhoodCounts;
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
    toast.success("CSV exportado com sucesso!");
  };

  if (authLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-black font-display text-foreground flex items-center gap-2">
              <Mail className="h-8 w-8 text-primary" />
              Inscritos Newsletter
            </h1>
            <p className="text-muted-foreground font-medium">Controle de público e alcance por bairro.</p>
          </div>
          <Button onClick={exportToCSV} className="rounded-full font-bold h-12 px-8 gradient-sunset shadow-lg">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {Object.entries(stats).sort((a, b) => b[1] - a[1]).map(([n, count]) => (
            <Card key={n} className="border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest truncate" title={n}>{n}</p>
                <p className="text-2xl font-black text-primary mt-1">{count}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-10 h-12 bg-muted/30 border-none rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
              <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl">
                <SelectValue placeholder="Filtrar por bairro" />
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

        <Card className="border-border shadow-sm overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Nome</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">E-mail</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Bairro</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest text-right">Inscrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      Nenhum inscrito encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-bold text-sm">{s.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold">
                          {s.neighborhood || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}