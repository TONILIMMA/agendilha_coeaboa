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
    <div className={cn("flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-muted-foreground font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {rightElement && (
        <div className="flex items-center gap-2">
          {rightElement}
        </div>
      )}
    </div>
  );
}
