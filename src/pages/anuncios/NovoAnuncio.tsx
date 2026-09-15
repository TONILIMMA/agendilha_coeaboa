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
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";
import { ROUTES } from "@/routes/config";

/** ISO -> valor aceito pelo input datetime-local (YYYY-MM-DDTHH:mm no horário local). */
function isoParaDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

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
  const [eventDate, setEventDate] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [comDestaque, setComDestaque] = useState(false);
  const [destaqueAberto, setDestaqueAberto] = useState(false);
  const [tituloEnviado, setTituloEnviado] = useState<string | null>(null);

  useEffect(() => {
    if (!existente) return;
    setTitle(existente.title);
    setDescription(existente.description);
    setCategory(existente.category);
    setPreco(existente.price_cents !== null ? centsToInput(existente.price_cents) : "");
    setWhats(formatPhoneDisplay(existente.contact_whatsapp));
    setCity(existente.city ?? "");
    setNeighborhood(existente.neighborhood ?? "");
    setEventDate(isoParaDatetimeLocal(existente.event_date));
    setPhotos(existente.photos);
    setComDestaque(existente.is_highlight);
  }, [existente]);

  const podeAnunciar = isPromoter || isAdmin;
  const salvando = criar.isPending || atualizar.isPending;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    let contactWhatsapp = "";
    if (whats.trim()) {
      const telefone = validateBrazilianMobile(whats);
      if (telefone.valid === false) {
        toast.error(telefone.reason);
        return;
      }
      contactWhatsapp = telefone.e164;
    }
    let price_cents: number | null = null;
    if (preco.trim()) {
      price_cents = inputToCents(preco);
      if (price_cents === null) {
        toast.error("Valor inválido. Use algo como 150,00.");
        return;
      }
    }

    let event_date: string | null = null;
    if (eventDate.trim()) {
      const d = new Date(eventDate);
      if (Number.isNaN(d.getTime())) {
        toast.error("Data do evento inválida.");
        return;
      }
      event_date = d.toISOString();
    }

    const input = {
      title: title.trim(),
      description: description.trim(),
      category,
      price_cents,
      contact_whatsapp: contactWhatsapp,
      city: city.trim() || null,
      neighborhood: neighborhood.trim() || null,
      event_date,
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
      if (comDestaque) {
        setTituloEnviado(novo.title);
        setDestaqueAberto(true);
      } else {
        navigate(ROUTES.MEUS_ANUNCIOS);
      }
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
                    onChange={(e) => setWhats(formatPhoneDisplay(e.target.value))}
                    placeholder="(21) 99999-9999"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventDate">Data do evento (opcional)</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Usada para ordenar e sumir da lista quando passar.
                  </p>
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
                <Label>Tipo de anúncio</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setComDestaque(false)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      !comDestaque ? "border-primary bg-primary/5" : "hover:border-primary/40"
                    }`}
                  >
                    <p className="font-bold">Gratuito</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aparece na lista de anúncios gratuitos no rodapé do app, sem destaque.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComDestaque(true)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      comDestaque ? "border-primary bg-primary/5" : "hover:border-primary/40"
                    }`}
                  >
                    <p className="font-bold">Com destaque</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fica na área principal de anúncios, com prioridade.
                    </p>
                  </button>
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
