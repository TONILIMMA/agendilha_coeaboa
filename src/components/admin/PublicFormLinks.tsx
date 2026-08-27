import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, ExternalLink, Link2, Music, Store, CalendarPlus, Share2 } from "lucide-react";
import { ROUTES } from "@/routes/config";

interface LinkItem {
  key: string;
  label: string;
  hint: string;
  path: string;
  icon: typeof Music;
  message: (url: string) => string;
}

const ITEMS: LinkItem[] = [
  {
    key: "evento",
    label: "Cadastro de evento",
    hint: "Manda pros divulgadores cadastrarem o rolê.",
    path: ROUTES.ENVIAR_EVENTO,
    icon: CalendarPlus,
    message: (url) =>
      `Fala! Cadastra teu rolê na AgendIlha por aqui, é rapidinho: ${url}`,
  },
  {
    key: "atrativo",
    label: "Cadastro de atrativo",
    hint: "Pra artistas, bandas, DJs e atrações.",
    path: ROUTES.CADASTRO_ATRATIVO,
    icon: Music,
    message: (url) =>
      `Fala! Cadastra teu atrativo (artista, banda, DJ) na AgendIlha aqui: ${url}`,
  },
  {
    key: "estabelecimento",
    label: "Cadastro de estabelecimento",
    hint: "Pra bares, restaurantes e casas de evento.",
    path: ROUTES.CADASTRO_ESTABELECIMENTO,
    icon: Store,
    message: (url) =>
      `Fala! Cadastra teu bar/restaurante na AgendIlha aqui: ${url}`,
  },
];

/**
 * Painel do ADM: gera, copia e compartilha por WhatsApp os links dos
 * formulários públicos. Quem recebe o link só preenche o próprio cadastro.
 */
export function PublicFormLinks() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const links = useMemo(
    () => ITEMS.map((i) => ({ ...i, url: `${origin}${i.path}` })),
    [origin],
  );

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado! Só colar e enviar.");
    } catch {
      toast.error("Não deu pra copiar. Selecione o link e copie na mão.");
    }
  };

  const share = (item: (typeof links)[number]) => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(item.message(item.url))}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <Card className="p-4 sm:p-5 space-y-4 rounded-2xl">
      <div className="space-y-1">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" />
          Links de cadastro
        </h2>
        <p className="text-xs text-muted-foreground">
          Envie o link certo para cada pessoa. Ninguém precisa de acesso ao painel: o cadastro chega
          aqui aguardando sua análise.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="rounded-xl border p-3 space-y-3 bg-card">
              <div className="space-y-1">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.hint}</p>
              </div>

              <Input readOnly value={item.url} className="h-9 text-xs" onFocus={(e) => e.currentTarget.select()} />

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => copy(item.url)}>
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
                <Button size="sm" className="gap-1" onClick={() => share(item)}>
                  <Share2 className="h-3.5 w-3.5" /> WhatsApp
                </Button>
                <Button size="sm" variant="ghost" className="gap-1" asChild>
                  <a href={item.path} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Abrir
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
