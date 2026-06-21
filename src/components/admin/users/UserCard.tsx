import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  User,
  Phone,
  MapPin,
  Music,
  Pencil,
  Check,
  X,
  Trash2,
  KeyRound,
  ChevronDown,
  MessageSquare,
  Users,
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
  savingEdit: boolean;
  setEditName: (v: string) => void;
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
    savingEdit,
    setEditName,
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

  return (
    <Card className="group hover:shadow-md transition-all duration-300 border-border bg-card overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-center p-4 sm:p-6 gap-6 relative">
          {/* Profile */}
          <div className="flex-1 flex gap-4 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap pr-10 md:pr-0">
                {editingId === u.id ? (
                  <div className="flex items-center gap-2 w-full max-w-sm">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-9"
                      autoFocus
                      disabled={savingEdit}
                    />
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" className="h-9 w-9 p-0" onClick={() => onSaveEdit(u)} disabled={savingEdit}>
                        {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={onCancelEdit} disabled={savingEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-base sm:text-lg font-bold text-foreground truncate max-w-[150px] xs:max-w-none">
                      {u.responsible_name || <span className="text-muted-foreground italic text-sm">Nome não definido</span>}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {u.status && <StatusBadge role={u.status} />}
                      {u.user_type && u.user_type !== "usuario" && (
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0">
                          {u.user_type}
                        </Badge>
                      )}
                      {(isMaster || (!u.is_admin && u.status !== "master")) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onStartEdit(u)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 text-[11px] sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  {formatPhone(u.phone)}
                </span>
                <span className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  {u.address_neighborhood || <span className="text-rose-400 font-medium">Bairro?</span>}
                </span>
                {u.musical_preferences && u.musical_preferences.length > 0 && (
                  <span className="flex items-center gap-1.5 truncate">
                    <Music className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    {u.musical_preferences.slice(0, 1).join(", ")}
                    {u.musical_preferences.length > 1 && "..."}
                  </span>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono pt-1">
                UID: {u.id.slice(0, 6)}... • {new Date(u.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 justify-end shrink-0">
            {u.phone && isValidBrazilianMobile(u.phone) && (
              <Button
                size="icon"
                variant="ghost"
                title="Falar no WhatsApp"
                className="h-9 w-9 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                onClick={() => window.open(buildWhatsappUrl(u.phone!, `Olá ${u.responsible_name || ""}!`), "_blank")}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full px-4 h-9 font-bold text-xs gap-2"
                  disabled={updatingType === u.id}
                >
                  {updatingType === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Users className="h-3 w-3" />}
                  Tipo: {u.user_type || "usuario"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onUpdateType(u, "usuario")}>Usuário</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateType(u, "promotor")}>Promotor</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateType(u, "divulgador")}>Divulgador</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateType(u, "estabelecimento")}>Estabelecimento</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isMaster && (
              <Button
                size="sm"
                variant={u.is_admin ? "destructive" : "outline"}
                disabled={toggling === u.id || u.id === currentUserId}
                className="rounded-full px-4 h-9 font-bold text-xs"
                onClick={() => onAskToggleAdmin(u)}
              >
                {toggling === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.is_admin ? "Remover Admin" : "Tornar Admin"}
              </Button>
            )}

            {isMaster && (
              <Button
                size="sm"
                variant={u.status === "master" ? "destructive" : "secondary"}
                disabled={togglingMaster === u.id || u.id === currentUserId}
                className="rounded-full px-4 h-9 font-bold text-xs"
                onClick={() => onAskToggleMaster(u)}
              >
                {togglingMaster === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.status === "master" ? "Remover Master" : "Tornar Master"}
              </Button>
            )}

            <Button
              size="icon"
              variant="ghost"
              disabled={u.id === currentUserId || deleting === u.id || (!isMaster && (u.is_admin || u.status === "master"))}
              className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"
              onClick={() => onAskDelete(u)}
            >
              {deleting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={resetting === u.id || (!isMaster && (u.is_admin || u.status === "master"))}
              title="Resetar senha"
              className="h-9 w-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full"
              onClick={() => onAskReset(u)}
            >
              {resetting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuSeparator />
                {u.phone && isValidBrazilianMobile(u.phone) && (
                  <>
                    <DropdownMenuItem
                      onClick={() => window.open(buildWhatsappUrl(u.phone!, `Olá ${u.responsible_name || ""}!`), "_blank")}
                      className="text-emerald-600 font-semibold"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Falar no WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem disabled className="text-[10px] font-bold uppercase tracking-wider opacity-50">
                  Alterar Tipo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateType(u, "usuario")}>Tornar Usuário</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateType(u, "promotor")}>Tornar Promotor</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateType(u, "divulgador")}>Tornar Divulgador</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateType(u, "estabelecimento")}>Tornar Estabelecimento</DropdownMenuItem>
                <DropdownMenuSeparator />
                {isMaster && (
                  <DropdownMenuItem onClick={() => onAskToggleAdmin(u)} disabled={u.id === currentUserId}>
                    {u.is_admin ? "Remover Admin" : "Tornar Admin"}
                  </DropdownMenuItem>
                )}
                {isMaster && (
                  <DropdownMenuItem onClick={() => onAskToggleMaster(u)} disabled={u.id === currentUserId}>
                    {u.status === "master" ? "Remover Master" : "Tornar Master"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAskReset(u)}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Resetar senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onAskDelete(u)}
                  disabled={u.id === currentUserId}
                  className="text-rose-600 font-bold"
                >
                  Excluir Usuário
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}