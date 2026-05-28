import { useState, useRef, useCallback, useEffect, useMemo } from "react";
 import { handleError } from "@/lib/error-handler";
 import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissions } from "@/contexts/SubmissionContext";
 import { useProfile } from "@/hooks/useProfile";
 import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { 
  Upload, Send, X, ChevronDown, ChevronUp, CalendarIcon, Search, 
  PlusCircle, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Save,
    Check, User, Info, MapPin, Scale, Eye, PartyPopper, Phone, Sparkles, Image as ImageIcon, Wand2, Loader2, RotateCcw, Download, Palette
 } from "lucide-react";
 import { AIFlyerGenerator } from "./AIFlyerGenerator";
 import { IMaskInput } from "react-imask";
 import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { getWeekdayFromDate } from "@/lib/dateUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StepIndicator } from "./submission-form/StepIndicator";
import { SummarySection } from "./submission-form/SummarySection";
import heroBanner from "@/assets/hero-banner.jpg";
import { generateFallbackFlyer } from "@/lib/generateFallbackFlyer";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

  const formSchema = z.object({
    imageSource: z.enum(["upload", "ai"]).optional(),
    selectedTemplate: z.string().optional(),
    aiTitle: z.string().optional(),
    aiSubtitle: z.string().optional(),
    aiVariant: z.enum(["modern", "vibrant", "elegant"]).optional(),
    eventImageUrl: z.string().optional(),
    eventImageUrlStory: z.string().optional(),
    eventImageUrlWhatsapp: z.string().optional(),
    // 1. Identificação do Divulgador
    nickName: z.string().trim().min(1, "Seu nome é obrigatório").max(50),
    basicPhone: z.string().trim().min(10, "WhatsApp inválido").max(16),

    // 2. Dados Profissionais
    companyName: z.string().trim().min(1, "Nome completo/Empresa é obrigatório").max(100),
    email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
    addressZip: z.string().trim().optional(),
   addressStreet: z.string().trim().optional(),
   addressNumber: z.string().trim().optional(),
 
   // 3. Questões Legais
   legalAcceptance: z.literal(true, {
     errorMap: () => ({ message: "Você precisa aceitar os termos para continuar" }),
   }),
 
   // 4. Informações do Evento
   category: z.string().min(1, "Selecione uma categoria"),
   eventTitle: z.string().trim().optional(),
   date: z.string().trim().min(1, "Selecione a data"),
   startTime: z.string().trim().min(1, "Campo obrigatório"),
   predictedDuration: z.string().trim().optional(),
   endTime: z.string().trim().optional(),
   atrativoName: z.string().trim().min(1, "Atrativo é obrigatório"),
   atrativoType: z.string().trim().min(1, "Tipo de atrativo é obrigatório"),
   atrativoStyle: z.string().trim().optional(),
    atrativoDescription: z.string().trim().max(500).optional(),
   atrativoContact: z.string().trim().optional(),
 
    // 5. Local de Realização
    locationName: z.string().trim().min(1, "O nome do local onde será o evento é obrigatório"),
    eventAddress: z.string().trim().min(1, "O endereço completo do evento é obrigatório"),
   locationType: z.enum(["public", "commercial"], { required_error: "Selecione o tipo do local" }),
   locationContact: z.string().trim().optional(),
 
    // 6. Complementares
    description: z.string().trim().max(500).optional(),
    contactSocial: z.string().trim().max(300).optional(),
    videoLink: z.string().url("URL inválida").optional().or(z.literal("")),
    additionalDetails: z.string().trim().optional(),
    stage: z.string().optional(),
    responsiblePerson: z.string().trim().optional(),
    
    // Campos que estavam faltando mas sendo usados
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().optional(),
    promotionType: z.string().optional(),
    promotionRules: z.string().optional(),
    targetAudience: z.string().optional(),
    salePrice: z.string().optional(),
    maintenanceCost: z.string().optional(),
    subscriptionInfo: z.string().optional(),
    commission: z.string().optional(),
    conceptDescription: z.string().optional(),
    authorization: z.boolean().optional(),
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

const categories = [
  { value: "musica", label: "Música / Show" },
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultura", label: "Cultura / Arte" },
  { value: "esporte", label: "Esporte" },
  { value: "outros", label: "Outros" },
];

const promotionTypes = [
  "Desconto",
  "Brinde",
  "Degustação",
  "Apresentação / Show",
  "Evento gratuito",
  "Sorteio",
  "Outro",
];

interface FileUploadProps {
  label: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}

function FileUpload({ label, accept, file, onFileChange, required }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="font-medium text-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </Label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-3 sm:px-4 py-6 sm:py-8 cursor-pointer transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-[0.98] min-h-[72px]"
      >
        <Upload className="h-6 w-6 text-primary/60" />
        {file ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
              className="rounded-full p-1.5 hover:bg-muted active:bg-muted/80 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground text-center">Toque para enviar ({accept})</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

interface ViaCepData {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

function CepField({ control, onCepFound }: { control: any; onCepFound: (data: ViaCepData) => void }) {
  const [loading, setLoading] = useState(false);

  const fetchCep = useCallback(async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data: ViaCepData = await res.json();
      if (!data.erro) onCepFound(data);
    } catch { /* silently ignore */ }
    setLoading(false);
  }, [onCepFound]);

  return (
    <FormField
      control={control}
      name="addressZip"
      render={({ field }) => (
        <FormItem>
          <FormLabel>CEP</FormLabel>
          <FormControl>
            <Input
              {...field}
              inputMode="numeric"
              placeholder="00000-000"
              className="h-12 text-base"
              onChange={(e) => {
                field.onChange(e);
                fetchCep(e.target.value);
              }}
            />
          </FormControl>
          {loading && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

 export default function SubmissionForm() {
    const [eventImage, setEventImage] = useState<File | string | null>(null);
    const [eventImageStory, setEventImageStory] = useState<string | null>(null);
    const [eventImageWhatsapp, setEventImageWhatsapp] = useState<string | null>(null);
    const [imageSource, setImageSource] = useState<"upload" | "ai" | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [aiStyles, setAiStyles] = useState({
      title: "",
      subtitle: "",
      color: "primary",
      variant: "modern" as "modern" | "vibrant" | "elegant"
    });
   const [submitting, setSubmitting] = useState(false);
   const [submitted, setSubmitted] = useState(false);
   const navigate = useNavigate();
   
   const [portalLocations, setPortalLocations] = useState<{ id: string; name: string }[]>([]);
   const [searchingAtrativo, setSearchingAtrativo] = useState(false);
   const [searchingLocation, setSearchingLocation] = useState(false);
   const [locationSuggestions, setLocationSuggestions] = useState<{ name: string; address?: string; type?: string; contact_responsible?: string }[]>([]);
   const [atrativoSuggestions, setAtrativoSuggestions] = useState<{ name: string; type?: string; style?: string; contact_whatsapp?: string; description?: string }[]>([]);
 
   const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
     basicos: true,
     divulgador: false,
     legal: true,
     evento: true,
     local: true,
     complementares: false,
   });
 
   const { addSubmission } = useSubmissions();
    const { user } = useAuth();
    const { profile, loaded, saveProfile } = useProfile();
 
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickName: "", 
      basicPhone: "",
      companyName: "", 
      email: "",
      category: "", 
      eventTitle: "", 
      date: "", 
      startTime: "",
      ageRating: "Livre",
      isSuitableForMinors: true,
      atrativoName: "", 
      atrativoType: "",
      locationName: "", 
      eventAddress: "", 
      locationType: "commercial",
      legalAcceptance: undefined,
    },
    mode: "onChange",
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const steps = [
     { id: 1, title: "Identificação", description: "Seus dados" },
     { id: 2, title: "Profissional", description: "Informações da conta" },
     { id: 3, title: "Evento", description: "O que vai rolar?" },
     { id: 4, title: "Atrativo", description: "Quem se apresenta?" },
     { id: 5, title: "Local", description: "Onde vai ser?" },
     { id: 6, title: "Arte", description: "Flyer/Banner" },
     { id: 7, title: "Legal", description: "Termos" },
     { id: 8, title: "Revisão", description: "Confira tudo" },
   ];

   const nextStep = async () => {
     const fieldsToValidate = getFieldsForStep(currentStep);
     const isValid = await form.trigger(fieldsToValidate as any);
     
     if (isValid) {
       // Save state to form before moving for draft persistence
       if (currentStep === 6) {
         form.setValue("imageSource", imageSource as any);
         form.setValue("selectedTemplate", selectedTemplate as any);
         form.setValue("aiTitle", aiStyles.title);
         form.setValue("aiSubtitle", aiStyles.subtitle);
         form.setValue("aiVariant", aiStyles.variant);
         if (typeof eventImage === 'string') {
           form.setValue("eventImageUrl", eventImage);
         }
       }
       
       const newStep = Math.min(currentStep + 1, steps.length);
       setCurrentStep(newStep);
       localStorage.setItem("agendilha_step", String(newStep));
       saveDraft(); // Auto-save on step change
       window.scrollTo(0, 0);
     }
   };

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1);
    setCurrentStep(newStep);
    localStorage.setItem("agendilha_step", String(newStep));
    window.scrollTo(0, 0);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    localStorage.setItem("agendilha_step", String(step));
    window.scrollTo(0, 0);
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ["nickName", "basicPhone"];
      case 2: return ["companyName", "email", "addressZip", "addressStreet", "addressNumber"];
      case 3: return ["category", "eventTitle", "date", "startTime", "predictedDuration", "endTime", "ageRating", "isSuitableForMinors"];
      case 4: return ["atrativoName", "atrativoType", "atrativoStyle", "atrativoDescription", "atrativoContact"];
       case 5: return ["locationName", "eventAddress", "locationType", "locationContact"];
       case 6: return []; // Step 6 is image, handled via state
       case 7: return ["legalAcceptance"];
       default: return [];
    }
  };

  const isSuspicious = useMemo(() => {
    const title = form.watch("eventTitle") || "";
    const desc = form.watch("description") || "";
    const words = ['porra', 'caralho', 'fuder', 'sexo', 'porn', 'putaria'];
    return words.some(w => title.toLowerCase().includes(w) || desc.toLowerCase().includes(w));
  }, [form.watch("eventTitle"), form.watch("description")]);

  const saveDraft = async () => {
    setIsSavingDraft(true);
    const currentValues = form.getValues();
    localStorage.setItem("agendilha_draft", JSON.stringify(currentValues));
    
    // If we have basic user data, save to profile as draft
    if (currentValues.nickName && currentValues.basicPhone) {
      await saveProfile({
        nick_name: currentValues.nickName,
        phone: currentValues.basicPhone,
        company_name: currentValues.companyName,
        email: currentValues.email || "",
      } as any);
    }
    
    toast.success("Rascunho salvo!", { description: "Você pode continuar depois." });
    setTimeout(() => setIsSavingDraft(false), 500);
  };

   useEffect(() => {
     const draft = localStorage.getItem("agendilha_draft");
     const savedStep = localStorage.getItem("agendilha_step");
     
     if (draft) {
       try {
         const parsed = JSON.parse(draft);
         form.reset(parsed);
         
         // Restore AI/Image state
         if (parsed.imageSource) setImageSource(parsed.imageSource);
         if (parsed.selectedTemplate) setSelectedTemplate(parsed.selectedTemplate);
         if (parsed.aiTitle || parsed.aiSubtitle || parsed.aiVariant) {
           setAiStyles({
             title: parsed.aiTitle || "",
             subtitle: parsed.aiSubtitle || "",
             color: "primary", // Default or derived
             variant: parsed.aiVariant || "modern"
           });
         }
        if (parsed.eventImageUrl) setEventImage(parsed.eventImageUrl);
        if (parsed.eventImageUrlStory) setEventImageStory(parsed.eventImageUrlStory);
        if (parsed.eventImageUrlWhatsapp) setEventImageWhatsapp(parsed.eventImageUrlWhatsapp);
         
         if (savedStep) {
           const stepNum = parseInt(savedStep);
           if (stepNum > 1 && stepNum <= steps.length) {
             setCurrentStep(stepNum);
           }
         }
         
         toast.info("Rascunho recuperado", { description: "Continuamos de onde você parou." });
       } catch (e) {
         console.error("Error parsing draft", e);
       }
     }
   }, [form]);
 
   useEffect(() => {
     const fetchPortalLocations = async () => {
       const { data } = await supabaseClient.from("portal_locations").select("id, name").order("name");
       if (data) setPortalLocations(data);
     };
     fetchPortalLocations();
   }, []);
 
   useEffect(() => {
     if (!loaded || !user) return;
     
     // Check if we already have data in form or localStorage draft
     const currentValues = form.getValues();
     const hasDraft = !!localStorage.getItem("agendilha_draft");
     const isDefault = !currentValues.nickName && !currentValues.companyName && !hasDraft;
     
     if (isDefault) {
       form.reset({
         ...currentValues,
         nickName: profile.nick_name || "",
         basicPhone: profile.phone || "",
         companyName: profile.company_name || "",
         email: profile.email || "",
         addressStreet: profile.address_street || "",
         addressNumber: profile.address_number || "",
         addressZip: profile.address_zip || "",
         contactSocial: profile.contact_social || "",
       } as any);
     }
   }, [loaded, profile, form, user]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const descriptionLength = form.watch("description")?.length || 0;


   async function onSubmit(data: FormData) {
     setSubmitting(true);
     
      let imageUrl = typeof eventImage === 'string' ? eventImage : null;
      let imageUrlStory = eventImageStory;
      let imageUrlWhatsapp = eventImageWhatsapp;

      if (eventImage && typeof eventImage !== 'string') {
         const fileExt = eventImage.name.split('.').pop();
         const fileName = `${user?.id || 'anon'}/${crypto.randomUUID()}.${fileExt}`;
         const { data: uploadData, error: uploadError } = await supabaseClient.storage
           .from('event-flyers')
           .upload(fileName, eventImage);
         
          if (uploadError) {
            handleError(uploadError, "Erro ao enviar a imagem. Tente novamente.");
            setSubmitting(false);
            return;
          } else {
           const { data: { publicUrl } } = supabaseClient.storage
             .from('event-flyers')
             .getPublicUrl(fileName);
          imageUrl = publicUrl;
         }
       }

      // Helper to upload dataURLs from IA generator
      const uploadDataUrl = async (dataUrl: string, suffix: string) => {
        if (!dataUrl.startsWith('data:image')) return dataUrl;
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fileName = `${user?.id || 'anon'}/${crypto.randomUUID()}-${suffix}.png`;
        const { error: uploadError } = await supabaseClient.storage
          .from('event-flyers')
          .upload(fileName, blob);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabaseClient.storage
          .from('event-flyers')
          .getPublicUrl(fileName);
        return publicUrl;
      };

      if (imageUrl?.startsWith('data:image')) {
        imageUrl = await uploadDataUrl(imageUrl, 'feed');
      }
      if (imageUrlStory?.startsWith('data:image')) {
        imageUrlStory = await uploadDataUrl(imageUrlStory, 'story');
      }
      if (imageUrlWhatsapp?.startsWith('data:image')) {
        imageUrlWhatsapp = await uploadDataUrl(imageUrlWhatsapp, 'whatsapp');
      }

      // Fallback: gerar flyer padrão Coé a Boa? quando não houver imagem
      if (!imageUrl) {
        try {
          const flyerDataUrl = await generateFallbackFlyer({
            title: data.eventTitle || data.atrativoName || "Evento",
            date: data.date,
            startTime: data.startTime,
            location: data.locationName,
            category: data.category,
          });
          imageUrl = await uploadDataUrl(flyerDataUrl, 'auto-flyer');
        } catch (err) {
          console.error("Falha ao gerar flyer padrão:", err);
        }
      }

    const submissionData = {
      company_name: data.companyName,
      responsible_name: data.nickName,
      email: data.email || null,
      phone: data.basicPhone.startsWith('+55') ? data.basicPhone : `+55${data.basicPhone.replace(/\D/g, '')}`,
      event_title: data.eventTitle || data.atrativoName,
      date: data.date,
      start_time: data.startTime,
      predicted_duration: data.predictedDuration || null,
      end_time: data.endTime || null,
      location: data.locationName,
      location_type: data.locationType,
      location_contact: data.locationContact || null,
      address_street: data.eventAddress,
      address_zip: data.addressZip || null,
      address_number: data.addressNumber || null,
      atrativo_name: data.atrativoName,
      atrativo_type: data.atrativoType,
      atrativo_style: data.atrativoStyle || null,
      atrativo_contact: data.atrativoContact || null,
      description: data.description || null,
      video_link: data.videoLink || null,
      category: data.category,
      contact_social: data.contactSocial || null,
      additional_details: data.additionalDetails || null,
      legal_acceptance: data.legalAcceptance,
      legal_acceptance_date: new Date().toISOString(),
      stage: data.stage || "development",
       responsible_person: data.responsiblePerson || "Toni",
       status: "pending",
      image_url: imageUrl,
      image_url_story: imageUrlStory,
      image_url_whatsapp: imageUrlWhatsapp,
       age_rating: data.ageRating,
       is_suitable_for_minors: data.isSuitableForMinors
    };

    const success = await addSubmission(submissionData as any);

     if (success) {
       localStorage.removeItem("agendilha_draft");
       localStorage.removeItem("agendilha_step");
       
       if (user) {
         saveProfile({
           nick_name: data.nickName,
           phone: data.basicPhone.startsWith('+55') ? data.basicPhone : `+55${data.basicPhone.replace(/\D/g, '')}`,
           company_name: data.companyName,
           email: data.email || "",
           address_street: data.addressStreet || "",
           address_number: data.addressNumber || "",
           address_zip: data.addressZip || "",
           contact_social: data.contactSocial || "",
         } as any);
       }
       
       setSubmitted(true);
       window.scrollTo({ top: 0, behavior: 'smooth' });
     }
    setSubmitting(false);
   }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-40 xs:h-48 sm:h-64 md:h-80 overflow-hidden">
        <img src={heroBanner} alt="Paisagem tropical" className="absolute inset-0 w-full h-full object-cover" width={1920} height={640} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-background/90" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-3 sm:px-4">
          <h1 className="font-display text-xl xs:text-2xl sm:text-3xl md:text-5xl font-extrabold text-primary-foreground drop-shadow-lg leading-tight">
            📌 Informações de Eventos
          </h1>
          <p className="mt-1 sm:mt-2 font-display text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-primary-foreground/90 drop-shadow">
            AgendIlha / Coé a Boa?
          </p>
          {submitted && (
            <Button
              onClick={() => navigate("/agenda")}
              className="mt-3 sm:mt-4 bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-sm sm:text-base px-6 py-2 rounded-full shadow-lg animate-in fade-in zoom-in duration-300"
            >
              📅 Ver Agenda de Eventos
            </Button>
          )}
        </div>
      </div>

      {/* Form Container */}
      <div className="mx-auto max-w-2xl px-2 xs:px-3 sm:px-4 -mt-6 xs:-mt-8 sm:-mt-10 relative z-20 pb-12 sm:pb-16">
        <div className="rounded-xl sm:rounded-2xl bg-card shadow-elevated p-3 xs:p-4 sm:p-6 md:p-10">
          {submitted ? (
            <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-3xl font-black mb-4">Solicitação Enviada!</h2>
              <div className="space-y-4 mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  Obrigado por enviar seu evento. Nossa equipe fará a curadoria e você será notificado em breve.
                </p>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-left">
                  <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Acompanhe o status na sua conta:
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Vá em <strong>Menu &gt; Envios</strong> para ver o andamento deste e de outros eventos.
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-2xl p-6 mb-8 text-left space-y-4 border border-border/50 shadow-inner">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status Inicial</span>
                  <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[10px] px-3 py-1">PENDENTE</Badge>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Resumo do Evento</p>
                  <p className="font-black text-lg text-foreground leading-tight">{form.getValues("eventTitle") || form.getValues("atrativoName")}</p>
                  <p className="text-sm text-muted-foreground font-medium mt-1 flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {form.getValues("date")} às {form.getValues("startTime")}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Vinculado à conta</p>
                  <p className="text-sm font-bold text-foreground">{profile.nick_name || profile.responsible_name || "Sua Conta"}</p>
                </div>
              </div>

              <div className="grid gap-3">
                <Button onClick={() => navigate("/")} variant="outline" size="lg" className="font-bold h-12 w-full border-2">
                  Voltar para a Home
                </Button>
                <Button onClick={() => navigate("/agenda")} size="lg" className="font-bold h-12 w-full gradient-sunset text-primary-foreground shadow-lg">
                  Ver Agenda Pública
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 sm:mb-8">
                O <strong className="text-secondary">Coé a Boa?</strong> é o portal que conecta a comunidade às melhores experiências locais.
                No <strong className="text-secondary">AgendIlha</strong>, você pode divulgar seus eventos, promoções e novidades com visibilidade garantida.
              </p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-8">
                  <StepIndicator steps={steps} currentStep={currentStep} />
                  
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold">1. Identificação</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                        Evento vinculado à conta: <strong>{profile.nick_name || profile.responsible_name || "Divulgador"}</strong>
                      </p>
                      <TextField control={form.control} name="nickName" label="Seu Nome" />
                      <FormField
                        control={form.control}
                        name="basicPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">WhatsApp de Contato <span className="text-accent">*</span></FormLabel>
                            <FormControl>
                              <IMaskInput
                                mask="(00) 00000-0000"
                                definitions={{
                                  '0': /[0-9]/
                                }}
                                value={field.value}
                                unmask={false}
                                onAccept={(value) => field.onChange(value)}
                                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="(99) 99999-9999"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {isSuspicious && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-amber-800">Linguagem Detectada</p>
                            <p className="text-xs text-amber-700">Detectamos termos que podem precisar de revisão. Evite linguagem ofensiva para garantir aprovação rápida.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-bold">2. Dados Profissionais</h2>
                      <TextField control={form.control} name="companyName" label="Nome da Empresa / Projeto" />
                      <TextField control={form.control} name="email" label="E-mail" required={false} />
                      <CepField control={form.control} onCepFound={(data) => {
                        form.setValue("addressStreet", data.logradouro || "");
                        form.setValue("addressNeighborhood", data.bairro || "");
                        form.setValue("addressCity", data.localidade || "");
                        form.setValue("addressState", data.uf || "");
                      }} />
                      <TextField control={form.control} name="addressStreet" label="Rua" required={false} />
                      <TextField control={form.control} name="addressNumber" label="Número / Complemento" required={false} />
                    </div>
                  )}

               {currentStep === 3 && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <PartyPopper className="h-5 w-5 text-primary" />
                      3. Informações do Evento
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <FormField
                        control={form.control}
                        name="ageRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Classificação Etária</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Livre">Livre</SelectItem>
                                <SelectItem value="14+">14+</SelectItem>
                                <SelectItem value="16+">16+</SelectItem>
                                <SelectItem value="18+">18+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isSuitableForMinors"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-card">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-bold">
                                Adequado para menores?
                              </FormLabel>
                              <p className="text-[10px] text-muted-foreground leading-tight">
                                Assinale se o conteúdo é seguro para todos.
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                   
                   <div className="grid gap-4 sm:grid-cols-2">
                     <FormField
                       control={form.control}
                       name="category"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Categoria <span className="text-accent">*</span></FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                             <FormControl>
                               <SelectTrigger className="h-12 text-base">
                                 <SelectValue placeholder="Selecione a categoria" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               {categories.map((cat) => (
                                 <SelectItem key={cat.value} value={cat.value} className="py-2">{cat.label}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <FormMessage />
                         </FormItem>
                       )}
                     />
                     <TextField control={form.control} name="eventTitle" label="Título do evento (opcional)" />
                     
                     <FormField
                       control={form.control}
                       name="date"
                       render={({ field }) => {
                         const weekday = getWeekdayFromDate(field.value || "");
                         let selectedDate: Date | undefined;
                         if (field.value && /^\d{2}\/\d{2}\/\d{4}$/.test(field.value)) {
                           const [d, m, y] = field.value.split("/").map(Number);
                           selectedDate = new Date(y, m - 1, d);
                         }
                         return (
                           <FormItem className="flex flex-col">
                             <FormLabel>Data <span className="text-accent">*</span></FormLabel>
                             <Popover>
                               <PopoverTrigger asChild>
                                 <FormControl>
                                   <Button variant="outline" className={cn("h-12 w-full justify-start text-left text-base font-normal", !field.value && "text-muted-foreground")}>
                                     <CalendarIcon className="mr-2 h-4 w-4" />
                                     {field.value ? (
                                       <span className="capitalize">{field.value} {weekday && <span className="ml-1 text-primary">({weekday})</span>}</span>
                                     ) : "Selecione a data"}
                                   </Button>
                                 </FormControl>
                               </PopoverTrigger>
                               <PopoverContent className="w-auto p-0" align="start">
                                 <Calendar
                                   mode="single"
                                   selected={selectedDate}
                                   onSelect={(date) => date && field.onChange(format(date, "dd/MM/yyyy"))}
                                   disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                   locale={ptBR}
                                   initialFocus
                                 />
                               </PopoverContent>
                             </Popover>
                             <FormMessage />
                           </FormItem>
                         );
                       }}
                     />
                     
                     <div className="grid grid-cols-2 gap-4">
                       <TextField control={form.control} name="startTime" label="Início" type="time" />
                       <TextField control={form.control} name="endTime" label="Término" type="time" required={false} />
                     </div>
                   </div>
                 </div>
               )}

               {currentStep === 4 && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <User className="h-5 w-5 text-primary" />
                     4. Atrativo
                   </h2>
                   <TextField control={form.control} name="atrativoName" label="Nome do Atrativo" />
                   <TextField control={form.control} name="atrativoType" label="Tipo (Banda, DJ, Palestrante...)" />
                   <TextField control={form.control} name="atrativoContact" label="WhatsApp do Atrativo" />
                   <FormField
                     control={form.control}
                     name="atrativoDescription"
                     render={({ field }) => (
                       <FormItem>
                         <FormLabel>Breve descrição</FormLabel>
                         <FormControl>
                           <Textarea {...field} placeholder="Conte um pouco sobre o atrativo..." className="min-h-[100px] text-base" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>
               )}

               {currentStep === 5 && (
                 <div className="space-y-6 animate-in fade-in duration-500">
                   <h2 className="text-xl font-bold flex items-center gap-2">
                     <MapPin className="h-5 w-5 text-primary" />
                     5. Local do Evento
                   </h2>
                   <TextField control={form.control} name="locationName" label="Nome do Local" />
                   <TextField control={form.control} name="eventAddress" label="Endereço Completo" />
                   
                   <FormField
                     control={form.control}
                     name="locationType"
                     render={({ field }) => (
                       <FormItem className="space-y-3">
                         <FormLabel>Tipo do Local</FormLabel>
                         <FormControl>
                           <div className="flex gap-4">
                             <label className={cn(
                               "flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                               field.value === "public" ? "border-primary bg-primary/5" : "border-muted"
                             )}>
                               <input type="radio" className="hidden" checked={field.value === "public"} onChange={() => field.onChange("public")} />
                               <span className="font-bold">Área Pública</span>
                             </label>
                             <label className={cn(
                               "flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                               field.value === "commercial" ? "border-primary bg-primary/5" : "border-muted"
                             )}>
                               <input type="radio" className="hidden" checked={field.value === "commercial"} onChange={() => field.onChange("commercial")} />
                               <span className="font-bold">Comercial</span>
                             </label>
                           </div>
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                   
                   {form.watch("locationType") === "commercial" && (
                     <TextField control={form.control} name="locationContact" label="Contato do Responsável" />
                   )}
                 </div>
               )}

                {currentStep === 6 && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      6. Arte do Evento
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => { setImageSource("upload"); setEventImage(null); }}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3",
                          imageSource === "upload" ? "border-primary bg-primary/5 shadow-md" : "border-muted hover:border-primary/30"
                        )}
                      >
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold">Enviar meu flyer</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG ou JPG até 5MB</p>
                        </div>
                      </button>
                      
                      <button 
                        type="button"
                        onClick={() => { setImageSource("ai"); setEventImage(null); }}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all gap-3 relative overflow-hidden group",
                          imageSource === "ai" ? "border-secondary bg-secondary/5 shadow-md" : "border-muted hover:border-secondary/30"
                        )}
                      >
                        <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Wand2 className="h-6 w-6 text-secondary" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold">Criar flyer com IA</p>
                          <p className="text-xs text-muted-foreground mt-1">Gere um flyer automaticamente</p>
                        </div>
                        <Sparkles className="absolute top-2 right-2 h-4 w-4 text-secondary opacity-40" />
                      </button>
                    </div>

                    {imageSource === "upload" && (
                      <div className="animate-in slide-in-from-top-4 duration-300">
                        <FileUpload 
                          label="Seu flyer ou banner" 
                          accept="image/*" 
                          file={eventImage instanceof File ? eventImage : null} 
                          onFileChange={(f) => setEventImage(f)} 
                        />
                      </div>
                    )}

                     {imageSource === "ai" && !eventImage && (
                       <div className="animate-in slide-in-from-top-4 duration-500">
                         <AIFlyerGenerator 
                            initialData={{
                              title: form.getValues("eventTitle") || "",
                              artist: form.getValues("atrativoName") || "",
                              date: form.getValues("date") || "",
                              time: form.getValues("startTime") || "",
                              location: form.getValues("locationName") || "",
                              neighborhood: form.getValues("addressNeighborhood") || "",
                              category: form.getValues("category") || "musica"
                            }}
                             onFlyerGenerated={(urls) => {
                               setEventImage(urls.feed);
                               setEventImageStory(urls.story);
                               setEventImageWhatsapp(urls.whatsapp);
                             }}
                         />
                       </div>
                     )}

                     {eventImage && imageSource === "ai" && (
                       <div className="space-y-6 animate-in zoom-in-95 duration-500">
                         <div className="relative group rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-muted max-w-sm mx-auto">
                           <img 
                             src={typeof eventImage === 'string' ? eventImage : URL.createObjectURL(eventImage)} 
                             alt="Flyer gerado" 
                             className="w-full h-auto"
                           />
                           <div className="absolute top-4 left-4 z-10 bg-secondary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                             ✨ Flyer Finalizado
                           </div>
                         </div>
                         
                         <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => { setEventImage(null); }}
                              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest border-2"
                            >
                              <RotateCcw className="mr-2 h-4 w-4" /> Editar Novamente
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => { setImageSource("upload"); setEventImage(null); }}
                              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest border-2"
                            >
                              <Upload className="mr-2 h-4 w-4" /> Upload Manual
                            </Button>
                         </div>
                       </div>
                     )}

                    {eventImage && imageSource === "upload" && (
                      <div className="relative mt-4 group rounded-2xl overflow-hidden border-2 border-border shadow-inner bg-muted">
                        <img 
                          src={typeof eventImage === 'string' ? eventImage : URL.createObjectURL(eventImage)} 
                          alt="Pré-visualização" 
                          className="w-full h-auto max-h-96 object-contain mx-auto"
                        />
                        <button 
                          type="button"
                          onClick={() => { setEventImage(null); setImageSource(null); }}
                          className="absolute top-2 right-2 z-10 h-8 w-8 bg-black/60 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Scale className="h-5 w-5 text-primary" />
                      7. Questões Legais
                    </h2>
                    
                    <div className="p-4 bg-muted rounded-xl space-y-4">
                      <p className="text-sm leading-relaxed">
                        Ao prosseguir, você concorda com nossos <a href="#" className="text-primary underline font-bold">Termos de Uso</a> e autoriza a publicação das informações fornecidas no portal AgendIlha.
                      </p>
                      
                      <FormField
                        control={form.control}
                        name="legalAcceptance"
                        render={({ field }) => (
                          <FormItem className="flex items-start gap-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} className="h-5 w-5" />
                            </FormControl>
                            <FormLabel className="font-bold cursor-pointer text-base">Eu aceito e autorizo a publicação</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormMessage />
                    </div>
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      8. Prévia Final
                    </h2>
                    
                      <SummarySection title="👤 Identificação" items={[
                        { label: "Nome", value: form.watch("nickName") || "" },
                        { label: "WhatsApp", value: form.watch("basicPhone") || "" }
                      ]} onEdit={() => goToStep(1)} />
 
                     <SummarySection title="💼 Divulgador" items={[
                       { label: "Empresa", value: form.watch("companyName") },
                       { label: "E-mail", value: form.watch("email") },
                       { label: "Endereço", value: `${form.watch("addressStreet") || ""}, ${form.watch("addressNumber") || ""}` }
                     ]} onEdit={() => goToStep(2)} />
 
                     <SummarySection title="🎉 Evento" items={[
                       { label: "Título", value: form.watch("eventTitle") },
                       { label: "Data", value: form.watch("date") },
                       { label: "Horário", value: `${form.watch("startTime") || ""} às ${form.watch("endTime") || ""}` }
                     ]} onEdit={() => goToStep(3)} />
 
                     <SummarySection title="🎤 Atrativo" items={[
                       { label: "Nome", value: form.watch("atrativoName") },
                       { label: "Tipo", value: form.watch("atrativoType") }
                     ]} onEdit={() => goToStep(4)} />
 
                     <SummarySection title="📍 Local" items={[
                       { label: "Nome do Local", value: form.watch("locationName") },
                       { label: "Endereço", value: form.watch("eventAddress") }
                     ]} onEdit={() => goToStep(5)} />

                      {eventImage && (
                         <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
                           <div className="flex items-center justify-between">
                             <h3 className="font-bold text-sm flex items-center gap-2">🖼️ Arte do Evento</h3>
                             <Button variant="ghost" size="sm" onClick={() => goToStep(6)} className="h-8 text-xs font-bold text-primary">Editar</Button>
                           </div>
                           <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted max-w-[200px]">
                             <img 
                               src={typeof eventImage === 'string' ? eventImage : URL.createObjectURL(eventImage)} 
                               alt="Flyer final" 
                               className="w-full h-full object-cover"
                             />
                           </div>
                         </div>
                      )}
                    
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Tudo pronto! Revise as informações acima e envie sua solicitação.</p>
                    </div>
                  </div>
                )}


                  <div className="pt-4 sm:pt-8 border-t border-border space-y-4">
                    {currentStep < steps.length ? (
                      <div className="flex gap-3">
                        {currentStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={prevStep}
                            className="flex-1 font-bold h-12"
                          >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Voltar
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="lg"
                          onClick={nextStep}
                          className={cn(
                            "flex-1 font-bold h-12 gradient-sunset text-primary-foreground",
                            currentStep === 1 && "w-full"
                          )}
                        >
                          Continuar
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={prevStep}
                            className="flex-1 font-bold h-12"
                            disabled={submitting}
                          >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Editar
                          </Button>
                          <Button
                            type="submit"
                            size="lg"
                            disabled={submitting}
                            className="flex-1 font-bold h-12 bg-green-600 hover:bg-green-700 text-white shadow-lg"
                          >
                            {submitting ? (
                              "Enviando..."
                            ) : (
                              <>
                                <Send className="mr-2 h-5 w-5" />
                                Enviar Solicitação
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={saveDraft}
                      disabled={isSavingDraft || submitting}
                      className="w-full text-muted-foreground hover:text-primary h-10 gap-2"
                    >
                      {isSavingDraft ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Salvando...
                        </span>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Rascunho para Continuar Depois
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, sectionKey, expanded, onToggle, children }: {
  title: string; sectionKey: string; expanded: boolean; onToggle: (key: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="flex w-full items-center justify-between font-display text-base sm:text-lg font-bold text-foreground border-b border-border pb-2 active:opacity-70 transition-opacity"
      >
        <span>{title}</span>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {expanded && <div className="animate-accordion-down">{children}</div>}
    </div>
  );
}

function TextField({
  control, name, label, type = "text", className = "", required = true, inputMode, placeholder,
}: {
  control: any; name: string; label: string; type?: string; className?: string; required?: boolean; inputMode?: "text" | "email" | "tel" | "url" | "numeric" | "search"; placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-sm">{label} {required && <span className="text-accent">*</span>}</FormLabel>
          <FormControl>
            <Input {...field} type={type} inputMode={inputMode} placeholder={placeholder} className="h-12 text-base" />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
