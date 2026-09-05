import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  EventWhatsAppCard,
  EventWhatsAppCardExport,
  type FlyerEvent,
} from "@/components/EventWhatsAppCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { pickCarouselEvents } from "@/lib/highlights";

const CAROUSEL_LIMIT = 10;

export default function Carrossel() {
  const [events, setEvents] = useState<FlyerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [zipping, setZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const bulkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("*")
        .eq("status", "aprovado")
        .neq("moderation_status", "blocked")
        .order("date", { ascending: true });
      if (!error && data) {
        // Até 10 cards, com os destaques ativos (prazo válido e não escondidos) na frente.
        setEvents(pickCarouselEvents(data as any[], CAROUSEL_LIMIT) as any as FlyerEvent[]);
      }
      setLoading(false);
    })();
  }, []);

  const total = events.length;
  const current = events[index];

  const onPrev = () => setIndex((i) => (i - 1 + total) % total);
  const onNext = () => setIndex((i) => (i + 1) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const counter = useMemo(
    () => (total ? `${index + 1} / ${total}` : "0 / 0"),
    [index, total]
  );

  async function handleDownloadAll() {
    if (!bulkRef.current || total === 0) return;
    try {
      setZipping(true);
      setZipProgress(0);
      const zip = new JSZip();
      const nodes = Array.from(
        bulkRef.current.querySelectorAll<HTMLElement>("[data-flyer]")
      );
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dataUrl = await toPng(node, {
          pixelRatio: 1,
          cacheBust: true,
          backgroundColor: "#faf8f5",
        });
        const blob = await (await fetch(dataUrl)).blob();
        const slug = (events[i].event_title || `evento-${i + 1}`)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60);
        zip.file(`${String(i + 1).padStart(2, "0")}-${slug || "evento"}.png`, blob);
        setZipProgress(Math.round(((i + 1) / nodes.length) * 100));
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `carrossel-agendilha-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${nodes.length} cards exportados!`);
    } catch (e) {
      handleError(e, { context: "Carrossel.exportZip", fallback: "Não deu pra gerar o .zip. Tenta de novo." });
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-foreground/10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/agenda" className="text-sm font-medium tracking-tight text-foreground/70 hover:text-foreground">
            ← Agenda
          </Link>
          <div className="text-xs uppercase tracking-[0.18em] text-foreground/60">
            Carrossel AgendIlha
          </div>
          <div className="text-sm tabular-nums text-foreground/60 w-16 text-right">{counter}</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="h-[60vh] flex items-center justify-center text-foreground/60">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando carrossel…
          </div>
        ) : total === 0 ? (
          <div className="h-[60vh] flex items-center justify-center text-foreground/60 text-sm">
            Nenhum evento aprovado para gerar o carrossel.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                {current.event_title}
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                Card pronto para WhatsApp · gerado automaticamente
              </p>
            </div>

            <EventWhatsAppCardExport event={current} />

            <div className="pt-2">
              <Button
                onClick={handleDownloadAll}
                disabled={zipping}
                variant="outline"
                className="w-full h-12 rounded-full border-foreground/15 hover:bg-foreground/5 font-semibold"
              >
                {zipping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando… {zipProgress}%
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Baixar todos os {total} cards (.zip)
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                className="rounded-full h-11 px-4"
                onClick={onPrev}
                disabled={total < 2}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <div className="flex gap-1.5 overflow-x-auto max-w-[55%] py-1">
                {events.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Ir para card ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-6 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/50"
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                className="rounded-full h-11 px-4"
                onClick={onNext}
                disabled={total < 2}
              >
                Próximo <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Off-screen renderer used to export all cards as PNG for the .zip */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: "-100000px",
            top: 0,
            width: 1080,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <div ref={bulkRef}>
            {events.map((ev) => (
              <div key={ev.id} data-flyer>
                <EventWhatsAppCard event={ev} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}