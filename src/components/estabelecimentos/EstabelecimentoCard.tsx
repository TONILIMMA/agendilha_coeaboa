import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2, ChevronDown, ChevronUp, MapPin, Phone, Pencil, Check, X, Loader2, Trash2,
} from "lucide-react";

export interface EstabelecimentoRow {
  id: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  numero: string | null;
  complemento: string | null;
  tipo: string | null;
  contato: string | null;
  responsavel_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  estab: EstabelecimentoRow;
  canEdit: boolean;
  canDelete: boolean;
  onSave: (id: string, patch: Partial<EstabelecimentoRow>) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}

export function EstabelecimentoCard({ estab, canEdit, canDelete, onSave, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    nome: estab.nome,
    endereco: estab.endereco ?? "",
    bairro: estab.bairro ?? "",
    cep: estab.cep ?? "",
    numero: estab.numero ?? "",
    complemento: estab.complemento ?? "",
    tipo: estab.tipo ?? "",
    contato: estab.contato ?? "",
  });

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    const ok = await onSave(estab.id, {
      nome: form.nome.trim(),
      endereco: form.endereco.trim() || null,
      bairro: form.bairro.trim() || null,
      cep: form.cep.trim() || null,
      numero: form.numero.trim() || null,
      complemento: form.complemento.trim() || null,
      tipo: form.tipo.trim() || null,
      contato: form.contato.trim() || null,
    });
    setSaving(false);
    if (ok) setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Excluir "${estab.nome}"? Essa ação não pode ser desfeita.`)) return;
    setDeleting(true);
    await onDelete(estab.id);
    setDeleting(false);
  };

  return (
    <Card
      className={`transition-all duration-300 border-border bg-card overflow-hidden ${
        expanded ? "shadow-md ring-2 ring-primary/20" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left p-4 sm:p-5 flex items-center gap-4"
          aria-expanded={expanded}
        >
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-foreground truncate">{estab.nome}</h3>
              {estab.tipo && (
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0">
                  {estab.tipo}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs sm:text-sm text-muted-foreground mt-1">
              {estab.bairro && (
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {estab.bairro}
                </span>
              )}
              {estab.contato && (
                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {estab.contato}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border bg-muted/20 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {!editing ? (
              <>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Field label="Endereço" value={estab.endereco} />
                  <Field label="Número" value={estab.numero} />
                  <Field label="Bairro" value={estab.bairro} />
                  <Field label="CEP" value={estab.cep} />
                  <Field label="Complemento" value={estab.complemento} />
                  <Field label="Tipo" value={estab.tipo} />
                  <Field label="Contato" value={estab.contato} />
                  <Field label="Criado em" value={new Date(estab.created_at).toLocaleDateString("pt-BR")} />
                </dl>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono">
                  ID: {estab.id}
                </p>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                  {canEdit && (
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditing(true)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleting}
                      className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto"
                      onClick={handleDelete}
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Excluir
                    </Button>
                  )}
                </div>
                {!canEdit && (
                  <p className="text-xs text-muted-foreground italic">
                    Apenas o responsável, o cadastrante ou um administrador podem editar.
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Editable label="Nome*" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                  <Editable label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} placeholder="bar, restaurante, praça..." />
                  <Editable label="Endereço" value={form.endereco} onChange={(v) => setForm({ ...form, endereco: v })} />
                  <Editable label="Número" value={form.numero} onChange={(v) => setForm({ ...form, numero: v })} />
                  <Editable label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} />
                  <Editable label="CEP" value={form.cep} onChange={(v) => setForm({ ...form, cep: v })} />
                  <Editable label="Complemento" value={form.complemento} onChange={(v) => setForm({ ...form, complemento: v })} />
                  <Editable label="Contato" value={form.contato} onChange={(v) => setForm({ ...form, contato: v })} placeholder="WhatsApp ou e-mail" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" onClick={handleSave} disabled={saving || !form.nome.trim()} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
      <p className="truncate">{value || <span className="text-muted-foreground/60 italic">—</span>}</p>
    </div>
  );
}

function Editable({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-10" />
    </div>
  );
}