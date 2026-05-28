import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, rightElement, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8", className)}>
      <div className="space-y-1.5 min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase leading-[1.1] break-words">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {rightElement && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {rightElement}
        </div>
      )}
    </div>
  );
}
