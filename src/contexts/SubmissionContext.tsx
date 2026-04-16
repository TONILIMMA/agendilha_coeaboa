import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubmissionEntry {
  id: string;
  created_at: string;
  user_id: string;
  company_name: string | null;
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  event_title: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  description: string | null;
  video_link: string | null;
  category: string | null;
  promotion_type: string | null;
  target_audience: string | null;
  promotion_rules: string | null;
  contact_social: string | null;
  additional_details: string | null;
  sale_price: string | null;
  maintenance_cost: string | null;
  subscription_info: string | null;
  commission: string | null;
  stage: string;
  concept_description: string | null;
  responsible_person: string | null;
  deleted_at: string | null;
}
interface SubmissionContextType {
  submissions: SubmissionEntry[];
  loading: boolean;
  fetchSubmissions: () => Promise<void>;
  addSubmission: (data: Omit<SubmissionEntry, "id" | "created_at" | "user_id" | "deleted_at" | "stage"> & { stage?: string }) => Promise<boolean>;
  deleteSubmission: (id: string) => Promise<void>;
  savedCount: number;
}

const SubmissionContext = createContext<SubmissionContextType | null>(null);

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar envios");
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  }, [user]);

  const addSubmission = useCallback(async (data: Omit<SubmissionEntry, "id" | "created_at" | "user_id" | "deleted_at" | "stage"> & { stage?: string }) => {
    if (!user) return false;
    const { error } = await supabase
      .from("submissions")
      .insert({ ...data, user_id: user.id } as any);

    if (error) {
      toast.error("Erro ao salvar envio", { description: error.message });
      return false;
    }
    toast.success("✅ Recebemos seu evento com sucesso!", {
      description: "Está em análise para divulgação. Você pode acompanhar o status em 'Envios' no menu.",
      duration: 6000,
    });
    await fetchSubmissions();
    return true;
  }, [user, fetchSubmissions]);

  const deleteSubmission = useCallback(async (id: string) => {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover");
    } else {
      toast.success("Envio removido");
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
  }, []);

  return (
    <SubmissionContext.Provider
      value={{
        submissions,
        loading,
        fetchSubmissions,
        addSubmission,
        deleteSubmission,
        savedCount: submissions.length,
      }}
    >
      {children}
    </SubmissionContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionContext);
  if (!ctx) throw new Error("useSubmissions must be used within SubmissionProvider");
  return ctx;
}
