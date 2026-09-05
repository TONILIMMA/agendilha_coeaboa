import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, MapPin, Sparkles } from "lucide-react";
import { useAdCoverUrl } from "@/data/useAdPhotoUrls";
import { formatPriceBRL } from "@/data/useAdPlans";
import type { Ad } from "@/data/useAds";

const STATUS_LABEL: Record<Ad["status"], string> = {
  pendente: "Em análise",
  publicado: "Publicado",
  recusado: "Recusado",
};

interface Props {
  ad: Ad;
  /** Mostra a situação do anúncio (usado em "Meus anúncios" e na moderação). */
  showStatus?: boolean;
  to?: string;
}

/** Card compacto de anúncio, clicável para os detalhes. */
export function AdCard({ ad, showStatus = false, to }: Props) {
  const cover = useAdCoverUrl(ad.photos);
  const destino = to ?? `/anuncios/${ad.id}`;
  const local = [ad.neighborhood, ad.city].filter(Boolean).join(" · ");

  return (
    <Link
      to={destino}
      className="group flex gap-3 rounded-2xl border bg-card p-3 hover:border-primary/40 hover:shadow-md transition-all"
    >
      <div className="h-24 w-24 shrink-0 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
        {cover ? (
          <img
            src={cover}
            alt={ad.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {ad.is_highlight && (
            <Badge className="gap-1">
              <Sparkles className="h-3 w-3" />
              Destaque
            </Badge>
          )}
          <Badge variant="outline">{ad.category}</Badge>
          {showStatus && (
            <Badge variant={ad.status === "publicado" ? "secondary" : "outline"}>
              {STATUS_LABEL[ad.status]}
            </Badge>
          )}
        </div>

        <h3 className="font-bold leading-snug line-clamp-2">{ad.title}</h3>

        {ad.price_cents !== null && (
          <p className="font-black text-primary">{formatPriceBRL(ad.price_cents)}</p>
        )}

        {local && (
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {local}
          </p>
        )}
      </div>
    </Link>
  );
}
