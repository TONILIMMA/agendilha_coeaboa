import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { emitEntityChanged } from "@/lib/entityEvents";
import { handleError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { AtrativoSuggestion } from "./AtrativoAutocomplete";

const TIPOS_ATRATIVO = [
  "Gastronomia",
  "Bar/Restaurante",
  "Cultura",
  "Turismo",
  "Lazer",
  "Esporte",
  "Hospedagem",
  "Comércio/Serviços",
  "Saúde e Bem-estar",
  "Educação",
  "Religioso",
  "Espaço para Eventos",
  "Outros",
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Texto já digitado no autocomplete — entra pronto no campo Nome. */
  initialName?: string;
  initialType?: string;
  onCreated: (atrativo: AtrativoSuggestion) => void;
}

/** Modal de cadastro rápido de atrativo, já preenchido com o que a pessoa digitou. */
export function NovoAtrativoDialog({
  open,
  onOpenChange,
  initialName = "",
  initialType = "",
  onCreated,
}: Props) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);
  const [tipoAtrativo, setTipoAtrativo] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setType(initialType);
  }, [open, initialName, initialType]);

  const salvar = async () => {
    if (name.trim().length < 2) {
      toast.error("Diz o nome do atrativo pra gente.");
      return;
    }
    if (!contactInfo.trim()) {
      toast.error("Informe um contato para o atrativo.");
      return;
    }
    if (!tipoAtrativo) {
      toast.error("Selecione uma categoria.");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      const { data, error } = await supabase
        .from("atrativos")
        .insert({
          name: name.trim(),
          type: tipoAtrativo,
          description: description.trim() || null,
          contact_info: contactInfo.trim() || null,
          category_other: tipoAtrativo === "Outros" ? categoryOther.trim() || null : null,
          created_by: uid,
          responsavel_id: uid,
        })
        .select(
          "id, name, type, estabelecimento_id, tipo_atrativo, style, estilos, description, contact_info, category_other, cidade_regiao, estado, pais, logo_url, fotos",
        )
        .single();
      if (error) throw error;
      emitEntityChanged("atrativo");
      toast.success(`"${data.name}" cadastrado e já vinculado.`);
      onCreated(data as AtrativoSuggestion);
      onOpenChange(false);
      setTipoAtrativo("");
      setCategoryOther("");
      setContactInfo("");
      setDescription("");
    } catch (err) {
      handleError(err, "Não rolou cadastrar o atrativo agora.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar novo atrativo</DialogTitle>
          <DialogDescription>
            Já trouxemos o que você digitou. Complete o resto e a gente vincula na hora.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Nome do atrativo*</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Contato*</Label>
            <Input
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="(21) 99999-9999 ou @instagram"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Categoria*</Label>
            <Select value={tipoAtrativo} onValueChange={setTipoAtrativo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ATRATIVO.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {tipoAtrativo === "Outros" && (
              <Input
                placeholder="Especifique..."
                value={categoryOther}
                onChange={(e) => setCategoryOther(e.target.value)}
                className="mt-2"
              />
            )}
          </div>


          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
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