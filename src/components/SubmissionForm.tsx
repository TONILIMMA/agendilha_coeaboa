import { useState, useEffect, useRef } from "react";
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
import { Send, Loader2, Save, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Check } from "lucide-react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./submission-form/StepIndicator";
import { 
  ContactStep, ProfessionalStep, EventStep, AtrativoStep, 
  LocationStep, MediaStep, LegalStep, ReviewStep 
} from "./submission-form/steps";
import { validateBrazilianMobile } from "@/lib/whatsapp";

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
  basicPhone: z.string().trim().min(1, "Informe o WhatsApp").superRefine((val, ctx) => {
    const v = validateBrazilianMobile(val);
    if (v.valid === false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
    }
  }),

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
  ageRating: z.enum(["Livre", "10+", "12+", "14+", "16+", "18+"]).default("Livre"),
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
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftLoadedRef = useRef(false);

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
        const { data, step, savedAt } = JSON.parse(saved);
        form.reset(data);
        setCurrentStep(step || 1);
        if (savedAt) setDraftSavedAt(new Date(savedAt));
        toast.info("Rascunho do evento recuperado.");
      } catch (e) {
        console.error("Error loading event draft", e);
      }
    }
    draftLoadedRef.current = true;
  }, []);

  // Save draft on change (debounced, only after initial load)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const subscription = form.watch((value) => {
      if (!draftLoadedRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const now = new Date();
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            data: value,
            step: currentStep,
            savedAt: now.toISOString(),
          }));
          setDraftSavedAt(now);
        } catch (e) {
          console.error("Error saving event draft", e);
        }
      }, 600);
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
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
      const clean = (v?: string | null) => {
        if (v == null) return null;
        const s = String(v).trim();
        if (!s) return null;
        if (/^não informado$/i.test(s)) return null;
        return s;
      };

      let imageUrl = values.eventImageUrl;
      
      if (eventImage instanceof File) {
        const fileExt = eventImage.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
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

      // Map camelCase form fields → snake_case DB columns
      const payload: any = {
        company_name: clean(values.companyName),
        responsible_name: clean(values.nickName),
        email: clean(values.email),
        phone: clean(values.basicPhone),
        event_title: clean(values.eventTitle) || clean(values.atrativoName),
        date: clean(values.date),
        start_time: clean(values.startTime),
        end_time: clean(values.endTime),
        location: clean(values.locationName),
        address_street: clean(values.addressStreet),
        address_number: clean(values.addressNumber),
        address_neighborhood: clean(values.addressNeighborhood),
        address_city: clean(values.addressCity),
        address_state: clean(values.addressState),
        address_zip: clean(values.addressZip),
        description: clean(values.description),
        video_link: clean(values.videoLink),
        category: clean(values.category),
        contact_social: clean(values.contactSocial),
        additional_details: clean(values.additionalDetails),
        stage: clean(values.stage) || 'submitted',
        responsible_person: clean(values.responsiblePerson),
        atrativo_name: clean(values.atrativoName),
        atrativo_type: clean(values.atrativoType),
        atrativo_style: clean(values.atrativoStyle),
        atrativo_contact: clean(values.atrativoContact),
        location_type: values.locationType,
        location_contact: clean(values.locationContact),
        legal_acceptance: values.legalAcceptance,
        legal_acceptance_date: values.legalAcceptance ? new Date().toISOString() : null,
        terms_accepted: values.legalAcceptance,
        terms_accepted_at: values.legalAcceptance ? new Date().toISOString() : null,
        age_rating: values.ageRating,
        is_suitable_for_minors: values.isSuitableForMinors,
        image_url: imageUrl || null,
        image_url_story: values.eventImageUrlStory || null,
        image_url_whatsapp: values.eventImageUrlWhatsapp || null,
        status: 'pendente',
      };

      const result = await addSubmission(payload as any);

      if (!result) return; // toast already shown by ctx

      localStorage.removeItem(DRAFT_KEY);
      navigate(`/evento-enviado/${result.id}`, { replace: true });
    } catch (error) {
      console.error("[SubmissionForm.onSubmit] failed", error);
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errors: any) => {
    const firstKey = Object.keys(errors)[0];
    const firstMsg = errors[firstKey]?.message || "Verifique os campos obrigatórios";
    toast.error("Não foi possível finalizar o envio", { description: String(firstMsg) });
    // Jump to the first step that has an error
    const stepMap: Record<string, number> = {
      nickName: 1, basicPhone: 1,
      companyName: 2, email: 2, addressZip: 2, addressStreet: 2, addressNumber: 2,
      category: 3, eventTitle: 3, date: 3, startTime: 3, endTime: 3,
      atrativoName: 4, atrativoType: 4, atrativoStyle: 4, atrativoDescription: 4, atrativoContact: 4,
      locationName: 5, eventAddress: 5, locationType: 5, locationContact: 5,
      legalAcceptance: 7,
    };
    const target = stepMap[firstKey];
    if (target) setCurrentStep(target);
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
    setDraftSavedAt(null);
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
        <div className="flex items-center gap-2">
          {draftSavedAt && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-emerald-600">
              <Check className="h-3 w-3" />
              Rascunho salvo {draftSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
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
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8 mt-8">
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
