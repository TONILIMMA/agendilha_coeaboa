import { useRef, useState } from "react";
import { Crown, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DestaqueModal } from "@/components/destaque/DestaqueModal";

const BENEFITS = [
  "Flyer em evidência no carrossel principal de eventos",
  "Mais alcance e mais público pro seu rolê",
  "Posição prioritária na agenda durante o período contratado",
];

interface Props {
  /** Título do rolê, usado na mensagem enviada para a equipe. */
  eventTitle?: string | null;
  submitting?: boolean;
  /** Estado recolhido controlado pelo formulário, pra sobreviver ao avançar/voltar. */
  dismissed?: boolean;
  onDismissedChange?: (dismissed: boolean) => void;
}

/**
 * Seção premium de destaque exibida no final do formulário de divulgação.
 * Visual preto + amarelo vibrante, padrão Coe a Boa.
 */
export function DestaquePremiumSection({
  eventTitle,
  submitting,
  dismissed: dismissedProp,
  onDismissedChange,
}: Props) {
  const [dismissedLocal, setDismissedLocal] = useState(false);
  const dismissed = dismissedProp ?? dismissedLocal;
  const setDismissed = (v: boolean) => {
    setDismissedLocal(v);
    onDismissedChange?.(v);
  };
  const [modalOpen, setModalOpen] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const modal = (
    <DestaqueModal
      open={modalOpen}
      onOpenChange={(open) => {
        setModalOpen(open);
        if (!open) ctaRef.current?.focus();
      }}
      eventTitle={eventTitle}
    />
  );

  if (dismissed) {
    return (
      <>
        <button
          type="button"
          aria-expanded={false}
          aria-label="Reabrir opções de destaque para o meu evento"
          onClick={() => setDismissed(false)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-neutral-950 py-3 text-xs font-semibold uppercase tracking-widest text-amber-400/80 hover:text-amber-300 transition-colors"
        >
          <Crown className="h-3.5 w-3.5" aria-hidden />
          Quero dar destaque ao meu evento
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>
        {modal}
      </>
    );
  }

  return (
    <section
      aria-label="Destaque premium"
      className="box-border w-full rounded-3xl bg-neutral-950 p-4 lg:px-10 lg:py-10 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/20"
    >
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Crown className="h-7 w-7 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]" aria-hidden />
        <h2 className="text-center font-display text-[1.2rem] font-extrabold text-amber-400 sm:text-2xl">
          Destaque sua publicação para maior visibilidade!
        </h2>
      </div>

      <p className="mx-auto mt-4 max-w-xl text-center text-[0.9rem] text-neutral-300 lg:text-base">
        Contrate o destaque e seu flyer fica em evidência no carrossel de eventos,
        aumentando o alcance e o público do seu rolê.
      </p>

      <ul className="mx-auto mt-7 max-w-md space-y-4">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-start gap-3 text-left text-sm text-neutral-200">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/40">
              <Check className="h-3 w-3 text-amber-400" strokeWidth={3} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-9 flex flex-col items-center gap-4">
        <Button
          ref={ctaRef}
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={submitting}
          aria-haspopup="dialog"
          aria-label="Ver planos e destacar meu evento"
          className={cn(
            "h-12 w-full px-5 font-extrabold tracking-wide sm:w-auto sm:px-8",
            "bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/25",
            "hover:bg-neutral-950 hover:text-amber-400 hover:ring-2 hover:ring-amber-400",
            "transition-colors"
          )}
        >
          <Crown className="h-4 w-4 mr-2" aria-hidden />
          DESTACAR MEU EVENTO
        </Button>
        <button
          type="button"
          aria-label="Recolher a seção de destaque"
          onClick={() => setDismissed(true)}
          className="text-xs text-neutral-400 hover:text-neutral-200 underline-offset-4 hover:underline transition-colors"
        >
          Não agora
        </button>
      </div>
      {modal}
    </section>
  );
}
