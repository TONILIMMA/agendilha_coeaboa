import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ShieldOff, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

export default function AdminUsers() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.");
        setLoading(false);
        return;
      }

      const response = await fetch(
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

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      setUsers(data as UserWithRole[]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar usuários");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  async function toggleAdmin(targetUser: UserWithRole) {
    if (targetUser.id === user?.id) {
      toast.error("Você não pode remover seu próprio papel de admin");
      return;
    }
    setToggling(targetUser.id);
    try {
      if (targetUser.is_admin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUser.id)
          .eq("role", "admin");
        if (error) throw error;
        toast.success(`Admin removido de ${targetUser.email}`);
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: targetUser.id, role: "admin" });
        if (error) throw error;
        toast.success(`${targetUser.email} agora é admin`);
      }
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar papel");
    }
    setToggling(null);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card className="border-border shadow-lg">
        <CardHeader className="flex flex-row items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-display">Gerenciar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</p>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Cadastro: {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.is_admin && (
                      <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                        Admin
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant={u.is_admin ? "destructive" : "outline"}
                      disabled={toggling === u.id || u.id === user?.id}
                      onClick={() => toggleAdmin(u)}
                      className="text-xs"
                    >
                      {toggling === u.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : u.is_admin ? (
                        <>
                          <ShieldOff className="h-3.5 w-3.5 mr-1" />
                          Remover Admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                          Tornar Admin
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
