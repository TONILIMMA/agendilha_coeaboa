import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2, Phone, MapPin, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const NEIGHBORHOODS = [
  "Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia",
  "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras",
  "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"
].sort();

const MUSICAL_INTERESTS = [
  { id: "samba", label: "Samba & Pagode" },
  { id: "rock", label: "Rock" },
  { id: "mpb", label: "MPB" },
  { id: "pop", label: "Pop" },
  { id: "funk", label: "Funk" },
  { id: "eletronico", label: "Eletrônico" },
  { id: "sertanejo", label: "Sertanejo" },
  { id: "jazz", label: "Jazz & Blues" }
];

const EVENT_TYPES = [
  { id: "show", label: "Shows" },
  { id: "teatro", label: "Teatro" },
  { id: "gastronomia", label: "Gastronomia" },
  { id: "feira", label: "Feiras" },
  { id: "esporte", label: "Esportes" },
  { id: "infantil", label: "Infantil" }
];

export default function Auth() {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [workNeighborhood, setWorkNeighborhood] = useState("");
  const [musicalInterests, setMusicalInterests] = useState<string[]>([]);
  const [eventTypeInterests, setEventTypeInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to={redirect} replace />;

  function formatPhoneDisplay(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length <= 11) {
      setPhone(formatPhoneDisplay(digits));
    }
  }

  function isValidPhone(value: string) {
    const digits = value.replace(/\D/g, "");
    return /^\d{2}9\d{8}$/.test(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "signup" && name.trim().length < 3) {
      toast.error("Nome inválido", {
        description: "Por favor, insira seu nome completo.",
      });
      return;
    }

    if (!isValidPhone(phone)) {
      toast.error("Número inválido", {
        description: "Por favor, insira um número de WhatsApp válido com DDD. Exemplo: (21) 98765-4321",
      });
      return;
    }

    setSubmitting(true);

    const { error } = mode === "login"
      ? await signIn(phone, password)
      : await signUp(phone, password, name.trim(), {
          home_location: homeLocation,
          work_neighborhood: workNeighborhood,
          musical_preferences: musicalInterests,
          event_type_preferences: eventTypeInterests
        });

    setSubmitting(false);

    if (error) {
      toast.error(mode === "login" ? "Erro ao entrar" : "Erro ao criar conta", {
        description: error.message,
      });
    } else if (mode === "signup") {
      toast.success("Conta criada!", {
        description: "Você já pode fazer login com seu WhatsApp.",
      });
      setMode("login");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl bg-card shadow-elevated p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            📌 AgendIlha
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-[280px] mx-auto">
            {mode === "login" 
              ? "Use seu WhatsApp para entrar na sua conta." 
              : "Cadastre-se para receber novidades de shows e eventos da Ilha."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-4 border-b border-border pb-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Digite seu nome completo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Onde mora?
                  </Label>
                  <Select value={homeLocation} onValueChange={setHomeLocation}>
                    <SelectTrigger className="bg-muted/30 border-none">
                      <SelectValue placeholder="Bairro" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Onde trabalha?
                  </Label>
                  <Select value={workNeighborhood} onValueChange={setWorkNeighborhood}>
                    <SelectTrigger className="bg-muted/30 border-none">
                      <SelectValue placeholder="Bairro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outros">Fora da Ilha / Home Office</SelectItem>
                      {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" /> Estilos Musicais
                </Label>
                <div className="flex flex-wrap gap-2">
                  {MUSICAL_INTERESTS.map(style => (
                    <Badge
                      key={style.id}
                      variant="outline"
                      className={cn(
                        "cursor-pointer px-3 py-1 rounded-full transition-all",
                        musicalInterests.includes(style.id) 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "hover:bg-primary/10"
                      )}
                      onClick={() => {
                        setMusicalInterests(prev => 
                          prev.includes(style.id) ? prev.filter(id => id !== style.id) : [...prev, style.id]
                        );
                      }}
                    >
                      {style.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Tipos de Evento</Label>
                <div className="grid grid-cols-2 gap-2">
                  {EVENT_TYPES.map(type => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`type-${type.id}`} 
                        checked={eventTypeInterests.includes(type.id)}
                        onCheckedChange={(checked) => {
                          setEventTypeInterests(prev => 
                            checked ? [...prev, type.id] : prev.filter(id => id !== type.id)
                          );
                        }}
                      />
                      <label htmlFor={`type-${type.id}`} className="text-xs font-medium leading-none cursor-pointer">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-primary" />
              WhatsApp (Identificador da Conta)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              required
              placeholder="(21) 98765-4321"
              className="h-11 sm:h-12 bg-muted/30 focus-visible:ring-primary/20"
            />
            <p className="text-[10px] text-muted-foreground">O DDD é obrigatório. Ex: 21 para o Rio.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {mode === "login" && (
            <div className="text-right">
              <a
                href="/forgot-password"
                className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center justify-end gap-1"
              >
                Recuperar acesso pelo WhatsApp
              </a>
            </div>
          )}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full gradient-sunset text-primary-foreground font-display font-semibold"
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="mr-2 h-4 w-4" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {mode === "login" ? "Entrar" : "Cadastrar Agora"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-medium hover:underline"
          >
            {mode === "login" ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
}
