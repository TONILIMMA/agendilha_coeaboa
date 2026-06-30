import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Megaphone, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { FormField } from "@/components/registration/FormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { validateBrazilianMobile } from "@/lib/whatsapp";
import { maskPhone } from "@/lib/registration";
import { handleError } from "@/lib/error-handler";
import { toast } from "sonner";
import { ROUTES } from "@/routes/config";

export default function CadastroPromotor() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim() || nome.trim().length < 3) e.nome = "Informe seu nome completo.";
    const v = validateBrazilianMobile(whatsapp);
    if (v.valid === false) e.whatsapp = v.reason;
    if (password.length < 6) e.password = "Mínimo 6 caracteres.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await signUp(whatsapp, password, nome.trim(), {}, "promotor");
      if (error) throw error;
      toast.success("Cadastro concluído! Bem-vindo(a) ao painel de promotor.");
      navigate(ROUTES.PROMOTOR_ESTABELECIMENTOS, { replace: true });
    } catch (err) {
      handleError(err, "Não foi possível concluir o cadastro de promotor.");
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
            Cadastro de Promotor
          </p>
          <h1 className="text-3xl font-black font-display leading-tight">
            Você vai se tornar Promotor
          </h1>
          <p className="text-base text-muted-foreground">
            Promotores têm acesso ao painel para cadastrar
            <strong> estabelecimentos </strong> e <strong>atrativos</strong> que aparecem na agenda.
          </p>
        </header>

        <Card className="p-5 space-y-2 border-2 border-rose-200 bg-rose-50/60">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">
              Após concluir, você entra direto no <strong>painel do promotor</strong>.
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
            label="Seu nome completo"
            value={nome}
            onChange={setNome}
            required
            error={errors.nome}
            placeholder="Como você quer ser identificado"
          />
          <FormField
            id="whatsapp"
            label="WhatsApp"
            value={whatsapp}
            onChange={(v) => setWhatsapp(maskPhone(v))}
            required
            inputMode="tel"
            placeholder="(21) 99999-9999"
            error={errors.whatsapp}
          />
          <FormField
            id="password"
            label="Crie uma senha"
            value={password}
            onChange={setPassword}
            required
            error={errors.password}
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 text-base font-bold rounded-full bg-rose-600 hover:bg-rose-700 shadow-lg"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Tornar-me promotor"}
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