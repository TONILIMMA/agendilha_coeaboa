import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDivulgadorStatus } from "@/hooks/useDivulgadorStatus";
import { SolicitarDivulgadorCard } from "@/components/divulgador/SolicitarDivulgadorCard";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/button";
import { 
  Megaphone, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowLeft,
  LayoutDashboard,
  Calendar
} from "lucide-react";
import { formatBrazilianDate } from "@/lib/date-utils";

export default function StatusDivulgador() {
  const { user } = useAuth();
  const { loading, isDivulgador, request } = useDivulgadorStatus();
  const navigate = useNavigate();

  if (loading) return <LoadingState message="Conferindo seu perfil..." />;

  // Se já for divulgador, encaminha para Meus Eventos que é o painel dele
  if (isDivulgador) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
        <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Perfil Aprovado!</h1>
          <p className="text-foreground/70">
            Você já tem acesso de Divulgador. Agora é só cadastrar seus eventos.
          </p>
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            className="rounded-full h-12 font-bold bg-foreground text-background hover:bg-foreground/90"
            onClick={() => navigate("/meus-eventos")}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Ver meus eventos
          </Button>
          <Button 
            variant="outline"
            className="rounded-full h-12 font-bold"
            onClick={() => navigate("/enviar-evento")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Divulgar novo evento
          </Button>
        </div>
      </div>
    );
  }

  const pendente = request?.status === "pendente";
  const recusado = request?.status === "recusado";

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-8">
      <header className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="rounded-full h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight">Perfil Divulgador</h1>
          <p className="text-xs text-foreground/60 uppercase tracking-widest font-bold">Solicitação de acesso</p>
        </div>
      </header>

      {request ? (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${
            pendente ? "bg-amber-50/50 border-amber-200" : "bg-red-50/50 border-red-200"
          } space-y-4`}>
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                pendente ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
              }`}>
                {pendente ? <Clock className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <h2 className={`font-bold text-lg tracking-tight ${
                  pendente ? "text-amber-900" : "text-red-900"
                }`}>
                  {pendente ? "Pedido em análise" : "Pedido não aprovado"}
                </h2>
                <p className={`text-sm ${
                  pendente ? "text-amber-800/80" : "text-red-800/80"
                }`}>
                  Solicitado em {formatBrazilianDate(request.created_at)}
                </p>
              </div>
            </div>

            {pendente && (
              <p className="text-sm text-amber-800/90 leading-relaxed">
                Nossa curadoria está avaliando seu perfil. Em breve você receberá acesso para criar e editar seus eventos diretamente na agenda.
              </p>
            )}

            {recusado && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/60 border border-red-200/60 text-sm text-red-900 leading-relaxed italic">
                  "{request.admin_notes || "Não foi possível aprovar seu perfil neste momento."}"
                </div>
                <p className="text-sm text-red-800/90">
                  Você pode enviar uma nova solicitação com mais detalhes sobre o que pretende divulgar.
                </p>
                <SolicitarDivulgadorCard />
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-dashed border-foreground/10 text-center">
            <p className="text-xs text-foreground/50 mb-4 font-medium italic">
              "Curadoria local focada no melhor da Ilha."
            </p>
            <Button 
              variant="ghost" 
              className="rounded-full text-foreground/60 hover:text-foreground text-xs"
              onClick={() => navigate("/")}
            >
              Voltar para a página inicial
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-foreground/[0.03] border border-foreground/10 text-center space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight">Divulgue seus rolês</h2>
              <p className="text-sm text-foreground/70 text-balance leading-relaxed">
                Tem um bar, restaurante, banda ou produz eventos na Ilha? Seja um Divulgador oficial.
              </p>
            </div>
            <div className="pt-4">
              <SolicitarDivulgadorCard />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 rounded-2xl border border-foreground/5 bg-foreground/[0.01]">
              <span className="block text-lg font-bold text-primary">Zero</span>
              <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-widest">Custo</span>
            </div>
            <div className="p-4 rounded-2xl border border-foreground/5 bg-foreground/[0.01]">
              <span className="block text-lg font-bold text-primary">VIP</span>
              <span className="text-[10px] uppercase font-bold text-foreground/50 tracking-widest">Destaque</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
