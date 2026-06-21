import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Music2,
  Search,
  User as UserIcon,
  CalendarDays,
  AtSign,
  Phone,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

type Artist = {
  id: string;
  user_id: string;
  name: string;
  genre: string | null;
  neighborhood: string | null;
  is_approved: boolean | null;
  bio: string | null;
  whatsapp: string | null;
  instagram: string | null;
  work_description: string | null;
  avatar_url: string | null;
};

function statusBadge(a: Artist) {
  if (a.is_approved) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] uppercase font-bold tracking-widest">
        Aprovado
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">
      Pendente
    </Badge>
  );
}

export function MasterArtistsPanel() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Artist | null>(null);
  const [view, setView] = useState<"profile" | "events">("profile");

  const { data: artists, isLoading } = useQuery({
    queryKey: ["master-artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select(
          "id,user_id,name,genre,neighborhood,is_approved,bio,whatsapp,instagram,work_description,avatar_url"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Artist[];
    },
  });

  const { data: eventCounts } = useQuery({
    queryKey: ["master-artists-event-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("artist_id")
        .not("artist_id", "is", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data ?? []).forEach((row: any) => {
        if (row.artist_id) counts[row.artist_id] = (counts[row.artist_id] || 0) + 1;
      });
      return counts;
    },
  });

  const filtered = useMemo(() => {
    const list = artists ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.name?.toLowerCase().includes(q) ||
        a.genre?.toLowerCase().includes(q) ||
        a.neighborhood?.toLowerCase().includes(q)
    );
  }, [artists, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border self-start">
          <Music2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">
            {artists?.length || 0} músicos cadastrados
          </span>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, estilo ou bairro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-full"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Carregando músicos..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="Nenhum músico encontrado"
          description={search ? "Tente outro termo de busca." : "Ainda não há músicos cadastrados."}
        />
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            {/* Desktop / tablet table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome artístico</TableHead>
                    <TableHead>Estilo</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Eventos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground">{a.genre || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{a.neighborhood || "—"}</TableCell>
                      <TableCell className="text-center">{statusBadge(a)}</TableCell>
                      <TableCell className="text-center font-bold">{eventCounts?.[a.id] ?? 0}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-full"
                          onClick={() => {
                            setSelected(a);
                            setView("profile");
                          }}
                        >
                          Ver perfil
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-full text-primary"
                          onClick={() => {
                            setSelected(a);
                            setView("events");
                          }}
                        >
                          Ver eventos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile compact list */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelected(a);
                    setView("profile");
                  }}
                  className="w-full text-left p-4 active:bg-muted/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold truncate">{a.name}</span>
                        {statusBadge(a)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {a.genre || "Estilo —"} • {a.neighborhood || "Bairro —"}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 gap-1 font-bold">
                      <CalendarDays className="h-3 w-3" />
                      {eventCounts?.[a.id] ?? 0}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ArtistDetailSheet
        artist={selected}
        view={view}
        setView={setView}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function ArtistDetailSheet({
  artist,
  view,
  setView,
  onClose,
}: {
  artist: Artist | null;
  view: "profile" | "events";
  setView: (v: "profile" | "events") => void;
  onClose: () => void;
}) {
  const { data: privateContacts } = useQuery({
    enabled: !!artist?.id,
    queryKey: ["master-artist-private-contacts", artist?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_artist_private_contacts", { p_artist_id: artist!.id });
      if (error) return null;
      const row = Array.isArray(data) ? data[0] : data;
      return row as { representative_name: string | null; representative_phone: string | null } | null;
    },
  });

  const { data: events, isLoading } = useQuery({
    enabled: !!artist?.id,
    queryKey: ["master-artist-events", artist?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id,event_title,date,status,editorial_status,location")
        .eq("artist_id", artist!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  return (
    <Sheet open={!!artist} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {artist && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-border">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.name} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{artist.name}</SheetTitle>
                  <SheetDescription className="truncate">
                    {artist.genre || "Estilo não informado"} • {artist.neighborhood || "Bairro não informado"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant={view === "profile" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("profile")}
                className="rounded-full"
              >
                Perfil
              </Button>
              <Button
                variant={view === "events" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("events")}
                className="rounded-full"
              >
                Eventos
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {view === "profile" ? (
                <>
                  <DetailRow
                    icon={UserIcon}
                    label="Nome completo / responsável"
                    value={privateContacts?.representative_name || "—"}
                  />
                  <DetailRow
                    icon={Phone}
                    label="Telefone"
                    value={artist.whatsapp || privateContacts?.representative_phone || "—"}
                  />
                  <DetailRow icon={AtSign} label="Instagram" value={artist.instagram || "—"} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Descrição
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{artist.bio || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Observações
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{artist.work_description || "—"}</p>
                  </div>
                  <a
                    href={`/artista/${artist.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    Ver perfil público <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando eventos...
                </div>
              ) : !events || events.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Nenhum evento vinculado"
                  description="Este músico ainda não foi vinculado a nenhum evento."
                />
              ) : (
                <ul className="space-y-2">
                  {events.map((ev: any) => (
                    <li
                      key={ev.id}
                      className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                    >
                      <p className="font-semibold text-sm truncate">{ev.event_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.date || "Sem data"} • {ev.location || "Sem local"}
                      </p>
                      <div className="flex gap-1.5 mt-1.5">
                        {ev.editorial_status && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {ev.editorial_status}
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  );
}