import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventWhatsAppCardExport, type FlyerEvent } from "@/components/EventWhatsAppCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Carrossel() {
  const [events, setEvents] = useState<FlyerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("*")
        .eq("status", "aprovado")
        .neq("moderation_status", "blocked")
        .order("date", { ascending: true });
      if (!error && data) setEvents(data as any as FlyerEvent[]);
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
      </main>
    </div>
  );
}