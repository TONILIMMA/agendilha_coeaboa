import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description: string;
  eyebrow?: string;
}

export function PlaceholderInfo({ title, description, eyebrow = "Em breve" }: Props) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-16 space-y-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
        {eyebrow}
      </span>
      <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
        {title}
      </h1>
      <p className="text-foreground/70 max-w-xl leading-relaxed">{description}</p>
      <Button asChild variant="outline" className="rounded-full mt-4">
        <Link to="/agenda">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar pra agenda
        </Link>
      </Button>
    </div>
  );
}

export function TermosPage() {
  return (
    <PlaceholderInfo
      eyebrow="Documento em preparação"
      title="Termos de Uso"
      description="Estamos redigindo a versão final dos Termos de Uso do AgendIlha. Assim que sair, você acha tudo aqui direitinho. Qualquer dúvida, chama a gente pelo WhatsApp."
    />
  );
}

export function PrivacidadePage() {
  return (
    <PlaceholderInfo
      eyebrow="Documento em preparação"
      title="Política de Privacidade"
      description="A gente cuida dos seus dados com carinho e a política completa tá saindo do forno. Em breve tudo aqui, com clareza total sobre o que a gente coleta e usa."
    />
  );
}

export function ImpulsionamentoPage() {
  return (
    <PlaceholderInfo
      eyebrow="Função em desenvolvimento"
      title="Impulsionar seu evento"
      description="Tô montando o esquema pra você dar aquele empurrão extra no seu rolê: destaque na agenda, topo da categoria e envio via WhatsApp. Fica de olho — em breve, tudo aqui."
    />
  );
}

export default PlaceholderInfo;