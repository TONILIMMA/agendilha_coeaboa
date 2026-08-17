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

function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 space-y-8">
      <header className="space-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
          {eyebrow}
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="text-foreground/70 leading-relaxed">{intro}</p>
      </header>

      <div className="space-y-6">
        {sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="font-display text-xl font-semibold tracking-tight">{s.heading}</h2>
            <p className="text-foreground/70 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>

      <Button asChild variant="outline" className="rounded-full">
        <Link to="/agenda">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar pra agenda
        </Link>
      </Button>
    </div>
  );
}

export function TermosPage() {
  return (
    <InfoPage
      eyebrow="Termos"
      title="Termos de Uso do AgendIlha"
      intro="O AgendIlha (Coé a Boa?) é uma agenda cultural curada da Ilha do Governador. Ao usar o app, você concorda com as regras abaixo."
      sections={[
        {
          heading: "O que o AgendIlha faz",
          body: "A gente reúne, revisa e divulga eventos da Ilha do Governador. O AgendIlha cura a programação, mas não organiza, vende ingresso nem responde pela realização dos rolês publicados.",
        },
        {
          heading: "Quem divulga é responsável pelas informações",
          body: "Data, horário, local, preço e classificação são informados por quem divulga o evento. O responsável pelo evento garante a veracidade dos dados e que tem autorização para usar as imagens enviadas.",
        },
        {
          heading: "Revisão antes de publicar",
          body: "Todo evento passa por revisão da equipe antes de aparecer na agenda. Podemos ajustar textos, recusar ou remover conteúdo enganoso, ofensivo, ilegal ou fora do escopo cultural da Ilha.",
        },
        {
          heading: "Conta e acesso",
          body: "O acesso é feito com seu WhatsApp e uma senha ou PIN de 4 dígitos. Guarde esses dados com você: tudo que for feito na sua conta é considerado feito por você.",
        },
        {
          heading: "Uso do conteúdo",
          body: "Você pode compartilhar links e cards do AgendIlha livremente. Copiar a base de eventos em massa, raspar dados automaticamente ou republicar como se fosse seu não é permitido.",
        },
        {
          heading: "Mudanças e contato",
          body: "Se estes termos mudarem, avisamos no app. Dúvida ou pedido de remoção de conteúdo? Fala com a gente pelo WhatsApp que consta no rodapé do evento ou no perfil do AgendIlha.",
        },
      ]}
    />
  );
}

export function PrivacidadePage() {
  return (
    <InfoPage
      eyebrow="Privacidade"
      title="Política de Privacidade"
      intro="Aqui você vê, sem enrolação, quais dados o AgendIlha coleta, por que coleta e o que você pode pedir a qualquer momento."
      sections={[
        {
          heading: "Dados que coletamos",
          body: "No cadastro: nome, número de WhatsApp e o tipo de perfil (público, divulgador ou artista). De quem divulga: dados do evento, do local e do contato de dúvidas. De quem só navega: preferências de bairro e categoria salvas no seu aparelho.",
        },
        {
          heading: "Por que usamos",
          body: "Pra criar e proteger sua conta, revisar e publicar eventos, falar com você sobre um rolê enviado e melhorar as sugestões da agenda. Não vendemos seus dados.",
        },
        {
          heading: "O que aparece em público",
          body: "Só o que faz parte do evento: título, descrição, data, local, imagens e o contato que o divulgador escolheu divulgar. Seu WhatsApp pessoal, senha e PIN nunca aparecem na agenda.",
        },
        {
          heading: "Quem tem acesso interno",
          body: "Apenas a equipe de curadoria e administração do AgendIlha, e só no que é necessário pra revisar cadastros e eventos. Usamos serviços de nuvem para banco de dados, autenticação e armazenamento de imagens.",
        },
        {
          heading: "Por quanto tempo guardamos",
          body: "Enquanto sua conta existir. Eventos removidos ficam na lixeira por 30 dias antes da exclusão definitiva.",
        },
        {
          heading: "Seus direitos",
          body: "Você pode ver, corrigir ou apagar seus dados e pedir a exclusão da conta. Chama a gente pelo WhatsApp do AgendIlha e resolvemos.",
        },
      ]}
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