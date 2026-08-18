import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Scale, Info, MessageCircle, ExternalLink, Lock, MessageSquare, AlertTriangle, Send, User } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/config";
import { useEffect, useRef, useState } from "react";
import { formatPhoneDisplay, validateBrazilianMobile, buildWhatsappUrl } from "@/lib/whatsapp";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MyChangeRequestsList } from "@/components/change-requests/MyChangeRequestsList";
import { PromotorAutocomplete } from "@/components/promotor/PromotorAutocomplete";

export function LegalStep({ form, isPublished = false, submissionId }: { form: UseFormReturn<any>; isPublished?: boolean; submissionId?: string }) {
  const { user } = useAuth();
  const nickName = form.watch("nickName") || "";
  const basicPhone = form.watch("basicPhone") || "";
  const responsavelNome = form.watch("responsavelNome") || "";
  const usarMeuWhatsapp = form.watch("usarMeuWhatsapp");
  const duvidasWhatsapp = form.watch("duvidasWhatsapp") || "";
  const tipoResponsavel = form.watch("tipoResponsavel") || "";
  const eventTitle = form.watch("eventTitle") || "";
  const [changeReqOpen, setChangeReqOpen] = useState(false);
  const [changeReqReason, setChangeReqReason] = useState("");
  const [changeReqNewPhone, setChangeReqNewPhone] = useState("");
  const [changeReqRevoke, setChangeReqRevoke] = useState(false);
  const [changeReqSaving, setChangeReqSaving] = useState(false);
  const [changeReqRefresh, setChangeReqRefresh] = useState(0);

  // Sincroniza o WhatsApp e o nome do responsável com base nas regras condicionais
  useEffect(() => {
    if (isPublished) return;

    // Se tipoResponsavel não for "outro", o campo duvidasWhatsapp deve refletir o valor associado
    // Porém, o preenchimento automático acontece via onSelect no Autocomplete ou quando 
    // trocamos de "outro" para algo mapeado.
    
    if (tipoResponsavel === "outro") {
      // Quando muda para "outro", limpamos se veio de um valor bloqueado anterior
      // (a regra diz: "não reutilizar automaticamente o número anterior; o campo deve ficar vazio")
      // Mas só fazemos isso UMA VEZ na transição para evitar apagar o que o usuário está digitando.
    }
  }, [tipoResponsavel, isPublished, form]);

  // Efeito para garantir que se o usuário mudar de "Outro" para um tipo específico, 
  // e tivermos os dados do perfil, a gente restaura.
  useEffect(() => {
    if (isPublished || tipoResponsavel === "outro") return;
    
    // Se o usuário selecionou algo que não é "outro", e o campo duvidasWhatsappOutro tinha valor,
    // podemos decidir se limpamos ou se apenas bloqueamos.
    // A regra diz: "substituir imediatamente o valor digitado manualmente pelo WhatsApp da pessoa selecionada."
    // Como a "pessoa selecionada" é controlada pelo responsavelNome e PromotorAutocomplete, 
    // a lógica principal deve residir na interação desses campos.
  }, [tipoResponsavel, isPublished, form]);

  // Pré-preenche o nome do responsável com o nome do cadastro, mas mantém editável.
  useEffect(() => {
    if (isPublished) return;
    if (!responsavelNome && nickName) {
      form.setValue("responsavelNome", nickName, { shouldDirty: false });
    }
  }, [nickName, responsavelNome, isPublished, form]);

  const phoneValidation = validateBrazilianMobile(duvidasWhatsapp);
  const previewMessage = eventTitle
    ? `Oi! Vi o rolê "${eventTitle}" no AgendIlha e queria tirar uma dúvida.`
    : `Oi! Vi um rolê no AgendIlha e queria tirar uma dúvida.`;
  const previewUrl = phoneValidation.valid ? buildWhatsappUrl(duvidasWhatsapp, previewMessage) : null;

  const lockedTooltip =
    "Travado porque o evento já foi publicado. Use “Solicitar alteração” pra pedir mudança à moderação.";

  const openChangeRequest = () => {
    setChangeReqReason("");
    setChangeReqNewPhone(duvidasWhatsapp);
    setChangeReqRevoke(false);
    setChangeReqOpen(true);
  };

  const submitChangeRequest = async () => {
    if (!changeReqReason.trim()) {
      toast.error("Explica rapidinho o que precisa mudar.");
      return;
    }
    const newPhoneValidation = changeReqNewPhone
      ? validateBrazilianMobile(changeReqNewPhone)
      : null;
    if (changeReqNewPhone && newPhoneValidation && newPhoneValidation.valid === false) {
      toast.error(newPhoneValidation.reason);
      return;
    }
    if (!submissionId || !user?.id) {
      toast.error("Não consegui identificar o evento. Recarregue a página e tente de novo.");
      return;
    }
    const wantsPhone = !!(changeReqNewPhone && newPhoneValidation?.valid);
    const request_type = wantsPhone && changeReqRevoke ? "both" : changeReqRevoke ? "authorization" : "whatsapp";
    setChangeReqSaving(true);
    const { error } = await (supabase as any).from("submission_change_requests").insert({
      submission_id: submissionId,
      requested_by: user.id,
      request_type,
      current_whatsapp: duvidasWhatsapp || null,
      proposed_whatsapp: wantsPhone ? newPhoneValidation!.display : null,
      revoke_authorization: changeReqRevoke,
      reason: changeReqReason.trim(),
    });
    setChangeReqSaving(false);
    if (error) {
      toast.error("Não deu pra enviar sua solicitação. Tenta de novo.");
      return;
    }
    toast.success("Solicitação enviada! A moderação já foi notificada.");
    setChangeReqOpen(false);
    setChangeReqRefresh((n) => n + 1);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Termos e Responsabilidade
        </h2>
        <p className="text-sm text-muted-foreground">Leia com atenção antes de finalizar.</p>
      </div>

      {isPublished && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <strong>Evento publicado.</strong> O WhatsApp do responsável e o checkbox de autorização ficam
              travados pra garantir que quem clicar em “Tirar dúvidas” continue caindo no número certo.
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-500/60"
            onClick={openChangeRequest}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Solicitar alteração à moderação
          </Button>
        </div>
      )}

      <div className="p-4 bg-muted/50 rounded-lg border border-muted space-y-3 text-sm text-muted-foreground">
        <div className="flex gap-2 text-primary font-bold">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Combinado antes de mandar</span>
        </div>
        <p>1. Você garante que as informações do rolê são verdadeiras.</p>
        <p>2. A gente dá uma olhada rápida antes de publicar no AgendIlha.</p>
        <p>3. Se rolar algo impróprio ou falso, tiramos do ar.</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link
          to={ROUTES.TERMOS}
          target="_blank"
          className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Termos de Uso <ExternalLink className="h-3 w-3" />
        </Link>
        <Link
          to={ROUTES.PRIVACIDADE}
          target="_blank"
          className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Política de Privacidade <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/*
        Seção "Responsável pelo evento" (Fase 7 – novo modelo).
        - responsavelNome vem do cadastro base (nickName), mas é editável.
        - usarMeuWhatsapp true → duvidasWhatsapp espelha basicPhone (só leitura).
        - usarMeuWhatsapp false → duvidasWhatsapp fica editável e obrigatório.
        - tipoResponsavel + campos de perfil são opcionais e reaproveitados.
      */}
      <div className="rounded-md border p-4 space-y-4">
        <div className="flex items-start gap-2 text-primary font-bold text-sm">
          <Lock className="h-4 w-4 mt-0.5" />
          <div>
            <div>Responsável pela divulgação</div>
            <p className="text-xs font-normal text-muted-foreground mt-1">
              Os dados de divulgação foram vinculados automaticamente ao seu perfil.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="responsavelNome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsável pela divulgação *</FormLabel>
              <FormControl>
                <PromotorAutocomplete
                  value={field.value ?? ""}
                  onChange={(val) => {
                    field.onChange(val);
                    // Se o usuário está digitando manualmente o nome e não é "Outro",
                    // ainda permitimos, mas o WhatsApp continuará bloqueado até que ele escolha "Outro"
                    // ou selecione alguém da lista que preencha o Zap.
                  }}
                  disabled={isPublished}
                  onSelect={(p) => {
                    field.onChange(p.nome);
                    if (p.whatsapp && tipoResponsavel !== "outro") {
                      const formatted = formatPhoneDisplay(p.whatsapp);
                      form.setValue("duvidasWhatsapp", formatted, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                    if (p.tipo) {
                      form.setValue("tipoResponsavel", p.tipo, { shouldDirty: true });
                    }
                  }}
                  placeholder="Como quer aparecer na divulgação?"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      {/* Removendo a opção Usar o mesmo WhatsApp conforme solicitado */}
      </div>

      <FormField
        control={form.control}
        name="duvidasWhatsapp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>WhatsApp para dúvidas *</FormLabel>
            <FormControl>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Input
                        inputMode="tel"
                        name="tel"
                        autoComplete="tel"
                        placeholder="(21) 9XXXX-XXXX – WhatsApp que vai receber dúvidas"
                        value={field.value || ""}
                        readOnly={tipoResponsavel !== "outro" || isPublished}
                        aria-readonly={tipoResponsavel !== "outro" || isPublished}
                        aria-describedby={(isPublished || tipoResponsavel !== "outro") ? "duvidas-whatsapp-lock" : undefined}
                        className={(isPublished || tipoResponsavel !== "outro") ? "pr-9 bg-muted/60 cursor-not-allowed" : undefined}
                        onChange={(e) => {
                          if (tipoResponsavel !== "outro") return;
                          // Máscara de telefone em tempo real
                          const rawValue = e.target.value.replace(/\D/g, "");
                          if (rawValue.length <= 11) {
                            field.onChange(formatPhoneDisplay(e.target.value));
                          }
                        }}
                      />
                      {(isPublished || tipoResponsavel !== "outro") && (
                        <Lock
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                          aria-hidden
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  {(isPublished || tipoResponsavel !== "outro") && (
                    <TooltipContent id="duvidas-whatsapp-lock" side="top">
                      {isPublished ? lockedTooltip : "Este campo é preenchido automaticamente. Para editar manualmente, selecione 'Outro' em 'Quem responde pelo evento'."}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </FormControl>
            {isPublished && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                onClick={openChangeRequest}
              >
                Solicitar alteração deste WhatsApp
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              Digite o WhatsApp de quem vai responder às dúvidas sobre esse evento.
            </p>

            {/* Pré-visualização do link do WhatsApp */}
            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium text-primary">
                <MessageSquare className="h-3.5 w-3.5" />
                Pré-visualização do link
              </div>
              {previewUrl && phoneValidation.valid ? (
                <>
                  <p className="text-muted-foreground">
                    Confere o número antes de avançar. Ao clicar em <strong>“Tirar dúvidas”</strong> na página do evento,
                    o público vai cair aqui:
                  </p>
                  <div className="rounded bg-background border p-2 font-mono text-[11px] break-all">
                    {phoneValidation.display} · +{phoneValidation.e164}
                  </div>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Testar no WhatsApp <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Informe um celular válido (DDD + 9 + 8 dígitos) pra ver a prévia do link.
                </p>
              )}
            </div>

            <FormMessage />
          </FormItem>
        )}
      />

      {/*
        Caracterização opcional do responsável — reaproveitada em divulgações futuras
        (persistida em submissions.responsavel_tipo + responsavel_perfil).
      */}
      <FormField
        control={form.control}
        name="tipoResponsavel"
        render={({ field }) => (
          <FormItem className="rounded-md border p-4 space-y-3">
            <FormLabel className="flex items-center gap-2 text-primary font-bold">
              <MessageCircle className="h-4 w-4" />
              Quem responde pelo evento? <span className="text-[10px] font-normal text-muted-foreground">(opcional)</span>
            </FormLabel>
            <p className="text-xs text-muted-foreground">
              A opção selecionada define quem receberá as dúvidas do público.
            </p>
            <FormControl>
              <RadioGroup
                value={field.value || ""}
                onValueChange={(val) => {
                  const previousVal = field.value;
                  field.onChange(val);
                  
                  if (val === "outro") {
                    // Ao selecionar “Outro”, não reutilizar automaticamente o número anterior; o campo deve ficar vazio
                    form.setValue("duvidasWhatsapp", "", { shouldValidate: true });
                  } else if (previousVal === "outro") {
                    // Se o usuário trocar de “Outro” para uma pessoa cadastrada, 
                    // substituir imediatamente o valor digitado manualmente pelo WhatsApp da pessoa selecionada.
                    // Tentamos buscar se o responsavelNome atual corresponde a alguém que já conhecemos ou se é o próprio usuário
                    if (responsavelNome === nickName && basicPhone) {
                      form.setValue("duvidasWhatsapp", formatPhoneDisplay(basicPhone), { shouldValidate: true });
                    } else {
                      // Se não for o próprio usuário, e ele apenas trocou o tipo, 
                      // o Autocomplete cuidará de preencher se ele selecionar alguém.
                      // Por enquanto, apenas limpamos para forçar a seleção/definição correta ou mantemos o que estava bloqueado.
                    }
                  }
                }}
                className="grid gap-2 sm:grid-cols-2"
              >
                {[
                  { v: "artista", l: "Artista / Músico" },
                  { v: "estabelecimento", l: "Local/Estabelecimento" },
                  { v: "produtor", l: "Produtor / Organizador" },
                  { v: "outro", l: "Outro" },
                ].map((opt) => (
                  <label key={opt.v} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/40 text-sm">
                    <RadioGroupItem value={opt.v} />
                    <span>{opt.l}</span>
                  </label>
                ))}
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Removido o campo duplicado duvidasWhatsappOutro, pois agora usamos o campo principal duvidasWhatsapp */}

      {tipoResponsavel === "artista" && (
        <div className="rounded-md border p-4 space-y-3">
          <div className="text-xs text-muted-foreground">Perfil de artista (opcional — usado nas próximas divulgações).</div>
          <FormField control={form.control} name="perfilNomeArtistico" render={({ field }) => (
            <FormItem><FormLabel>Nome artístico</FormLabel><FormControl><Input {...field} placeholder="Nome que aparece nos flyers" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="perfilEstiloMusical" render={({ field }) => (
            <FormItem><FormLabel>Estilo musical</FormLabel><FormControl><Input {...field} placeholder="Samba, MPB, Rock…" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="perfilLinkPrincipal" render={({ field }) => (
            <FormItem><FormLabel>Link principal</FormLabel><FormControl><Input {...field} placeholder="Instagram, Spotify, YouTube…" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      )}

      {tipoResponsavel === "estabelecimento" && (
        <div className="rounded-md border p-4 space-y-3">
          <div className="text-xs text-muted-foreground">Perfil do estabelecimento (opcional).</div>
          <FormField control={form.control} name="perfilNomeEstabelecimento" render={({ field }) => (
            <FormItem><FormLabel>Nome do estabelecimento</FormLabel><FormControl><Input {...field} placeholder="Ex.: Bar do Zé" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="perfilCategoriaLocal" render={({ field }) => (
            <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input {...field} placeholder="Bar, restaurante, casa de show…" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="perfilEnderecoResumido" render={({ field }) => (
            <FormItem><FormLabel>Endereço resumido</FormLabel><FormControl><Input {...field} placeholder="Rua e bairro" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      )}

      <FormField
        control={form.control}
        name="duvidasAuthorized"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Checkbox
                        checked={field.value}
                        disabled={isPublished}
                        aria-readonly={isPublished}
                        aria-describedby={isPublished ? "duvidas-auth-lock" : undefined}
                        onCheckedChange={(v) => {
                          if (isPublished) return;
                          field.onChange(v);
                        }}
                      />
                    </span>
                  </TooltipTrigger>
                  {isPublished && (
                    <TooltipContent id="duvidas-auth-lock" side="top">
                      {lockedTooltip}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className={isPublished ? "flex items-center gap-1" : "cursor-pointer"}>
                {isPublished && <Lock className="h-3 w-3" />}
                Declaro que tenho autorização para utilizar este número de WhatsApp como contato oficial para dúvidas sobre este evento.
              </FormLabel>
              {isPublished && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-primary"
                  onClick={openChangeRequest}
                >
                  Solicitar revogação/alteração
                </Button>
              )}
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="legalAcceptance"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                Declaro que as informações deste evento são verdadeiras e que estou ciente das regras de divulgação do AgendIlha.
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <Dialog open={changeReqOpen} onOpenChange={setChangeReqOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Solicitar alteração à moderação
            </DialogTitle>
            <DialogDescription>
              Como o evento já está publicado, a mudança precisa passar pela moderação. A equipe recebe uma notificação
              na hora e você acompanha o status aqui embaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Novo WhatsApp (opcional)</label>
              <Input
                inputMode="tel"
                placeholder="(21) 9XXXX-XXXX"
                value={changeReqNewPhone}
                onChange={(e) => setChangeReqNewPhone(formatPhoneDisplay(e.target.value))}
              />
            </div>
            <label className="flex items-start gap-2 rounded-md border p-2 text-xs cursor-pointer">
              <Checkbox
                checked={changeReqRevoke}
                onCheckedChange={(v) => setChangeReqRevoke(v === true)}
              />
              <span>Também quero revogar a autorização de usar este WhatsApp como contato oficial.</span>
            </label>
            <div className="space-y-1">
              <label className="text-xs font-medium">Motivo da alteração</label>
              <Textarea
                rows={4}
                placeholder="Ex.: o número certo é outro, quero revogar a autorização, etc."
                value={changeReqReason}
                onChange={(e) => setChangeReqReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeReqOpen(false)}>Cancelar</Button>
            <Button onClick={submitChangeRequest} disabled={changeReqSaving} className="gap-1">
              <Send className="h-4 w-4" /> {changeReqSaving ? "Enviando…" : "Enviar solicitação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPublished && submissionId && (
        <div className="rounded-md border p-4 space-y-2">
          <MyChangeRequestsList submissionId={submissionId} refreshKey={changeReqRefresh} />
        </div>
      )}
    </div>
  );
}
