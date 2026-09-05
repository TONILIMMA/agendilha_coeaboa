import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, ExternalLink } from "lucide-react";
import { format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface HighlightedEvent {
  id: string;
  event_title: string;
  status: string;
  is_highlight: boolean;
  highlight_until: string | null;
  date: string;
}

export function HighlightedEventsPanel() {
  const [events, setEvents] = useState<HighlightedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHighlights() {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("id, event_title, status, is_highlight, highlight_until, date")
        .eq("is_highlight", true)
        .not("highlight_until", "is", null)
        .order("highlight_until", { ascending: false });

      if (!error && data) {
        setEvents(data as HighlightedEvent[]);
      }
      setLoading(false);
    }
    fetchHighlights();
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed text-muted-foreground p-8">
        <Loader2 className="animate-spin h-6 w-6" />
        <span className="ml-2 font-medium">Carregando rolês em destaque...</span>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed p-8">
          <p className="text-sm font-medium text-muted-foreground">Nenhum evento em destaque no momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((ev) => {
            const isActive = ev.highlight_until && isAfter(parseISO(ev.highlight_until), now);
            return (
              <Card key={ev.id} className="rounded-2xl transition-all shadow-sm hover:shadow">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
                  <div className="max-w-[70%]">
                    <CardTitle className="text-lg font-bold truncate" title={ev.event_title}>
                      {ev.event_title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 font-medium capitalize flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {ev.date ? format(parseISO(ev.date), "dd 'de' MMM, yyyy", { locale: ptBR }) : "Sem data"}
                    </p>
                  </div>
                  {isActive ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold whitespace-nowrap shadow-sm">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="whitespace-nowrap font-semibold">Expirado</Badge>
                  )}
                </CardHeader>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="text-sm flex flex-col gap-1 text-muted-foreground font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Fim do pacote:
                    </span>
                    <span className="text-foreground pl-5">
                      {ev.highlight_until ? format(parseISO(ev.highlight_until), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="font-semibold rounded-full" asChild>
                    <a href={`/evento/${ev.id}`} target="_blank" rel="noreferrer">
                      Ver evento <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
