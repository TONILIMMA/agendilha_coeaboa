import { useState } from "react";
import SubmissionForm from "@/components/SubmissionForm";
import { useProfile } from "@/hooks/useProfile";
import { LoadingState } from "@/components/ui/LoadingState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Megaphone, ExternalLink, ShieldCheck } from "lucide-react";

/**
 * Gate para divulgar evento.
 * Disponível para qualquer usuário logado sem restrição de perfil.
 */
const SubmitEvent = () => {
  const { loaded } = useProfile();
  const [adModalOpen, setAdModalOpen] = useState(false);

  if (!loaded) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background pb-12">
      <main className="container mx-auto px-2 sm:px-4 pt-4 sm:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Espaço de Publicidade (Carrossel / Banner) */}
          <div 
            onClick={() => setAdModalOpen(true)}
            className="w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-xl p-4 cursor-pointer hover:bg-primary/20 transition-all flex items-center gap-4 overflow-hidden relative"
          >
            <div className="absolute top-2 right-2 flex gap-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">Patrocinado</span>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Destaque sua marca ou evento aqui!</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">Clique e conheça o carrossel de anúncios premium rotativos.</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground mr-2" />
          </div>

          <Dialog open={adModalOpen} onOpenChange={setAdModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Espaço de Publicidade e Mídia Kit</DialogTitle>
                <DialogDescription>
                  Maximize seu alcance oferecendo anúncios impactantes dentro da nossa plataforma.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-bold text-sm mb-1">Carrossel de Anúncios Rotativo</h4>
                  <p className="text-sm text-muted-foreground">Sua marca exibida diretamente no formulário visual para o púbico alvo que navega todos os dias na agenda.</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-bold text-sm mb-1">Destaques Premium</h4>
                  <p className="text-sm text-muted-foreground">Coloque seu conteúdo no topo do mural, se tornando prioridade ao longo de todo o mapa de eventos.</p>
                </div>
                <Button className="w-full" onClick={() => setAdModalOpen(false)}>Falar com a Curadoria (WhatsApp)</Button>
              </div>
            </DialogContent>
          </Dialog>

          <SubmissionForm />
          
          {/* Seção de anúncios gratuitos de eventos */}
          <div className="mt-8 border-t pt-8">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Anúncios Gratuitos e Pré-cadastro Inteligente
            </h3>
            <p className="text-sm text-muted-foreground">
              A Plataforma permite a inclusão em seção de anúncios gratuitos de eventos. Qualquer usuário logado pode sugerir, pela ferramenta de autocomplete global nos campos acima, atrativos ou contatos vindos da base existente. Caso o item não exista, nossa ferramenta permite abrir facilmente a opção do seu pré-cadastro atrelado à criação do evento. 
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubmitEvent;
