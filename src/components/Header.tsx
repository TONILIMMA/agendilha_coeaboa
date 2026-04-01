import { useState } from "react";
import { Save, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { saveToStorage, savedCount, currentFormData } = useSubmissions();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Small delay for visual feedback
    await new Promise((r) => setTimeout(r, 400));
    saveToStorage();
    setSaving(false);
  };

  const hasData = currentFormData && Object.keys(currentFormData).length > 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-primary">📌 AgendIlha</span>
          <span className="hidden sm:inline text-sm text-muted-foreground">/ Coé a Boa?</span>
        </div>

        <div className="flex items-center gap-3">
          {savedCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              <Badge variant="secondary" className="text-xs font-medium">
                {savedCount}
              </Badge>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className={`font-display font-semibold transition-all ${
              hasData
                ? "gradient-sunset text-primary-foreground shadow-card hover:opacity-90"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1.5 h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </header>
  );
}
