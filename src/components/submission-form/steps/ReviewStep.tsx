import { UseFormReturn } from "react-hook-form";
import { SummarySection } from "../SummarySection";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { FullPreviewDialog } from "../FullPreviewDialog";
import { PublishChecklist } from "../PublishChecklist";

interface ReviewStepProps {
  form: UseFormReturn<any>;
  goToStep: (step: number) => void;
}

export function ReviewStep({ form, goToStep }: ReviewStepProps) {
  const values = form.getValues();
  const [previewOpen, setPreviewOpen] = useState(false);

  const addressLine = [values.addressStreet, values.addressNumber]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(", ");

  const horario = values.startTime
    ? `${values.startTime}${values.endTime ? ` - ${values.endTime}` : " (Sem término)"}`
    : null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary">Revise seus dados</h2>
        <p className="text-sm text-muted-foreground">Confira se tudo está correto antes de enviar.</p>
      </div>

      <PublishChecklist form={form} goToStep={goToStep} variant="full" />

      <Button
        type="button"
        variant="outline"
        className="w-full h-12 gap-2 border-primary/40 text-primary hover:bg-primary/10"
        onClick={() => setPreviewOpen(true)}
      >
        <Eye className="h-4 w-4" />
        Ver prévia em tela cheia antes de enviar
      </Button>

      <SummarySection
        title="1. Identificação"
        onEdit={() => goToStep(1)}
        items={[
          { label: "Apelido", value: values.nickName },
          { label: "WhatsApp", value: values.basicPhone },
        ]}
      />

      <SummarySection
        title="2. Profissional"
        onEdit={() => goToStep(2)}
        items={[
          { label: "Empresa/Divulgador", value: values.companyName },
          { label: "E-mail", value: values.email },
          { label: "Endereço", value: addressLine || null },
        ]}
      />

      <SummarySection
        title="3. Evento"
        onEdit={() => goToStep(3)}
        items={[
          { label: "Categoria", value: values.category },
          { label: "Título", value: values.eventTitle },
          { 
            label: "Data", 
            value: values.date ? format(new Date(values.date), "PPP", { locale: ptBR }) : null 
          },
          { label: "Horário", value: horario },
        ]}
      />

      <SummarySection
        title="4. Atrativo"
        onEdit={() => goToStep(3)}
        items={[
          { label: "Nome", value: values.atrativoName },
          { label: "Tipo", value: values.atrativoType },
          { label: "Estilo", value: values.atrativoStyle },
        ]}
      />

      <SummarySection
        title="5. Local"
        onEdit={() => goToStep(3)}
        items={[
          { label: "Nome do Local", value: values.locationName },
          { label: "Endereço", value: values.eventAddress },
          { label: "Tipo", value: values.locationType === 'commercial' ? 'Estabelecimento' : 'Espaço Público' },
        ]}
      />

      <FullPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} form={form} />
    </div>
  );
}
