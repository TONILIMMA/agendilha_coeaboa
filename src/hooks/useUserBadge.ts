import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export type UserStatus = "master" | "admin" | "collaborator" | "user" | null;

export interface UserBadge {
  name: string;
  initials: string;
  status: UserStatus;
  label: string; // "Admin Master" | "Admin" | "Colaborador" | "Usuário"
  loaded: boolean;
}

function buildInitials(name: string): string {
  const clean = name.trim();
  if (!clean) return "U";
  const parts = clean.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export function useUserBadge(): UserBadge {
  const { user, isAdmin } = useAuth();
  const { profile, loaded: profileLoaded } = useProfile();
  const [status, setStatus] = useState<UserStatus>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setStatus(null);
      setStatusLoaded(true);
      return;
    }

    let cancelled = false;

    (async () => {
      // Check master via RPC (formal master role OR fallback: oldest admin)
      const { data: masterFlag } = await supabase.rpc("is_master", {
        _user_id: user.id,
      });

      if (cancelled) return;

      if (masterFlag === true) {
        setStatus("master");
        setStatusLoaded(true);
        return;
      }

      if (isAdmin) {
        setStatus("admin");
        setStatusLoaded(true);
        return;
      }

      // Not admin → check collaborator
      const { data: collab } = await supabase
        .from("collaborators")
        .select("is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (collab && collab.is_active !== false) {
        setStatus("collaborator");
      } else {
        setStatus("user");
      }
      setStatusLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin]);

  const name = profile.responsible_name || profile.company_name || "";
  const initials = buildInitials(name || user?.email?.split("@")[0] || "U");
  const labelMap: Record<NonNullable<UserStatus>, string> = {
    master: "Admin Master",
    admin: "Admin",
    collaborator: "Colaborador",
    user: "Usuário",
  };
  const label = status ? labelMap[status] : "";

  return {
    name: name || "Usuário",
    initials,
    status,
    label,
    loaded: profileLoaded && statusLoaded,
  };
}
