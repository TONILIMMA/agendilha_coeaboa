import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MENSAGENS: Record<string, { titulo: string; texto: string }> = {
  publico: {
    titulo: "Pronto!",
    texto: "Agora você poderá receber eventos e novidades perto de você.",
  },
  divulgador: {
    titulo: "Cadastro concluído",
    texto:
      "Seus dados ficarão salvos para facilitar futuras divulgações.",
  },
  artista: {
    titulo: "Tudo certo!",
    texto: "Seu perfil artístico foi criado com sucesso.",
  },
};

export default function CadastroSucesso() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const perfil = params.get("perfil") ?? "publico";
  const msg = MENSAGENS[perfil] ?? MENSAGENS.publico;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-background to-background flex items-center">
      <div className="mx-auto max-w-md px-4 py-10 text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black font-display text-foreground">
            {msg.titulo}
          </h1>
          <p className="text-base text-muted-foreground">{msg.texto}</p>
        </div>
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate("/agenda")}
            className="w-full h-14 text-base font-bold rounded-full gradient-sunset shadow-lg"
          >
            Ver agenda de eventos
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full h-12 font-semibold"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}