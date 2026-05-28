  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { useAuth } from "@/contexts/AuthContext";
  import { Navigate } from "react-router-dom";

 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { toast } from "sonner";
 import { 
   Check, 
   X, 
   User, 
   Music, 
   ExternalLink,
   ShieldCheck,
   Clock
 } from "lucide-react";
 import { Badge } from "@/components/ui/badge";
 
  export default function AdminArtists() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    if (authLoading) return <div className="p-8">Carregando...</div>;
    if (!user || !isAdmin) return <Navigate to="/" replace />;

   const queryClient = useQueryClient();
 
   const { data: artists, isLoading } = useQuery({
     queryKey: ["admin-artists"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("artist_profiles")
         .select("*")
         .order("created_at", { ascending: false });
       if (error) throw error;
       return data;
     },
   });
 
   const approveMutation = useMutation({
     mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
       const { error } = await supabase
         .from("artist_profiles")
         .update({ is_approved: approved })
         .eq("id", id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["admin-artists"] });
       toast.success("Status atualizado com sucesso!");
     },
   });
 
   if (isLoading) return <div className="p-8">Carregando artistas...</div>;
 
   return (
     <div className="p-8 max-w-6xl mx-auto space-y-8">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-3xl font-display font-bold">Moderação de Artistas</h1>
           <p className="text-muted-foreground">Aprove ou rejeite perfis de músicos e bandas.</p>
         </div>
         <Badge variant="outline" className="px-4 py-1 flex gap-2">
           <ShieldCheck className="h-4 w-4" /> Painel Admin
         </Badge>
       </div>
 
       <div className="grid gap-4">
         {artists?.map((artist) => (
           <div key={artist.id} className="bg-card border border-border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
             <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
                 {artist.avatar_url ? (
                   <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                 ) : (
                   <div className="h-full w-full flex items-center justify-center">
                     <User className="h-8 w-8 text-muted-foreground" />
                   </div>
                 )}
               </div>
               <div>
                 <div className="flex items-center gap-2">
                   <h3 className="font-display font-bold text-lg">{artist.name}</h3>
                   {artist.is_approved ? (
                     <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Aprovado</Badge>
                   ) : (
                     <Badge variant="secondary" className="flex gap-1">
                       <Clock className="h-3 w-3" /> Pendente
                     </Badge>
                   )}
                 </div>
                 <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                   <Music className="h-3 w-3" /> {artist.genre} • {artist.neighborhood}
                 </p>
                 <div className="flex gap-2 mt-2">
                   <a href={`/artista/${artist.id}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                     Ver Perfil <ExternalLink className="h-3 w-3" />
                   </a>
                 </div>
               </div>
             </div>
 
             <div className="flex gap-2">
               {!artist.is_approved ? (
                 <Button 
                   onClick={() => approveMutation.mutate({ id: artist.id, approved: true })}
                   className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-6"
                 >
                   <Check className="h-4 w-4 mr-2" /> Aprovar
                 </Button>
               ) : (
                 <Button 
                   variant="outline"
                   onClick={() => approveMutation.mutate({ id: artist.id, approved: false })}
                   className="text-destructive hover:bg-destructive/5 border-destructive/20 rounded-lg px-6"
                 >
                   <X className="h-4 w-4 mr-2" /> Revogar
                 </Button>
               )}
             </div>
           </div>
         ))}
         
         {artists?.length === 0 && (
           <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
             <p className="text-muted-foreground">Nenhum artista cadastrado ainda.</p>
           </div>
         )}
       </div>
     </div>
   );
 }