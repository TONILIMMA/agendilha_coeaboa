import logo from "@/assets/coeaboa-logo.webp";
import { Link } from "react-router-dom";

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
    <footer className={`flex flex-col w-full px-6 py-8 md:py-10 border-t border-border/40 gap-8 ${bg} ${className}`}>
      {/* Links Adicionais Acima do Rodapé Superior */}
      <div className="mx-auto flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-foreground/80 w-full max-w-6xl">
        <Link to="/" className="hover:text-primary transition-colors">
          Agenda Coé a boa?
        </Link>
        <Link to="/agenda" className="hover:text-primary transition-colors">
          Agenda Cultural
        </Link>
        <Link to="/enviar-evento" className="hover:text-primary transition-colors">
          Divulgue seu evento
        </Link>
        <Link to="/contato" className="hover:text-primary transition-colors">
          Contato
        </Link>
      </div>

      <div className="mx-auto max-w-6xl w-full grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-center sm:text-left pt-6 border-t border-border/20">
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
            href="https://limaxsistemas.online/"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-foreground/80 hover:text-primary transition-colors hover:underline"
          >
            Lima<span className="text-orange-500">X</span> Soluções
          </a>
        </div>
      </div>
    </footer>
  );
}
