import { Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgendaLoginBannerProps {
  isLoggedIn: boolean;
  neighborhood?: string | null;
  hasProfile: boolean;
  onSignUp: () => void;
  onFilterNeighborhood: (neighborhood: string) => void;
}

/** Faixa acima das abas: convida visitante a se cadastrar ou mostra o bairro do usuário. */
export function AgendaLoginBanner({
  isLoggedIn,
  neighborhood,
  hasProfile,
  onSignUp,
  onFilterNeighborhood,
}: AgendaLoginBannerProps) {
  if (!isLoggedIn) {
    return (
      <div className="mb-12 animate-in fade-in slide-in-from-top-2 duration-700">
        <div className="bg-gradient-to-br from-secondary/5 to-primary/5 border border-primary/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="h-24 w-24 text-primary" />
          </div>
          <div className="h-16 w-16 rounded-2xl bg-card shadow-md flex items-center justify-center shrink-0 border border-primary/10 z-10">
            <Info className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left z-10">
            <h3 className="text-xl font-black font-display text-primary leading-tight mb-1.5 tracking-tight">
              Personalize sua experiência ✨
            </h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-lg">
              Cadastre-se pra receber dicas do seu bairro e do seu som. É rapidinho e de graça!
            </p>
          </div>
          <Button
            onClick={onSignUp}
            className="rounded-full gradient-sunset text-primary-foreground font-black px-8 h-12 shadow-lg hover:scale-105 active:scale-95 transition-all z-10"
          >
            Começar agora
          </Button>
        </div>
      </div>
    );
  }

  if (!hasProfile) return null;

  return (
    <div className="mb-12 animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-black font-display text-primary leading-tight mb-1">
            Destaques no seu bairro 🌴
          </h3>
          <p className="text-muted-foreground text-sm font-medium">
            {neighborhood
              ? `Filtrando automaticamente eventos próximos a ${neighborhood}.`
              : "Coloque seu bairro no perfil que a gente separa o que rola perto de você."}
          </p>
        </div>
        {neighborhood && (
          <Button
            variant="outline"
            onClick={() => onFilterNeighborhood(neighborhood)}
            className="rounded-full border-2 border-primary/20 text-primary font-bold px-6 hover:bg-primary/5"
          >
            Ver todos no bairro
          </Button>
        )}
      </div>
    </div>
  );
}
