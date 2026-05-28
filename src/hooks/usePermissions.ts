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
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role, collaborators(can_submit, can_approve, can_edit, can_delete, is_active)")
          .eq("user_id", user!.id)
          .maybeSingle();

        if (profileError) throw profileError;

        const isPromoter = profileData?.role === 'promoter';
        const collab = profileData?.collaborators?.[0] as any;

        if (collab && collab.is_active !== false) {
          setPerms({
            canSubmit: collab.can_submit || isPromoter,
            canApprove: collab.can_approve,
            canEdit: collab.can_edit || isPromoter,
            canDelete: collab.can_delete,
            isCollaborator: true,
            loaded: true,
          });
        } else {
          setPerms({ 
            canSubmit: isPromoter, 
            canApprove: false, 
            canEdit: false, 
            canDelete: false, 
            isCollaborator: false, 
            loaded: true 
          });
        }
      } catch (err) {
        console.error("Error loading permissions:", err);
        setPerms(prev => ({ ...prev, loaded: true }));
      }
    }

    load();
  }, [user, isAdmin]);

  return perms;
}
