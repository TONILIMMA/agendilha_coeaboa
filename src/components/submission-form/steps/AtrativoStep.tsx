import { NovoAtrativoDialog } from "@/components/atrativos/NovoAtrativoDialog";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { Music, Search, Info, Lock, Link2, RefreshCw, Unlink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onEntityCreated } from "@/lib/entityEvents";
import { formatPhoneDisplay, validateBrazilianMobile } from "@/lib/whatsapp";
import { EventPreview } from "../EventPreview";
import { AutofillIssues } from "../AutofillIssues";
import { checkAtrativoAutofill } from "@/lib/autofillValidation";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { AtrativoAutocomplete } from "@/components/atrativos/AtrativoAutocomplete";

const CATEGORIES = [
  { value: "musica", label: "Música / Show" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultura", label: "Cultura / Arte" },
  { value: "esporte", label: "Esporte" },
  { value: "turismo", label: "Turismo" },
  { value: "outros", label: "Outros" },
] as const;

type AtrativoCategory = typeof CATEGORIES[number]["value"];

export function AtrativoStep({ form }: { form: UseFormReturn<any> }) {
  const { isAdmin, isMaster } = useAppPermissions();
  const isSuperUser = isAdmin || isMaster;
  
  // Um evento já salvo (que tem ID) bloqueia a troca de atrativo para usuários comuns.
  const submissionId = form.watch("id");
  const isExistingEvent = !!submissionId;
  const canEditAtrativo = !isExistingEvent || isSuperUser;
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [resyncing, setResyncing] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [novoAtrativo, setNovoAtrativo] = useState(false);
  const [novoAtrativoOpen, setNovoAtrativoOpen] = useState(false);
  const [novoAtrativoNome, setNovoAtrativoNome] = useState("");

  const watched = form.watch(["atrativoName", "atrativoContact", "atrativoEmail", "atrativoCategory"]);
  const issues = checkAtrativoAutofill({
    atrativoName: watched[0],
    atrativoContact: watched[1],
    atrativoEmail: watched[2],
    atrativoCategory: watched[3],
  });

  const sourceId: string | undefined = form.watch("atrativoSourceId");
  const sourceType: "artist" | "atrativo" | undefined = form.watch("atrativoSourceType");
  const linkedName: string | undefined = form.watch("atrativoLinkedName");
  const linkedAt: string | undefined = form.watch("atrativoLinkedAt");

  // Aplica o snapshot no rascunho a partir de uma linha do banco.
  const applySnapshot = (row: any, kind: "artist" | "atrativo") => {
    if (kind === "artist") {
      form.setValue("atrativoName", row.name ?? "", { shouldDirty: true });
      form.setValue("atrativoType", row.artist_type ?? "", { shouldDirty: true });
      form.setValue("atrativoStyle", row.genre ?? "", { shouldDirty: true });
      form.setValue("atrativoDescription", (row.bio ?? "").slice(0, 500), { shouldDirty: true });
      form.setValue(
        "atrativoContact",
        row.whatsapp ? formatPhoneDisplay(row.whatsapp) : "",
        { shouldDirty: true, shouldValidate: true },
      );
      if (row.contact_email) {
        form.setValue("atrativoEmail", row.contact_email, { shouldDirty: true });
      }
      form.setValue("atrativoCategory", "musica", { shouldDirty: true });
    } else {
      form.setValue("atrativoName", row.name ?? "", { shouldDirty: true });
      form.setValue("atrativoType", row.tipo_atrativo || row.type || "", { shouldDirty: true });
      form.setValue(
        "atrativoStyle",
        Array.isArray(row.estilos) ? row.estilos.join(", ") : (row.style ?? ""),
        { shouldDirty: true },
      );
      form.setValue("atrativoDescription", (row.description ?? "").slice(0, 500), { shouldDirty: true });
      form.setValue(
        "atrativoContact",
        row.contact_whatsapp ? formatPhoneDisplay(row.contact_whatsapp) : "",
        { shouldDirty: true, shouldValidate: true },
      );
      const cat = (row.tipo_atrativo || row.type || "").toLowerCase();
      const foundCat = CATEGORIES.find((c) => c.value === cat);
      if (foundCat) {
        form.setValue("atrativoCategory", foundCat.value, { shouldDirty: true });
      }
    }
  };

  const criarNovoAtrativo = (nome: string) => {
    setNovoAtrativo(true);
    setSuggestions([]);
    form.setValue("atrativoName", nome, { shouldDirty: true, shouldValidate: true });
    form.setValue("atrativoSourceId", undefined);
    form.setValue("atrativoSourceType", undefined);
    form.setValue("atrativoLinkedName", undefined);
    form.setValue("atrativoLinkedAt", undefined);
    // Abre o modal já com o nome digitado — sem redigitar nada.
    setNovoAtrativoNome(nome);
    setNovoAtrativoOpen(true);
  };

  const linkSource = (id: string, kind: "artist" | "atrativo", row: any) => {
    setNovoAtrativo(false);
    applySnapshot(row, kind);
    form.setValue("atrativoSourceId", id, { shouldDirty: true });
    form.setValue("atrativoSourceType", kind, { shouldDirty: true });
    form.setValue("atrativoLinkedAt", new Date().toISOString(), { shouldDirty: true });
    form.setValue("atrativoLinkedName", row.name ?? "", { shouldDirty: true });
  };

  const unlinkSource = () => {
    form.setValue("atrativoSourceId", undefined, { shouldDirty: true });
    form.setValue("atrativoSourceType", undefined, { shouldDirty: true });
    form.setValue("atrativoLinkedAt", undefined, { shouldDirty: true });
    form.setValue("atrativoLinkedName", undefined, { shouldDirty: true });
    toast.success("Vínculo desfeito. Agora dá pra editar tudo à mão.");
  };

  const resyncFromSource = async () => {
    if (!sourceId || !sourceType) return;
    setResyncing(true);
    try {
      if (sourceType === "artist") {
        const { data, error } = await supabase
          .from("public_artist_profiles")
          .select("id, name, artist_type, genre, bio, whatsapp, contact_email")
          .eq("id", sourceId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          toast.error("Perfil do artista não está mais disponível.");
          return;
        }
        applySnapshot(data, "artist");
      } else {
        const { data, error } = await supabase
          .from("atrativos_public")
          .select("id, name, type, tipo_atrativo, style, estilos, description, contact_whatsapp")
          .eq("id", sourceId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          toast.error("Atrativo não está mais disponível.");
          return;
        }
        applySnapshot(data, "atrativo");
      }
      form.setValue("atrativoLinkedAt", new Date().toISOString(), { shouldDirty: true });
      toast.success("Rascunho atualizado com os dados atuais do perfil.");
    } catch (e: any) {
      toast.error(e?.message || "Não deu pra atualizar do perfil agora.");
    } finally {
      setResyncing(false);
    }
  };

  const searchTimer = useRef<number | null>(null);
  const searchSeq = useRef(0);
  const searchAbort = useRef<AbortController | null>(null);
  const searchCache = useRef(new Map<string, any[]>());

  // Se um atrativo for criado, editado, aprovado ou excluído em outra tela,
  // limpa o cache local para as sugestões virem fresquinhas do banco.
  useEffect(
    () =>
      onEntityCreated("atrativo", () => {
        searchCache.current.clear();
        setSuggestions([]);
      }),
    [],
  );

  /** Debounce + cache + cancelamento: evita disparar consulta a cada tecla. */
  const searchAtrativo = (query: string) => {
    const q = (query ?? "").trim().toLowerCase();
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    const cached = searchCache.current.get(q);
    if (cached) {
      setSuggestions(cached);
      return;
    }
    searchTimer.current = window.setTimeout(() => runSearch(q), q ? 150 : 0);
  };

  const runSearch = async (query: string) => {
    const q = (query ?? "").trim();
    const seq = ++searchSeq.current;
    searchAbort.current?.abort();
    const controller = new AbortController();
    searchAbort.current = controller;
    // Lista todos os atrativos cadastrados (aprovados ou não) para o
    // preenchimento; a função exige login e não devolve dados do responsável.
    const atrQuery = supabase
      .rpc("search_atrativos_autocomplete", {
        _q: q || null,
        _limit: q ? 10 : 20,
        _offset: 0,
      })
      .abortSignal(controller.signal);
    let artQuery = supabase
      .from("public_artist_profiles")
      .select("id, name, artist_type, genre, bio, whatsapp, contact_email, is_approved")
      .eq("is_approved", true)
      .order("name", { ascending: true })
      .limit(q ? 6 : 10)
      .abortSignal(controller.signal);
    if (q) {
      artQuery = artQuery.ilike("name", `%${q}%`);
    }
    let atrativosRes: any, artistsRes: any;
    try {
      [atrativosRes, artistsRes] = await Promise.all([atrQuery, artQuery]);
    } catch {
      return; // requisição cancelada
    }
    if (seq !== searchSeq.current) return; // resposta obsoleta

    const merged = [
      ...((atrativosRes.data ?? []).map((a: any) => ({
        __kind: "atrativo" as const,
        __id: a.id,
        row: a,
        display: { name: a.name, type: a.tipo_atrativo || a.type || "" },
      }))),
      ...((artistsRes.data ?? []).map((s: any) => ({
        __kind: "artist" as const,
        __id: s.id,
        row: s,
        display: { name: s.name, type: s.artist_type || "" },
      }))),
    ];
    searchCache.current.set(q.toLowerCase(), merged);
    setSuggestions(merged);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Music className="h-5 w-5" />
          Atrativo do Evento
        </h2>
        <p className="text-sm text-muted-foreground">Quem é a estrela do rolê?</p>
      </div>

      {/* 1. Nome do atrativo */}
      <div className="relative">
        <FormField
          control={form.control}
          name="atrativoName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do atrativo *</FormLabel>
              <FormControl>
                <AtrativoAutocomplete
                  value={field.value || ""}
                  onChange={(val) => {
                    if (!canEditAtrativo) return;
                    field.onChange(val);
                    if (sourceId && val !== linkedName) {
                      form.setValue("atrativoSourceId", undefined);
                      form.setValue("atrativoSourceType", undefined);
                      form.setValue("atrativoLinkedName", undefined);
                    }
                  }}
                  onSelect={(s) => {
                    if (!canEditAtrativo) return;
                    linkSource(s.id, s.tipo_atrativo === "Artista" || s.type === "Artista" ? "artist" : "atrativo", s);
                    toast.success(`Vinculado a "${s.name}". Os dados viram um snapshot do perfil.`);
                  }}
                  onCreateNew={undefined} // Cadastro direto desativado conforme novo requisito
                  placeholder={canEditAtrativo ? "Busque ou selecione um atrativo..." : "Atrativo fixado"}
                  selected={!!sourceId}
                  disabled={!canEditAtrativo}
                />
              </FormControl>
              {!isSuperUser && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {isExistingEvent 
                    ? "Após o envio, apenas administradores podem alterar o atrativo."
                    : "Selecione um atrativo da lista. Não é possível criar novos por aqui."}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {novoAtrativo && !sourceId && (
          <Badge variant="secondary" className="mt-2" data-testid="novo-atrativo-badge">
            Novo atrativo — preencha contato e categoria que a gente cadastra ao enviar
          </Badge>
        )}
        {sourceId && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
            <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold text-primary">
              Vinculado a {sourceType === "artist" ? "perfil de artista" : "atrativo"}: {linkedName}
            </span>
            {linkedAt && (
              <span className="text-muted-foreground">
                · snapshot de {new Date(linkedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
            <div className="ml-auto flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={resyncFromSource}
                disabled={resyncing}
              >
                <RefreshCw className={"h-3 w-3 mr-1 " + (resyncing ? "animate-spin" : "")} />
                Atualizar do perfil
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setConfirmUnlink(true)}
              >
                <Unlink className="h-3 w-3 mr-1" />
                Desvincular
              </Button>
            </div>
          </div>
        )}
        <AlertDialog open={confirmUnlink} onOpenChange={setConfirmUnlink}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desvincular esse atrativo?</AlertDialogTitle>
              <AlertDialogDescription>
                O rascunho fica solto pra você editar à mão. Os dados que já estão preenchidos continuam aí — mas o link com o perfil "{linkedName}" se perde e o botão "Atualizar do perfil" some. Dá pra vincular de novo depois buscando pelo nome.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Deixa como tá</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  unlinkSource();
                  setConfirmUnlink(false);
                }}
              >
                Desvincular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <p className="text-[11px] text-muted-foreground mt-1 flex items-start gap-1">
          <Lock className="h-3 w-3 mt-0.5 shrink-0" />
          O rascunho guarda um snapshot do perfil no momento do vínculo — mudanças posteriores no cadastro só entram se você clicar em "Atualizar do perfil".
        </p>
      </div>

      {/* 2. Contato do atrativo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="atrativoContact"
          render={({ field }) => {
            const v = validateBrazilianMobile(field.value);
            const showOk = field.value && v.valid;
            const showErr = field.value && !v.valid;
            return (
              <FormItem>
                <FormLabel>Celular / WhatsApp *</FormLabel>
                <FormControl>
                <Input
                  placeholder="(21) 99999-9999"
                  inputMode="tel"
                  maxLength={16}
                  className="h-12"
                  {...field}
                  name="tel"
                  autoComplete="tel"
                  id="tel"
                  onChange={(e) => field.onChange(formatPhoneDisplay(e.target.value))}
                  onBlur={() => {
                    field.onBlur();
                    form.trigger("atrativoContact");
                  }}
                />
                </FormControl>
                {showOk ? (
                  <p className="text-xs text-emerald-600">✓ Celular válido para receber WhatsApp.</p>
                ) : showErr && "reason" in v ? (
                  <p className="text-xs text-destructive">{v.reason}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">DDD + 9 + 8 dígitos.</p>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name="atrativoEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail (opcional)</FormLabel>
              <FormControl>
              <Input
                type="email"
                placeholder="contato@exemplo.com"
                className="h-12"
                {...field}
                name="email"
                autoComplete="email"
                id="email"
              />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 3. Categoria */}
      <FormField
        control={form.control}
        name="atrativoCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-12 bg-background border-input">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(() => {
              const age = form.watch("ageRating") || "Livre";
              const cat = field.value;
              if (!cat) return null;
              const label = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
              return (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                    Categoria: {label}
                  </span>
                  <span
                    className={
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold " +
                      (age === "Livre"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400")
                    }
                  >
                    Classificação: {age}
                  </span>
                </div>
              );
            })()}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Separador de opcionais */}
      <div className="pt-2">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Campos opcionais
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Preencha se quiser dar mais contexto sobre o atrativo. Pode pular sem problema.
        </p>
      </div>

      {/* 4. Tipo / Estilo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="atrativoType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: DJ, banda, guia, palestrante" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="atrativoStyle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estilo / Gênero</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Sertanejo, Rock, Tech House" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* 5. Descrição */}
      <FormField
        control={form.control}
        name="atrativoDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Descrição do atrativo
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Conte um pouco sobre o trabalho do artista ou o atrativo..."
                className="min-h-[100px] resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <EventPreview form={form} variant="atrativo" />

      <AutofillIssues
        issues={issues}
        okMessage="Atrativo conferido — WhatsApp, e-mail e categoria estão ok."
      />

      <NovoAtrativoDialog
        open={novoAtrativoOpen}
        onOpenChange={setNovoAtrativoOpen}
        initialName={novoAtrativoNome}
        onCreated={(a) => {
          linkSource(a.id, "atrativo", a);
          setSuggestions([]);
        }}
      />
    </div>
  );
}