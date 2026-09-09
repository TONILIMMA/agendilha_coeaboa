import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, Music } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";
import { submitPublicCadastro } from "@/lib/publicCadastro";
import { handleError } from "@/lib/error-handler";

const CATEGORIAS = [
  { value: "Música", label: "Música / Show" },
  { value: "Cultura", label: "Cultura / Arte" },
  { value: "Esporte", label: "Esporte" },
  { value: "Outros", label: "Outra categoria" },
];

export default function CadastroAtrativoPublico() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    categoryOther: "",
    style: "",
    responsavelNome: "",
    whatsapp: "",
    email: "",
    cidade: "",
    social: "",
    description: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Informe o nome do atrativo.");
    if (!form.category) return toast.error("Escolha a categoria.");
    if (form.category === "Outros" && !form.categoryOther.trim())
      return toast.error("Diga qual é a categoria.");
    const v = validateBrazilianMobile(form.whatsapp);
    if (!v.valid) return toast.error("Informe um WhatsApp válido com DDD.");

    setLoading(true);
    try {
      await submitPublicCadastro("atrativo", form);
      setSent(true);
      window.scrollTo(0, 0);
    } catch (err) {
      handleError(err, { context: "CadastroAtrativoPublico", fallback: "Não deu pra enviar o cadastro." });
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
            Recebemos os dados do atrativo <strong>{form.name}</strong>. A equipe vai conferir e organizar
            tudo. Se precisar mudar alguma informação, fala com quem te mandou esse link.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <Helmet>
        <title>Cadastro de atrativo | AgendIlha</title>
        <meta
          name="description"
          content="Cadastre seu atrativo (artista, banda, DJ ou atração) para entrar na agenda do AgendIlha."
        />
      </Helmet>

      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Music className="h-6 w-6" /> Cadastro de atrativo
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha só o essencial. É rapidinho e a equipe cuida do resto.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do atrativo / artista *</Label>
          <Input id="name" className="h-12 text-base" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Banda Maré Alta" />
        </div>

        <div className="space-y-2">
          <Label>Categoria *</Label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map((c) => {
              const active = form.category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("category", c.value)}
                  className={cn(
                    "min-h-14 rounded-xl border px-3 py-3 text-sm font-semibold text-left transition-colors",
                    active ? "border-primary bg-primary/10 text-primary" : "border-input bg-background hover:bg-muted",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Bar ou restaurante? Use o formulário de estabelecimentos.
          </p>
        </div>

        {form.category === "Outros" && (
          <div className="space-y-2">
            <Label htmlFor="categoryOther">Qual categoria? *</Label>
            <Input id="categoryOther" className="h-12 text-base" value={form.categoryOther} onChange={(e) => set("categoryOther", e.target.value)} placeholder="Ex.: Teatro, Feira, Palestra" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="style">Estilo (opcional)</Label>
          <Input id="style" className="h-12 text-base" value={form.style} onChange={(e) => set("style", e.target.value)} placeholder="Ex.: samba, rock, MPB" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelNome">Contato (nome do responsável) *</Label>
          <Input id="responsavelNome" name="name" autoComplete="name" className="h-12 text-base" value={form.responsavelNome} onChange={(e) => set("responsavelNome", e.target.value)} placeholder="Quem responde pelo atrativo" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp *</Label>
          <Input id="whatsapp" name="tel" autoComplete="tel" inputMode="tel" maxLength={16} className="h-12 text-base" value={form.whatsapp} onChange={(e) => set("whatsapp", formatPhoneDisplay(e.target.value))} placeholder="(21) 99999-9999" />
          <p className="text-xs text-muted-foreground">DDD + 9 + 8 dígitos.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail (opcional)</Label>
          <Input id="email" name="email" autoComplete="email" type="email" className="h-12 text-base" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@exemplo.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cidade">Cidade / região (opcional)</Label>
          <Input id="cidade" className="h-12 text-base" value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social">Instagram ou link (opcional)</Label>
          <Input id="social" className="h-12 text-base" value={form.social} onChange={(e) => set("social", e.target.value)} placeholder="@seuperfil" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Sobre o atrativo (opcional)</Label>
          <Textarea id="description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Conta rapidinho o que vocês fazem" />
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
