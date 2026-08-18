import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";
import { qk } from "./queryKeys";

export interface UserProfile {
  id: string;
  email?: string | null;
  responsible_name?: string | null;
  phone?: string | null;
  created_at?: string;
}

/**
 * Unified profiles hook for the new data layer.
 */
export function useProfiles() {
  const qc = useQueryClient();

  const useProfileById = (id: string | null | undefined) => {
    return useQuery({
      queryKey: id ? qk.userDetails.byId(id) : ["profiles", "byId", "none"],
      enabled: !!id,
      queryFn: async (): Promise<UserProfile | null> => {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id as string)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      meta: {
        onError: (error: unknown) => handleError(error, { 
          silent: true, 
          context: "useProfileById" 
        })
      }
    });
  };

  return {
    useProfileById
  };
}
