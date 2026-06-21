import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { UserWithRole } from "./types";

interface Props {
  adminTarget: UserWithRole | null;
  setAdminTarget: (v: UserWithRole | null) => void;
  onConfirmAdmin: (u: UserWithRole) => void;

  masterTarget: UserWithRole | null;
  setMasterTarget: (v: UserWithRole | null) => void;
  onConfirmMaster: (u: UserWithRole) => void;

  deleteTarget: UserWithRole | null;
  setDeleteTarget: (v: UserWithRole | null) => void;
  onConfirmDelete: (u: UserWithRole) => void;

  resetTarget: UserWithRole | null;
  setResetTarget: (v: UserWithRole | null) => void;
  onConfirmReset: (u: UserWithRole) => void;
}

export function ConfirmUserActionDialogs(p: Props) {
  return (
    <>
      <ConfirmModal
        isOpen={!!p.adminTarget}
        onClose={() => p.setAdminTarget(null)}
        onConfirm={() => {
          if (p.adminTarget) p.onConfirmAdmin(p.adminTarget);
          p.setAdminTarget(null);
        }}
        title="Alterar Papel Administrativo"
        description={`Deseja mesmo ${p.adminTarget?.is_admin ? "remover" : "conceder"} privilégios de administrador para ${p.adminTarget?.responsible_name || p.adminTarget?.email}?`}
        confirmText="Confirmar Alteração"
        variant={p.adminTarget?.is_admin ? "destructive" : "default"}
      />

      <ConfirmModal
        isOpen={!!p.masterTarget}
        onClose={() => p.setMasterTarget(null)}
        onConfirm={() => {
          if (p.masterTarget) p.onConfirmMaster(p.masterTarget);
          p.setMasterTarget(null);
        }}
        title="Controle Admin Master"
        description={`Esta é a permissão máxima do sistema. Confirmar ${p.masterTarget?.status === "master" ? "remoção" : "concessão"} de acesso Master para ${p.masterTarget?.responsible_name || p.masterTarget?.email}?`}
        confirmText="Confirmar Master"
        variant={p.masterTarget?.status === "master" ? "destructive" : "default"}
      />

      <ConfirmModal
        isOpen={!!p.deleteTarget}
        onClose={() => p.setDeleteTarget(null)}
        onConfirm={() => {
          if (p.deleteTarget) p.onConfirmDelete(p.deleteTarget);
          p.setDeleteTarget(null);
        }}
        title="Excluir Usuário"
        description="Esta ação é irreversível. Todos os dados, preferências e históricos deste usuário serão permanentemente removidos da plataforma."
        confirmText="Excluir Permanentemente"
        variant="destructive"
      />

      <ConfirmModal
        isOpen={!!p.resetTarget}
        onClose={() => p.setResetTarget(null)}
        onConfirm={() => {
          if (p.resetTarget) p.onConfirmReset(p.resetTarget);
          p.setResetTarget(null);
        }}
        title="Resetar senha do usuário"
        description={`Será gerada uma senha temporária para ${p.resetTarget?.responsible_name || p.resetTarget?.email}. A senha atual deixará de funcionar imediatamente e o usuário precisará trocá-la no próximo login.`}
        confirmText="Gerar senha temporária"
      />
    </>
  );
}