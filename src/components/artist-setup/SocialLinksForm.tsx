import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { Music, Globe, MessageCircle, Video } from "lucide-react";

interface SocialLinksFormProps {
  form: UseFormReturn<any>;
}

export function SocialLinksForm({ form }: SocialLinksFormProps) {
  const { register } = form;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="instagram" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="text-pink-500 font-bold">IG</span> Instagram
          </Label>
          <Input 
            id="instagram" 
            {...register("instagram")}
            placeholder="@seuusuario"
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtube" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
             <Video className="h-3 w-3 text-red-500" /> YouTube
          </Label>
          <Input 
            id="youtube" 
            {...register("youtube")}
            placeholder="Link do canal ou vídeo principal"
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spotify_url" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Music className="h-3 w-3 text-emerald-500" /> Spotify
          </Label>
          <Input 
            id="spotify_url" 
            {...register("spotify_url")}
            placeholder="Link do perfil ou álbum"
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website_url" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-3 w-3 text-blue-500" /> Site Oficial
          </Label>
          <Input 
            id="website_url" 
            {...register("website_url")}
            placeholder="www.seusite.com.br"
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
        </div>
      </div>

      <div className="pt-4 border-t border-border/50">
        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="h-3 w-3 text-green-500" /> WhatsApp Profissional *
          </Label>
          <Input 
            id="whatsapp" 
            {...register("whatsapp")}
            placeholder="(21) 98765-4321"
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
          <p className="text-[10px] text-muted-foreground px-1 italic">Este número será usado para contratações através do app.</p>
        </div>
      </div>
    </div>
  );
}