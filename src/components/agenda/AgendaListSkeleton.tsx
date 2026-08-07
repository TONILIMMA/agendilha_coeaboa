import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder da lista de eventos enquanto os dados carregam. */
export function AgendaListSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-6">
          <div className="flex items-center gap-3 py-3 border-b border-border/50">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-7 w-48" />
          </div>
          <div className="grid grid-cols-1 gap-6">
            {[1, 2].map((j) => (
              <Card key={j} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <Skeleton className="w-full md:w-1 shrink-0 h-1 md:h-auto" />
                    <div className="flex-1 p-5 sm:p-7 md:p-8 space-y-5">
                      <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-10 w-3/4" />
                      </div>
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <div className="flex gap-3">
                        <Skeleton className="h-10 w-32 rounded-full" />
                        <Skeleton className="h-10 w-32 rounded-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
