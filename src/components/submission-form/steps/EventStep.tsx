import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon, PartyPopper, ShieldAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EventPreview } from "../EventPreview";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function EventStep({ form }: { form: UseFormReturn<any> }) {
  const [pendingRating, setPendingRating] = useState<string | null>(null);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <PartyPopper className="h-5 w-5" />
          Sobre o Evento
        </h2>
        <p className="text-sm text-muted-foreground">Quando vai rolar e pra quem?</p>
      </div>

      {/* 1. Data do evento (com dia da semana na divulgação) */}
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => {
          const selected = field.value ? new Date(field.value) : undefined;
          return (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-1.5">Data do evento *</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-12 pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {selected ? (
                        format(selected, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              {selected && (
                <p className="text-xs text-muted-foreground capitalize">
                  Vai na divulgação como: {format(selected, "EEEE, dd/MM", { locale: ptBR })}
                </p>
              )}
              <FormMessage />
            </FormItem>
          );
        }}
      />

      {/* 2. Horário de início */}
      <FormField
        control={form.control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horário de início *</FormLabel>
            <FormControl>
              <SuggestInput
                type="time"
                className="h-12"
                suggestFrom="public_submissions"
                suggestColumn="start_time"
                normalizeOption={(v) => v.slice(0, 5)}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 3. Classificação (Livre pré-marcado) */}
      <FormField
        control={form.control}
        name="ageRating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Classificação *</FormLabel>
            <Select
              value={field.value || "Livre"}
              defaultValue="Livre"
              onValueChange={(next) => {
                // Regra: mantém "Livre" automaticamente quando o evento é pra todo mundo.
                // Se o usuário tentar mudar, pede confirmação antes.
                const current = field.value || "Livre";
                if (current === "Livre" && next !== "Livre") {
                  setPendingRating(next);
                  return;
                }
                field.onChange(next);
                form.setValue("isSuitableForMinors", next === "Livre", { shouldDirty: true });
              }}
            >
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Livre">Livre</SelectItem>
                <SelectItem value="10+">10+</SelectItem>
                <SelectItem value="12+">12+</SelectItem>
                <SelectItem value="14+">14+</SelectItem>
                <SelectItem value="16+">16+</SelectItem>
                <SelectItem value="18+">18+</SelectItem>
              </SelectContent>
            </Select>
            {(field.value || "Livre") === "Livre" ? (
              <p className="text-[11px] text-muted-foreground">
                Pré-selecionado como <strong>Livre</strong> — evento pra todo mundo. Só mude se tiver restrição de idade.
              </p>
            ) : (
              <p className="text-[11px] text-amber-600 dark:text-amber-500 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                Você mudou pra {field.value}. Só menores de idade acompanhados vão poder entrar.
              </p>
            )}
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
          Preencha se quiser deixar a divulgação mais completa. Pode pular sem problema.
        </p>
      </div>

      {/* 4. Nome do evento (opcional) */}
      <FormField
        control={form.control}
        name="eventTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do evento</FormLabel>
            <FormControl>
              <SuggestInput
                placeholder="Ex: Festival de Inverno"
                className="h-12"
                suggestFrom="public_submissions"
                suggestColumn="event_title"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* 5. Horário previsto para término (opcional) */}
      <FormField
        control={form.control}
        name="endTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Horário previsto para término</FormLabel>
            <FormControl>
              <SuggestInput
                type="time"
                className="h-12"
                suggestFrom="public_submissions"
                suggestColumn="end_time"
                normalizeOption={(v) => v.slice(0, 5)}
                {...field}
              />
            </FormControl>
            <p className="text-[11px] text-muted-foreground italic">
              Sem término definido se ficar vazio.
            </p>
            <FormMessage />
          </FormItem>
        )}
      />

      <EventPreview form={form} variant="event" />

      <AlertDialog open={pendingRating !== null} onOpenChange={(o) => !o && setPendingRating(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Trocar a classificação?
            </AlertDialogTitle>
            <AlertDialogDescription>
              A classificação tá marcada como <strong>Livre</strong> — assim entra todo mundo.
              Se mudar pra <strong>{pendingRating}</strong>, o evento vai aparecer com restrição de idade
              e pode limitar o público. Tem certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter Livre</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingRating) {
                  form.setValue("ageRating", pendingRating as any, { shouldDirty: true, shouldValidate: true });
                  form.setValue("isSuitableForMinors", false, { shouldDirty: true });
                }
                setPendingRating(null);
              }}
            >
              Sim, mudar pra {pendingRating}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}