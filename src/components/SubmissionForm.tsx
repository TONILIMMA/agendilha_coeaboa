import { useState, useEffect } from "react";
import { handleError } from "@/lib/error-handler";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { z } from "zod";
import { Send, Loader2, Save, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./submission-form/StepIndicator";
import { 
  ContactStep, ProfessionalStep, EventStep, AtrativoStep, 
  LocationStep, MediaStep, LegalStep, ReviewStep 
} from "./submission-form/steps";
import { phoneSchema } from "@/lib/validations";

const formSchema = z.object({
  imageSource: z.enum(["upload", "ai"]).optional(),
  selectedTemplate: z.string().optional(),
  aiTitle: z.string().optional(),
  aiSubtitle: z.string().optional(),
  aiVariant: z.enum(["modern", "vibrant", "elegant"]).optional(),
  eventImageUrl: z.string().optional(),
  eventImageUrlStory: z.string().optional(),
  eventImageUrlWhatsapp: z.string().optional(),
  
  nickName: z.string().trim().min(1, "Seu nome é obrigatório").max(50),
  basicPhone: phoneSchema,

  companyName: z.string().trim().min(1, "Nome completo/Empresa é obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  addressZip: z.string().trim().optional(),
  addressStreet: z.string().trim().optional(),
  addressNumber: z.string().trim().optional(),

  legalAcceptance: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os termos para continuar" }),
  }),

  category: z.string().min(1, "Selecione uma categoria"),
  eventTitle: z.string().trim().optional(),
  date: z.string().trim().min(1, "Selecione a data"),
  startTime: z.string().trim().min(1, "Campo obrigatório"),
  endTime: z.string().trim().optional(),
  
  atrativoName: z.string().trim().min(1, "Atrativo é obrigatório"),
  atrativoType: z.string().trim().min(1, "Tipo de atrativo é obrigatório"),
  atrativoStyle: z.string().trim().optional(),
  atrativoDescription: z.string().trim().max(500).optional(),
  atrativoContact: z.string().trim().optional(),

  locationName: z.string().trim().min(1, "O nome do local é obrigatório"),
  eventAddress: z.string().trim().min(1, "O endereço completo é obrigatório"),
  locationType: z.enum(["public", "commercial"], { required_error: "Selecione o tipo do local" }),
  locationContact: z.string().trim().optional(),

  description: z.string().trim().max(500).optional(),
  contactSocial: z.string().trim().max(300).optional(),
  videoLink: z.string().url("URL inválida").optional().or(z.literal("")),
  additionalDetails: z.string().trim().optional(),
  stage: z.string().optional(),
  responsiblePerson: z.string().trim().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  ageRating: z.enum(["Livre", "14+", "16+", "18+"]).default("Livre"),
  isSuitableForMinors: z.boolean().default(true),
}).refine((data) => {
  if (data.locationType === "commercial" && !data.locationContact) {
    return false;
  }
  return true;
}, {
  message: "Contato do responsável é obrigatório para estabelecimentos comerciais",
  path: ["locationContact"],
});

type FormData = z.infer<typeof formSchema>;

const DRAFT_KEY = "agendilha_event_submission_draft";

export default function SubmissionForm() {
  const [eventImage, setEventImage] = useState<File | string | null>(null);
  const [imageSource, setImageSource] = useState<"upload" | "ai" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { addSubmission } = useSubmissions();
  const { user } = useAuth();
  const { isCollaborator, isPromoter } = usePermissions();
  const { profile, loaded } = useProfile();
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickName: "", basicPhone: "", companyName: "", email: "",
      category: "", eventTitle: "", date: "", startTime: "",
      ageRating: "Livre", isSuitableForMinors: true,
      atrativoName: "", atrativoType: "",
      locationName: "", eventAddress: "", locationType: "commercial",
    },
    mode: "onChange",
  });

  // Load profile data into form when ready
  useEffect(() => {
    if (loaded && profile) {
      const currentValues = form.getValues();
      // Only fill if they are empty
      if (!currentValues.nickName) form.setValue("nickName", profile.responsible_name || "");
      if (!currentValues.basicPhone) form.setValue("basicPhone", profile.phone || "");
      if (!currentValues.companyName) form.setValue("companyName", profile.company_name || profile.responsible_name || "");
      if (!currentValues.email) form.setValue("email", profile.email || "");
      if (!currentValues.addressZip) form.setValue("addressZip", profile.address_zip || "");
      if (!currentValues.addressStreet) form.setValue("addressStreet", profile.address_street || "");
      if (!currentValues.addressNumber) form.setValue("addressNumber", profile.address_number || "");
    }
  }, [loaded, profile, form]);

  // Handle draft loading
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const { data, step } = JSON.parse(saved);
        form.reset(data);
        setCurrentStep(step || 1);
        toast.info("Rascunho do evento recuperado.");
      } catch (e) {
        console.error("Error loading event draft", e);
      }
    }
  }, []);

  // Save draft on change
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        data: value,
        step: currentStep
      }));
    });
    return () => subscription.unsubscribe();
  }, [form.watch, currentStep]);

  const steps = [
    { id: 1, title: "Identificação" },
    { id: 2, title: "Profissional" },
    { id: 3, title: "Evento" },
    { id: 4, title: "Atrativo" },
    { id: 5, title: "Local" },
    { id: 6, title: "Arte" },
    { id: 7, title: "Legal" },
    { id: 8, title: "Revisão" },
  ];

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields as any);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      window.scrollTo(0, 0);
    }
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ["nickName", "basicPhone"];
      case 2: return ["companyName", "email", "addressZip", "addressStreet", "addressNumber"];
      case 3: return ["category", "eventTitle", "date", "startTime", "endTime", "ageRating", "isSuitableForMinors"];
      case 4: return ["atrativoName", "atrativoType", "atrativoStyle", "atrativoDescription", "atrativoContact"];
      case 5: return ["locationName", "eventAddress", "locationType", "locationContact"];
      case 7: return ["legalAcceptance"];
      default: return [];
    }
  };

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    try {
      let imageUrl = values.eventImageUrl;
      
      if (eventImage instanceof File) {
        const fileExt = eventImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('event-flyers')
          .upload(filePath, eventImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseClient.storage
          .from('event-flyers')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      await addSubmission({
        ...values,
        image_url: imageUrl,
        status: 'pendente',
      } as any);

      setSubmitted(true);
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Evento enviado!", { description: "Ele será analisado pela nossa equipe." });
      setTimeout(() => navigate("/agenda"), 3000);
    } catch (error) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    form.reset({
      nickName: profile?.responsible_name || "",
      basicPhone: profile?.phone || "",
      companyName: profile?.company_name || profile?.responsible_name || "",
      email: profile?.email || "",
    });
    setCurrentStep(1);
    toast.success("Rascunho limpo.");
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in-95 duration-500">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h1 className="text-3xl font-bold">Sucesso!</h1>
        <p className="text-muted-foreground">Seu evento foi enviado para moderação.</p>
        <Button onClick={() => navigate("/agenda")}>Voltar para a Agenda</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <StepIndicator steps={steps} currentStep={currentStep} />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetDraft}
          className="text-muted-foreground hover:text-destructive gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="text-[10px] uppercase font-bold tracking-widest">Limpar Rascunho</span>
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
          {currentStep === 1 && <ContactStep form={form} />}
          {currentStep === 2 && <ProfessionalStep form={form} />}
          {currentStep === 3 && <EventStep form={form} />}
          {currentStep === 4 && <AtrativoStep form={form} />}
          {currentStep === 5 && <LocationStep form={form} />}
          {currentStep === 6 && (
            <MediaStep 
              form={form} 
              imageSource={imageSource} 
              setImageSource={setImageSource} 
              eventImage={eventImage} 
              setEventImage={setEventImage} 
            />
          )}
          {currentStep === 7 && <LegalStep form={form} />}
          {currentStep === 8 && <ReviewStep form={form} goToStep={setCurrentStep} />}

          <div className="flex justify-between items-center pt-8 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep} className="gap-2">
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting} className="gap-2 gradient-sunset font-bold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Finalizar Envio
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
