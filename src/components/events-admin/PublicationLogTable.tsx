import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";

interface LogRow {
  id: string;
  event_id: string;
  channel: string;
  published_at: string;
  event_title?: string;
}

export function PublicationLogTable() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("event_publication_log")
        .select("id, event_id, channel, published_at, submissions:event_id(event_title)")
        .order("published_at", { ascending: false })
        .limit(20);
      if (data) {
        setRows(data.map((r: any) => ({
          id: r.id, event_id: r.event_id, channel: r.channel,
          published_at: r.published_at,
          event_title: r.submissions?.event_title,
        })));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold">Últimas publicações</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Nenhuma publicação registrada.</p>
        ) : (
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {rows.map(r => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded hover:bg-muted/50 text-xs">
                <span className="truncate flex-1 font-medium">{r.event_title || r.event_id.slice(0, 8)}</span>
                <Badge variant="outline" className="text-[10px]">{r.channel}</Badge>
                <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                  {new Date(r.published_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}