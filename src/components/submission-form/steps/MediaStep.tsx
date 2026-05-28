import { UseFormReturn } from "react-hook-form";
import { Image as ImageIcon, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "../FormFields";
import { AIFlyerGenerator } from "../../AIFlyerGenerator";
import { Badge } from "@/components/ui/badge";

interface MediaStepProps {
  form: UseFormReturn<any>;
  imageSource: "upload" | "ai" | null;
  setImageSource: (val: "upload" | "ai") => void;
  eventImage: File | string | null;
  setEventImage: (val: File | string | null) => void;
}

export function MediaStep({ form, imageSource, setImageSource, eventImage, setEventImage }: MediaStepProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Flyer ou Banner do Evento
        </h2>
        <p className="text-sm text-muted-foreground">Escolha como quer adicionar a arte do seu evento.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          variant={imageSource === "upload" ? "default" : "outline"}
          className="h-20 sm:h-24 flex flex-col gap-2 transition-all"
          onClick={() => setImageSource("upload")}
        >
          <ImageIcon className="h-6 w-6" />
          <div className="text-center">
            <div className="font-bold">Já tenho a arte</div>
            <div className="text-[10px] opacity-70">Fazer upload do flyer</div>
          </div>
        </Button>

        <Button
          type="button"
          variant={imageSource === "ai" ? "default" : "outline"}
          className="h-20 sm:h-24 flex flex-col gap-2 relative transition-all"
          onClick={() => setImageSource("ai")}
        >
          <Sparkles className="h-6 w-6 text-yellow-500" />
          <div className="text-center">
            <div className="font-bold">Gerar com IA</div>
            <div className="text-[10px] opacity-70 italic font-medium">Novidade!</div>
          </div>
          <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black border-none animate-pulse text-[8px] sm:text-[10px]">BETA</Badge>
        </Button>
      </div>

      {imageSource === "upload" && (
        <div className="animate-in zoom-in-95 duration-300">
          <FileUpload
            label="Flyer Principal"
            accept="image/*"
            file={eventImage}
            onFileChange={setEventImage}
          />
        </div>
      )}

      {imageSource === "ai" && (
        <div className="animate-in zoom-in-95 duration-300">
          <AIFlyerGenerator
            eventTitle={form.watch("eventTitle") || form.watch("atrativoName")}
            eventDate={form.watch("date")}
            onImageGenerated={(url) => setEventImage(url)}
          />
        </div>
      )}
    </div>
  );
}
