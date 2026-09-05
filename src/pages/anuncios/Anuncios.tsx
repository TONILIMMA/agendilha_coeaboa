import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ShoppingBag, Sparkles } from "lucide-react";
import { AD_CATEGORIES, usePublishedAds } from "@/data/useAds";
import { AdCard } from "@/components/anuncios/AdCard";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { ROUTES } from "@/routes/config";

export default function Anuncios() {
  const { data: anuncios = [], isLoading } = usePublishedAds();
  const { isPromoter, isAdmin } = useAppPermissions();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);

  const podeAnunciar = isPromoter || isAdmin;

  const destaques = useMemo(
    () => anuncios.filter((a) => a.is_highlight).slice(0, 10),
    [anuncios],
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return anuncios.filter((a) => {
      if (categoria && a.category !== categoria) return false;
      if (!termo) return true;
      return (
        a.title.toLowerCase().includes(termo) ||
        a.description.toLowerCase().includes(termo) ||
        (a.city ?? "").toLowerCase().includes(termo) ||
        (a.neighborhood ?? "").toLowerCase().includes(termo)
      );
    });
  }, [anuncios, busca, categoria]);

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Anúncios
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Produtos, serviços e oportunidades de gente da ilha. Achou algo? Fala direto no
            WhatsApp de quem anunciou.
          </p>
          {podeAnunciar && (
            <div className="flex flex-wrap gap-2">
              <Button asChild className="font-bold">
                <Link to={ROUTES.ANUNCIO_NOVO}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar anúncio
                </Link>
              </Button>
              <Button asChild variant="outline" className="font-semibold">
                <Link to={ROUTES.MEUS_ANUNCIOS}>Meus anúncios</Link>
              </Button>
            </div>
          )}
        </header>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, serviço ou lugar"
              aria-label="Buscar anúncios"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setCategoria(null)}>
              <Badge variant={categoria === null ? "default" : "outline"} className="cursor-pointer">
                Tudo
              </Badge>
            </button>
            {AD_CATEGORIES.map((c) => (
              <button key={c} type="button" onClick={() => setCategoria(c)}>
                <Badge
                  variant={categoria === c ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                >
                  {c}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Carregando anúncios…" />
        ) : (
          <>
            {destaques.length > 0 && !busca && !categoria && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Em destaque
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                  {destaques.map((ad) => (
                    <div key={ad.id} className="min-w-[280px] snap-start">
                      <AdCard ad={ad} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3">
              {filtrados.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-8 text-center space-y-2">
                  <p className="font-semibold">Nada por aqui ainda.</p>
                  <p className="text-sm text-muted-foreground">
                    {busca || categoria
                      ? "Tenta outra busca ou muda a categoria."
                      : podeAnunciar
                        ? "Publique o primeiro anúncio no botão “Criar anúncio”."
                        : "Volte mais tarde: novos anúncios entram toda semana."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtrados.map((ad) => (
                    <AdCard key={ad.id} ad={ad} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
