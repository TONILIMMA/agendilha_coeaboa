import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Permissions {
  canSubmit: boolean;
  canApprove: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isCollaborator: boolean;
  loaded: boolean;
}

export function usePermissions(): Permissions {
  const { user, isAdmin } = useAuth();
  const [perms, setPerms] = useState<Permissions>({
    canSubmit: false,
    canApprove: false,
    canEdit: false,
    canDelete: false,
    isCollaborator: false,
    loaded: false,
  });

  useEffect(() => {
    if (!user) {
      setPerms({ canSubmit: false, canApprove: false, canEdit: false, canDelete: false, isCollaborator: false, loaded: true });
      return;
    }

    if (isAdmin) {
      setPerms({ canSubmit: true, canApprove: true, canEdit: true, canDelete: true, isCollaborator: true, loaded: true });
      return;
    }

    async function load() {
      const { data } = await supabase
        .from("collaborators")
        .select("can_submit, can_approve, can_edit, can_delete")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (data) {
        setPerms({
          canSubmit: data.can_submit,
          canApprove: data.can_approve,
          canEdit: data.can_edit,
          canDelete: data.can_delete,
          isCollaborator: true,
          loaded: true,
        });
      } else {
        // Regular user - can only submit
        setPerms({ canSubmit: true, canApprove: false, canEdit: false, canDelete: false, isCollaborator: false, loaded: true });
      }
    }

    load();
  }, [user, isAdmin]);

  return perms;
}
