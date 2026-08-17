import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { Music, MapPin, Sparkles, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const genres = [
  { id: "Samba", label: "Samba / Pagode" },
  { id: "Rock", label: "Rock" },
  { id: "MPB", label: "MPB" },
  { id: "Eletrônica", label: "Eletrônica" },
  { id: "Funk", label: "Funk" },
  { id: "Sertanejo", label: "Sertanejo" },
  { id: "Jazz", label: "Jazz / Blues" },
  { id: "Pop", label: "Pop" },
];

const neighborhoods = ["Bancários", "Cacuia", "Cocotá", "Freguesia", "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras", "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"];

export function Onboarding() {
  const { profile, loaded, saveProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");

  useEffect(() => {
    // Pop-up automático desativado conforme requisito de experiência.
    // if (loaded && !profile.onboarding_completed && profile.role === 'public') {
    //   setOpen(true);
    // }
  }, [loaded, profile.onboarding_completed, profile.role]);

  const handleFinish = async () => {
    await saveProfile({
      musical_preferences: selectedGenres,
      home_location: selectedNeighborhood,
      onboarding_completed: true,
    });
    setOpen(false);
    toast.success("Perfil personalizado com sucesso!", {
      description: "Agora as recomendações são baseadas no seu gosto.",
    });
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-8 sm:p-10">
          <DialogHeader className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-white shadow-xl flex items-center justify-center animate-bounce">
                <Sparkles className="h-8 w-8 text-secondary" />
              </div>
            </div>
            <DialogTitle className="text-3xl font-black text-center font-display text-primary leading-tight">
              {step === 1 ? "Onde você está?" : "O que você curte?"}
            </DialogTitle>
            <DialogDescription className="text-center text-lg font-medium text-muted-foreground mt-2">
              {step === 1 
                ? "Escolha seu bairro favorito na Ilha para recomendações hiperlocais." 
                : "Selecione os estilos musicais que não podem faltar na sua agenda."}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[250px] flex flex-col justify-center">
            {step === 1 ? (
              <div className="grid grid-cols-2 gap-3">
                {neighborhoods.sort().map(n => (
                  <Button
                    key={n}
                    variant={selectedNeighborhood === n ? "default" : "outline"}
                    className={cn(
                      "rounded-xl h-12 font-bold transition-all border-2",
                      selectedNeighborhood === n ? "scale-105 shadow-lg border-primary" : "hover:border-primary/30"
                    )}
                    onClick={() => setSelectedNeighborhood(n)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {n}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 justify-center">
                {genres.map(g => (
                  <Badge
                    key={g.id}
                    className={cn(
                      "px-6 py-3 rounded-full text-sm font-bold cursor-pointer transition-all border-2",
                      selectedGenres.includes(g.id) 
                        ? "bg-secondary text-white border-secondary scale-110 shadow-lg" 
                        : "bg-white text-muted-foreground border-border hover:border-secondary/30"
                    )}
                    onClick={() => toggleGenre(g.id)}
                  >
                    {selectedGenres.includes(g.id) && <Check className="h-4 w-4 mr-2 inline" />}
                    {g.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-10 flex-col sm:flex-row gap-3">
            <Button 
              variant="ghost" 
              className="rounded-full h-14 font-bold text-muted-foreground"
              onClick={() => {
                if (step === 1) setOpen(false);
                else setStep(1);
              }}
            >
              {step === 1 ? "Pular agora" : "Voltar"}
            </Button>
            <Button 
              className="rounded-full h-14 flex-1 font-black text-lg gradient-sunset shadow-xl"
              onClick={() => {
                if (step === 1 && selectedNeighborhood) setStep(2);
                else if (step === 2) handleFinish();
                else if (step === 1 && !selectedNeighborhood) setStep(2); // Skip neigh
              }}
            >
              {step === 1 ? "Continuar" : "Finalizar"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}