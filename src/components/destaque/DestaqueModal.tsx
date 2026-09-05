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
import { Crown, Loader2, Sparkles, Star, Zap } from "lucide-react";
import {
  useHighlightPackages,
  formatPriceBRL,
  formatDuration,
  type HighlightPackage,
} from "@/data/useHighlightPackages";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { SETTING_KEYS, settingOr, useAppSettings } from "@/data/useAppSettings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título do rolê, usado na mensagem enviada para a equipe. */
  eventTitle?: string | null;
  /** WhatsApp alternativo; por padrão usa o número oficial das configurações. */
  contactWhatsapp?: string | null;
  /** Link público do rolê, incluído na pré-mensagem. */
  eventUrl?: string | null;
}

const CARD_STYLES = [
  {
    wrapper: "bg-purple-600 border-purple-500/30 shadow-purple-900/40",
    icon: "bg-purple-500/50 text-purple-100",
    title: "text-purple-50",
    text: "text-purple-100/85",
    Icon: Zap,
  },
  {
    wrapper: "bg-amber-400 border-amber-300/50 shadow-amber-900/40",
    icon: "bg-amber-300/60 text-amber-900",
    title: "text-amber-950",
    text: "text-amber-900/85",
    Icon: Crown,
  },
];

export function DestaqueModal({
  open,
  onOpenChange,
  eventTitle,
  contactWhatsapp,
  eventUrl,
}: Props) {
  const { data: packages = [], isLoading } = useHighlightPackages();
  const { data: settings } = useAppSettings();
  const [selected, setSelected] = useState<string | null>(null);

  const chosen: HighlightPackage | undefined =
    packages.find((p) => p.id === selected) ?? packages[0];

  const teamWhatsapp = settingOr(settings, SETTING_KEYS.teamWhatsapp);
  const destino = teamWhatsapp || contactWhatsapp || "";
  const titulo = settingOr(settings, SETTING_KEYS.destaqueEventoTitulo);
  const texto = settingOr(settings, SETTING_KEYS.destaqueEventoTexto);
  const cta = settingOr(settings, SETTING_KEYS.destaqueCta);

  function abrirWhatsapp(mensagem: string) {
    const direto = destino ? buildWhatsappUrl(destino, mensagem) : null;
    const url = direto ?? `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function contratar() {
    if (!chosen) return;
    const linha = eventTitle ? `o rolê "${eventTitle}"` : "meu rolê";
    const link = eventUrl || (typeof window !== "undefined" ? window.location.href : "");
    const mensagem =
      `Oi! Quero contratar o ${chosen.name} para ${linha}.\n` +
      `Plano: ${chosen.name} — ${formatPriceBRL(chosen.price_cents)} · ${formatDuration(chosen.duration_days)}` +
      (link ? `\nLink: ${link}` : "");
    abrirWhatsapp(mensagem);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
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
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-4 space-y-2">
            <p className="text-sm font-semibold">Nenhum destaque disponível agora</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os planos estão sendo ajustados pela curadoria. Chama a equipe no WhatsApp pra saber
              valores e prazos, ou tenta de novo mais tarde.
            </p>
            <Button
              variant="outline"
              onClick={() => abrirWhatsapp("Oi! Quero saber sobre destacar meu rolê.")}
              className="font-semibold"
            >
              Falar com a curadoria
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {packages.map((pkg, i) => {
              const style = CARD_STYLES[i % CARD_STYLES.length];
              const isSelected = chosen?.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelected(pkg.id)}
                  aria-pressed={isSelected}
                  className={`text-left rounded-2xl p-4 space-y-2.5 border shadow-lg transition-all ${style.wrapper} ${
                    isSelected ? "ring-2 ring-offset-2 ring-primary scale-[1.01]" : "opacity-90"
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center ${style.icon}`}
                  >
                    <style.Icon className="h-4.5 w-4.5" />
                  </div>
                  <h3 className={`font-bold text-base ${style.title}`}>{pkg.name}</h3>
                  {pkg.description && (
                    <p className={`text-xs leading-relaxed ${style.text}`}>{pkg.description}</p>
                  )}
                  <p className={`text-sm font-black ${style.title}`}>
                    {formatPriceBRL(pkg.price_cents)}
                    <span className={`ml-1.5 text-xs font-semibold ${style.text}`}>
                      · {formatDuration(pkg.duration_days)}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-medium">
            Agora não
          </Button>
          <Button
            onClick={contratar}
            disabled={!chosen}
            className="font-bold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-amber-400 text-white hover:opacity-90"
          >
            <Star className="h-4 w-4 mr-2" />
            {cta}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
