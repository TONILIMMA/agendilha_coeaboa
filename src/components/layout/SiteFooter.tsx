import logo from "@/assets/coeaboa-logo.jpg";

interface SiteFooterProps {
  variant?: "default" | "muted";
  className?: string;
}

/**
 * Rodapé único, consolidado em 3 colunas:
 *  1) Copyright
 *  2) Marca + slogan
 *  3) Créditos do autor
 * Substitui rodapés duplicados ao longo do app.
 */
export function SiteFooter({ variant = "default", className = "" }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const bg = variant === "muted" ? "bg-muted/30" : "bg-card/30";

  return (
    <footer className={`w-full py-10 px-6 border-t border-border/40 ${bg} ${className}`}>
      <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-center sm:text-left">
        {/* Copyright */}
        <div className="text-xs text-foreground/60 font-medium order-2 sm:order-1">
          © {year} — Todos os direitos reservados
        </div>

        {/* Marca + slogan */}
        <div className="flex items-center justify-center gap-2 order-1 sm:order-2">
          <img
            src={logo}
            alt="Coé a Boa? — Agendilha"
            className="h-7 w-7 rounded-full ring-1 ring-primary/15"
          />
          <div className="leading-tight">
            <div className="font-display text-sm font-black text-foreground tracking-tight">
              Coé a Boa? <span className="text-foreground/30">•</span> Agendilha
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-foreground/40 font-semibold">
              Transparência e Cultura
            </div>
          </div>
        </div>

        {/* Créditos */}
        <div className="text-xs text-foreground/60 font-medium order-3 sm:text-right">
          Criado por{" "}
          <a
            href="https://vexo-sistemas.lovable.app"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-foreground/80 hover:text-primary transition-colors hover:underline"
          >
            Vexo Sistemas
          </a>
        </div>
      </div>
    </footer>
  );
}