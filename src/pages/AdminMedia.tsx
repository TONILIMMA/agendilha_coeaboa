 import { useState } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Loader2, Check, X, Shield, Play, User, ExternalLink } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
  import { handleError } from "@/lib/error-handler";
  import { toast } from "sonner";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 
 export default function AdminMedia() {
   const queryClient = useQueryClient();
   const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
 
   const { data: media, isLoading } = useQuery({
     queryKey: ["admin-pending-media"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("artist_media")
         .select(`
           *,
           artist:artist_profiles(name, genre)
         `)
         .eq("moderation_status", "pending")
         .order("created_at", { ascending: true });
       
      if (error) {
        handleError(error, "Erro ao carregar mídias pendentes.");
        throw error;
      }
      return data;
    },
    retry: 1
  });
 
   const moderateMutation = useMutation({
     mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
       const { error } = await supabase
         .from("artist_media")
         .update({ 
           moderation_status: status,
           is_approved: status === 'approved' 
         })
         .eq("id", id);
       
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ["admin-pending-media"] });
       toast.success(data.status === 'approved' ? "Mídia aprovada!" : "Mídia removida.");
     },
      if (error) throw error;
      return { id, status };
    },
    onError: (error) => {
      handleError(error, "Erro ao processar moderação.");
    }
   });
 
   if (isLoading) {
     return (
       <div className="p-8 flex justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="container mx-auto p-4 sm:p-8 space-y-8">
       <div className="flex items-center gap-3 border-b pb-6">
         <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
           <Shield className="h-6 w-6 text-primary" />
         </div>
         <div>
           <h1 className="text-3xl font-display font-black text-primary">Moderação de Mídia</h1>
           <p className="text-muted-foreground">Revise vídeos e fotos enviados pelos artistas.</p>
         </div>
       </div>
 
       {!media || media.length === 0 ? (
         <Card className="border-dashed py-20">
           <CardContent className="flex flex-col items-center justify-center text-center">
             <Check className="h-12 w-12 text-muted-foreground mb-4" />
             <CardTitle>Tudo limpo!</CardTitle>
             <p className="text-muted-foreground mt-2">Não há mídias pendentes de revisão no momento.</p>
           </CardContent>
         </Card>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {media.map((item: any) => (
             <Card key={item.id} className="overflow-hidden group border-2 transition-colors hover:border-primary/20">
               <div className="relative aspect-video bg-black flex items-center justify-center">
                 {item.media_type === 'video' ? (
                   <button 
                     className="w-full h-full relative"
                     onClick={() => setSelectedVideo(item.url)}
                   >
                     <video 
                       src={item.url} 
                       className="w-full h-full object-cover opacity-60"
                       muted
                     />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <Play className="h-12 w-12 text-white fill-current" />
                     </div>
                   </button>
                 ) : (
                   <img src={item.url} className="w-full h-full object-cover" alt="Mídia do artista" />
                 )}
                 <Badge className="absolute top-2 right-2 bg-black/50 backdrop-blur-md border-white/20 capitalize">
                   {item.media_type}
                 </Badge>
               </div>
               <CardContent className="p-4 space-y-4">
                 <div>
                   <h3 className="font-bold flex items-center gap-2">
                     <User className="h-4 w-4 text-primary" />
                     {item.artist?.name || "Artista Desconhecido"}
                   </h3>
                   <p className="text-xs text-muted-foreground">{item.artist?.genre}</p>
                 </div>
                 
                 <div className="flex gap-2">
                   <Button 
                     size="sm" 
                     className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                     onClick={() => moderateMutation.mutate({ id: item.id, status: 'approved' })}
                   >
                     <Check className="h-4 w-4 mr-2" /> Aprovar
                   </Button>
                   <Button 
                     size="sm" 
                     variant="destructive"
                     className="flex-1"
                     onClick={() => moderateMutation.mutate({ id: item.id, status: 'rejected' })}
                   >
                     <X className="h-4 w-4 mr-2" /> Rejeitar
                   </Button>
                 </div>
               </CardContent>
             </Card>
           ))}
         </div>
       )}
 
       <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
         <DialogContent className="max-w-4xl p-0 bg-black overflow-hidden border-0">
           <DialogHeader className="p-4 bg-zinc-900 border-b border-zinc-800">
             <DialogTitle className="text-white flex items-center justify-between">
               <span>Visualização de Mídia</span>
               <Button variant="ghost" size="icon" onClick={() => setSelectedVideo(null)} className="text-white hover:bg-white/10">
                 <X className="h-5 w-5" />
               </Button>
             </DialogTitle>
           </DialogHeader>
           <div className="aspect-video w-full flex items-center justify-center bg-black">
             {selectedVideo && (
               <video 
                 src={selectedVideo} 
                 controls 
                 autoPlay 
                 className="max-h-full max-w-full"
               />
             )}
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 }