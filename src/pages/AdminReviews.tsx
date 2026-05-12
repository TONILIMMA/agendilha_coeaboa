import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Check, X, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  event_id: string;
  rating: number;
  comment: string;
  user_name: string;
  created_at: string;
  status: string;
  is_flagged: boolean;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_reviews")
        .select("*")
        .or("status.eq.pending,is_flagged.eq.true")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Erro ao carregar avaliações.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string, isFlagged = false) {
    try {
      const { error } = await supabase
        .from("event_reviews")
        .update({ status, is_flagged: isFlagged })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(status === 'approved' ? "Avaliação aprovada!" : "Avaliação rejeitada.");
      fetchReviews();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Erro ao atualizar status.");
    }
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Moderação de Avaliações</h1>
          <p className="text-muted-foreground font-medium">Revise denúncias e comentários pendentes.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/60">
          <Check className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-xl font-bold text-muted-foreground">Tudo limpo! Nenhuma avaliação pendente.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden border-border/60 rounded-[1.5rem] shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                      <Badge variant={review.status === 'pending' ? 'secondary' : 'outline'} className="rounded-full">
                        {review.status.toUpperCase()}
                      </Badge>
                      {review.is_flagged && (
                        <Badge variant="destructive" className="rounded-full gap-1">
                          <Flag className="h-3 w-3" /> DENUNCIADA
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-lg font-medium text-foreground italic">"{review.comment}"</p>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                      <span>— {review.user_name}</span>
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                      <span>{new Date(review.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={() => updateStatus(review.id, 'approved', false)}
                      className="rounded-full bg-green-500 hover:bg-green-600 text-white gap-2 font-bold"
                    >
                      <Check className="h-4 w-4" /> Aprovar
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => updateStatus(review.id, 'rejected', false)}
                      className="rounded-full border-red-200 text-red-600 hover:bg-red-50 gap-2 font-bold"
                    >
                      <X className="h-4 w-4" /> Rejeitar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}