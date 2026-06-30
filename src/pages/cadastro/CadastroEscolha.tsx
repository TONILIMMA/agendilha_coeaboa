import { useNavigate } from "react-router-dom";
import { Bell, Megaphone, Music, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const opcoes = [
  {
    id: "publico",
    titulo: "Quero receber eventos",
    descricao: "Receba novidades e eventos perto de você.",
    icon: Bell,
    cor: "from-amber-100 to-orange-50",
    iconBg: "bg-orange-500",
    rota: "/cadastro/publico",
  },
  {
    id: "divulgador",
    titulo: "Quero divulgar eventos",
    descricao: "Cadastre-se para divulgar os seus rolês.",
    icon: Megaphone,
    cor: "from-rose-100 to-pink-50",
    iconBg: "bg-rose-500",
    rota: "/cadastro-promotor",
  },
  {
    id: "artista",
    titulo: "Sou artista / banda / atração",
    descricao: "Crie seu perfil e fique disponível para oportunidades.",
    icon: Music,
    cor: "from-violet-100 to-indigo-50",
    iconBg: "bg-violet-500",
    rota: "/cadastro/artista",
  },
] as const;

export default function CadastroEscolha() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background">
      <div className="mx-auto max-w-md px-4 py-10 sm:py-16 space-y-8">
        <header className="text-center space-y-3">
          <p className="text-sm font-bold uppercase tracking-wide text-primary">
            AgendIlha · Coé a Boa
          </p>
          <h1 className="text-3xl sm:text-4xl font-black font-display text-foreground leading-tight">
            Como você quer participar?
          </h1>
          <p className="text-base text-muted-foreground">
            Escolha o perfil que mais combina com você. É rapidinho.
          </p>
        </header>

        <div className="space-y-4">
          {opcoes.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.id}
                onClick={() => navigate(o.rota)}
                className="w-full text-left group"
              >
                <Card
                  className={`p-5 border-2 rounded-2xl bg-gradient-to-br ${o.cor} hover:scale-[1.02] hover:shadow-xl transition-all duration-200`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-14 w-14 rounded-2xl ${o.iconBg} flex items-center justify-center shadow-md shrink-0`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground leading-tight">
                        {o.titulo}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {o.descricao}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </Card>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Já tem cadastro?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="font-bold text-primary underline-offset-2 hover:underline"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
}