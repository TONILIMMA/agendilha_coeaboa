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
      const [{ data: collabData }, { data: profileData }] = await Promise.all([
        supabase
          .from("collaborators")
          .select("can_submit, can_approve, can_edit, can_delete, is_active")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user!.id)
          .maybeSingle()
      ]);

      const isPromoter = profileData?.role === 'promoter';

      if (collabData && (collabData as any).is_active !== false) {
        setPerms({
          canSubmit: collabData.can_submit || isPromoter,
          canApprove: collabData.can_approve,
          canEdit: collabData.can_edit || isPromoter,
          canDelete: collabData.can_delete,
          isCollaborator: true,
          loaded: true,
        });
      } else {
        // Regular public users cannot submit anymore
        setPerms({ 
          canSubmit: isPromoter, 
          canApprove: false, 
          canEdit: false, 
          canDelete: false, 
          isCollaborator: false, 
          loaded: true 
        });
      }
    }

    load();
  }, [user, isAdmin]);

  return perms;
}
