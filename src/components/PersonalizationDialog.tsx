import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile } from "@/hooks/useProfile";
import { Music, MapPin, Bell, Sparkles, Check, Settings2 } from "lucide-react";
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

interface PersonalizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonalizationDialog({ open, onOpenChange }: PersonalizationDialogProps) {
  const { profile, saveProfile } = useProfile();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [homeLocation, setHomeLocation] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");

  useEffect(() => {
    if (profile) {
      setSelectedGenres(profile.musical_preferences || []);
      setHomeLocation(profile.home_location || "");
      setPushEnabled(profile.push_notifications_enabled || false);
      setEmailEnabled(profile.email_notifications_enabled || false);
      setFrequency(profile.notification_frequency || "weekly");
    }
  }, [profile]);

  const handleSave = async () => {
    await saveProfile({
      musical_preferences: selectedGenres,
      home_location: homeLocation,
      push_notifications_enabled: pushEnabled,
      email_notifications_enabled: emailEnabled,
      notification_frequency: frequency,
    });
    onOpenChange(false);
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background/95 backdrop-blur-md">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-2xl font-black font-display text-primary flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-secondary" />
            Personalizar Experiência
          </SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            Ajuste suas preferências para receber recomendações e notificações personalizadas.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-10 py-4">
          {/* Localização */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Sua Localização
            </h3>
            <Select value={homeLocation} onValueChange={setHomeLocation}>
              <SelectTrigger className="h-14 rounded-2xl border-border/50 bg-secondary/5">
                <SelectValue placeholder="Seu bairro favorito" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoods.sort().map(n => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estilos Musicais */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
              <Music className="h-4 w-4" />
              Estilos Musicais
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map(g => (
                <Badge
                  key={g.id}
                  variant={selectedGenres.includes(g.id) ? "default" : "outline"}
                  className={cn(
                    "px-4 py-2 rounded-full cursor-pointer transition-all border-2",
                    selectedGenres.includes(g.id) 
                      ? "bg-secondary text-white border-secondary" 
                      : "bg-transparent text-muted-foreground border-border hover:border-secondary/30"
                  )}
                  onClick={() => toggleGenre(g.id)}
                >
                  {g.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notificações */}
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações Inteligentes
            </h3>
            
            <div className="space-y-4 bg-secondary/5 p-6 rounded-3xl border border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Alertas diretos no celular</p>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              </div>
              
              <div className="flex items-center justify-between border-t border-border/50 pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Resumo por WhatsApp</Label>
                  <p className="text-xs text-muted-foreground">Agenda completa no seu WhatsApp</p>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              <div className="space-y-2 border-t border-border/50 pt-4">
                <Label className="text-sm font-bold">Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="h-10 rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-10 sm:justify-start">
          <Button 
            className="w-full h-14 rounded-full font-black text-lg gradient-sunset shadow-xl"
            onClick={handleSave}
          >
            Salvar Preferências
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}