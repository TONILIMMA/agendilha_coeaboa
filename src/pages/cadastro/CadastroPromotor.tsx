import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FormField } from "@/components/registration/FormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateBrazilianMobile } from "@/lib/whatsapp";
import { maskPhone } from "@/lib/registration";
import { handleError } from "@/lib/error-handler";
import { toast } from "sonner";
import { ROUTES } from "@/routes/config";

const BAIRROS_ILHA = [
  "Jardim Guanabara",
  "Cocotá",
  "Cacuia",
  "Ribeira",
  "Galeão",
  "Freguesia",
  "Ilha do Governador (outros)",
];

export default function CadastroPromotor() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bairro, setBairro] = useState("");
  const [aceite, setAceite] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    // Só valida o formato do telefone quando algo for digitado.
    if (whatsapp.trim()) {
      const v = validateBrazilianMobile(whatsapp);
      if (v.valid === false) e.whatsapp = v.reason;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signUp(
        whatsapp,
        password,
        nome.trim(),
        { profile: { address_neighborhood: bairro } },
        "divulgador",
      );
      if (error) throw error;
      toast.success(
        "Cadastro feito! Agora você já pode cadastrar seus eventos na agenda curada da Ilha.",
      );
      navigate(ROUTES.PROMOTOR_ESTABELECIMENTOS, { replace: true });
    } catch (err) {
      handleError(err, "Não foi possível concluir o cadastro de divulgador.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-background to-background">
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16 space-y-6">
        <header className="space-y-3 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 shadow-lg mx-auto">
            <Megaphone className="h-8 w-8 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600">
            Divulgador
          </p>
          <h1 className="text-3xl font-black font-display leading-tight">
            Cadastro rápido para divulgar seus eventos
          </h1>
          <p className="text-base text-muted-foreground">
            É coisa de 30 segundos: só pra gente saber quem está por trás dos rolês da Ilha.
          </p>
        </header>

        <Card className="p-5 space-y-2 border-2 border-rose-200 bg-rose-50/60">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              Após concluir, você entra direto no <strong>painel do divulgador</strong>.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              Somente você poderá editar os registros que cadastrar.
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <FormField
            id="nome"
            label="Seu nome ou nome fantasia"
            value={nome}
            onChange={setNome}
            error={errors.nome}
            placeholder="Ex.: Bar do Zé, Produções da Ana"
            autoComplete="name"
          />
          <FormField
            id="whatsapp"
            label="WhatsApp (DDD + número)"
            value={whatsapp}
            onChange={(v) => setWhatsapp(maskPhone(v))}
            inputMode="tel"
            placeholder="Ex.: 21 99999-0000"
            error={errors.whatsapp}
            autoComplete="tel"
          />
          <div className="space-y-1.5">
            <Label htmlFor="bairro">Seu bairro</Label>
            <Select value={bairro} onValueChange={setBairro}>
              <SelectTrigger id="bairro" className="h-12">
                <SelectValue placeholder="Escolha seu bairro" />
              </SelectTrigger>
              <SelectContent>
                {BAIRROS_ILHA.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bairro && <p className="text-xs text-destructive">{errors.bairro}</p>}
          </div>
          <FormField
            id="password"
            label="Crie uma senha"
            value={password}
            onChange={setPassword}
            error={errors.password}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
          <div className="space-y-1.5">
            <div className="flex items-start gap-3 rounded-xl border-2 border-rose-200 bg-rose-50/60 p-4">
              <Checkbox
                id="aceite"
                checked={aceite}
                onCheckedChange={(v) => setAceite(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="aceite" className="text-sm font-normal leading-snug cursor-pointer">
                Li e concordo com os termos de uso e com a responsabilidade pela divulgação dos
                eventos que eu cadastrar.
              </Label>
            </div>
            {errors.aceite && <p className="text-xs text-destructive">{errors.aceite}</p>}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 text-base font-bold rounded-full bg-rose-600 hover:bg-rose-700 shadow-lg"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Começar a divulgar"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Já tem conta?{" "}
          <button
            onClick={() => navigate(ROUTES.AUTH)}
            className="font-semibold text-rose-600 hover:underline"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}