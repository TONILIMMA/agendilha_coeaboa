import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageIcon, Video, X, Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MediaUploadFormProps {
  artistId?: string;
  onMediaUploaded: () => void;
}

export function MediaUploadForm({ artistId, onMediaUploaded }: MediaUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; type: 'image' | 'video'; preview: string }[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map(file => ({
      file,
      type,
      preview: URL.createObjectURL(file)
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadMedia = async () => {
    if (!artistId || previews.length === 0) return;
    setUploading(true);
    try {
      for (const item of previews) {
        const fileExt = item.file.name.split('.').pop();
        const filePath = `${artistId}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('artist-media')
          .upload(filePath, item.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('artist-media')
          .getPublicUrl(filePath);

        await supabase.from('artist_media').insert({
          artist_id: artistId,
          url: publicUrl,
          media_type: item.type,
        });
      }
      toast.success("Mídias enviadas com sucesso!");
      setPreviews([]);
      onMediaUploaded();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar mídias.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative group">
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={(e) => handleFileChange(e, 'image')}
            disabled={uploading}
          />
          <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group-hover:border-primary/40 transition-colors bg-primary/5">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Adicionar Fotos</span>
            <p className="text-[10px] text-muted-foreground">Flyers, shows, bastidores</p>
          </div>
        </div>

        <div className="relative group">
          <input 
            type="file" 
            accept="video/*" 
            multiple 
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={(e) => handleFileChange(e, 'video')}
            disabled={uploading}
          />
          <div className="border-2 border-dashed border-secondary/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 group-hover:border-secondary/40 transition-colors bg-secondary/5">
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Video className="h-6 w-6 text-secondary" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-secondary">Adicionar Vídeos</span>
            <p className="text-[10px] text-muted-foreground">Teasers, apresentações (máx 30s)</p>
          </div>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {previews.map((item, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                {item.type === 'image' ? (
                  <img src={item.preview} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.preview} className="w-full h-full object-cover" />
                )}
                <button 
                  type="button"
                  onClick={() => removePreview(idx)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-rose-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          <Button 
            onClick={uploadMedia} 
            disabled={uploading}
            className="w-full rounded-xl gradient-sunset font-bold"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Enviar {previews.length} mídias
          </Button>
        </div>
      )}
    </div>
  );
}