import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

export type UserStatus = "master" | "admin" | "collaborator" | "user" | null;

export interface UserBadge {
  name: string;
  initials: string;
  status: UserStatus;
  label: string;
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
  const [collabName, setCollabName] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setStatus(null);
      setStatusLoaded(true);
      setCollabName("");
      return;
    }

    let cancelled = false;

    (async () => {
      const { data: masterFlag } = await supabase.rpc("is_master", {
        _user_id: user.id,
      });

      if (cancelled) return;

      // Always try to fetch collaborator name (used as display fallback)
      const { data: collab } = await supabase
        .from("collaborators")
        .select("name, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;
      if (collab?.name) setCollabName(collab.name);

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

  // Priority: profile name → company → collaborator name → user metadata → email/phone
  const emailLocal = user?.email?.split("@")[0] || "";
  const isPhonePlaceholder = user?.email?.endsWith("@phone.agendilha.app");
  const metaName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    "";
  const fallback = isPhonePlaceholder
    ? ((user?.user_metadata as any)?.phone || emailLocal)
    : emailLocal;
  const name =
    profile.responsible_name ||
    profile.company_name ||
    collabName ||
    metaName ||
    fallback ||
    "Usuário";
  const initials = buildInitials(name);
  const labelMap: Record<NonNullable<UserStatus>, string> = {
    master: "Admin Master",
    admin: "Admin",
    collaborator: "Divulgador",
    user: "Divulgador",
  };
  const label = status ? labelMap[status] : "";

  return {
    name,
    initials,
    status,
    label,
    loaded: profileLoaded && statusLoaded,
  };
}
