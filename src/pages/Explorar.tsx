import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isToday, isTomorrow, parseISO, addDays, startOfDay, endOfDay, isWithinInterval, nextSaturday, nextSunday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { InlineError } from "@/components/errors/InlineError";
import { SeoHead } from "@/components/seo/SeoHead";

const NEIGHBORHOODS = [
  "Bancários","Cacuia","Cidade Universitária","Cocotá","Freguesia","Galeão",
  "Jardim Carioca","Jardim Guanabara","Moneró","Pitangueiras","Portuguesa",
  "Praia da Bandeira","Ribeira","Tauá","Zumbi",
].sort();

const CATEGORIES: { id: string; label: string }[] = [
  { id: "musica", label: "Música / Shows" },
  { id: "gastronomia", label: "Gastronomia" },
  { id: "cultura", label: "Cultura" },
  { id: "esporte", label: "Esporte" },
  { id: "turismo", label: "Turismo" },
  { id: "familia", label: "Família" },
  { id: "religioso", label: "Religioso" },
  { id: "promocoes", label: "Promoções" },
  { id: "outros", label: "Outros" },
];

type DatePreset = "all" | "today" | "tomorrow" | "weekend" | "next7" | "custom";

function presetMatches(eventDate: string | null, preset: DatePreset, customDate?: Date): boolean {
  if (preset === "all") return true;
  if (!eventDate) return false;
  let d: Date;
  try { d = parseISO(eventDate); if (isNaN(d.getTime())) return false; } catch { return false; }
  const now = new Date();
  switch (preset) {
    case "today": return isToday(d);
    case "tomorrow": return isTomorrow(d);
    case "weekend": {
      const sat = startOfDay(nextSaturday(now));
      const sun = endOfDay(nextSunday(now));
      return isWithinInterval(d, { start: sat, end: sun });
    }
    case "next7": return isWithinInterval(d, { start: startOfDay(now), end: endOfDay(addDays(now, 7)) });
    case "custom": return customDate ? format(d, "yyyy-MM-dd") === format(customDate, "yyyy-MM-dd") : true;
    default: return true;
  }
}

export default function Explorar() {
  return (
    <SectionErrorBoundary context="Explorar">
      <ExplorarInner />
    </SectionErrorBoundary>
  );
}

function ExplorarInner() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialCat = params.get("category") || "all";

  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customDate, setCustomDate] = useState<Date | undefined>();
  const [neighborhood, setNeighborhood] = useState<string>("all");
  const [category, setCategory] = useState<string>(initialCat);
  const [term, setTerm] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ["explorar-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("id, event_title, date, start_time, location, address_neighborhood, category, image_url, description, age_rating")
        .eq("status", "aprovado")
        .order("date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    const list = events.filter(ev => {
      if (!presetMatches(ev.date, datePreset, customDate)) return false;
      if (neighborhood !== "all" && ev.address_neighborhood !== neighborhood) return false;
      if (category !== "all" && ev.category !== category) return false;
      if (q) {
        const haystack = [ev.event_title, ev.location, ev.address_neighborhood, ev.description]
          .filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Ordem: hoje primeiro, depois próximos dias, por fim os sem data / passados
    const rank = (ev: (typeof list)[number]) => {
      if (!ev.date) return 3;
      let d: Date;
      try { d = parseISO(ev.date); } catch { return 3; }
      if (isNaN(d.getTime())) return 3;
      if (isToday(d)) return 0;
      return d >= startOfDay(new Date()) ? 1 : 2;
    };

    return [...list].sort((a, b) => {
      const ra = rank(a), rb = rank(b);
      if (ra !== rb) return ra - rb;
      return (a.date || "9999-12-31").localeCompare(b.date || "9999-12-31");
    });
  }, [events, datePreset, customDate, neighborhood, category, term]);

  const activeFiltersCount =
    (datePreset !== "all" ? 1 : 0) +
    (neighborhood !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (term.trim() ? 1 : 0);

  const clearAll = () => {
    setDatePreset("all");
    setCustomDate(undefined);
    setNeighborhood("all");
    setCategory("all");
    setTerm("");
  };

  const SearchField = (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar por nome, local ou atração"
        className="h-11 pl-10 rounded-xl bg-background"
      />
    </div>
  );

  const DateChips = (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
      {[
        { id: "all", label: "Todos" },
        { id: "today", label: "Hoje" },
        { id: "next7", label: "Próximos dias" },
        { id: "weekend", label: "Este fim de semana" },
        { id: "tomorrow", label: "Amanhã" },
      ].map(c => (
        <button
          key={c.id}
          onClick={() => { setDatePreset(c.id as DatePreset); setCustomDate(undefined); }}
          className={cn(
            "shrink-0 h-9 px-4 rounded-full text-sm font-medium border transition-colors",
            datePreset === c.id
              ? "bg-foreground text-background border-foreground"
              : "bg-transparent text-foreground/80 border-foreground/15 hover:border-foreground/40"
          )}
        >
          {c.label}
        </button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "shrink-0 h-9 px-4 rounded-full text-sm font-medium border inline-flex items-center gap-1.5 transition-colors",
              datePreset === "custom"
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-foreground/80 border-foreground/15 hover:border-foreground/40"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {customDate ? format(customDate, "dd/MM", { locale: ptBR }) : "Escolher data"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={customDate}
            onSelect={(d) => { if (d) { setCustomDate(d); setDatePreset("custom"); } }}
            initialFocus
            locale={ptBR}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const Selects = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Select value={neighborhood} onValueChange={setNeighborhood}>
        <SelectTrigger className="h-11 rounded-xl bg-background">
          <SelectValue placeholder="Bairros" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os bairros</SelectItem>
          {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="h-11 rounded-xl bg-background">
          <SelectValue placeholder="Categorias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as categorias</SelectItem>
          {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <Header />

      <section className="pt-24 sm:pt-32 pb-10 px-4 max-w-6xl mx-auto">
        <SeoHead
          title="Buscar rolê na Ilha — agenda completa | AgendIlha"
          description="Explore a agenda completa da Ilha do Governador: filtre eventos por bairro, data e categoria e ache o rolê certo pra hoje ou pro fim de semana."
          path="/explorar"
        />
        <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full border border-accent mb-6">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-secondary">Agenda completa</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold mb-4 font-display tracking-tight leading-[1.05] text-balance">
            Buscar rolê <span className="text-secondary">na Ilha</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto text-balance leading-relaxed">
            Filtre por bairro, data e categoria pra encontrar o evento certo.
          </p>
        </div>

        {/* Desktop filters */}
        <div className="hidden md:block mb-8 space-y-4 rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm p-5">
          <h2 className="sr-only">Filtrar eventos por data, bairro e categoria</h2>
          {SearchField}
          {DateChips}
          {Selects}
          {activeFiltersCount > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "evento encontrado" : "eventos encontrados"}
              </span>
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs h-8">
                <X className="h-3.5 w-3.5 mr-1" /> Limpar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Mobile filters trigger */}
        <div className="md:hidden mb-6 flex items-center gap-2">
          <h2 className="sr-only">Buscar e filtrar eventos</h2>
          <div className="flex-1">{SearchField}</div>
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 rounded-full shrink-0 gap-2 font-medium px-4">
                <SlidersHorizontal className="h-4 w-4" />
                Filtrar
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-2 text-[10px]">{activeFiltersCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
              <SheetHeader className="text-left mb-4">
                <SheetTitle>Filtrar eventos</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quando</p>
                  {DateChips}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Onde e o quê</p>
                  {Selects}
                </div>
              </div>
              <SheetFooter className="flex-row gap-2 sm:flex-row">
                <Button variant="outline" onClick={clearAll} className="flex-1 rounded-full">Limpar</Button>
                <Button onClick={() => setMobileFiltersOpen(false)} className="flex-1 rounded-full">
                  Ver {filtered.length} {filtered.length === 1 ? "evento" : "eventos"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Grid */}
        <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight mb-4">
          Eventos na Ilha do Governador
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-3xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <InlineError
            error={error}
            title="Não deu pra carregar os rolês agora."
            description="Confere tua conexão e tenta de novo."
            onRetry={() => refetch()}
          />
        ) : filtered.length === 0 ? (
          <div className="bg-muted/30 rounded-3xl p-12 text-center border border-dashed border-primary/15">
            <Sparkles className="h-10 w-10 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">Ainda não temos eventos para este filtro.</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Tente mudar o bairro, a data ou a categoria pra ver mais opções.
            </p>
            <Button variant="outline" onClick={clearAll} className="rounded-full font-semibold">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filtered.map(ev => (
              <DiscoveryEventCard
                key={ev.id}
                event={ev as any}
                variant="compact"
                className="w-full h-auto"
                onClick={() => navigate(`/agenda?event=${ev.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}