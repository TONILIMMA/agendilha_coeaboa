import { useEffect, useState } from "react";
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
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          actor:profiles!audit_logs_actor_id_fkey(responsible_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setLogs(data.map(log => ({
        ...log,
        actor_name: (log.actor as any)?.responsible_name || 'Sistema/Removido'
      })));
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('audit_logs.read')) {
      fetchLogs();
    }
  }, [hasPermission]);

  if (permsLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!hasPermission('audit_logs.read')) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-muted/30 pb-16">
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-8 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/master">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-black font-display text-foreground flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                Logs de Auditoria
              </h1>
              <p className="text-sm text-muted-foreground">Rastreabilidade completa de ações administrativas</p>
            </div>
          </div>
          <Button onClick={fetchLogs} disabled={loading} variant="outline" size="sm" className="gap-2">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

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
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
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
