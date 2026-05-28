import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon, PartyPopper } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const categories = [
  { value: "musica", label: "Música / Show" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultura", label: "Cultura / Arte" },
  { value: "esporte", label: "Esporte" },
  { value: "outros", label: "Outros" },
];

export function EventStep({ form }: { form: UseFormReturn<any> }) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <PartyPopper className="h-5 w-5" />
          Sobre o Evento
        </h2>
        <p className="text-sm text-muted-foreground">O que vai acontecer e quando?</p>
      </div>

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoria</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="eventTitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome do Evento (opcional)</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Festival de Inverno" className="h-12" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="mb-1.5">Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "h-12 pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP", { locale: ptBR })
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
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário de Início</FormLabel>
              <FormControl>
                <Input type="time" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="predictedDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duração Prevista (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 2 horas, 4h" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário de Término (opcional)</FormLabel>
              <FormControl>
                <Input type="time" className="h-12" {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-[10px] text-muted-foreground italic">Sem término definido se vazio</p>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="ageRating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Classificação</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Livre">Livre</SelectItem>
                <SelectItem value="14+">14+</SelectItem>
                <SelectItem value="16+">16+</SelectItem>
                <SelectItem value="18+">18+</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
