import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardShell } from "@/components/registration/WizardShell";
import { FormField, FormTextarea } from "@/components/registration/FormField";
import { NeighborhoodSelect } from "@/components/registration/NeighborhoodSelect";
import { isBairroValido } from "@/lib/neighborhoods";
import {
  CATEGORIAS_ARTISTA,
  isWhatsappValido,
  maskPhone,
  saveArtista,
} from "@/lib/registration";
import { handleError } from "@/lib/error-handler";
import { cn } from "@/lib/utils";

const TOTAL = 3;

export default function CadastroArtista() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [responsavel, setResponsavel] = useState("");
  const [nomeArtistico, setNomeArtistico] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [integrantes, setIntegrantes] = useState("1");
  const [categoria, setCategoria] = useState("");
  const [genero, setGenero] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [release, setRelease] = useState("");
  const [tempo, setTempo] = useState("");
  const [possuiEstrutura, setPossuiEstrutura] = useState<null | boolean>(null);
  const [necessidades, setNecessidades] = useState("");
  const [cache, setCache] = useState("");

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!responsavel.trim() || responsavel.trim().length < 2)
        e.responsavel = "Informe o nome do responsável.";
      if (!nomeArtistico.trim() || nomeArtistico.trim().length < 2)
        e.nomeArtistico = "Informe o nome artístico.";
      if (!isWhatsappValido(whatsapp))
        e.whatsapp = "WhatsApp inválido. Use DDD + número.";
    }
    if (s === 2) {
      if (!endereco.trim() || endereco.trim().length < 5)
        e.endereco = "Informe seu endereço.";
      if (!isBairroValido(bairro)) e.bairro = "Selecione um bairro.";
      const n = parseInt(integrantes, 10);
      if (!Number.isFinite(n) || n < 1) e.integrantes = "Mínimo 1.";
      if (!categoria) e.categoria = "Selecione uma categoria.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (step < TOTAL) {
      if (validate(step)) setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      await saveArtista({
        nome_responsavel: responsavel,
        nome_artistico: nomeArtistico,
        whatsapp,
        endereco,
        bairro,
        quantidade_integrantes: parseInt(integrantes, 10) || 1,
        categoria,
        genero,
        instagram,
        portfolio_url: portfolio,
        release_curto: release,
        tempo_apresentacao: tempo,
        possui_estrutura: possuiEstrutura,
        necessidades_tecnicas: necessidades,
        cache_faixa: cache,
      });
      navigate("/cadastro/sucesso?perfil=artista", { replace: true });
    } catch (err) {
      handleError(err, "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardShell
      title={
        step === 1
          ? "Apresenta o seu trampo"
          : step === 2
            ? "Onde e como você atua"
            : "Detalhes finais (opcional)"
      }
      subtitle={
        step === 1
          ? "Só o básico pra começar."
          : step === 2
            ? "Ajuda a entender o porte da atração."
            : "Quanto mais info, mais oportunidades."
      }
      step={step}
      totalSteps={TOTAL}
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={handleNext}
      loading={loading}
      isLast={step === TOTAL}
      nextLabel={step === TOTAL ? "Concluir cadastro" : "Continuar"}
    >
      {step === 1 && (
        <>
          <FormField
            id="responsavel"
            label="Nome do responsável"
            value={responsavel}
            onChange={setResponsavel}
            placeholder="Quem responde pela atração"
            required
            error={errors.responsavel}
          />
          <FormField
            id="nomeart"
            label="Nome artístico / banda"
            value={nomeArtistico}
            onChange={setNomeArtistico}
            placeholder="Como vocês se chamam"
            required
            error={errors.nomeArtistico}
          />
          <FormField
            id="whatsapp"
            label="WhatsApp"
            value={whatsapp}
            onChange={(v) => setWhatsapp(maskPhone(v))}
            placeholder="(21) 99999-9999"
            inputMode="tel"
            maxLength={15}
            required
            error={errors.whatsapp}
          />
        </>
      )}

      {step === 2 && (
        <>
          <FormField
            id="endereco"
            label="Endereço"
            value={endereco}
            onChange={setEndereco}
            placeholder="Rua, número, complemento"
            required
            error={errors.endereco}
          />
          <NeighborhoodSelect
            value={bairro}
            onChange={setBairro}
            error={errors.bairro}
          />
          <FormField
            id="integrantes"
            label="Quantidade de integrantes"
            value={integrantes}
            onChange={(v) => setIntegrantes(v.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            required
            error={errors.integrantes}
          />
          <div className="space-y-2">
            <Label htmlFor="categoria" className="text-base font-semibold">
              Categoria<span className="text-destructive ml-1">*</span>
            </Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger id="categoria" className="h-12 text-base">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_ARTISTA.map((c) => (
                  <SelectItem key={c} value={c} className="text-base py-3">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoria && (
              <p className="text-sm text-destructive">{errors.categoria}</p>
            )}
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <FormField
            id="genero"
            label="Gênero / estilo"
            value={genero}
            onChange={setGenero}
            placeholder="Ex.: samba, rock, MPB..."
          />
          <FormField
            id="ig"
            label="Instagram"
            value={instagram}
            onChange={setInstagram}
            placeholder="@seuperfil"
          />
          <FormField
            id="portfolio"
            label="Portfólio (YouTube, Spotify, site)"
            value={portfolio}
            onChange={setPortfolio}
            placeholder="https://..."
            inputMode="url"
          />
          <FormTextarea
            id="release"
            label="Release curto"
            value={release}
            onChange={setRelease}
            placeholder="Conta em poucas palavras"
            rows={3}
            maxLength={400}
          />
          <FormField
            id="tempo"
            label="Tempo médio de apresentação"
            value={tempo}
            onChange={setTempo}
            placeholder="Ex.: 60 minutos"
          />
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Possui estrutura própria?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: true, l: "Sim" },
                { v: false, l: "Não" },
                { v: null, l: "Não sei" },
              ].map((o) => (
                <button
                  type="button"
                  key={String(o.v)}
                  onClick={() => setPossuiEstrutura(o.v)}
                  className={cn(
                    "h-11 rounded-xl border-2 text-sm font-semibold transition-all",
                    possuiEstrutura === o.v
                      ? "bg-primary text-primary-foreground border-primary shadow"
                      : "bg-background border-border hover:border-primary/40",
                  )}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          <FormTextarea
            id="necessidades"
            label="Necessidades técnicas"
            value={necessidades}
            onChange={setNecessidades}
            placeholder="Ex.: 2 microfones, projetor..."
            rows={3}
            maxLength={400}
          />
          <FormField
            id="cache"
            label="Faixa de cachê"
            value={cache}
            onChange={setCache}
            placeholder='Ex.: "R$ 500 a R$ 1.000" ou "a combinar"'
          />
        </>
      )}
    </WizardShell>
  );
}