import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBadge } from "@/hooks/useUserBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
 import {
   Trophy,
  Loader2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
   Calendar,
 } from "lucide-react";
 import Header from "@/components/Header";
import { LoadingState } from "@/components/ui/LoadingState";
import { PageContainer } from "@/components/ui/PageContainer";
 
import { toast } from "sonner";

type Period = "week" | "month" | "year" | "all" | "custom";
type SortKey = "name" | "approved" | "other" | "total";
type SortDir = "asc" | "desc";

interface RankRow {
  user_id: string;
  name: string;
  approved: number;
  other: number;
  total: number;
}

const periodLabels: Record<Period, string> = {
  week: "7 dias",
  month: "Mês",
  year: "Ano",
  all: "Tudo",
  custom: "Personalizado",
};

const categoryOptions = [
  { value: "all", label: "Todas as categorias" },
  { value: "musica", label: "Música" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultura", label: "Cultura / Arte" },
  { value: "esporte", label: "Esporte" },
  { value: "promocoes", label: "Promoções" },
  { value: "outros", label: "Outros" },
];

function periodCutoff(p: Period): Date | null {
  if (p === "all" || p === "custom") return null;
  const d = new Date();
  if (p === "week") d.setDate(d.getDate() - 7);
  if (p === "month") d.setMonth(d.getMonth() - 1);
  if (p === "year") d.setFullYear(d.getFullYear() - 1);
  return d;
}

function downloadCSV(rows: RankRow[], filename: string) {
  const header = ["Posição", "Nome", "Aprovados", "Outros", "Total"];
  const lines = [
    header.join(","),
    ...rows.map((r, i) =>
      [
        i + 1,
        `"${r.name.replace(/"/g, '""')}"`,
        r.approved,
        r.other,
        r.total,
      ].join(","),
    ),
  ];
  const blob = new Blob(["\ufeff" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Ranking() {
  const { user, loading: authLoading } = useAuth();
  const { status, loaded: badgeLoaded } = useUserBadge();

  const [period, setPeriod] = useState<Period>("month");
  const [category, setCategory] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("approved");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  async function load() {
    setLoading(true);
    try {
      let q = supabase
        .from("public_submissions")
        .select("user_id, status, created_at, category");

      if (period === "custom") {
        if (customFrom) q = q.gte("created_at", new Date(customFrom).toISOString());
        if (customTo) {
          const end = new Date(customTo);
          end.setHours(23, 59, 59, 999);
          q = q.lte("created_at", end.toISOString());
        }
      } else {
        const cutoff = periodCutoff(period);
        if (cutoff) q = q.gte("created_at", cutoff.toISOString());
      }
      if (category !== "all") q = q.eq("category", category);

      const { data, error } = await q;
      if (error) throw error;

      const map = new Map<string, { approved: number; other: number }>();
      (data ?? []).forEach((r) => {
        const cur = map.get(r.user_id) ?? { approved: 0, other: 0 };
        if (r.status === "approved") cur.approved += 1;
        else cur.other += 1;
        map.set(r.user_id, cur);
      });

      const ids = Array.from(map.keys());
      const nameMap = new Map<string, string>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, responsible_name, company_name")
          .in("user_id", ids);
        (profs ?? []).forEach((p) =>
          nameMap.set(p.user_id, p.responsible_name || p.company_name || "Usuário"),
        );
      }

      const out: RankRow[] = ids.map((uid) => {
        const c = map.get(uid)!;
        return {
          user_id: uid,
          name: nameMap.get(uid) || "Usuário",
          approved: c.approved,
          other: c.other,
          total: c.approved + c.other,
        };
      });
      setRows(out);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar ranking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "master") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, period, category, customFrom, customTo]);

  const sorted = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name, "pt-BR");
      else cmp = (a[sortKey] as number) - (b[sortKey] as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="inline h-3 w-3 ml-1" />
    );
  }

  if (authLoading || !badgeLoaded) {
    return <LoadingState fullPage message="Montando o ranking…" />;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (status !== "master") return <Navigate to="/" replace />;

  const filename = `ranking-${period}${category !== "all" ? `-${category}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`;

   return (
     <PageContainer maxWidth="6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
                Ranking de Promotores
              </h1>
              <p className="text-sm text-muted-foreground">
                Filtre por período e categoria, ordene e exporte
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => downloadCSV(sorted, filename)}
            disabled={sorted.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <TabsList className="bg-muted/50">
                {(Object.keys(periodLabels) as Period[]).map((p) => (
                  <TabsTrigger key={p} value={p} className="text-xs sm:text-sm">
                    {periodLabels[p]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/70">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {period === "custom" && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">De</label>
                    <Input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="bg-white/70"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Até</label>
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="bg-white/70"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-secondary" />
              Resultados
              <Badge variant="outline" className="ml-2">
                {sorted.length}
              </Badge>
            </CardTitle>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            {sorted.length === 0 && !loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Calendar className="h-8 w-8 opacity-40" />
                Nenhum dado para os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead
                        onClick={() => toggleSort("name")}
                        className="cursor-pointer select-none hover:text-foreground"
                      >
                        Divulgador <SortIcon k="name" />
                      </TableHead>
                      <TableHead
                        onClick={() => toggleSort("approved")}
                        className="cursor-pointer select-none text-right hover:text-foreground"
                      >
                        Aprovados <SortIcon k="approved" />
                      </TableHead>
                      <TableHead
                        onClick={() => toggleSort("other")}
                        className="cursor-pointer select-none text-right hover:text-foreground"
                      >
                        Outros <SortIcon k="other" />
                      </TableHead>
                      <TableHead
                        onClick={() => toggleSort("total")}
                        className="cursor-pointer select-none text-right hover:text-foreground"
                      >
                        Total <SortIcon k="total" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((r, i) => (
                      <TableRow key={r.user_id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20">
                            {r.approved}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {r.other}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{r.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
    </PageContainer>
  );
}
