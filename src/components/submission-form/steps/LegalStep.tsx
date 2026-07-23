import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Scale, Info, MessageCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/routes/config";
import { useEffect, useRef } from "react";
import { formatPhoneDisplay } from "@/lib/whatsapp";

export function LegalStep({ form }: { form: UseFormReturn<any> }) {
  const promotorName = form.watch("nickName") || form.watch("companyName");
  const atrativoName = form.watch("atrativoName");
  const locationName = form.watch("locationName");
  const duvidasSource = form.watch("duvidasSource") || "promotor";
  const promotorPhone = form.watch("basicPhone");
  const atrativoContact = form.watch("atrativoContact");
  const locationContact = form.watch("locationContact");
  const lastAutoRef = useRef<string>("");

  // Auto-preenche o número quando muda a fonte selecionada, respeitando edição manual do usuário.
  useEffect(() => {
    const currentPhone = form.getValues("duvidasWhatsapp") || "";
    const suggested =
      duvidasSource === "atrativo"
        ? atrativoContact
        : duvidasSource === "estabelecimento"
        ? locationContact
        : promotorPhone;
    // Se o campo está vazio ou ainda contém a sugestão anterior automática, atualiza.
    if (!currentPhone || currentPhone === lastAutoRef.current) {
      const next = suggested || "";
      lastAutoRef.current = next;
      form.setValue("duvidasWhatsapp", next, { shouldValidate: true, shouldDirty: false });
    }
  }, [duvidasSource, promotorPhone, atrativoContact, locationContact, form]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Scale className="h-5 w-5" />
          Termos e Responsabilidade
        </h2>
        <p className="text-sm text-muted-foreground">Leia com atenção antes de finalizar.</p>
      </div>

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

      <FormField
        control={form.control}
        name="duvidasSource"
        render={({ field }) => (
          <FormItem className="rounded-md border p-4 space-y-3">
            <FormLabel className="flex items-center gap-2 text-primary font-bold">
              <MessageCircle className="h-4 w-4" />
              Quem responde dúvidas sobre este evento?
            </FormLabel>
            <p className="text-xs text-muted-foreground">
              Quando alguém clicar em <strong>“Tirar dúvidas”</strong> na página do evento, vai cair no WhatsApp da opção escolhida.
            </p>
            <FormControl>
              <RadioGroup
                value={field.value || "promotor"}
                onValueChange={field.onChange}
                className="grid gap-2"
              >
                <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                  <RadioGroupItem value="promotor" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Promotor</div>
                    <div className="text-xs text-muted-foreground">
                      {promotorName || "Você (definido na Etapa 1)"}
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                  <RadioGroupItem value="atrativo" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Atrativo</div>
                    <div className="text-xs text-muted-foreground">
                      {atrativoName || "Contato do atrativo (Etapa 4)"}
                    </div>
                  </div>
                </label>
                <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                  <RadioGroupItem value="estabelecimento" className="mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Estabelecimento</div>
                    <div className="text-xs text-muted-foreground">
                      {locationName || "Contato do local (Etapa 5)"}
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="duvidasWhatsapp"
        render={({ field }) => (
          <FormItem>
            <FormLabel>WhatsApp do responsável pelas informações</FormLabel>
            <FormControl>
              <Input
                inputMode="tel"
                placeholder="(21) 9XXXX-XXXX – número que receberá dúvidas sobre o evento"
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(formatPhoneDisplay(e.target.value));
                }}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">
              É esse número que vai receber as dúvidas do público via WhatsApp.
              {duvidasSource === "promotor" && " Pré-preenchido com seu contato — pode trocar se quiser usar outro."}
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="duvidasAuthorized"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="cursor-pointer">
                Declaro que tenho autorização para utilizar este número de WhatsApp como contato oficial para dúvidas sobre este evento.
              </FormLabel>
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
    </div>
  );
}
