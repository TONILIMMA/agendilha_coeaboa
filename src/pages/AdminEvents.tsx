import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays, Loader2, MessageCircle, Trash2, Search,
  FileDown, SlidersHorizontal, MapPin, Clock, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { exportSingleEventPdf, exportBulkEventsPdf } from "@/lib/pdfExport";

interface Submission {
  id: string;
  created_at: string;
  user_id: string;
  company_name: string | null;
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  description: string | null;
  video_link: string | null;
  category: string | null;
  promotion_type: string | null;
  target_audience: string | null;
  promotion_rules: string | null;
  contact_social: string | null;
  additional_details: string | null;
}

const categoryLabels: Record<string, string> = {
  musica: "Música / Show",
  gastronomia: "Gastronomia",
  cultura: "Cultura / Arte",
  esporte: "Esporte",
  promocoes: "Promoções / Ofertas",
  outros: "Outros",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

function getDayOfWeek(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR", { weekday: "long" }).replace(/^\w/, c => c.toUpperCase());
    }
  }
  return "";
}

function buildWhatsAppMessage(sub: Submission): string {
  const dayOfWeek = getDayOfWeek(sub.date || "");
  const lines = [
    `*AGENDILHA* - sua agenda de eventos da Ilha do Governador`,
    `*Para mais informações:*`,
    `https://coeaboa.lovable.app/`,
    "",
    `🗓️ ${dayOfWeek ? dayOfWeek + " " : ""}${sub.date || ""}`,
    "",
    `🎙️ ${sub.start_time || ""}${sub.end_time ? ` às ${sub.end_time}` : ""} *${sub.event_title || "Evento"}*`,
    `👉 ${sub.location || ""}`,
    `✔️ Mais informações: https://coeaboa.lovable.app/`,
  ];
  return encodeURIComponent(lines.join("\n"));
}

function downloadEventPdf(sub: Submission) {
  exportSingleEventPdf(sub);
  toast.success("PDF gerado com sucesso!");
}

export default function AdminEvents() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "date">("newest");

  async function fetchAll() {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar eventos");
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover evento");
    } else {
      toast.success("Evento removido");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
  }

  const filtered = useMemo(() => {
    let list = [...submissions];

    if (categoryFilter !== "all") {
      list = list.filter((s) => s.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.event_title.toLowerCase().includes(q) ||
          (s.company_name || "").toLowerCase().includes(q) ||
          (s.location || "").toLowerCase().includes(q) ||
          (s.responsible_name || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "oldest") {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === "date") {
      list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    }

    return list;
  }, [submissions, categoryFilter, search, sortBy]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-display font-bold text-foreground">Todos os Eventos</h1>
          <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            exportBulkEventsPdf(filtered);
            toast.success("PDF com todos os eventos gerado!");
          }}
          disabled={filtered.length === 0}
          className="text-xs"
        >
          <FileDown className="mr-1.5 h-3.5 w-3.5" />
          Exportar Todos (PDF)
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-5 border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, empresa, local..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <SlidersHorizontal className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mais recente</SelectItem>
                <SelectItem value="oldest">Mais antigo</SelectItem>
                <SelectItem value="date">Data do evento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm">Nenhum evento encontrado.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => (
            <Card key={sub.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-foreground text-base">
                        {sub.event_title}
                      </h3>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {categoryLabels[sub.category || ""] || "—"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {sub.date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {sub.date} {sub.start_time && `às ${sub.start_time}`}{sub.end_time && ` - ${sub.end_time}`}
                        </span>
                      )}
                      {sub.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {sub.location}
                        </span>
                      )}
                      {sub.company_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {sub.company_name}
                        </span>
                      )}
                    </div>

                    {sub.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 italic">
                        "{sub.description}"
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground/60">
                      Enviado em {formatDate(sub.created_at)}
                      {sub.responsible_name && ` por ${sub.responsible_name}`}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => window.open(`https://wa.me/?text=${buildWhatsAppMessage(sub)}`, "_blank")}
                      className="bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white text-xs"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      WhatsApp
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadEventPdf(sub)}
                      className="text-xs"
                    >
                      <FileDown className="mr-1.5 h-3.5 w-3.5" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(sub.id)}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
