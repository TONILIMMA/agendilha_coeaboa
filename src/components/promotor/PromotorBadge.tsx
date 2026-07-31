import { Megaphone } from "lucide-react";

/** Badge fixa que indica que o usuário está logado como promotor. */
export function PromotorBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-xs font-bold uppercase tracking-wide border border-rose-200">
      <Megaphone className="h-3.5 w-3.5" />
      Painel do Divulgador
    </div>
  );
}