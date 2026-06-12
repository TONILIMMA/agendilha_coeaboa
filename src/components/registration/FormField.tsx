import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Base {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  hint?: string;
  inputMode?: "text" | "numeric" | "tel" | "email" | "url";
  maxLength?: number;
}

export function FormField({
  id,
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
  hint,
  inputMode,
  maxLength,
}: Base) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-semibold">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className={cn("h-12 text-base", error && "border-destructive")}
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function FormTextarea({
  id,
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
  hint,
  rows = 4,
  maxLength,
}: Base & { rows?: number }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-semibold">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={cn("text-base", error && "border-destructive")}
      />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}