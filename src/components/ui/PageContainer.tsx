import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: MaxWidth;
  /** Ativa `animate-fade-in`. Default: true. */
  animate?: boolean;
}

const MAX_WIDTH_MAP: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

/**
 * Padrão de container de páginas: centralizado, com padding responsivo
 * e fade-in suave. Substitui o `<div className="mx-auto max-w-*xl px-4 py-8 animate-fade-in">`
 * repetido em quase todas as páginas.
 */
export function PageContainer({
  children,
  className,
  maxWidth = "5xl",
  animate = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-4 py-6 sm:py-8 space-y-6",
        MAX_WIDTH_MAP[maxWidth],
        animate && "animate-fade-in",
        className,
      )}
    >
      {children}
    </div>
  );
}