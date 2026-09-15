import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, ImageIcon, MessageCircle } from "lucide-react";
import { useFreeAds, type Ad } from "@/data/useAds";
import { useAdPhotoUrls } from "@/data/useAdPhotoUrls";
import { buildWhatsappUrl } from "@/lib/whatsapp";

/** Troca de slide do carrossel externo: entre 5 e 6 segundos. */
const SLIDE_MS = 5500;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Data mostrada: a do evento quando existe, senão a de criação. */
function adDate(ad: Ad): string {
  return ad.event_date ? formatDate(ad.event_date) : formatDate(ad.created_at);
}

/** Carrossel interno com até 3 fotos de um anúncio. */
function AdImages({ ad }: { ad: Ad }) {
  const fotos = ad.photos.slice(0, 3);
  const { data: urls = {} } = useAdPhotoUrls(fotos);

  if (fotos.length === 0) {
    return (
      <div className="aspect-[4/3] w-full rounded-xl border bg-muted flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (fotos.length === 1) {
    const src = urls[fotos[0]];
    return (
      <div className="aspect-[4/3] w-full rounded-xl border bg-muted overflow-hidden">
        {src ? (
          <img src={src} alt={ad.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Carousel opts={{ loop: true }} className="w-full">
      <CarouselContent>
        {fotos.map((path) => (
          <CarouselItem key={path}>
            <div className="aspect-[4/3] w-full rounded-xl border bg-muted overflow-hidden">
              {urls[path] ? (
                <img src={urls[path]} alt={ad.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

/**
 * Carrossel de anúncios gratuitos, exibido acima do rodapé do app.
 * Cada slide é um anúncio; a troca é automática a cada ~5,5s. Cada anúncio
 * pode ter um carrossel interno com até 3 fotos. Sem destaque visual extra:
 * usa o fundo neutro do design system. A ordem (por data do evento) já vem
 * pronta da query useFreeAds. Ao clicar, abre uma visualização com nome,
 * descrição, data e contato.
 */
export function FreeAdsCarousel() {
  const { data: gratuitos = [] } = useFreeAds();
  const [api, setApi] = useState<CarouselApi>();
  const [selecionado, setSelecionado] = useState<Ad | null>(null);

  useEffect(() => {
    if (!api || gratuitos.length < 2) return;
    const id = window.setInterval(() => {
      api.scrollNext();
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [api, gratuitos.length]);

  if (gratuitos.length === 0) return null;

  const linkWhats = selecionado ? buildWhatsappUrl(selecionado.contact_whatsapp) : null;

  return (
    <section
      aria-label="Anúncios gratuitos"
      className="w-full border-t border-border/40 bg-background"
    >
      <div className="mx-auto max-w-2xl px-6 py-6">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Anúncios gratuitos
        </h2>

        <Carousel setApi={setApi} opts={{ loop: gratuitos.length > 1 }} className="w-full">
          <CarouselContent>
            {gratuitos.map((ad) => (
              <CarouselItem key={ad.id}>
                <button
                  type="button"
                  onClick={() => setSelecionado(ad)}
                  className="w-full text-left space-y-2 group"
                >
                  <AdImages ad={ad} />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {ad.title}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {adDate(ad)}
                    </span>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
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
