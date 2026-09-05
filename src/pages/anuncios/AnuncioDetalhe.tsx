import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ImageIcon, MapPin, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAd } from "@/data/useAds";
import { useAdPhotoUrls } from "@/data/useAdPhotoUrls";
import { formatPriceBRL } from "@/data/useAdPlans";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { useAuth } from "@/contexts/AuthContext";
import { DestaqueAnuncioModal } from "@/components/anuncios/DestaqueAnuncioModal";
import { ROUTES } from "@/routes/config";

export default function AnuncioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: ad, isLoading } = useAd(id);
  const { data: urls = {} } = useAdPhotoUrls(ad?.photos ?? []);
  const [destaqueAberto, setDestaqueAberto] = useState(false);

  useEffect(() => {
    if (!ad?.id) return;
    void supabase.rpc("increment_ad_views", { target_ad_id: ad.id });
  }, [ad?.id]);

  if (isLoading) return <LoadingState message="Abrindo anúncio…" fullPage />;

  if (!ad) {
    return (
      <PageContainer>
        <div className="space-y-4 py-10 text-center">
          <p className="font-semibold">Esse anúncio não está disponível.</p>
          <Button asChild variant="outline">
            <Link to={ROUTES.ANUNCIOS}>Ver todos os anúncios</Link>
          </Button>
        </div>
      </PageContainer>
    );
  }

  const local = [ad.neighborhood, ad.city].filter(Boolean).join(" · ");
  const mensagem = `Oi! Vi seu anúncio "${ad.title}" no Coé a Boa e queria saber mais.`;
  const linkWhats = buildWhatsappUrl(ad.contact_whatsapp, mensagem);
  const souDono = user?.id === ad.user_id;

  return (
    <PageContainer>
      <div className="space-y-6 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="font-medium -ml-2">
          <Link to={ROUTES.ANUNCIOS}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Anúncios
          </Link>
        </Button>

        <div className="rounded-2xl overflow-hidden border bg-muted aspect-[4/3] flex items-center justify-center">
          {ad.photos[0] && urls[ad.photos[0]] ? (
            <img
              src={urls[ad.photos[0]]}
              alt={ad.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        {ad.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ad.photos.slice(1).map((p) =>
              urls[p] ? (
                <img
                  key={p}
                  src={urls[p]}
                  alt={`${ad.title} — foto extra`}
                  className="h-20 w-20 rounded-xl object-cover border shrink-0"
                />
              ) : null,
            )}
          </div>
        )}

        <header className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {ad.is_highlight && (
              <Badge className="gap-1">
                <Sparkles className="h-3 w-3" />
                Destaque
              </Badge>
            )}
            <Badge variant="outline">{ad.category}</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{ad.title}</h1>
          {ad.price_cents !== null && (
            <p className="text-2xl font-black text-primary">{formatPriceBRL(ad.price_cents)}</p>
          )}
          {local && (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {local}
            </p>
          )}
        </header>

        <p className="text-sm leading-relaxed whitespace-pre-line">{ad.description}</p>

        <div className="flex flex-wrap gap-2">
          {linkWhats && (
            <Button asChild className="font-bold">
              <a href={linkWhats} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
                Chamar no WhatsApp
              </a>
            </Button>
          )}
          {souDono && (
            <>
              <Button
                variant="outline"
                className="font-semibold"
                onClick={() => setDestaqueAberto(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Destacar anúncio
              </Button>
              <Button asChild variant="ghost" className="font-medium">
                <Link to={`/anuncios/${ad.id}/editar`}>Editar</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <DestaqueAnuncioModal
        open={destaqueAberto}
        onOpenChange={setDestaqueAberto}
        adTitle={ad.title}
        adUrl={`${window.location.origin}/anuncios/${ad.id}`}
      />
    </PageContainer>
  );
}
