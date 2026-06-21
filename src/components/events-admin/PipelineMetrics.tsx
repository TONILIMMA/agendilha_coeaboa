import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import { EDITORIAL_STAGES, type EditorialStatus } from "./types";

interface Metrics {
  counts: Partial<Record<EditorialStatus, number>>;
  pending_publish: number;
  generated_at: string;
}

export function PipelineMetrics() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc("get_pipeline_metrics" as any);
      if (!error && data) setData(data as unknown as Metrics);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  if (!data) return null;

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Pipeline editorial</h3>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Atualizado: {new Date(data.generated_at).toLocaleTimeString("pt-BR")}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {EDITORIAL_STAGES.map(stage => (
            <div key={stage.key} className={`rounded-lg border p-2 ${stage.color}`}>
              <div className="text-[10px] uppercase tracking-wider opacity-80 truncate">{stage.label}</div>
              <div className="text-xl font-bold mt-0.5">{data.counts[stage.key] ?? 0}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}