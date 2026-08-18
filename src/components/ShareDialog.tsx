import { memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
  import { MessageCircle, Globe, Copy, Share2, Send } from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  text: string;
  url: string;
  onShare?: (platform: string) => void;
}

export const ShareDialog = memo(function ShareDialog({ open, onOpenChange, title, text, url, onShare }: ShareDialogProps) {
  const fullText = `${text}\n${url}`;

  const handleShare = (platform: string) => {
    onShare?.(platform);
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`, '_blank');
        break;
      case 'instagram':
        navigator.clipboard.writeText(url);
        toast.success("Link copiado para o Instagram!", { description: "Abra os Stories, selecione o sticker de Link e cole." });
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
        break;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-[2rem] p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black font-display text-primary flex items-center gap-2 justify-center">
            <Share2 className="h-6 w-6 text-secondary" />
            Compartilhar
          </DialogTitle>
          <DialogDescription className="text-center font-medium mt-2">
            Divulgue esse evento com seus amigos e nas redes sociais!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          <Button 
            variant="outline" 
            className="flex-col h-24 rounded-3xl gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
            onClick={() => handleShare('whatsapp')}
          >
            <MessageCircle className="h-8 w-8" />
            <span className="font-bold text-xs">WhatsApp</span>
          </Button>
           <Button 
             variant="outline" 
             className="flex-col h-24 rounded-3xl gap-2 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
             onClick={() => handleShare('instagram')}
           >
             <Globe className="h-8 w-8" />
             <span className="font-bold text-xs">Instagram</span>
           </Button>
          <Button 
            variant="outline" 
            className="flex-col h-24 rounded-3xl gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            onClick={() => handleShare('facebook')}
          >
             <Globe className="h-8 w-8" />
            <span className="font-bold text-xs">Facebook</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex-col h-24 rounded-3xl gap-2 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200"
            onClick={() => handleShare('twitter')}
          >
             <Send className="h-8 w-8" />
            <span className="font-bold text-xs">Twitter / X</span>
          </Button>
        </div>

        <Button 
          variant="secondary" 
          className="w-full h-12 rounded-full font-bold gap-2"
          onClick={() => handleShare('copy')}
        >
          <Copy className="h-4 w-4" />
          Copiar link do evento
        </Button>
      </DialogContent>
    </Dialog>
  );
});