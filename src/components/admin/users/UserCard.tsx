import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, User, Phone, MapPin, Music, Pencil, Check, X, Trash2,
  KeyRound, ChevronDown, ChevronUp, MessageSquare, Mail, Calendar,
  ShieldCheck, Crown,
} from "lucide-react";
import {
  isValidBrazilianMobile,
  formatPhoneDisplay,
  buildWhatsappUrl,
} from "@/lib/whatsapp";
import type { UserWithRole } from "./types";

function formatPhone(phone: string | null): string {
  if (!phone) return "Não informado";
  return formatPhoneDisplay(phone);
}

interface UserCardProps {
  u: UserWithRole;
  currentUserId: string | undefined;
  isMaster: boolean;
  // edit
  editingId: string | null;
  editName: string;
  editPhone: string;
  editNeighborhood: string;
  savingEdit: boolean;
  setEditName: (v: string) => void;
  setEditPhone: (v: string) => void;
  setEditNeighborhood: (v: string) => void;
  onStartEdit: (u: UserWithRole) => void;
  onCancelEdit: () => void;
  onSaveEdit: (u: UserWithRole) => void;
  // per-row loading
  toggling: string | null;
  togglingMaster: string | null;
  deleting: string | null;
  resetting: string | null;
  updatingType: string | null;
  // actions
  onUpdateType: (u: UserWithRole, type: string) => void;
  onAskToggleAdmin: (u: UserWithRole) => void;
  onAskToggleMaster: (u: UserWithRole) => void;
  onAskDelete: (u: UserWithRole) => void;
  onAskReset: (u: UserWithRole) => void;
}

export function UserCard(props: UserCardProps) {
  const {
    u,
    currentUserId,
    isMaster,
    editingId,
    editName,
    editPhone,
    editNeighborhood,
    savingEdit,
    setEditName,
    setEditPhone,
    setEditNeighborhood,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    toggling,
    togglingMaster,
    deleting,
    resetting,
    updatingType,
    onUpdateType,
    onAskToggleAdmin,
    onAskToggleMaster,
    onAskDelete,
    onAskReset,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const isSelf = u.id === currentUserId;
  const canEditRoles = isMaster && !isSelf;
  const isEditing = editingId === u.id;

  // Tipos disponíveis na ficha administrativa
  const userTypes = [
    { value: "usuario", label: "Público" },
    { value: "divulgador", label: "Divulgador" },
    { value: "estabelecimento", label: "Estabelecimento" },
  ];

  return (
    <Card
      className={`group transition-all duration-300 border-border bg-card overflow-hidden ${
        expanded ? "shadow-md ring-2 ring-primary/20" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-0">
        {/* Cabeçalho compacto — clique alterna expansão */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left p-4 sm:p-5 flex items-center gap-4"
          aria-expanded={expanded}
        >
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                {u.responsible_name || <span className="text-muted-foreground italic text-sm">Nome não definido</span>}
              </h3>
              {u.status && <StatusBadge role={u.status} />}
              {u.user_type && u.user_type !== "usuario" && (
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0">
                  {u.user_type}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs sm:text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1.5 truncate">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {formatPhone(u.phone)}
              </span>
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {u.address_neighborhood || <span className="text-rose-400 font-medium">Bairro?</span>}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>

        {/* Ficha expandida — visível somente para admin/master (a página já protege o acesso) */}
        {expanded && (
          <div className="border-t border-border bg-muted/20 p-4 sm:p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
            {/* Bloco: Identificação completa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">E-mail</p>
                  <p className="truncate">{u.email || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Telefone</p>
                  <p>{formatPhone(u.phone)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bairro</p>
                  <p>{u.address_neighborhood || "Não informado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Criado em</p>
                  <p>{new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              {u.musical_preferences && u.musical_preferences.length > 0 && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <Music className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Preferências</p>
                    <p>{u.musical_preferences.join(", ")}</p>
                  </div>
                </div>
              )}
              <p className="sm:col-span-2 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono">
                UID: {u.id}
              </p>
            </div>

            {/* Bloco: Editar nome */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Editar dados</p>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Nome do responsável</label>
                      <SuggestInput
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        disabled={savingEdit}
                        placeholder="Nome do responsável"
                        autoComplete="name"
                        suggestFrom="profiles"
                        suggestColumn="responsible_name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">WhatsApp</label>
                      <SuggestInput
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        disabled={savingEdit}
                        placeholder="(21) 99999-9999"
                        inputMode="tel"
                        autoComplete="tel"
                        suggestFrom="profiles"
                        suggestColumn="phone"
                      />
                      <p className="text-[10px] text-muted-foreground">DDD + número. Deixe em branco pra remover.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Bairro</label>
                      <SuggestInput
                        value={editNeighborhood}
                        onChange={(e) => setEditNeighborhood(e.target.value)}
                        disabled={savingEdit}
                        placeholder="Ex: Centro"
                        suggestFrom="profiles"
                        suggestColumn="address_neighborhood"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" className="gap-2" onClick={() => onSaveEdit(u)} disabled={savingEdit}>
                      {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-2" onClick={onCancelEdit} disabled={savingEdit}>
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => onStartEdit(u)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar dados
                </Button>
              )}
            </div>

            {/* Bloco: Tipo de usuário */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tipo de usuário</p>
              <div className="flex items-center gap-2">
                <Select
                  value={u.user_type || "usuario"}
                  onValueChange={(v) => onUpdateType(u, v)}
                  disabled={updatingType === u.id}
                >
                  <SelectTrigger className="h-10 max-w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {updatingType === u.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>

            {/* Bloco: Papéis administrativos (somente master) */}
            {canEditRoles && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Papéis administrativos
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={u.is_admin ? "destructive" : "outline"}
                    disabled={toggling === u.id}
                    onClick={() => onAskToggleAdmin(u)}
                    className="gap-2"
                  >
                    {toggling === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                  </Button>
                  <Button
                    size="sm"
                    variant={u.status === "master" ? "destructive" : "secondary"}
                    disabled={togglingMaster === u.id}
                    onClick={() => onAskToggleMaster(u)}
                    className="gap-2"
                  >
                    {togglingMaster === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                    {u.status === "master" ? "Remover Master" : "Tornar Master"}
                  </Button>
                </div>
              </div>
            )}
            {!canEditRoles && isSelf && (
              <p className="text-xs text-muted-foreground italic">
                Você não pode alterar seus próprios papéis administrativos.
              </p>
            )}

            {/* Bloco: Ações */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
              {u.phone && isValidBrazilianMobile(u.phone) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                  onClick={() =>
                    window.open(buildWhatsappUrl(u.phone!, `Olá ${u.responsible_name || ""}!`), "_blank")
                  }
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={resetting === u.id || (!isMaster && (u.is_admin || u.status === "master"))}
                className="gap-2 text-amber-700 border-amber-200 hover:bg-amber-50"
                onClick={() => onAskReset(u)}
              >
                {resetting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Resetar senha
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isSelf || deleting === u.id || (!isMaster && (u.is_admin || u.status === "master"))}
                className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto"
                onClick={() => onAskDelete(u)}
              >
                {deleting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Excluir usuário
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}