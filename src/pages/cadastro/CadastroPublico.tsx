import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardShell } from "@/components/registration/WizardShell";
import { FormField } from "@/components/registration/FormField";
import { NeighborhoodSelect } from "@/components/registration/NeighborhoodSelect";
import { isBairroValido } from "@/lib/neighborhoods";
import {
  FREQUENCIAS,
  INTERESSES,
  isWhatsappValido,
  maskPhone,
  saveUsuarioPublico,
} from "@/lib/registration";
import { handleError } from "@/lib/error-handler";
import { cn } from "@/lib/utils";

const TOTAL = 2;

export default function CadastroPublico() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bairro, setBairro] = useState("");
  const [interesses, setInteresses] = useState<string[]>([]);
  const [aceita, setAceita] = useState(true);
  const [frequencia, setFrequencia] = useState("semanal");

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!nome.trim() || nome.trim().length < 2) e.nome = "Informe seu nome.";
    if (!isWhatsappValido(whatsapp))
      e.whatsapp = "WhatsApp inválido. Use DDD + número.";
    if (!isBairroValido(bairro)) e.bairro = "Selecione um bairro.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }
    setLoading(true);
    try {
      await saveUsuarioPublico({
        nome,
        whatsapp,
        bairro,
        interesses,
        aceita_notificacoes: aceita,
        frequencia_notificacao: frequencia,
      });
      navigate("/cadastro/sucesso?perfil=publico", { replace: true });
    } catch (err) {
      handleError(err, "Não foi possível concluir o cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const toggleInteresse = (i: string) =>
    setInteresses((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    );

  return (
    <WizardShell
      title={
        step === 1
          ? "Vamos começar pelo básico"
          : "O que você curte?"
      }
      subtitle={
        step === 1
          ? "Só pra te avisar dos eventos certos."
          : "Escolha seus interesses (opcional)."
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
            id="nome"
            label="Seu nome"
            value={nome}
            onChange={setNome}
            placeholder="Como você quer ser chamado"
            autoComplete="name"
            required
            error={errors.nome}
          />
          <FormField
            id="whatsapp"
            label="WhatsApp"
            value={whatsapp}
            onChange={(v) => setWhatsapp(maskPhone(v))}
            placeholder="(21) 99999-9999"
            inputMode="tel"
            autoComplete="tel"
            maxLength={15}
            required
            error={errors.whatsapp}
          />
          <NeighborhoodSelect
            value={bairro}
            onChange={setBairro}
            error={errors.bairro}
          />
        </>
      )}

      {step === 2 && (
        <>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Interesses</Label>
            <div className="flex flex-wrap gap-2">
              {INTERESSES.map((i) => {
                const ativo = interesses.includes(i);
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => toggleInteresse(i)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all",
                      ativo
                        ? "bg-primary text-primary-foreground border-primary shadow"
                        : "bg-background text-foreground border-border hover:border-primary/40",
                    )}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border-2 border-border p-4 bg-card">
            <Checkbox
              id="aceita"
              checked={aceita}
              onCheckedChange={(v) => setAceita(v === true)}
              className="mt-1"
            />
            <Label
              htmlFor="aceita"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              Aceito receber notificações, sugestões e novidades pelo WhatsApp.
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="freq" className="text-base font-semibold">
              Frequência das notificações
            </Label>
            <Select value={frequencia} onValueChange={setFrequencia}>
              <SelectTrigger id="freq" className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIAS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-base py-3">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </WizardShell>
  );
}