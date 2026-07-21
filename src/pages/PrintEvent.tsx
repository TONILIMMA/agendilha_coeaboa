import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileDown, Printer, Loader2 } from "lucide-react";
import { exportEventToPdf } from "@/lib/exportEventPdf";
import { formatBrazilianDate } from "@/lib/date-utils";
import { ROUTES } from "@/routes/config";

interface EventRow {
  id: string;
  slug: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  category: string | null;
  age_rating: string | null;
  description: string | null;
  artist_name: string | null;
  music_style: string | null;
  sale_price: string | null;
}

/**
 * Prévia pública "pronta pra imprimir" de um evento — layout A4 espelhando o PDF.
 * Usada como link compartilhável: quem receber pode ver, imprimir ou baixar o PDF
 * sem precisar entrar no app.
 */
export default function PrintEvent() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("events" as any)
        .select("id, slug, event_title, date, start_time, end_time, location, address_street, address_number, address_neighborhood, address_city, category, age_rating, description, artist_name, music_style, sale_price")
        .eq("slug", slug)
        .maybeSingle();
      if (!alive) return;
      setEvent((data as any) ?? null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-bold mb-2">Não achamos esse evento</h1>
          <p className="text-sm text-muted-foreground mb-4">Talvez o link tenha mudado.</p>
          <Button asChild variant="outline"><Link to={ROUTES.EXPLORAR}>Ver o que tá rolando</Link></Button>
        </div>
      </div>
    );
  }

  const dateFmt = event.date ? formatBrazilianDate(event.date) : "—";
  const address = [event.address_street, event.address_number].filter(Boolean).join(", ");
  const localFull = [event.location, address, event.address_neighborhood, event.address_city].filter(Boolean).join(" — ");

  const rows: [string, string][] = [
    ["Data", dateFmt],
    ["Horário", `${event.start_time || "—"}${event.end_time ? ` até ${event.end_time}` : ""}`],
    ["Local", localFull || "—"],
    ["Categoria", event.category || "—"],
    ["Classificação", event.age_rating || "Livre"],
    ["Atrativo", event.artist_name || "—"],
    ["Estilo", event.music_style || "—"],
    ["Ingresso / Preço", event.sale_price || "—"],
  ];

  const download = () => {
    exportEventToPdf(event as any, {
      filename: `evento-${event.slug}.pdf`,
      cover: {
        eventTitle: event.event_title,
        date: dateFmt,
        location: localFull,
        subtitle: "Prévia compartilhada",
      },
    });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Toolbar — some hidden na impressão */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b print:hidden">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between px-4 py-3 gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link to={`/evento/${event.slug}`}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button size="sm" onClick={download} className="gap-1">
              <FileDown className="h-4 w-4" /> Baixar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[210mm] mx-auto p-4 sm:p-8">
        <div
          className="bg-white text-slate-900 shadow-lg border w-full aspect-[210/297] p-8 relative print:shadow-none print:border-0"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          <div className="-mx-8 -mt-8 mb-6 bg-slate-900 text-white px-8 py-4">
            <div className="text-lg font-bold">AgendIlha</div>
            <div className="text-[10px] opacity-80">Ficha do evento — prévia compartilhada</div>
          </div>

          <h2 className="text-xl font-bold mb-5 leading-tight">{event.event_title}</h2>

          <table className="w-full text-[11px] border-collapse mb-4">
            <thead>
              <tr className="bg-orange-600 text-white">
                <th className="text-left px-2 py-1.5 font-bold w-1/3">Informação</th>
                <th className="text-left px-2 py-1.5 font-bold">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border border-slate-300">
                  <td className="border border-slate-300 px-2 py-1.5 font-semibold align-top">{label}</td>
                  <td className="border border-slate-300 px-2 py-1.5 align-top">{value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {event.description && (
            <div className="mt-4">
              <div className="font-bold text-[11px] mb-1">Descrição</div>
              <p className="text-[11px] whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}

          <div className="absolute bottom-4 left-8 right-8 flex justify-between text-[9px] text-slate-500">
            <span>agendilha.lovable.app/evento/{event.slug}/imprimir</span>
            <span>Prévia — compartilhável sem baixar</span>
          </div>
        </div>
      </div>
    </div>
  );
}