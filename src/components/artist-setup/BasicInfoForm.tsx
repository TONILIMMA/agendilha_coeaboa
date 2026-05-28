import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";

const NEIGHBORHOODS = [
  "Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia",
  "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras",
  "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"
].sort();

interface BasicInfoFormProps {
  form: UseFormReturn<any>;
}

export function BasicInfoForm({ form }: BasicInfoFormProps) {
  const { register, watch, setValue } = form;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider">Nome Artístico / Banda *</Label>
          <Input 
            id="name" 
            {...register("name")} 
            placeholder="Ex: Banda do Porto"
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre" className="text-xs font-bold uppercase tracking-wider">Gênero Principal *</Label>
          <Input 
            id="genre" 
            {...register("genre")} 
            placeholder="Ex: Samba, Rock, MPB..."
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider">Bairro *</Label>
          <Select value={watch("neighborhood")} onValueChange={v => setValue("neighborhood", v)}>
            <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="member_count" className="text-xs font-bold uppercase tracking-wider">Integrantes</Label>
          <Input 
            id="member_count"
            type="number" 
            min="1" 
            {...register("member_count")} 
            className="h-12 bg-muted/30 border-none rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase tracking-wider">Tipo *</Label>
          <Select value={watch("artist_type")} onValueChange={v => setValue("artist_type", v)}>
            <SelectTrigger className="h-12 bg-muted/30 border-none rounded-xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cover</SelectItem>
              <SelectItem value="autoral">Autoral</SelectItem>
              <SelectItem value="both">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}