import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2, Sparkles, Star, Zap } from "lucide-react";
import {
  useAdPlans,
  formatPriceBRL,
  formatDurationDays,
  type AdPlan,
} from "@/data/useAdPlans";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { SETTING_KEYS, settingOr, useAppSettings } from "@/data/useAppSettings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título do anúncio, usado na mensagem enviada à equipe. */
  adTitle?: string | null;
  /** Link público do anúncio, incluído na pré-mensagem. */
  adUrl?: string | null;
}

const CARD_STYLES = [
  { ring: "border-border", badge: "bg-muted text-muted-foreground", Icon: Star },
  { ring: "border-primary/40", badge: "bg-primary/10 text-primary", Icon: Zap },
  { ring: "border-amber-400/60", badge: "bg-amber-400/15 text-amber-600", Icon: Crown },
];

export function DestaqueAnuncioModal({ open, onOpenChange, adTitle, adUrl }: Props) {
  const { data: planos = [], isLoading } = useAdPlans();
  const { data: settings } = useAppSettings();
  const [selecionado, setSelecionado] = useState<string | null>(null);

  const escolhido: AdPlan | undefined =
    planos.find((p) => p.id === selecionado) ?? planos[0];

  const destino = settingOr(settings, SETTING_KEYS.teamWhatsapp);
  const titulo = settingOr(settings, SETTING_KEYS.destaqueAnuncioTitulo);
  const texto = settingOr(settings, SETTING_KEYS.destaqueAnuncioTexto);
  const cta = settingOr(settings, SETTING_KEYS.destaqueCta);

  function contratar() {
    if (!escolhido) return;
    const alvo = adTitle ? `o anúncio "${adTitle}"` : "meu anúncio";
    const link = adUrl || (typeof window !== "undefined" ? window.location.href : "");
    const mensagem =
      `Oi! Quero contratar o destaque para ${alvo}.\n` +
      `Plano: ${escolhido.name} — ${formatPriceBRL(escolhido.price_cents)} · ${formatDurationDays(escolhido.duration_days)}` +
      (link ? `\nLink: ${link}` : "");
    const direto = destino ? buildWhatsappUrl(destino, mensagem) : null;
    window.open(
      direto ?? `https://wa.me/?text=${encodeURIComponent(mensagem)}`,
      "_blank",
      "noopener,noreferrer",
    );
    onOpenChange(false);
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight">{titulo}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed whitespace-pre-line">
            {texto}
          </DialogDescription>
        </DialogHeader>


        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : planos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Os planos de destaque estão sendo ajustados. Chama a equipe no WhatsApp pra saber os
            valores.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {planos.map((plano, i) => {
              const style = CARD_STYLES[Math.min(i, CARD_STYLES.length - 1)];
              const ativo = escolhido?.id === plano.id;
              return (
                <button
                  key={plano.id}
                  type="button"
                  onClick={() => setSelecionado(plano.id)}
                  aria-pressed={ativo}
                  className={`text-left rounded-2xl border-2 bg-card p-4 space-y-3 transition-all ${style.ring} ${
                    ativo ? "ring-2 ring-primary ring-offset-2 shadow-lg" : "hover:border-primary/30"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center ${style.badge}`}
                  >
                    <style.Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base">{plano.name}</h3>
                    <p className="text-lg font-black text-foreground">
                      {formatPriceBRL(plano.price_cents)}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {formatDurationDays(plano.duration_days)} em evidência
                    </p>
                  </div>
                  {plano.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {plano.description}
                    </p>
                  )}
                  {plano.benefits.length > 0 && (
                    <ul className="space-y-1.5">
                      {plano.benefits.map((b) => (
                        <li key={b} className="flex gap-1.5 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-medium">
            Agora não
          </Button>
          <Button onClick={contratar} disabled={!escolhido} className="font-bold">
            <Sparkles className="h-4 w-4 mr-2" />
            {cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
