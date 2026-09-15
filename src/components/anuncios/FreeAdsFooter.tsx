import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageCircle } from "lucide-react";
import { useFreeAds, type Ad } from "@/data/useAds";
import { buildWhatsappUrl } from "@/lib/whatsapp";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Data mostrada para o anúncio: a do evento quando existe, senão a de criação. */
function adDate(ad: Ad): string {
  return ad.event_date ? formatDate(ad.event_date) : formatDate(ad.created_at);
}

/**
 * Seção fixa de anúncios gratuitos, exibida acima do rodapé do app.
 * Sem cores especiais, banner ou prioridade visual: apenas uma lista simples.
 * A ordem (por data do evento) já vem pronta da query useFreeAds.
 * Ao clicar num item, abre uma visualização com título, descrição, data e contato.
 */
export function FreeAdsFooter() {
  const { data: gratuitos = [] } = useFreeAds();
  const [selecionado, setSelecionado] = useState<Ad | null>(null);

  if (gratuitos.length === 0) return null;

  const linkWhats = selecionado ? buildWhatsappUrl(selecionado.contact_whatsapp) : null;

  return (
    <section
      aria-label="Anúncios gratuitos"
      className="w-full border-t border-border/40 bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Anúncios gratuitos
        </h2>
        <ul className="divide-y divide-border/40">
          {gratuitos.map((ad) => (
            <li key={ad.id}>
              <button
                type="button"
                onClick={() => setSelecionado(ad)}
                className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:text-primary transition-colors"
              >
                <span className="text-sm text-foreground truncate">{ad.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{adDate(ad)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={!!selecionado} onOpenChange={(aberto) => !aberto && setSelecionado(null)}>
        <DialogContent className="max-w-md">
          {selecionado && (
            <>
              <DialogHeader>
                <DialogTitle>{selecionado.title}</DialogTitle>
                <DialogDescription className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {adDate(selecionado)}
                </DialogDescription>
              </DialogHeader>

              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                {selecionado.description}
              </p>

              {linkWhats && (
                <Button asChild className="font-bold w-full">
                  <a href={linkWhats} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
                    Chamar no WhatsApp
                  </a>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
