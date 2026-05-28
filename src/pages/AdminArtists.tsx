import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { 
  Check, 
  X, 
  User, 
  Music, 
  ExternalLink,
  ShieldCheck,
  Clock,
  Music2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminArtists() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: artists, isLoading, error } = useQuery({
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

  if (authLoading) return <LoadingState fullPage message="Verificando acesso..." />;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <SectionHeader 
        title="Moderação de Artistas" 
        subtitle="Gerencie os perfis artísticos da plataforma e controle quem aparece no feed principal."
        rightElement={
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border">
            <Music2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">{artists?.length || 0} artistas</span>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Carregando artistas..." />
      ) : artists?.length === 0 ? (
        <EmptyState 
          icon={Music}
          title="Nenhum artista para moderar"
          description="Ainda não há solicitações de perfil artístico pendentes."
        />
      ) : (
        <div className="grid gap-4">
          {artists?.map((artist) => (
            <Card key={artist.id} className="group hover:shadow-md transition-all border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center p-5 gap-6">
                  <div className="flex-1 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-border shadow-sm">
                      {artist.avatar_url ? (
                        <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg text-foreground">{artist.name}</h3>
                        {artist.is_approved ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 uppercase text-[10px] font-bold tracking-widest px-2 py-0">Aprovado</Badge>
                        ) : (
                          <Badge variant="secondary" className="flex gap-1 uppercase text-[10px] font-bold tracking-widest px-2 py-0">
                            <Clock className="h-3 w-3" /> Pendente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Music className="h-3.5 w-3.5" /> {artist.genre} • {artist.neighborhood || "Bairro não informado"}
                      </p>
                      <a 
                        href={`/artista/${artist.id}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1 mt-2"
                      >
                        Ver Perfil Público <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                  <div className="flex gap-2 justify-end">
                    {!artist.is_approved ? (
                      <Button 
                        size="sm" 
                        onClick={() => approveMutation.mutate({ id: artist.id, approved: true })}
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                      >
                        <Check className="h-4 w-4" /> Aprovar
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setRevokingId(artist.id)}
                        className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 font-bold gap-2"
                      >
                        <X className="h-4 w-4" /> Revogar
                      </Button>
                    )}
                  </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal 
        isOpen={!!revokingId}
        onClose={() => setRevokingId(null)}
        onConfirm={() => {
          if (revokingId) approveMutation.mutate({ id: revokingId, approved: false });
          setRevokingId(null);
        }}
        title="Revogar Aprovação"
        description="O perfil deste artista deixará de ser público imediatamente. Ele precisará ser reavaliado para voltar ao ar."
        confirmText="Revogar Agora"
        variant="destructive"
      />
    </div>
  );
}
