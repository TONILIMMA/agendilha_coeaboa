import { useState } from "react";
import { Crown, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BENEFITS = [
  "Flyer em evidência no carrossel principal de eventos",
  "Mais alcance e mais público pro seu rolê",
  "Posição prioritária na agenda durante o período contratado",
];

interface Props {
  /** Chamado quando o usuário clica em "DESTACAR MEU EVENTO" (envia o formulário). */
  onDestacar: () => void;
  submitting?: boolean;
}

/**
 * Seção premium de destaque exibida no final do formulário de divulgação.
 * Visual preto + amarelo vibrante, padrão Coe a Boa.
 */
export function DestaquePremiumSection({ onDestacar, submitting }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-neutral-950 py-3 text-xs font-semibold uppercase tracking-widest text-amber-400/80 hover:text-amber-300 transition-colors"
      >
        <Crown className="h-3.5 w-3.5" />
        Quero dar destaque ao meu evento
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    );
  }

  return (
    <section
      aria-label="Destaque premium"
      className="rounded-3xl bg-neutral-950 px-6 py-10 sm:px-10 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/20"
    >
      <div className="flex items-center justify-center gap-3">
        <Crown className="h-7 w-7 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]" aria-hidden />
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-400 text-center font-display">
          Destaque sua publicação para maior visibilidade!
        </h2>
      </div>

      <p className="mt-3 text-center text-sm sm:text-base text-neutral-300 max-w-xl mx-auto">
        Contrate o destaque e seu flyer fica em evidência no carrossel de eventos,
        aumentando o alcance e o público do seu rolê.
      </p>

      <ul className="mt-6 space-y-3 max-w-md mx-auto">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm text-neutral-200">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/40">
              <Check className="h-3 w-3 text-amber-400" strokeWidth={3} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button
          type="button"
          onClick={onDestacar}
          disabled={submitting}
          className={cn(
            "h-12 px-8 w-full sm:w-auto font-extrabold tracking-wide",
            "bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/25",
            "hover:bg-neutral-950 hover:text-amber-400 hover:ring-2 hover:ring-amber-400",
            "transition-colors"
          )}
        >
          <Crown className="h-4 w-4 mr-2" />
          DESTACAR MEU EVENTO
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-neutral-400 hover:text-neutral-200 underline-offset-4 hover:underline transition-colors"
        >
          Não agora
        </button>
      </div>
    </section>
  );
}
