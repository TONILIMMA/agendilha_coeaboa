import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { useEventReviews, useCreateEventReview } from "@/data/useEventReviews";
import { cn } from "@/lib/utils";

interface EventReviewsProps {
  eventId: string;
  eventTitle: string;
}

export default function EventReviews({ eventId, eventTitle }: EventReviewsProps) {
  const { data: reviews = [], isLoading: loading } = useEventReviews(eventId);
  const createReview = useCreateEventReview(eventId);
  const submitting = createReview.isPending;
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Escreve um comentário rapidinho pra gente publicar.");
      return;
    }

    try {
      await createReview.mutateAsync({
        rating: newRating,
        comment: newComment.trim(),
        user_name: userName.trim() || "Anônimo",
      });
      toast.success("Avaliação publicada. Valeu!");
      setNewComment("");
      setUserName("");
      setNewRating(5);
    } catch (err) {
      handleError(err, { context: "EventReviews.submit", fallback: "Não deu pra enviar tua avaliação. Tenta de novo." });
    }
  }

  return (
    <div className="space-y-8 pt-8 border-t border-border/50">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5">
          <Star className="h-5 w-5 text-primary fill-primary" />
        </div>
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Avaliações Públicas</p>
          <h3 className="font-bold text-lg text-foreground">O que estão falando de {eventTitle}</h3>
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Carregando avaliações...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-muted/30 p-4 rounded-2xl border border-border/40 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {new Date(review.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {review.comment}
              </p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                — {review.user_name}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border/60 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sua nota:</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewRating(star)}
                className="focus:outline-none transition-transform active:scale-90"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    star <= newRating ? "text-primary fill-primary" : "text-muted-foreground/30 hover:text-primary/50"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <input
            placeholder="Seu nome (opcional)"
            className="w-full bg-muted/50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Textarea
            placeholder="O que você achou deste evento?"
            className="min-h-[100px] bg-muted/50 border-none rounded-2xl resize-none focus-visible:ring-2 focus-visible:ring-primary/20 p-4"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full h-12 font-black uppercase tracking-widest gradient-sunset text-white shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
        >
          {submitting ? "Enviando..." : "Publicar Avaliação"}
        </Button>
      </form>
    </div>
  );
}