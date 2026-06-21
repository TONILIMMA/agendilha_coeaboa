import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, Image as ImageIcon, MapPin } from "lucide-react";
import { categoryLabels, type Submission } from "./types";

interface EventSocialCardProps {
  sub: Submission;
}

export function EventSocialCard({ sub }: EventSocialCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">
          <ImageIcon className="h-3.5 w-3.5 mr-1" />
          Card p/ Redes Sociais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[450px] p-0 overflow-hidden border-0">
        <div id={`event-card-${sub.id}`} className="bg-gradient-to-br from-primary via-primary to-primary/90 p-8 text-white aspect-square flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-20%] w-[70%] h-[70%] bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-2xl" />
          <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] bg-white/5 rounded-full blur-xl" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-2xl shadow-lg border border-white/30">🌴</div>
                <div className="flex flex-col">
                  <span className="font-display font-black text-2xl tracking-tighter leading-none">AgendIlha</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70">Agenda Cultural</span>
                </div>
              </div>
              {sub.is_highlight && (
                <Badge className="bg-amber-500 text-white border-0 animate-bounce shadow-lg px-3 py-1 font-bold">DESTAQUE 🔥</Badge>
              )}
            </div>

            <div className="space-y-4">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm px-3 py-1">{categoryLabels[sub.category || ''] || 'Evento'}</Badge>
              <h2 className="text-4xl font-display font-black leading-[1.1] uppercase tracking-tighter drop-shadow-md">{sub.event_title}</h2>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-amber-500/30 flex items-center justify-center"><CalendarDays className="h-4 w-4 text-amber-500" /></div>
                <p className="text-[10px] uppercase opacity-70 font-bold tracking-widest">Quando</p>
              </div>
              <p className="font-bold text-lg leading-tight">{sub.date}<br/><span className="text-amber-500">{sub.start_time}</span></p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg group hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-500/30 flex items-center justify-center"><MapPin className="h-4 w-4 text-blue-400" /></div>
                <p className="text-[10px] uppercase opacity-70 font-bold tracking-widest">Onde</p>
              </div>
              <p className="font-bold text-lg leading-tight line-clamp-2">{sub.location}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center p-1">
                <img src="/lovable-uploads/61793740-3f9b-4638-ba33-df5e67272522.png" alt="QR" className="w-full h-full object-contain" />
              </div>
              <p className="text-[10px] font-bold opacity-80 leading-tight">Escaneie para<br/>ver detalhes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black italic tracking-tighter text-amber-500">#CoéABoaIlha</p>
              <p className="text-[10px] font-mono opacity-50">agendilha.com.br</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-muted/50 border-t flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-primary font-bold animate-pulse">
            <ImageIcon className="h-4 w-4" />
            <p className="text-xs">CARD PRONTO PARA POSTAR!</p>
          </div>
          <p className="text-[10px] text-muted-foreground text-center px-4 italic leading-tight">DICA: No celular, pressione o card e escolha "Salvar" ou tire um print. No PC, use "Ferramenta de Captura" (Win+Shift+S).</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}