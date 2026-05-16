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
   CheckCircle2
 } from "lucide-react";
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
       const { error } = await supabase
         .from("artist_profiles")
         .upsert({
           user_id: user.id,
           ...formData,
           member_count: parseInt(formData.member_count),
           artist_type: formData.artist_type as 'cover' | 'autoral' | 'both',
           is_approved: false // Requires admin approval
         });
 
       if (error) throw error;
 
       toast.success("Perfil enviado para análise!", {
         description: "Avisaremos assim que seu perfil for aprovado."
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
 
           <Button type="submit" className="w-full rounded-xl" disabled={loading}>
             {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
             Enviar para Aprovação
           </Button>
         </form>
       </div>
     </div>
   );
 }