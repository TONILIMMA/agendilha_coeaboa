import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

  export type UserStatus = "master" | "admin" | "collaborator" | "artist" | "user" | null;

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
      try {
        // Fetch roles from the robust System B (app_user_roles)
        const { data: userRolesData } = await supabase
          .from('app_user_roles')
          .select('app_roles(name)')
          .eq('user_id', user.id);

        const roleNames = userRolesData?.map(r => (r.app_roles as any)?.name).filter(Boolean) || [];

        // Always try to fetch collaborator name (used as display fallback)
        const { data: collab } = await supabase
          .from("collaborators")
          .select("name, is_active")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;
        if (collab?.name) setCollabName(collab.name);

        if (roleNames.includes('master_admin') || roleNames.includes('developer')) {
          setStatus("master");
        } else if (roleNames.includes('admin') || isAdmin) {
          setStatus("admin");
        } else if (profile?.role === 'artist') {
          setStatus("artist");
        } else if (collab && collab.is_active !== false) {
          setStatus("collaborator");
        } else {
          setStatus("user");
        }

        // Auto-populate profile.responsible_name from user_metadata
        const metaName = (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || "";
        if (metaName && profileLoaded) {
          if (profile && !profile.responsible_name) {
            await supabase
              .from("profiles")
              .update({ responsible_name: metaName })
              .eq("user_id", user.id);
          }
        }
      } catch (err) {
        console.error("Error in useUserBadge:", err);
      } finally {
        if (!cancelled) setStatusLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, profile, profileLoaded]);

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
    artist: "Artista",
    user: "Público",
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
