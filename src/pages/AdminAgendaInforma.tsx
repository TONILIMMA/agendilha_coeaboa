import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Copy, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

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
}

const CATEGORY_EMOJI: Record<string, string> = {
  musica: "🎸",
  gastronomia: "🍽️",
  cultura: "🎭",
  esporte: "⚽",
  promocoes: "🏷️",
  outros: "📌",
};

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

  const [header, setHeader] = useState("🎶 AGENDILHA INFORMA 🎶");
  const [intro, setIntro] = useState("🔥 A Ilha está fervendo hoje! Escolha seu rolê 👇");
  const [footer, setFooter] = useState(
    "📲 Compartilhe com os amigos e monte sua noite!\n#Agendilha #IlhaMusical #RolêDaSemana"
  );
  const [withImageMarker, setWithImageMarker] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("submissions")
      .select(
        "id, event_title, date, start_time, location, address_neighborhood, category, atrativo_name, atrativo_style, short_copy"
      )
      .eq("status", "approved")
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
    const blocks = chosen.map((e, i) => {
      const emoji = CATEGORY_EMOJI[e.category || "outros"] || "📌";
      const title = e.atrativo_name || e.event_title;
      const time = formatTime(e.start_time);
      const loc = [e.location, e.address_neighborhood].filter(Boolean).join(" - ");
      const desc = e.short_copy || e.atrativo_style || "";
      return [
        `🕖 ${time ? `${time} — ` : ""}${title}`,
        `📍 ${loc}`,
        desc ? `${emoji} ${desc}` : null,
        withImageMarker ? `👉 [Imagem ${i + 1}]` : null,
      ]
        .filter(Boolean)
        .join("\n");
    });

    return [header, "", intro, "", blocks.join("\n\n"), "", footer]
      .filter((s) => s !== null)
      .join("\n");
  }, [events, selected, header, intro, footer, withImageMarker]);

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AgendIlha Informa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gere o roteiro do dia em formato pronto para WhatsApp.
          </p>
        </div>
        <div className="flex items-end gap-2">
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
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cabeçalho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Título</Label>
                <Input value={header} onChange={(e) => setHeader(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Introdução</Label>
                <Textarea rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Rodapé / hashtags</Label>
                <Textarea rows={2} value={footer} onChange={(e) => setFooter(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={withImageMarker}
                  onCheckedChange={(v) => setWithImageMarker(Boolean(v))}
                />
                Incluir marcador "[Imagem N]" para colar os flyers
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Eventos do dia ({events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
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
                          {e.atrativo_name || e.event_title}
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
                className="font-mono text-xs h-[420px] resize-none bg-muted/30"
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