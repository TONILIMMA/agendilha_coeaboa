import { useEffect, useState } from "react";
import { handleError } from "@/lib/error-handler";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  History, 
  User, 
  Shield, 
  Activity,
  Filter,
  RefreshCcw,
  ArrowLeft
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import Header from "@/components/Header";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";

interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  created_at: string;
  reason: string;
}

export default function AdminAuditLogs() {
  const { user } = useAuth();
  const { hasPermission, loading: permsLoading } = useAppPermissions();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: isMaster } = await supabase.rpc('is_master', { _user_id: session.user.id });

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          actor:profiles!audit_logs_actor_id_fkey(responsible_name)
        `);
      
      if (!isMaster) {
        query = query.eq('actor_id', session.user.id);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setLogs(data.map(log => ({
        ...log,
        actor_name: (log.actor as any)?.responsible_name || 'Sistema/Removido'
      })));
    } catch (error) {
      handleError(error, { context: "AdminAuditLogs.fetch", fallback: "Não deu pra carregar o histórico. Tenta de novo." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('audit_logs.read')) {
      fetchLogs();
    }
  }, [hasPermission]);

  if (permsLoading) return <LoadingState fullPage message="Verificando permissões..." />;
  if (!hasPermission('audit_logs.read')) return <Navigate to="/" replace />;

  return (
    <div className="pb-16 animate-fade-in">
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        <SectionHeader
          title="Logs de Auditoria"
          subtitle="Rastreabilidade completa de ações administrativas"
          rightElement={
            <>
              <Link to="/master/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm" className="gap-2">
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </>
          }
        />

        <Card className="border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider">Data/Hora</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider">Autor</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider">Ação</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider">Recurso</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider">ID do Recurso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <LoadingState message="Carregando logs..." />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Nenhum log encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/5">
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-primary" />
                          <span className="text-sm font-medium">{log.actor_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-muted-foreground">
                        {log.resource_type}
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">
                        {log.resource_id}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
