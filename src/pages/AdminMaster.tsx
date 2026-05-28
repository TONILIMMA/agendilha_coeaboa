import { useEffect, useMemo, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserBadge } from "@/hooks/useUserBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import Header from "@/components/Header";
import {
  Crown,
  Shield,
  Users,
  CalendarCheck,
  Loader2,
  ShieldPlus,
  ShieldOff,
  Trophy,
  UserPlus,
  Pencil,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  responsible_name: string | null;
  phone: string | null;
  is_admin: boolean;
  is_master: boolean;
}

interface RankRow {
  user_id: string;
  name: string;
  approved: number;
  other: number;
}

type Period = "week" | "month" | "year" | "all";

const periodLabels: Record<Period, string> = {
  week: "Semana",
  month: "Mês",
  year: "Ano",
  all: "Tudo",
};

function periodCutoff(p: Period): Date | null {
  if (p === "all") return null;
  const d = new Date();
  if (p === "week") d.setDate(d.getDate() - 7);
  if (p === "month") d.setMonth(d.getMonth() - 1);
  if (p === "year") d.setFullYear(d.getFullYear() - 1);
  return d;
}

export default function AdminMaster() {
  const { user, loading: authLoading } = useAuth();
  const { status, loaded: badgeLoaded } = useUserBadge();

  const [stats, setStats] = useState({ users: 0, admins: 0, approved: 0, newsletter: 0 });
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Edit user dialog
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function openEdit(u: AdminUser) {
    setEditingUser(u);
    setEditName(u.responsible_name || "");
    setEditPhone(u.phone || "");
  }

  async function saveEdit() {
    if (!editingUser) return;
    if (editName.trim().length < 2) {
      toast.error("Nome muito curto");
      return;
    }
    setSavingEdit(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            user_id: editingUser.id,
            responsible_name: editName.trim(),
            phone: editPhone.trim(),
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Falha ao salvar");
      toast.success("Usuário atualizado");
      setEditingUser(null);
      loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSavingEdit(false);
    }
  }

  const [period, setPeriod] = useState<Period>("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ranking, setRanking] = useState<RankRow[]>([]);

  const categoryOptions: { value: string; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "musica", label: "Música" },
    { value: "gastronomia", label: "Gastronomia" },
    { value: "cultura", label: "Cultura / Arte" },
    { value: "esporte", label: "Esporte" },
    { value: "promocoes", label: "Promoções" },
    { value: "outros", label: "Outros" },
  ];

  const [subscribers, setSubscribers] = useState<any[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão expirada.");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error("Falha ao carregar usuários");
      const usersList: Array<{
        id: string;
        email: string;
        responsible_name: string | null;
        phone: string | null;
        is_admin: boolean;
      }> = await res.json();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const masters = new Set(
        (roles ?? []).filter((r) => r.role === "master").map((r) => r.user_id)
      );

      // Fallback master = oldest admin if no formal masters
      let fallbackMaster: string | null = null;
      if (masters.size === 0) {
        const { data: oldest } = await supabase
          .from("user_roles")
          .select("user_id, created_at")
          .eq("role", "admin")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        fallbackMaster = oldest?.user_id ?? null;
      }

      const enriched: AdminUser[] = usersList.map((u) => ({
        ...u,
        is_master: masters.has(u.id) || u.id === fallbackMaster,
      }));

      setAllUsers(enriched);
      setAdmins(enriched.filter((u) => u.is_admin || u.is_master));

      // Approved events count
      const { count: approvedCount } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      // Newsletter subscribers
      const { data: subs, count: subsCount } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      
      if (subs) setSubscribers(subs);

      setStats({
        users: usersList.length,
        admins: enriched.filter((u) => u.is_admin).length,
        approved: approvedCount ?? 0,
        newsletter: subsCount ?? 0,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function loadRanking(p: Period, cat: string) {
    const cutoff = periodCutoff(p);
    let q = supabase
      .from("submissions")
      .select("user_id, status, created_at, category");
    if (cutoff) q = q.gte("created_at", cutoff.toISOString());
    if (cat !== "all") q = q.eq("category", cat);
    const { data } = await q;

    const map = new Map<string, { approved: number; other: number }>();
    (data ?? []).forEach((row) => {
      const cur = map.get(row.user_id) ?? { approved: 0, other: 0 };
      if (row.status === "approved") cur.approved += 1;
      else cur.other += 1;
      map.set(row.user_id, cur);
    });

    const userIds = Array.from(map.keys());
    if (userIds.length === 0) {
      setRanking([]);
      return;
    }

    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, responsible_name, company_name")
      .in("user_id", userIds);

    const nameMap = new Map<string, string>();
    (profs ?? []).forEach((p) =>
      nameMap.set(p.user_id, p.responsible_name || p.company_name || "Usuário")
    );

    const rows: RankRow[] = userIds
      .map((uid) => ({
        user_id: uid,
        name: nameMap.get(uid) || "Usuário",
        approved: map.get(uid)!.approved,
        other: map.get(uid)!.other,
      }))
      .sort((a, b) => b.approved - a.approved)
      .slice(0, 20);

    setRanking(rows);
  }

  useEffect(() => {
    if (!authLoading && user && status === "master") {
      loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, status]);

  useEffect(() => {
    if (status === "master") loadRanking(period, categoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, categoryFilter, status]);

  const masterCount = useMemo(
    () => admins.filter((a) => a.is_master).length,
    [admins]
  );

  async function promoteToAdmin(uid: string) {
    setBusyId(uid);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: uid, role: "admin" });
    setBusyId(null);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Promovido a Admin");
    loadAll();
  }

  async function promoteToMaster(uid: string) {
    setBusyId(uid);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: uid, role: "master" });
    setBusyId(null);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Promovido a Admin Master");
    loadAll();
  }

  async function removeAdmin(uid: string) {
    if (uid === user?.id) return toast.error("Você não pode remover a si mesmo.");
    setBusyId(uid);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", uid)
      .eq("role", "admin");
    setBusyId(null);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Admin removido");
    loadAll();
  }

  async function removeMaster(uid: string) {
    if (uid === user?.id) return toast.error("Você não pode remover a si mesmo.");
    if (masterCount <= 1) return toast.error("É necessário ao menos 1 Master.");
    setBusyId(uid);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", uid)
      .eq("role", "master");
    setBusyId(null);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Master removido");
    loadAll();
  }

  async function bootstrapToniLima() {
    setBootstrapping(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Sessão expirada.");
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bootstrap-master`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            name: "TONI LIMA",
            phone: "21998554322",
            password: "Master@2025",
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao cadastrar");
      toast.success("TONI LIMA cadastrado como Admin Master! Senha: Master@2025");
      loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao cadastrar");
    } finally {
      setBootstrapping(false);
    }
  }

  if (authLoading || !badgeLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (status !== "master") return <Navigate to="/" replace />;

   return (
     <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-muted pb-16">
       <Header />
       <div className="container max-w-6xl mx-auto px-4 pt-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center">
              <Crown className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground">
                Painel Master
              </h1>
              <p className="text-sm text-muted-foreground">
                Controle total da plataforma
              </p>
            </div>
          </div>
          <Button
            onClick={bootstrapToniLima}
            disabled={bootstrapping}
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm"
          >
            {bootstrapping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Cadastrar TONI LIMA como Master
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Usuários", value: stats.users, tone: "text-primary bg-primary/10 border-primary/20" },
            { icon: Shield, label: "Admins", value: stats.admins, tone: "text-secondary bg-secondary/10 border-secondary/20" },
            { icon: CalendarCheck, label: "Eventos", value: stats.approved, tone: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20" },
            { icon: Mail, label: "Newsletter", value: stats.newsletter, tone: "text-orange-700 bg-orange-500/10 border-orange-500/20" },
          ].map((s) => (
            <Card
              key={s.label}
              className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm transition-transform hover:scale-[1.01]"
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                    {s.label}
                  </div>
                  <div className="text-2xl font-display font-semibold text-foreground">
                    {loading ? "—" : s.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin management */}
        {/* Newsletter Subscribers */}
        <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600" />
                Inscritos na Newsletter
              </CardTitle>
              <Link to="/admin/newsletter">
                <Button variant="ghost" size="sm" className="text-xs text-primary font-bold">Ver Painel Completo</Button>
              </Link>
              <Link to="/admin/audit">
                <Button variant="ghost" size="sm" className="text-xs text-secondary font-bold flex items-center gap-1">
                  <History className="h-3 w-3" /> Logs de Auditoria
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                {subscribers.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum inscrito ainda.</p>
                )}
                {subscribers.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/60">
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate">{s.name || "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Gestão de administradores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {admins.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum administrador.</p>
                )}
                {admins.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/50 border border-white/60"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate flex items-center gap-2">
                        {u.responsible_name || u.email}
                        {u.is_master && (
                          <Badge className="bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/15">
                            <Crown className="h-3 w-3 mr-1" /> Master
                          </Badge>
                        )}
                        {u.is_admin && !u.is_master && (
                          <Badge variant="outline" className="border-primary/30 text-primary">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(u)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                      {!u.is_master && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === u.id}
                          onClick={() => promoteToMaster(u.id)}
                        >
                          <Crown className="h-3.5 w-3.5 mr-1" /> Tornar Master
                        </Button>
                      )}
                      {u.is_admin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === u.id || u.id === user.id}
                          onClick={() => removeAdmin(u.id)}
                        >
                          <ShieldOff className="h-3.5 w-3.5 mr-1" /> Remover Admin
                        </Button>
                      )}
                      {u.is_master && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === u.id || u.id === user.id || masterCount <= 1}
                          onClick={() => removeMaster(u.id)}
                        >
                          <ShieldOff className="h-3.5 w-3.5 mr-1" /> Remover Master
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Promote a non-admin */}
            <div className="pt-4 border-t border-white/60">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono mb-2">
                Promover usuário a Admin / Editar
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {allUsers.filter((u) => !u.is_admin && !u.is_master).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/40 border border-white/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {u.responsible_name || "Sem nome"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {u.phone || u.email}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(u)}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id}
                        onClick={() => promoteToAdmin(u.id)}
                        className="h-8"
                      >
                        <ShieldPlus className="h-3.5 w-3.5 mr-1" /> Admin
                      </Button>
                    </div>
                  </div>
                ))}
                {allUsers.filter((u) => !u.is_admin && !u.is_master).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem usuários elegíveis.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card className="bg-white/60 backdrop-blur-md border-white/40 shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary" />
              Ranking de divulgadores
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <TabsList>
                  {(Object.keys(periodLabels) as Period[]).map((p) => (
                    <TabsTrigger key={p} value={p}>
                      {periodLabels[p]}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-[160px] rounded-full bg-white/70 border-white/60 text-xs">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-sm">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Sem dados para o período.
              </p>
            ) : (
              <div className="space-y-2">
                {ranking.map((r, i) => (
                  <div
                    key={r.user_id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/50 border border-white/60 transition-transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center font-display font-semibold text-sm ${
                          i === 0
                            ? "bg-secondary text-secondary-foreground"
                            : i < 3
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.other} pendentes/reprovados
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-display font-semibold text-primary">
                        {r.approved}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                        aprovados
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit user dialog */}
      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome completo</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">WhatsApp</Label>
              <Input
                id="edit-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(21) 98765-4321"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              E-mail/login: <span className="font-mono">{editingUser?.email}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingUser(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={savingEdit}>
              {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
