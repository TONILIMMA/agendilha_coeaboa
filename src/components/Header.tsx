import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { Badge } from "@/components/ui/badge";
import SubmissionsPanel from "@/components/SubmissionsPanel";

export default function Header() {
  const { savedCount } = useSubmissions();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-primary">📌 AgendIlha</span>
          <span className="hidden sm:inline text-sm text-muted-foreground">/ Coé a Boa?</span>
        </div>

        <SubmissionsPanel>
          <Button
            size="sm"
            className="font-display font-semibold gradient-sunset text-primary-foreground shadow-card hover:opacity-90 transition-all"
          >
            <ClipboardList className="mr-1.5 h-4 w-4" />
            Envios
            {savedCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs font-medium bg-white/20 text-white">
                {savedCount}
              </Badge>
            )}
          </Button>
        </SubmissionsPanel>
      </div>
    </header>
  );
}
