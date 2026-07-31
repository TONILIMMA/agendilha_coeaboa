import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/routes/config";
import { cn } from "@/lib/utils";
import {
  Search,
  Building2,
  Users,
  Megaphone,
  ChevronDown,
  Phone,
  AtSign,
  MapPin,
  ExternalLink,
} from "lucide-react";

type Registro = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  aprovado: boolean | null;
  criadoEm: string | null;
  detalhes: { icon: typeof Phone; label: string; value: string }[];
  link?: string;
};

function useRegistros() {
  return useQuery({
    queryKey: ["master-registros"],
    queryFn: async () => {
      const [atrativos, estabelecimentos, promotores] = await Promise.all([
        supabase
          .from("atrativos")
          .select(
            "id, name, tipo_atrativo, style, is_approved, created_at, responsavel_nome, responsavel_telefone, responsavel_email, cidade_regiao"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("estabelecimentos")
          .select(
            "id, nome, tipo, bairro, endereco, is_approved, created_at, responsavel_nome, responsavel_telefone, responsavel_email"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("promotor_profiles")
          .select("id, promotor_nome, promotor_whatsapp, tipo_promotor, created_at")
          .order("created_at", { ascending: false }),
      ]);

      if (atrativos.error) throw atrativos.error;
      if (estabelecimentos.error) throw estabelecimentos.error;
      if (promotores.error) throw promotores.error;

      const mapAtrativo = (a: any): Registro => ({
        id: a.id,
        titulo: a.name,
        subtitulo: a.tipo_atrativo || a.style || null,
        aprovado: a.is_approved,
        criadoEm: a.created_at,
        detalhes: [
          a.responsavel_nome && { icon: Users, label: "Responsável", value: a.responsavel_nome },
          a.responsavel_telefone && { icon: Phone, label: "WhatsApp", value: a.responsavel_telefone },
          a.responsavel_email && { icon: AtSign, label: "E-mail", value: a.responsavel_email },
          a.cidade_regiao && { icon: MapPin, label: "Região", value: a.cidade_regiao },
        ].filter(Boolean) as Registro["detalhes"],
        link: ROUTES.ADMIN_ATRATIVOS,
      });

      const mapEstab = (e: any): Registro => ({
        id: e.id,
        titulo: e.nome,
        subtitulo: e.tipo || e.bairro || null,
        aprovado: e.is_approved,
        criadoEm: e.created_at,
        detalhes: [
          e.endereco && { icon: MapPin, label: "Endereço", value: [e.endereco, e.bairro].filter(Boolean).join(" - ") },
          e.responsavel_nome && { icon: Users, label: "Responsável", value: e.responsavel_nome },
          e.responsavel_telefone && { icon: Phone, label: "WhatsApp", value: e.responsavel_telefone },
          e.responsavel_email && { icon: AtSign, label: "E-mail", value: e.responsavel_email },
        ].filter(Boolean) as Registro["detalhes"],
        link: ROUTES.ADMIN_ESTABELECIMENTOS,
      });

      const mapPromotor = (p: any): Registro => ({
        id: p.id,
        titulo: p.promotor_nome,
        subtitulo: p.tipo_promotor || "divulgador",
        aprovado: null,
        criadoEm: p.created_at,
        detalhes: [
          p.promotor_whatsapp && { icon: Phone, label: "WhatsApp", value: p.promotor_whatsapp },
        ].filter(Boolean) as Registro["detalhes"],
        link: ROUTES.ADMIN_USERS,
      });

      return {
        atrativos: (atrativos.data ?? []).map(mapAtrativo),
        estabelecimentos: (estabelecimentos.data ?? []).map(mapEstab),
        promotores: (promotores.data ?? []).map(mapPromotor),
      };
    },
    staleTime: 60_000,
  });
}

function RegistroCard({ registro }: { registro: Registro }) {
  const [open, setOpen] = useState(false);
  return (
    <Card
      className={cn(
        "border-border/50 transition-all cursor-pointer hover:border-primary/40",
        open && "border-primary/60 ring-1 ring-primary/20"
      )}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate">{registro.titulo}</p>
            {registro.subtitulo && (
              <p className="text-xs text-muted-foreground truncate capitalize">{registro.subtitulo}</p>
            )}
          </div>
          {registro.aprovado !== null && (
            <Badge variant={registro.aprovado ? "default" : "secondary"} className="shrink-0 text-[10px]">
              {registro.aprovado ? "Aprovado" : "Pendente"}
            </Badge>
          )}
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
        </div>

        {open && (
          <div className="mt-4 pt-4 border-t border-border/60 space-y-3 animate-fade-in">
            {registro.detalhes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados extras nesse cadastro ainda.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {registro.detalhes.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <d.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{d.label}:</span>
                    <span className="font-medium break-words">{d.value}</span>
                  </div>
                ))}
              </div>
            )}
            {registro.criadoEm && (
              <p className="text-[11px] text-muted-foreground">
                Cadastrado em {new Date(registro.criadoEm).toLocaleDateString("pt-BR")}
              </p>
            )}
            {registro.link && (
              <Link to={registro.link} onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="rounded-full gap-2">
                  Abrir gestão
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RegistroList({ registros, busca }: { registros: Registro[]; busca: string }) {
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return registros;
    return registros.filter((r) =>
      [r.titulo, r.subtitulo, ...r.detalhes.map((d) => d.value)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [registros, busca]);

  if (filtrados.length === 0) {
    return (
      <EmptyState
        title="Nada por aqui ainda"
        description="Nenhum cadastro bateu com essa busca. Tenta outro nome ou limpa o filtro."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {filtrados.map((r) => (
        <RegistroCard key={r.id} registro={r} />
      ))}
    </div>
  );
}

export function MasterRegistrationsPanel() {
  const { data, isLoading } = useRegistros();
  const [busca, setBusca] = useState("");

  if (isLoading) return <LoadingState message="Buscando todos os cadastros..." />;

  const atrativos = data?.atrativos ?? [];
  const estabelecimentos = data?.estabelecimentos ?? [];
  const promotores = data?.promotores ?? [];

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, responsável, WhatsApp..."
          className="pl-9 rounded-full"
        />
      </div>

      <Tabs defaultValue="atrativos" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-full w-full grid grid-cols-3 h-10 sm:h-12">
          <TabsTrigger value="atrativos" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
            <Users className="h-3.5 w-3.5" /> Atrativos ({atrativos.length})
          </TabsTrigger>
          <TabsTrigger value="estabelecimentos" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
            <Building2 className="h-3.5 w-3.5" /> Locais ({estabelecimentos.length})
          </TabsTrigger>
          <TabsTrigger value="promotores" className="rounded-full gap-2 font-bold text-[10px] sm:text-xs uppercase tracking-widest">
            <Megaphone className="h-3.5 w-3.5" /> Divulgadores ({promotores.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="atrativos" className="mt-0">
          <RegistroList registros={atrativos} busca={busca} />
        </TabsContent>
        <TabsContent value="estabelecimentos" className="mt-0">
          <RegistroList registros={estabelecimentos} busca={busca} />
        </TabsContent>
        <TabsContent value="promotores" className="mt-0">
          <RegistroList registros={promotores} busca={busca} />
        </TabsContent>
      </Tabs>
    </div>
  );
}