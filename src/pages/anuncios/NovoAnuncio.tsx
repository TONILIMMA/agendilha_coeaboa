import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { AD_CATEGORIES, useAd, useCreateAd, useUpdateAd } from "@/data/useAds";
import { AdPhotoUploader } from "@/components/anuncios/AdPhotoUploader";
import { DestaqueAnuncioModal } from "@/components/anuncios/DestaqueAnuncioModal";
import { inputToCents, centsToInput } from "@/data/useAdPlans";
import { formatBrPhoneInput, validateBrPhone } from "@/lib/whatsapp";
import { ROUTES } from "@/routes/config";

export default function NovoAnuncio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPromoter, isAdmin, loading: permsLoading } = useAppPermissions();
  const editando = !!id;

  const { data: existente, isLoading: carregando } = useAd(id);
  const criar = useCreateAd();
  const atualizar = useUpdateAd();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [preco, setPreco] = useState("");
  const [whats, setWhats] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [destaqueAberto, setDestaqueAberto] = useState(false);
  const [tituloEnviado, setTituloEnviado] = useState<string | null>(null);

  useEffect(() => {
    if (!existente) return;
    setTitle(existente.title);
    setDescription(existente.description);
    setCategory(existente.category);
    setPreco(existente.price_cents !== null ? centsToInput(existente.price_cents) : "");
    setWhats(formatBrPhoneInput(existente.contact_whatsapp));
    setCity(existente.city ?? "");
    setNeighborhood(existente.neighborhood ?? "");
    setPhotos(existente.photos);
  }, [existente]);

  const podeAnunciar = isPromoter || isAdmin;
  const salvando = criar.isPending || atualizar.isPending;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (title.trim().length < 4) {
      toast.error("Dê um nome ao anúncio (mínimo 4 letras).");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("Conte um pouco mais no texto do anúncio (mínimo 20 letras).");
      return;
    }
    if (!category) {
      toast.error("Escolha uma categoria.");
      return;
    }
    const telefone = validateBrPhone(whats);
    if (!telefone.valid) {
      toast.error(telefone.error ?? "Confira o número de WhatsApp.");
      return;
    }
    let price_cents: number | null = null;
    if (preco.trim()) {
      price_cents = inputToCents(preco);
      if (price_cents === null) {
        toast.error("Valor inválido. Use algo como 150,00.");
        return;
      }
    }

    const input = {
      title: title.trim(),
      description: description.trim(),
      category,
      price_cents,
      contact_whatsapp: telefone.e164,
      city: city.trim() || null,
      neighborhood: neighborhood.trim() || null,
      photos,
    };

    try {
      if (editando && id) {
        await atualizar.mutateAsync({ id, input });
        toast.success("Anúncio atualizado. Voltou para análise da equipe.");
        navigate(ROUTES.MEUS_ANUNCIOS);
        return;
      }
      const novo = await criar.mutateAsync({ userId: user.id, input });
      toast.success("Anúncio enviado! A equipe confere e publica.");
      setTituloEnviado(novo.title);
      setDestaqueAberto(true);
    } catch (err) {
      handleError(err, "Não deu pra salvar o anúncio agora");
    }
  }

  if (permsLoading || (editando && carregando)) {
    return <LoadingState message="Carregando…" fullPage />;
  }
  if (!user) return <Navigate to={ROUTES.AUTH} replace />;
  if (!podeAnunciar) return <Navigate to={ROUTES.ANUNCIOS} replace />;
  if (editando && existente && existente.user_id !== user.id && !isAdmin) {
    return <Navigate to={ROUTES.MEUS_ANUNCIOS} replace />;
  }

  return (
    <PageContainer>
      <div className="space-y-6 max-w-2xl">
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight inline-flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            {editando ? "Editar anúncio" : "Criar anúncio"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Preencha o que der: quanto mais claro, mais gente chama você no WhatsApp. A equipe
            confere antes de publicar.
          </p>
        </header>

        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={(e) => void enviar(e)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="titulo">O que você está anunciando?</Label>
                <Input
                  id="titulo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Som e iluminação para festa"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descricao">Detalhes</Label>
                <Textarea
                  id="descricao"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique o que inclui, condições, horários…"
                  rows={5}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="categoria" className="h-11">
                      <SelectValue placeholder="Escolha uma" />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="preco">Valor (opcional)</Label>
                  <Input
                    id="preco"
                    inputMode="decimal"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    placeholder="150,00"
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deixe vazio para “a combinar”.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="whats">WhatsApp de contato</Label>
                  <Input
                    id="whats"
                    inputMode="tel"
                    value={whats}
                    onChange={(e) => setWhats(formatBrPhoneInput(e.target.value))}
                    placeholder="(21) 99999-9999"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cidade">Cidade (opcional)</Label>
                  <Input
                    id="cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Rio de Janeiro"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="bairro">Bairro ou região (opcional)</Label>
                  <Input
                    id="bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ex.: Cocotá"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fotos</Label>
                <AdPhotoUploader userId={user.id} paths={photos} onChange={setPhotos} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={salvando} className="font-bold">
                  {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editando ? "Salvar alterações" : "Enviar anúncio"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(ROUTES.ANUNCIOS)}
                  className="font-medium"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <DestaqueAnuncioModal
        open={destaqueAberto}
        onOpenChange={(aberto) => {
          setDestaqueAberto(aberto);
          if (!aberto) navigate(ROUTES.MEUS_ANUNCIOS);
        }}
        adTitle={tituloEnviado}
      />
    </PageContainer>
  );
}
