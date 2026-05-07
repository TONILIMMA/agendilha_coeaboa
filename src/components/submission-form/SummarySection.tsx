import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2 } from "lucide-react";

interface SummarySectionProps {
  title: string;
  items: { label: string; value: string | null | undefined }[];
  onEdit: () => void;
}

export function SummarySection({ title, items, onEdit }: SummarySectionProps) {
  return (
    <Card className="p-4 sm:p-6 mb-4 relative overflow-hidden group border-muted/50 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-primary uppercase tracking-tight">{title}</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEdit}
          className="text-muted-foreground hover:text-primary hover:bg-primary/5 h-8 gap-1"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span className="text-xs">Editar</span>
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
            <p className="text-sm sm:text-base font-medium text-foreground break-words">
              {item.value || <span className="text-muted-foreground/50 italic">Não informado</span>}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
