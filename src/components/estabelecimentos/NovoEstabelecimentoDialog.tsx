import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emitEntityChanged } from "@/lib/entityEvents";
import { handleError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BAIRROS, PLACEHOLDER_BAIRRO } from "@/lib/neighborhoods";
import { cepDigits, formatCep, validateCep } from "@/lib/autofillValidation";
import type { EstabelecimentoSuggestion } from "./EstabelecimentoAutocomplete";

const TIPOS = [
  { v: "bar", l: "Bar" },
  { v: "restaurante", l: "Restaurante" },
  { v: "casa_show", l: "Casa de show" },
  { v: "quiosque", l: "Quiosque" },
  { v: "praca", l: "Praça / espaço público" },
  { v: "clube", l: "Clube" },
  { v: "espaco_cultural", l: "Espaço cultural" },
  { v: "outro", l: "Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Texto já digitado no autocomplete — entra pronto no campo Nome. */
  initialName?: string;
  /** Endereço já digitado no formulário — entra pronto no campo Endereço. */
  initialEndereco?: string;
  initialBairro?: string;
  onCreated: (estab: EstabelecimentoSuggestion) => void;
}

/** Modal de cadastro rápido de local, já preenchido com o que a pessoa digitou. */
export function NovoEstabelecimentoDialog({
  open,
  onOpenChange,
  initialName = "",
  initialEndereco = "",
  initialBairro = "",
  onCreated,
}: Props) {
  const [nome, setNome] = useState(initialName);
  const [tipo, setTipo] = useState("");
  const [endereco, setEndereco] = useState(initialEndereco);
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState(initialBairro);
  const [cep, setCep] = useState("");
  const [contato, setContato] = useState("");
  const [saving, setSaving] = useState(false);
  // Duplicidade só é checada no submit. Aqui guardamos o registro existente
  // pra oferecer "usar o que já existe" em vez de travar o cadastro.
  const [duplicado, setDuplicado] = useState<EstabelecimentoSuggestion | null>(null);

  // Sempre que o modal abre, reaproveita o que já foi digitado lá fora.
  useEffect(() => {
    if (!open) return;
    setNome(initialName);
    setEndereco(initialEndereco);
    setBairro(initialBairro);
    setDuplicado(null);
  }, [open, initialName, initialEndereco, initialBairro]);

  const buscarCep = async (raw: string) => {
    const d = cepDigits(raw);
    if (d.length !== 8 || validateCep(d).valid === false) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await res.json();
      if (data?.erro) return;
      if (!endereco.trim() && data.logradouro) setEndereco(data.logradouro);
      if (!bairro && data.bairro && BAIRROS.includes(data.bairro)) setBairro(data.bairro);
    } catch {
      /* silencioso — dá pra digitar à mão */
    }
  };

  const usarExistente = () => {
    if (!duplicado) return;
    toast.success(`Usando o cadastro de "${duplicado.nome}" que já existe.`);
    onCreated(duplicado);
    onOpenChange(false);
    setDuplicado(null);
  };

  const salvar = async () => {
    if (nome.trim().length < 2) {
      toast.error("Diz o nome do lugar pra gente.");
      return;
    }
    setSaving(true);
    try {
      // Validação de duplicidade no submit, pelo identificador único (nome).
      const { data: existente } = await supabase
        .from("estabelecimentos_public")
        .select("id, nome, endereco, bairro, cep, numero, complemento, tipo")
        .ilike("nome", nome.trim())
        .limit(1)
        .maybeSingle();
      if (existente?.id) {
        setDuplicado({ ...existente, contato: null } as EstabelecimentoSuggestion);
        setSaving(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const { data, error } = await supabase
        .from("estabelecimentos")
        .insert({
          nome: nome.trim(),
          tipo: tipo || null,
          endereco: endereco.trim() || null,
          numero: numero.trim() || null,
          bairro: bairro || null,
          cep: cepDigits(cep) || null,
          contato: contato.trim() || null,
          created_by: uid,
          responsavel_id: uid,
        })
        .select("id, nome, endereco, bairro, cep, numero, complemento, tipo, contato")
        .single();
      if (error) throw error;
      emitEntityChanged("estabelecimento");
      toast.success(`"${data.nome}" cadastrado e já vinculado.`);
      onCreated(data as EstabelecimentoSuggestion);
      onOpenChange(false);
      setDuplicado(null);
      setTipo("");
      setNumero("");
      setCep("");
      setContato("");
    } catch (err) {
      handleError(err, "Não rolou cadastrar o local agora.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar novo local</DialogTitle>
          <DialogDescription>
            Já trouxemos o que você digitou. Complete o resto e a gente vincula na hora.
          </DialogDescription>
        </DialogHeader>

        {duplicado && (
          <div
            role="alert"
            data-testid="estabelecimento-duplicate-alert"
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 space-y-2"
          >
            <p>
              Já tem um <strong>{duplicado.nome}</strong> cadastrado
              {duplicado.bairro ? ` no ${duplicado.bairro}` : ""}. Quer usar esse mesmo?
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={usarExistente}>
                Usar o cadastro existente
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDuplicado(null)}
              >
                Mudar o nome
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Nome do local*</Label>
            <Input
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                setDuplicado(null);
              }}
              autoComplete="organization"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Bar, praça, casa de show…" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.v} value={t.v}>
                    {t.l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-semibold">Endereço</Label>
              <Input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                autoComplete="address-line1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Número</Label>
              <Input value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Bairro</Label>
              <Select value={bairro} onValueChange={setBairro}>
                <SelectTrigger>
                  <SelectValue placeholder={PLACEHOLDER_BAIRRO} />
                </SelectTrigger>
                <SelectContent>
                  {BAIRROS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">CEP</Label>
              <Input
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                onBlur={(e) => buscarCep(e.target.value)}
                inputMode="numeric"
                autoComplete="postal-code"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Contato (WhatsApp)</Label>
            <Input
              value={contato}
              onChange={(e) => setContato(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={salvar} disabled={saving}>
            {saving ? "Salvando…" : "Cadastrar e usar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}