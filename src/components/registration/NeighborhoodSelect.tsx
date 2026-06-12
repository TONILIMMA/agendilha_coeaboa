import { BAIRROS, PLACEHOLDER_BAIRRO } from "@/lib/neighborhoods";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  id?: string;
}

export function NeighborhoodSelect({
  value,
  onChange,
  label = "Bairro",
  required = true,
  error,
  id = "bairro",
}: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-semibold">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-12 text-base">
          <SelectValue placeholder={PLACEHOLDER_BAIRRO} />
        </SelectTrigger>
        <SelectContent>
          {BAIRROS.map((b) => (
            <SelectItem key={b} value={b} className="text-base py-3">
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}