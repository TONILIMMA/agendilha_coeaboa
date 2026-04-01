import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "sonner";

interface SubmissionEntry {
  id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface SubmissionContextType {
  currentFormData: Record<string, unknown> | null;
  setCurrentFormData: (data: Record<string, unknown> | null) => void;
  saveToStorage: () => void;
  savedCount: number;
  getSavedSubmissions: () => SubmissionEntry[];
}

const STORAGE_KEY = "agendilha_submissions";
const MAX_STORAGE_MB = 5;

const SubmissionContext = createContext<SubmissionContextType | null>(null);

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const [currentFormData, setCurrentFormData] = useState<Record<string, unknown> | null>(null);
  const [savedCount, setSavedCount] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as SubmissionEntry[]).length : 0;
    } catch {
      return 0;
    }
  });

  const getSavedSubmissions = useCallback((): SubmissionEntry[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const saveToStorage = useCallback(() => {
    if (!currentFormData || Object.keys(currentFormData).length === 0) {
      toast.info("Nenhuma informação para salvar", {
        description: "Preencha o formulário antes de salvar.",
      });
      return;
    }

    try {
      const submissions = getSavedSubmissions();
      const newEntry: SubmissionEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        data: currentFormData,
      };
      const updated = [...submissions, newEntry];
      const json = JSON.stringify(updated);

      // Check storage limit (~5MB)
      if (new Blob([json]).size > MAX_STORAGE_MB * 1024 * 1024) {
        toast.error("Limite de armazenamento excedido", {
          description: "Remova submissões antigas para continuar salvando.",
        });
        return;
      }

      localStorage.setItem(STORAGE_KEY, json);
      setSavedCount(updated.length);
      toast.success("✅ Informações salvas com sucesso!", {
        description: `${updated.length} submissão(ões) armazenada(s).`,
      });
    } catch {
      toast.error("Erro ao salvar", {
        description: "Não foi possível armazenar as informações.",
      });
    }
  }, [currentFormData, getSavedSubmissions]);

  return (
    <SubmissionContext.Provider value={{ currentFormData, setCurrentFormData, saveToStorage, savedCount, getSavedSubmissions }}>
      {children}
    </SubmissionContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionContext);
  if (!ctx) throw new Error("useSubmissions must be used within SubmissionProvider");
  return ctx;
}
