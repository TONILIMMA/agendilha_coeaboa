import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { buildCoeaboaDailyReport } from "@/lib/todayWhatsappSummary";

interface Ev {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  category: string | null;
  atrativo_name: string | null;
  atrativo_style: string | null;
  short_copy: string | null;
  address_street: string | null;
  address_number: string | null;
  submission_atrativos: Array<{ name: string | null; display_order: number | null }> | null;
}

function todayISO() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function formatTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  if (m && m !== "00") return `${h}:${m}h`;
  return `${h}h`;
}

export default function AdminAgendaInforma() {
  const [date, setDate] = useState<string>(todayISO());
  const [events, setEvents] = useState<Ev[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("submissions")
      .select(
        "id, event_title, date, start_time, location, address_street, address_number, address_neighborhood, category, atrativo_name, atrativo_style, short_copy, submission_atrativos(name, display_order)"
      )
      .eq("status", "aprovado")
      .eq("date", date)
      .order("start_time", { ascending: true, nullsFirst: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          toast.error("Falha ao carregar eventos", { description: error.message });
        } else {
          const list = (data as Ev[]) || [];
          setEvents(list);
          const sel: Record<string, boolean> = {};
          list.forEach((e) => (sel[e.id] = true));
          setSelected(sel);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const lines = useMemo(() => {
    const chosen = events.filter((e) => selected[e.id]);
    return buildCoeaboaDailyReport(chosen, date).text;
  }, [events, selected, date]);

  const chosenCount = Object.values(selected).filter(Boolean).length;

  async function copy() {
    await navigator.clipboard.writeText(lines);
    toast.success("Texto copiado!");
  }

  function shareWhats() {
    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Relatório diário COEABOA"
        subtitle="Selecione os eventos e copie o texto pronto para postar no WhatsApp Agendilha."
        rightElement={
          <div>
            <Label htmlFor="date" className="text-xs">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-[170px]"
            />
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Eventos do dia ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Carregando eventos..." className="py-6" />
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum evento aprovado para esta data.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[420px] overflow-y-auto">
                  {events.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/40"
                    >
                      <Checkbox
                        checked={!!selected[e.id]}
                        onCheckedChange={(v) =>
                          setSelected((s) => ({ ...s, [e.id]: Boolean(v) }))
                        }
                        className="mt-1"
                      />
                      <div className="text-sm flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {formatTime(e.start_time)} —{" "}
                           {(e.submission_atrativos || []).map((item) => item.name).filter(Boolean).join(" - ") || e.atrativo_name || e.event_title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {e.location} {e.address_neighborhood && `· ${e.address_neighborhood}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Pré-visualização</CardTitle>
              <span className="text-xs text-muted-foreground">
                {chosenCount} evento(s)
              </span>
            </CardHeader>
            <CardContent>
              <Textarea
                value={lines}
                onChange={() => {}}
                readOnly
                className="font-mono text-sm h-[420px] resize-none bg-muted/30 leading-relaxed"
              />
              <div className="flex gap-2 mt-3">
                <Button onClick={copy} variant="outline" className="flex-1">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar texto
                </Button>
                <Button onClick={shareWhats} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}