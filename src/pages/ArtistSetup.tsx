 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { useAuth } from "@/contexts/AuthContext";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { toast } from "sonner";
 import { 
   Music, 
   Users, 
   MapPin, 
   Instagram, 
   Youtube, 
    Plus, 
    Loader2,
    CheckCircle2,
    Upload,
    Video,
    Image as ImageIcon,
    X
  } from "lucide-react";
    const [mediaFiles, setMediaFiles] = useState<{ file: File; type: 'image' | 'video'; preview: string }[]>([]);
    const [uploadingMedia, setUploadingMedia] = useState(false);

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
      const files = Array.from(e.target.files || []);
      const newFiles = files.map(file => ({
        file,
        type,
        preview: URL.createObjectURL(file)
      }));
      setMediaFiles(prev => [...prev, ...newFiles]);
    };

    const removeMedia = (index: number) => {
      setMediaFiles(prev => {
        const updated = [...prev];
        URL.revokeObjectURL(updated[index].preview);
        updated.splice(index, 1);
        return updated;
      });
    };

 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 
 const NEIGHBORHOODS = [
   "Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia",
   "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras",
   "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"
 ].sort();
 
 export default function ArtistSetup() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [loading, setLoading] = useState(false);
   
   const [formData, setFormData] = useState({
     name: "",
     bio: "",
     genre: "",
     city: "Rio de Janeiro",
     neighborhood: "",
     member_count: "1",
     artist_type: "cover",
     instagram: "",
     whatsapp: "",
     spotify: "",
     youtube: "",
     avatar_url: "",
     cover_url: "",
   });
 
   async function handleSubmit(e: React.FormEvent) {
     e.preventDefault();
     if (!user) return;
     
     setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("artist_profiles")
          .upsert({
            user_id: user.id,
            ...formData,
            member_count: parseInt(formData.member_count),
            artist_type: formData.artist_type as 'cover' | 'autoral' | 'both',
            is_approved: false
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Upload media files
        if (mediaFiles.length > 0) {
          setUploadingMedia(true);
          for (const item of mediaFiles) {
            const fileExt = item.file.name.split('.').pop();
            const filePath = `${profileData.id}/${Math.random()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('artist-media')
              .upload(filePath, item.file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
              .from('artist-media')
              .getPublicUrl(filePath);

            await supabase.from('artist_media').insert({
              artist_id: profileData.id,
              url: publicUrl,
              media_type: item.type,
              moderation_status: 'pending'
            });
          }
        }

        toast.success("Perfil e mídias enviados para análise!", {
          description: "Avisaremos assim que tudo for aprovado."
        });
        navigate("/agenda");
     } catch (error: any) {
       toast.error("Erro ao salvar perfil", {
         description: error.message
       });
     } finally {
       setLoading(false);
     }
   }
 
   return (
     <div className="min-h-screen bg-background py-12 px-6">
       <div className="max-w-2xl mx-auto space-y-8">
         <div className="text-center space-y-2">
           <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
             <Music className="h-6 w-6 text-primary" />
           </div>
           <h1 className="text-3xl font-display font-bold">Configure seu Perfil Artístico</h1>
           <p className="text-muted-foreground">Conte um pouco sobre seu trabalho para a comunidade.</p>
         </div>
 
         <form onSubmit={handleSubmit} className="bg-card p-8 rounded-2xl border border-border shadow-sm space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <Label htmlFor="name">Nome Artístico / Banda</Label>
               <Input 
                 id="name" 
                 value={formData.name} 
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 required 
                 placeholder="Ex: Banda do Porto"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="genre">Gênero Principal</Label>
               <Input 
                 id="genre" 
                 value={formData.genre} 
                 onChange={e => setFormData({...formData, genre: e.target.value})}
                 required 
                 placeholder="Ex: Samba, Rock, MPB..."
               />
             </div>
           </div>
 
           <div className="space-y-2">
             <Label htmlFor="bio">Biografia Curta</Label>
             <Textarea 
               id="bio" 
               value={formData.bio} 
               onChange={e => setFormData({...formData, bio: e.target.value})}
               placeholder="Fale um pouco sobre sua trajetória musical..."
               className="min-h-[100px]"
             />
           </div>
 
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
               <Label>Bairro</Label>
               <Select value={formData.neighborhood} onValueChange={v => setFormData({...formData, neighborhood: v})}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione" />
                 </SelectTrigger>
                 <SelectContent>
                   {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <Label>Integrantes</Label>
               <Input 
                 type="number" 
                 min="1" 
                 value={formData.member_count} 
                 onChange={e => setFormData({...formData, member_count: e.target.value})}
               />
             </div>
             <div className="space-y-2">
               <Label>Tipo</Label>
               <Select value={formData.artist_type} onValueChange={v => setFormData({...formData, artist_type: v})}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="cover">Cover</SelectItem>
                   <SelectItem value="autoral">Autoral</SelectItem>
                   <SelectItem value="both">Ambos</SelectItem>
                 </SelectContent>
               </Select>
             </div>
           </div>
 
           <div className="space-y-4 pt-4 border-t border-border">
             <h3 className="font-display font-semibold flex items-center gap-2">
               <Plus className="h-4 w-4" /> Links & Redes Sociais
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="flex items-center gap-2 text-xs"><Instagram className="h-3 w-3" /> Instagram</Label>
                 <Input 
                   placeholder="@usuario" 
                   value={formData.instagram} 
                   onChange={e => setFormData({...formData, instagram: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <Label className="flex items-center gap-2 text-xs"><Youtube className="h-3 w-3" /> YouTube</Label>
                 <Input 
                   placeholder="Link do canal ou vídeo" 
                   value={formData.youtube} 
                   onChange={e => setFormData({...formData, youtube: e.target.value})}
                 />
               </div>
             </div>
           </div>
 
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-display font-semibold flex items-center gap-2 text-primary">
                <Video className="h-5 w-5" /> Fotos e Vídeos (Opcional)
              </h3>
              <p className="text-xs text-muted-foreground">Adicione flyers, fotos de shows ou vídeos curtos (máx 30s) para seu feed.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleMediaChange(e, 'image')}
                  />
                  <div className="border-2 border-dashed border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 group-hover:border-primary/40 transition-colors bg-primary/5">
                    <ImageIcon className="h-6 w-6 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Fotos</span>
                  </div>
                </div>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="video/*" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleMediaChange(e, 'video')}
                  />
                  <div className="border-2 border-dashed border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 group-hover:border-primary/40 transition-colors bg-primary/5">
                    <Video className="h-6 w-6 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Vídeos</span>
                  </div>
                </div>
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {mediaFiles.map((item, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                      {item.type === 'image' ? (
                        <img src={item.preview} className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.preview} className="w-full h-full object-cover" />
                      )}
                      <button 
                        type="button"
                        onClick={() => removeMedia(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full rounded-xl" disabled={loading || uploadingMedia}>
              {loading || uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              {uploadingMedia ? "Enviando mídias..." : "Enviar para Aprovação"}
            </Button>
         </form>
       </div>
     </div>
   );
 }