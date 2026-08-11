import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { normalizeBrPhone, validateWhatsappForAccount } from "@/lib/phone";

type Row = { user_id: string; responsible_name: string | null; phone: string | null; user_type: string | null };

/**
 * Diagnóstico de acesso pro Master: mostra, em linguagem simples, quem pode ficar
 * travado no login ou na divulgação — sem expor senha, PIN ou dado sensível.
 */
export function AccessDiagnostics() {
  const { data, isLoading } = useQuery({
    queryKey: ["master", "access-diagnostics"],
    staleTime: 60_000,
    queryFn: async () => {
      const [profilesRes, rolesRes, collabRes] = await Promise.all([
        supabase.from("profiles").select("user_id, responsible_name, phone, user_type"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("collaborators").select("user_id, is_active, can_submit"),
      ]);

      const profiles = (profilesRes.data ?? []) as Row[];
      const roles = rolesRes.data ?? [];
      const collabs = collabRes.data ?? [];

      const adminIds = new Set(
        roles.filter((r) => r.role === "admin" || r.role === "master").map((r) => r.user_id),
      );
      const collabIds = new Set(
        collabs.filter((c) => c.is_active && c.can_submit).map((c) => c.user_id),
      );

      const semNome = profiles.filter((p) => !p.responsible_name?.trim());
      const telefoneRuim = profiles.filter((p) => !!p.phone && !!validateWhatsappForAccount(p.phone));
      const semTelefone = profiles.filter((p) => !normalizeBrPhone(p.phone));
      const tipoForaDoPadrao = profiles.filter(
        (p) => !["publico", "divulgador", "artista"].includes((p.user_type ?? "").toLowerCase()),
      );
      const podemDivulgar = profiles.filter(
        (p) =>
          adminIds.has(p.user_id) ||
          collabIds.has(p.user_id) ||
          (p.user_type ?? "").toLowerCase() === "divulgador",
      );

      return {
        total: profiles.length,
        admins: adminIds.size,
        podemDivulgar: podemDivulgar.length,
        semNome: semNome.length,
        semTelefone: semTelefone.length,
        telefoneRuim: telefoneRuim.length,
        tipoForaDoPadrao: tipoForaDoPadrao.length,
      };
    },
  });

  const items = data
    ? [
        { label: "Contas no app", value: data.total, warn: false },
        { label: "Admins e Masters", value: data.admins, warn: false },
        { label: "Podem divulgar evento", value: data.podemDivulgar, warn: false },
        { label: "Sem nome no cadastro", value: data.semNome, warn: data.semNome > 0 },
        { label: "Sem WhatsApp salvo", value: data.semTelefone, warn: data.semTelefone > 0 },
        { label: "WhatsApp em formato errado", value: data.telefoneRuim, warn: data.telefoneRuim > 0 },
        { label: "Tipo de perfil fora do padrão", value: data.tipoForaDoPadrao, warn: data.tipoForaDoPadrao > 0 },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="h-4 w-4 text-primary" />
          Diagnóstico de acesso
        </CardTitle>
        <CardDescription>
          Onde a galera pode estar travando pra entrar ou divulgar. Quem aparece com alerta precisa de um
          ajuste no cadastro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Conferindo os cadastros…
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <Badge variant={item.warn ? "destructive" : "secondary"} className="gap-1">
                  {item.warn ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {item.value}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          Nada de senha ou PIN aparece aqui — só o que dá pra corrigir no cadastro.
        </p>
      </CardContent>
    </Card>
  );
}
