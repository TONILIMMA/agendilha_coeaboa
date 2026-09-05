import { Link, Navigate } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { useMyAds } from "@/data/useAds";
import { AdCard } from "@/components/anuncios/AdCard";
import { ROUTES } from "@/routes/config";

export default function MeusAnuncios() {
  const { user } = useAuth();
  const { isPromoter, isAdmin, loading } = useAppPermissions();
  const { data: anuncios = [], isLoading } = useMyAds(user?.id);

  if (loading) return <LoadingState message="Verificando seu acesso…" fullPage />;
  if (!user) return <Navigate to={ROUTES.AUTH} replace />;
  if (!isPromoter && !isAdmin) return <Navigate to={ROUTES.ANUNCIOS} replace />;

  return (
    <PageContainer>
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            Meus anúncios
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Acompanhe a situação de cada anúncio. Enquanto está em análise ou recusado, você pode
            editar e reenviar.
          </p>
          <Button asChild className="font-bold">
            <Link to={ROUTES.ANUNCIO_NOVO}>
              <Plus className="h-4 w-4 mr-2" />
              Criar anúncio
            </Link>
          </Button>
        </header>

        {isLoading ? (
          <LoadingState message="Carregando seus anúncios…" />
        ) : anuncios.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center space-y-2">
            <p className="font-semibold">Você ainda não tem anúncios.</p>
            <p className="text-sm text-muted-foreground">
              Crie o primeiro no botão acima: leva menos de dois minutos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anuncios.map((ad) => (
              <div key={ad.id} className="space-y-2">
                <AdCard ad={ad} showStatus />
                {ad.status === "recusado" && ad.rejection_reason && (
                  <p className="text-xs text-destructive px-3">
                    Motivo: {ad.rejection_reason}
                  </p>
                )}
                {ad.status !== "publicado" && (
                  <Button asChild variant="outline" size="sm" className="font-semibold">
                    <Link to={`/anuncios/${ad.id}/editar`}>Editar e reenviar</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
