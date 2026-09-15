import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";
import { submitPublicCadastro } from "@/lib/publicCadastro";
import { handleError } from "@/lib/error-handler";

const TIPOS = [
  { value: "Bar", label: "Bar" },
  { value: "Restaurante", label: "Restaurante" },
  { value: "Casa de eventos", label: "Casa de eventos" },
  { value: "Quiosque", label: "Quiosque" },
  { value: "Outro", label: "Outro tipo" },
];

/**
 * Formulário público de estabelecimento (link enviado pelo administrador).
 * Sem login: o cadastro entra como "aguardando análise" e não pode ser editado depois.
 */
export default function CadastroEstabelecimentoPublico() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    tipo: "",
    tipoOutro: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cep: "",
    responsavelNome: "",
    whatsapp: "",
    email: "",
    social: "",
    observacoes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Informe o nome do estabelecimento.");
    if (!form.tipo) return toast.error("Escolha o tipo do estabelecimento.");
    if (form.tipo === "Outro" && !form.tipoOutro.trim()) return toast.error("Diga qual é o tipo.");
    if (!form.endereco.trim()) return toast.error("Informe o endereço.");
    if (form.whatsapp.trim() && !validateBrazilianMobile(form.whatsapp).valid)
      return toast.error("Confira o WhatsApp ou deixe o campo vazio.");

    setLoading(true);
    try {
      await submitPublicCadastro("estabelecimento", {
        ...form,
        tipo: form.tipo === "Outro" ? form.tipoOutro : form.tipo,
      });
      setSent(true);
      window.scrollTo(0, 0);
    } catch (err) {
      handleError(err, {
        context: "CadastroEstabelecimentoPublico",
        fallback: "Não deu pra enviar o cadastro.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full p-8 text-center space-y-4 rounded-3xl">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold">Cadastro enviado!</h1>
          <p className="text-muted-foreground text-sm">
            Recebemos os dados de <strong>{form.nome}</strong>. A equipe vai conferir tudo. Se precisar
            mudar alguma informação, fala com quem te mandou esse link.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <Helmet>
        <title>Cadastro de estabelecimento | AgendIlha</title>
        <meta
          name="description"
          content="Cadastre seu bar, restaurante ou casa de eventos para entrar na agenda do AgendIlha."
        />
      </Helmet>

      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Store className="h-6 w-6" /> Cadastro de estabelecimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha só o essencial. É rapidinho e a equipe cuida do resto.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do estabelecimento *</Label>
          <Input id="nome" className="h-12 text-base" value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Bar do Zé" />
        </div>

        <div className="space-y-2">
          <Label>Tipo *</Label>
          <div className="grid grid-cols-2 gap-2">
            {TIPOS.map((t) => {
              const active = form.tipo === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("tipo", t.value)}
                  className={cn(
                    "min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold text-left transition-colors",
                    active ? "border-primary bg-primary/10 text-primary" : "border-input bg-background hover:bg-muted",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {form.tipo === "Outro" && (
          <div className="space-y-2">
            <Label htmlFor="tipoOutro">Qual tipo? *</Label>
            <Input id="tipoOutro" className="h-12 text-base" value={form.tipoOutro} onChange={(e) => set("tipoOutro", e.target.value)} placeholder="Ex.: Quiosque, Clube" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço (rua) *</Label>
          <Input id="endereco" className="h-12 text-base" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua / Avenida" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" inputMode="numeric" className="h-12 text-base" value={form.numero} onChange={(e) => set("numero", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" className="h-12 text-base" value={form.complemento} onChange={(e) => set("complemento", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro / região</Label>
            <Input id="bairro" className="h-12 text-base" value={form.bairro} onChange={(e) => set("bairro", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" inputMode="numeric" maxLength={9} className="h-12 text-base" value={form.cep} onChange={(e) => set("cep", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelNome">Contato (nome do responsável) *</Label>
          <Input id="responsavelNome" name="name" autoComplete="name" className="h-12 text-base" value={form.responsavelNome} onChange={(e) => set("responsavelNome", e.target.value)} placeholder="Quem responde pelo local" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
          <Input id="whatsapp" name="tel" autoComplete="tel" inputMode="tel" maxLength={16} className="h-12 text-base" value={form.whatsapp} onChange={(e) => set("whatsapp", formatPhoneDisplay(e.target.value))} placeholder="(21) 99999-9999" />
          <p className="text-xs text-muted-foreground">Se informar, use DDD + número.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail (opcional)</Label>
          <Input id="email" name="email" autoComplete="email" type="email" className="h-12 text-base" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@exemplo.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social">Instagram ou link (opcional)</Label>
          <Input id="social" className="h-12 text-base" value={form.social} onChange={(e) => set("social", e.target.value)} placeholder="@seuperfil" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Alguma observação (opcional)</Label>
          <Textarea id="observacoes" rows={3} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Horário de funcionamento, dias de música ao vivo..." />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 font-bold gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar cadastro
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Depois do envio, os dados ficam com a equipe para conferência.
        </p>
      </form>
    </main>
  );
}
