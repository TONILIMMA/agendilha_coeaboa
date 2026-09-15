import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import {
  ArrowLeft, Building2, MapPin, Navigation, Phone, Share2, CalendarOff,
} from "lucide-react";
import { toast } from "sonner";
import { SeoHead } from "@/components/seo/SeoHead";

interface Estabelecimento {
  id: string;
  nome: string;
  tipo: string | null;
  bairro: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  cep: string | null;
  contato: string | null;
  fotos: string[] | null;
}

interface EventRow {
  id: string;
  event_title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  address_neighborhood: string | null;
  category: string | null;
  image_url: string | null;
  slug: string | null;
  age_rating: string | null;
  is_suitable_for_minors: boolean | null;
}

export default function EstabelecimentoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [estab, setEstab] = useState<Estabelecimento | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("estabelecimentos_public")
        .select("id, nome, tipo, bairro, endereco, numero, complemento, cep, fotos")
        .eq("id", id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      // Contato do responsável não é público: fica fora da consulta pública.
      setEstab({ ...data, contato: null } as Estabelecimento);

      const today = new Date().toISOString().slice(0, 10);
      const { data: evs } = await supabase
        .from("public_submissions")
        .select("id, event_title, date, start_time, location, address_neighborhood, category, image_url, slug, age_rating, is_suitable_for_minors")
        .ilike("location", `%${data.nome}%`)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(24);
      if (!cancelled) setEvents((evs || []) as EventRow[]);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const fullAddress = useMemo(() => {
    if (!estab) return "";
    return [
      [estab.endereco, estab.numero].filter(Boolean).join(", "),
      estab.complemento,
      estab.bairro,
      estab.cep,
    ].filter(Boolean).join(" – ");
  }, [estab]);

  const mapsUrl = useMemo(() => {
    if (!estab) return "#";
    const q = encodeURIComponent([estab.nome, fullAddress].filter(Boolean).join(", "));
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [estab, fullAddress]);

  const handleShare = async () => {
    const url = window.location.href;
    const text = estab ? `Conheça ${estab.nome} na Ilha — ${url}` : url;
    try {
      if (navigator.share) {
        await navigator.share({ title: estab?.nome, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado!");
      }
    } catch { /* user cancelled */ }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (notFound || !estab) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <EmptyState
          icon={Building2}
          title="Estabelecimento não encontrado"
          description="O lugar que você procura pode ter sido removido ou o link está incorreto."
          actionLabel="Voltar para a home"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-10 space-y-8 pb-24">
      <SeoHead
        title={`${estab.nome}${estab.bairro ? ` — ${estab.bairro}` : ""} | AgendIlha`}
        description={`${estab.nome}${estab.tipo ? `, ${estab.tipo}` : ""}${estab.bairro ? ` no bairro ${estab.bairro}` : ""} na Ilha do Governador. Veja endereço, contato e os próximos eventos por lá.`}
        path={`/lugar/${estab.id}`}
        image={estab.fotos?.[0] || undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: estab.nome,
          telephone: estab.contato || undefined,
          image: estab.fotos?.[0] || undefined,
          address: {
            "@type": "PostalAddress",
            streetAddress: [estab.endereco, estab.numero].filter(Boolean).join(", ") || undefined,
            addressLocality: "Rio de Janeiro",
            addressRegion: "RJ",
            postalCode: estab.cep || undefined,
            addressCountry: "BR",
          },
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2 text-foreground/70 hover:text-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Hero */}
      <header className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight leading-tight text-foreground break-words">
              {estab.nome}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {estab.tipo && (
                <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-[0.18em] px-3 py-1 rounded-full">
                  {estab.tipo}
                </Badge>
              )}
              {estab.bairro && (
                <span className="inline-flex items-center gap-1 text-sm text-foreground/70">
                  <MapPin className="h-3.5 w-3.5" /> {estab.bairro}
                </span>
              )}
            </div>
          </div>
        </div>

        {fullAddress && (
          <p className="text-sm sm:text-base text-foreground/75 leading-snug">{fullAddress}</p>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            className="h-11 rounded-full px-5 font-semibold gap-2"
            onClick={() => window.open(mapsUrl, "_blank")}
          >
            <Navigation className="h-4 w-4" />
            Como chegar
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-full px-5 font-semibold gap-2 border-foreground/15"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </header>

      {estab.fotos && estab.fotos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
            Fotos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {estab.fotos.map((url, i) => (
              <a
                key={url + i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="aspect-square rounded-2xl overflow-hidden ring-1 ring-foreground/[0.08] bg-muted block"
              >
                <img
                  src={url}
                  alt={`${estab.nome} — foto ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Informações práticas */}
      {(estab.contato || estab.cep || estab.complemento) && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
            Informações práticas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {estab.contato && (
              <InfoTile icon={<Phone className="h-4 w-4 text-foreground/60" />} label="Contato" value={estab.contato} />
            )}
            {estab.bairro && (
              <InfoTile icon={<MapPin className="h-4 w-4 text-foreground/60" />} label="Bairro" value={estab.bairro} />
            )}
            {estab.cep && (
              <InfoTile icon={<MapPin className="h-4 w-4 text-foreground/60" />} label="CEP" value={estab.cep} />
            )}
            {estab.complemento && (
              <InfoTile icon={<Building2 className="h-4 w-4 text-foreground/60" />} label="Complemento" value={estab.complemento} />
            )}
          </div>
        </section>
      )}

      {/* Eventos neste lugar */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight">
            Rolês no {estab.nome}
          </h2>
          <p className="text-sm text-foreground/60 mt-1">Próximos eventos confirmados aqui.</p>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Sem rolê marcado por aqui ainda"
            description="Fica de olho — esse lugar pode soltar novidade a qualquer momento."
            actionLabel="Ver agenda completa"
            onAction={() => navigate("/explorar")}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {events.map((ev) => (
              <DiscoveryEventCard
                key={ev.id}
                event={ev as any}
                variant="small"
                className="w-full"
                onClick={() => ev.slug && navigate(`/evento/${ev.slug}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl ring-1 ring-foreground/[0.08] p-4 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/55">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}