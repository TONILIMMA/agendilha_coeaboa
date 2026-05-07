import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Rule {
  label: string;
  test: (pwd: string) => boolean;
}

const rules: Rule[] = [
  { label: "Mínimo de 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Letra maiúscula (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Letra minúscula (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "Número (0-9)", test: (p) => /\d/.test(p) },
  { label: "Símbolo (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const COMMON_WEAK = [
  "123456", "12345678", "123456789", "senha", "password",
  "qwerty", "abc123", "111111", "000000", "123123",
];

export function calculatePasswordScore(password: string): number {
  if (!password) return 0;
  let score = rules.filter((r) => r.test(password)).length;
  if (password.length >= 12) score += 1;
  if (COMMON_WEAK.some((w) => password.toLowerCase().includes(w))) {
    score = Math.min(score, 1);
  }
  return Math.min(score, 5);
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const score = calculatePasswordScore(password);
  const isCommon =
    password.length > 0 &&
    COMMON_WEAK.some((w) => password.toLowerCase().includes(w));

  const getStrength = () => {
    if (score <= 2) return { label: "Fraca", color: "bg-destructive", text: "text-destructive" };
    if (score <= 4) return { label: "Média", color: "bg-yellow-500", text: "text-yellow-600" };
    return { label: "Forte", color: "bg-green-500", text: "text-green-600" };
  };

  const strength = getStrength();
  const segments = 5;
  const filledSegments = score;

  if (!password) return null;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: segments }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < filledSegments ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-semibold whitespace-nowrap", strength.text)}>
          {strength.label}
        </span>
      </div>

      {isCommon && (
        <p className="text-xs text-destructive">
          ⚠️ Esta senha é muito comum e fácil de adivinhar.
        </p>
      )}

      <ul className="space-y-1 pt-1">
        {rules.map((rule) => {
          const passed = rule.test(password);
          return (
            <li
              key={rule.label}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3 w-3 shrink-0" />
              ) : (
                <X className="h-3 w-3 shrink-0" />
              )}
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
