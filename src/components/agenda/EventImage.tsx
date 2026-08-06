import { useState, useMemo, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventFallbackImage, normalizeText } from "@/lib/event-utils";
import { cn } from "@/lib/utils";

interface EventImageProps {
  src?: string | null;
  alt: string;
  category?: string | null;
  className?: string;
  icon?: any;
}

export function EventImage({ src, alt, category, className, icon: Icon }: EventImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const fallback = useMemo(() => getEventFallbackImage(category), [category]);

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10 p-2">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      )}
      {src && <link rel="prefetch" href={src} as="image" />}
      <img
        src={error ? fallback : src || fallback}
        alt={alt}
        key={src || "fallback"}
        className={cn(
          "h-full w-full object-cover transition-all duration-700",
          !isLoaded ? "opacity-0 blur-sm scale-105" : "opacity-100 blur-0 scale-100",
        )}
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          const currentTarget = e.currentTarget;
          if (!error) {
            const unsplashFallbacks: Record<string, string> = {
              musica:
                "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=800",
              gastronomia:
                "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
              teatro:
                "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&q=80&w=800",
              esporte:
                "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800",
              outros:
                "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
            };
            const normalized = normalizeText(category || "");
            let finalFallback = unsplashFallbacks["outros"];
            if (normalized.includes("musica") || normalized.includes("show"))
              finalFallback = unsplashFallbacks["musica"];
            else if (normalized.includes("gastronomia") || normalized.includes("comida"))
              finalFallback = unsplashFallbacks["gastronomia"];
            else if (
              normalized.includes("teatro") ||
              normalized.includes("arte") ||
              normalized.includes("cultura")
            )
              finalFallback = unsplashFallbacks["teatro"];
            else if (normalized.includes("esporte")) finalFallback = unsplashFallbacks["esporte"];

            currentTarget.src = finalFallback;
          }
          setError(true);
          setIsLoaded(true);
        }}
        loading="eager"
      />
      {(!src || error) && Icon && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px] z-20">
          <Icon className="h-6 w-6 text-white drop-shadow-md" />
        </div>
      )}
    </div>
  );
}