import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneDisplay } from "@/lib/whatsapp";
import { formatBrazilianDate } from "@/lib/date-utils";
import {
  Loader2, User, Phone, Mail, MapPin, Calendar, ShieldCheck, CalendarDays, Check, X,
} from "lucide-react";
import type { UserWithRole } from "./types";

interface Props {
  user: UserWithRole | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const TYPE_LABELS: Record<string, string> = {
  usuario: "Usuário público",
  divulgador: "Divulgador",
  promotor: "Divulgador",
  promoter: "Divulgador",
  estabelecimento: "Estabelecimento",
  artist: "Músico / Artista",
};

export function UserDetailsDialog({ user, open, onOpenChange }: Props) {
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["user-details", userId],
    enabled: open && !!userId,
    queryFn: async () => {
      const [events, roles, collab] = await Promise.all([
        supabase
          .from("submissions")
          .select("id, event_title, date, status")
          .eq("user_id", userId!)
          .order("date", { ascending: false })
          .limit(30),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
        supabase
          .from("collaborators")
          .select("can_submit, can_approve, can_edit, can_delete, is_active, role_title")
          .eq("user_id", userId!)
          .maybeSingle(),
      ]);
      return {
        events: events.data ?? [],
        roles: (roles.data ?? []).map((r: any) => String(r.role)),
        collab: collab.data as any,
      };
    },
  });

  if (!user) return null;

  const isAdmin = user.status === "admin" || user.status === "master" || !!user.is_admin;
  const perms = [
    { label: "Enviar eventos", ok: isAdmin || !!data?.collab?.can_submit },
    { label: "Aprovar eventos", ok: isAdmin || !!data?.collab?.can_approve },
    { label: "Editar eventos", ok: isAdmin || !!data?.collab?.can_edit },
    { label: "Apagar eventos", ok: isAdmin || !!data?.collab?.can_delete },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <User className="h-5 w-5 text-primary shrink-0" />
            <span className="truncate">{user.responsible_name || "Sem nome"}</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            Ficha completa: tipo, eventos e o que essa pessoa pode fazer no app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Tipo e papel */}
          <div className="flex flex-wrap items-center gap-2">
            {user.status && <StatusBadge role={user.status} />}
            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">
              {TYPE_LABELS[user.user_type || "usuario"] || user.user_type}
            </Badge>
            {data?.collab?.role_title && (
              <Badge variant="outline" className="text-[10px]">{data.collab.role_title}</Badge>
            )}
          </div>

          {/* Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 min-w-0">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="truncate">{user.email || "—"}</span>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{user.phone ? formatPhoneDisplay(user.phone) : "Não informado"}</span>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{user.address_neighborhood || "Bairro não informado"}</span>
            </div>
            <div className="flex items-start gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>Desde {new Date(user.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>

          <Separator />

          {/* Permissões */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Permissões atuais
            </p>
            {isAdmin && (
              <p className="text-xs text-muted-foreground">
                Admin já tem tudo liberado.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {perms.map((p) => (
                <div
                  key={p.label}
                  className={`flex items-center gap-2 text-xs rounded-lg border px-2.5 py-2 ${
                    p.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {p.ok ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />}
                  {p.label}
                </div>
              ))}
            </div>
            {!!data?.roles?.length && (
              <p className="text-[11px] text-muted-foreground">
                Papéis no sistema: {data.roles.join(", ")}
              </p>
            )}
          </div>

          <Separator />

          {/* Eventos vinculados */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Eventos vinculados
              {!!data?.events?.length && (
                <span className="ml-1 text-foreground/70">({data.events.length})</span>
              )}
            </p>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
              </div>
            ) : !data?.events?.length ? (
              <p className="text-sm text-muted-foreground">
                Ainda não divulgou nenhum evento por aqui.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {data.events.map((e: any) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{e.event_title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {e.date ? formatBrazilianDate(e.date) : "Sem data"}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 capitalize">
                      {e.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
