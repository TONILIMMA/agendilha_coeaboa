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
import { PublishChecklist } from "./submission-form/PublishChecklist";
import { 
  ContactStep, ProfessionalStep, EventStep, AtrativoStep, 
  LocationStep, MediaStep, LegalStep, ReviewStep 
} from "./submission-form/steps";
import { validateBrazilianMobile } from "@/lib/whatsapp";
import { generateFallbackFlyer } from "@/lib/generateFallbackFlyer";
import { emitEntityCreated } from "@/lib/entityEvents";
import { usePromotorProfile, upsertPromotorProfile } from "@/data/usePromotorProfile";

const formSchema = z.object({
  imageSource: z.enum(["upload", "ai"]).optional(),
  selectedTemplate: z.string().optional(),
  aiTitle: z.string().optional(),
  aiSubtitle: z.string().optional(),
  aiVariant: z.enum(["modern", "vibrant", "elegant"]).optional(),
  eventImageUrl: z.string().optional(),
  eventImageUrlStory: z.string().optional(),
  eventImageUrlWhatsapp: z.string().optional(),
  fotos: z.array(z.string().url()).default([]),
  
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
  // Novo modelo (Fase 7): "Responsável pelo evento".
  // Substitui o antigo seletor promotor/atrativo/estabelecimento.
  responsavelNome: z.string().trim().min(1, "Informe o nome do responsável").max(100),
  usarMeuWhatsapp: z.boolean().default(true),
  // duvidasWhatsapp = WhatsApp do responsável (mantivemos o nome do campo p/ compat com backend).
  duvidasWhatsapp: z.string().trim().optional().default(""),
  // Campo legado — mantido em 'promotor' pra compat com telas antigas.
  duvidasSource: z.enum(["promotor", "atrativo", "estabelecimento"]).default("promotor"),
  duvidasAuthorized: z.literal(true, {
    errorMap: () => ({ message: "Você precisa autorizar o uso deste WhatsApp" }),
  }),
  // Caracterização opcional do responsável (reaproveitada em divulgações futuras).
  tipoResponsavel: z.enum(["artista", "estabelecimento", "produtor", "outro"]).optional(),
  perfilNomeArtistico: z.string().trim().max(120).optional(),
  perfilEstiloMusical: z.string().trim().max(120).optional(),
  perfilLinkPrincipal: z.string().trim().max(300).optional(),
  perfilNomeEstabelecimento: z.string().trim().max(120).optional(),
  perfilCategoriaLocal: z.string().trim().max(80).optional(),
  perfilEnderecoResumido: z.string().trim().max(200).optional(),

  category: z.string().trim().optional(),
  eventTitle: z.string().trim().min(1, "Dá um nome pro rolê"),
  date: z.string().trim().min(1, "Selecione a data"),
  startTime: z.string().trim().min(1, "Campo obrigatório"),
  endTime: z.string().trim().optional(),
  
  atrativoName: z.string().trim().min(1, "Atrativo é obrigatório"),
  atrativoType: z.string().trim().optional(),
  atrativoStyle: z.string().trim().optional(),
  atrativoDescription: z.string().trim().max(500).optional(),
  atrativoContact: z.string().trim().min(1, "WhatsApp do atrativo é obrigatório").superRefine((val, ctx) => {
    const v = validateBrazilianMobile(val);
    if (v.valid === false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
    }
  }),
  atrativoEmail: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  atrativoCategory: z.enum(["musica", "gastronomia", "cultura", "esporte", "turismo", "outros"], {
    errorMap: () => ({ message: "Selecione uma categoria (inclui Turismo)" }),
  }),
  // Vínculo com cadastro externo (snapshot: draft NÃO segue mudanças posteriores do perfil)
  atrativoSourceId: z.string().uuid().optional(),
  atrativoSourceType: z.enum(["artist", "atrativo"]).optional(),
  atrativoLinkedAt: z.string().optional(),
  atrativoLinkedName: z.string().optional(),

  locationName: z.string().trim().min(1, "Informe o nome do local/estabelecimento"),
  eventAddress: z.string().trim().min(1, "Informe o endereço resumido"),
  locationType: z.enum(["public", "commercial"], { required_error: "Selecione a categoria do espaço" }),
  locationContact: z.string().trim().optional(),
  locationCep: z.string().trim().optional().superRefine((val, ctx) => {
    if (!val) return;
    const d = val.replace(/\D/g, "");
    if (d.length !== 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CEP precisa ter 8 dígitos" });
    }
  }),
  localTipo: z.string().trim().min(1, "Selecione o tipo de local (bar, praça, restaurante...)"),

  description: z.string().trim().max(500).optional(),
  contactSocial: z.string().trim().max(300).optional(),
  videoLink: z.string().url("URL inválida").optional().or(z.literal("")),
  additionalDetails: z.string().trim().optional(),
  stage: z.string().optional(),
  responsiblePerson: z.string().trim().optional(),
  addressNeighborhood: z.string().trim().min(1, "Selecione o bairro do local"),
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
}).superRefine((data, ctx) => {
  // WhatsApp do responsável por dúvidas: sempre exigimos número válido; para atrativo/estabelecimento é obrigatório.
  const phone = (data.duvidasWhatsapp || "").trim();
  if (!phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["duvidasWhatsapp"],
      message: "Informe o WhatsApp que vai receber as dúvidas",
    });
    return;
  }
  const v = validateBrazilianMobile(phone);
  if (v.valid === false) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["duvidasWhatsapp"], message: v.reason });
  }
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
  const { profile: promotorProfile, loading: promotorLoading } = usePromotorProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftLoadedRef = useRef(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickName: "", basicPhone: "", companyName: "", email: "",
      category: "", eventTitle: "", date: "", startTime: "",
      ageRating: "Livre", isSuitableForMinors: true,
      atrativoName: "", atrativoType: "", atrativoContact: "", atrativoEmail: "", atrativoCategory: undefined as any,
      locationName: "", eventAddress: "", locationType: "commercial",
      fotos: [],
      duvidasSource: "promotor",
      duvidasWhatsapp: "",
      responsavelNome: "",
      usarMeuWhatsapp: true,
    },
    mode: "onChange",
  });

  // Load profile data into form when ready + limpa rascunho stale de contato.
  useEffect(() => {
    if (loaded && profile) {
      const currentValues = form.getValues();
      // Contato: o perfil é a fonte da verdade. Sobrescreve o rascunho
      // pra evitar que um telefone/e-mail antigo salvo no navegador continue vencendo.
      if (profile.responsible_name) form.setValue("nickName", profile.responsible_name, { shouldDirty: false });
      if (profile.phone) form.setValue("basicPhone", profile.phone, { shouldDirty: false, shouldValidate: true });
      // Cadastro base → pré-preenche o "Responsável" da Fase 7.
      if (profile.responsible_name && !currentValues.responsavelNome) {
        form.setValue("responsavelNome", profile.responsible_name, { shouldDirty: false });
      }
      if (profile.phone && !currentValues.duvidasWhatsapp) {
        form.setValue("duvidasWhatsapp", profile.phone, { shouldDirty: false });
      }
      if (profile.company_name || profile.responsible_name) {
        form.setValue("companyName", profile.company_name || profile.responsible_name || "", { shouldDirty: false });
      }
      if (profile.email) form.setValue("email", profile.email, { shouldDirty: false });
      // Endereço permanece só-se-vazio (usuário costuma variar por evento)
      if (!currentValues.addressZip) form.setValue("addressZip", profile.address_zip || "");
      if (!currentValues.addressStreet) form.setValue("addressStreet", profile.address_street || "");
      if (!currentValues.addressNumber) form.setValue("addressNumber", profile.address_number || "");

      // Limpa do localStorage os campos de contato salvos no rascunho —
      // assim, se o usuário atualizar o perfil, o rascunho não sobrescreve com dado velho.
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.data) {
            parsed.data.nickName = profile.responsible_name || parsed.data.nickName || "";
            parsed.data.basicPhone = profile.phone || "";
            parsed.data.companyName = profile.company_name || profile.responsible_name || parsed.data.companyName || "";
            parsed.data.email = profile.email || "";
            localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
          }
        }
      } catch (e) {
        console.error("Error syncing draft with profile", e);
      }
    }
  }, [loaded, profile, form]);

  // Perfil de Promotor/Divulgador (por usuário) tem prioridade sobre o cadastro base
  // pra reaproveitar nome/WhatsApp/tipo em divulgações futuras.
  useEffect(() => {
    if (promotorLoading || !promotorProfile) return;
    const current = form.getValues();
    if (promotorProfile.promotor_nome) {
      form.setValue("responsavelNome", promotorProfile.promotor_nome, { shouldDirty: false });
    }
    if (promotorProfile.promotor_whatsapp) {
      form.setValue("usarMeuWhatsapp", false, { shouldDirty: false });
      form.setValue("duvidasWhatsapp", promotorProfile.promotor_whatsapp, { shouldDirty: false });
    }
    if (promotorProfile.tipo_promotor && !current.tipoResponsavel) {
      form.setValue("tipoResponsavel", promotorProfile.tipo_promotor as any, { shouldDirty: false });
    }
  }, [promotorLoading, promotorProfile, form]);

  // Restaura a etapa 1 com os dados mais recentes do perfil (sobrepondo o rascunho).
  const restoreContactFromProfile = () => {
    if (!profile) return;
    form.setValue("nickName", profile.responsible_name || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("basicPhone", profile.phone || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("companyName", profile.company_name || profile.responsible_name || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("email", profile.email || "", { shouldDirty: true, shouldValidate: true });
    toast.success("Etapa 1 atualizada com os dados do seu perfil.");
  };

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

  const FIELD_LABELS: Record<string, string> = {
    nickName: "Seu nome",
    basicPhone: "WhatsApp para contato",
    companyName: "Nome completo / Empresa",
    email: "E-mail",
    date: "Data do evento",
    startTime: "Horário de início",
    ageRating: "Classificação",
    eventTitle: "Nome do evento",
    endTime: "Horário previsto para término",
    atrativoName: "Nome do atrativo",
    atrativoContact: "WhatsApp do atrativo",
    atrativoEmail: "E-mail do atrativo",
    atrativoCategory: "Categoria do atrativo",
    locationName: "Nome do local/estabelecimento",
    eventAddress: "Endereço resumido do local",
    locationType: "Categoria do espaço",
    locationContact: "Contato do local/estabelecimento",
    locationCep: "CEP do local",
    localTipo: "Tipo de local",
    addressNeighborhood: "Bairro do local",
    legalAcceptance: "Aceite dos termos",
    duvidasWhatsapp: "WhatsApp do responsável pelas informações",
    duvidasAuthorized: "Autorização de uso do WhatsApp",
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fields as any, { shouldFocus: true });
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      window.scrollTo(0, 0);
      return;
    }
    // Foca no primeiro campo inválido e mostra qual é.
    const errors = form.formState.errors as any;
    const firstInvalid = (fields as string[]).find((f) => errors?.[f]);
    if (firstInvalid) {
      const label = FIELD_LABELS[firstInvalid] ?? firstInvalid;
      const msg = errors[firstInvalid]?.message || "Preencha esse campo pra continuar.";
      toast.error(`Falta preencher: ${label}`, { description: String(msg) });
      form.setFocus(firstInvalid as any);
    } else {
      toast.error("Alguns campos precisam de ajuste antes de continuar.");
    }
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1: return ["nickName", "basicPhone"];
      case 2: return ["companyName", "email", "addressZip", "addressStreet", "addressNumber"];
      case 3: return ["date", "startTime", "ageRating", "eventTitle", "endTime", "isSuitableForMinors"];
      case 4: return ["atrativoName", "atrativoContact", "atrativoEmail", "atrativoCategory", "atrativoType", "atrativoStyle", "atrativoDescription"];
      case 5: return ["locationName", "localTipo", "addressNeighborhood", "eventAddress", "locationType", "locationContact", "locationCep"];
      case 7: return ["legalAcceptance", "responsavelNome", "duvidasWhatsapp", "duvidasAuthorized"];
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

      // Fallback: se o usuário não enviou flyer nem escolheu imagem, gera um flyer
      // genérico da marca para o espaço do evento nunca ficar vazio.
      if (!imageUrl) {
        try {
          const dataUrl = await generateFallbackFlyer({
            title: clean(values.eventTitle) || clean(values.atrativoName) || "Evento",
            date: clean(values.date),
            startTime: clean(values.startTime),
            location: clean(values.locationName),
            category: clean(values.atrativoCategory) || clean(values.category),
          });
          const blob = await (await fetch(dataUrl)).blob();
          const filePath = `${user?.id ?? "anon"}/fallback-${crypto.randomUUID()}.jpg`;
          const { error: fbErr } = await supabaseClient.storage
            .from("event-flyers")
            .upload(filePath, blob, { contentType: "image/jpeg", upsert: false });
          if (!fbErr) {
            const { data: { publicUrl } } = supabaseClient.storage
              .from("event-flyers")
              .getPublicUrl(filePath);
            imageUrl = publicUrl;
          }
        } catch (e) {
          // Segue sem flyer se algo der errado — não bloqueia o envio.
          console.warn("[fallback flyer] falhou, seguindo sem imagem", e);
        }
      }

      // Map camelCase form fields → snake_case DB columns
      const payload: any = {
        company_name: clean(values.companyName),
        // responsible_name é preenchido abaixo com o nome do responsável (Fase 7).
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
        category: clean(values.atrativoCategory) || clean(values.category),
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
        local_tipo: clean((values as any).localTipo),
        legal_acceptance: values.legalAcceptance,
        legal_acceptance_date: values.legalAcceptance ? new Date().toISOString() : null,
        terms_accepted: values.legalAcceptance,
        terms_accepted_at: values.legalAcceptance ? new Date().toISOString() : null,
        age_rating: values.ageRating,
        is_suitable_for_minors: values.isSuitableForMinors,
        duvidas_source: 'promotor',
        responsavel_duvidas_whatsapp: clean(values.duvidasWhatsapp),
        // Responsável pelo evento (nova Fase 7). O nome do responsável
        // sobrescreve `responsible_name` no registro do evento.
        responsible_name: clean(values.responsavelNome) || clean(values.nickName),
        responsavel_tipo: values.tipoResponsavel || null,
        responsavel_perfil: {
          nome_artistico: clean(values.perfilNomeArtistico),
          estilo_musical: clean(values.perfilEstiloMusical),
          link_principal: clean(values.perfilLinkPrincipal),
          nome_estabelecimento: clean(values.perfilNomeEstabelecimento),
          categoria_local: clean(values.perfilCategoriaLocal),
          endereco_resumido: clean(values.perfilEnderecoResumido),
        },
        image_url: imageUrl || null,
        image_url_story: values.eventImageUrlStory || null,
        image_url_whatsapp: values.eventImageUrlWhatsapp || null,
        fotos: values.fotos || [],
        status: 'pendente',
      };

      // Vincula Local/Estabelecimento existente (se o usuário selecionou pelo autocomplete).
      const selectedEstabId = (values as any).estabelecimentoId || null;
      if (selectedEstabId) payload.estabelecimento_id = selectedEstabId;

      const result = await addSubmission(payload as any);

      if (!result) return; // toast already shown by ctx

      // "Primeira vez grava, próximas vezes reaproveita".
      // Cria Local/Estabelecimento e Atrativo quando o usuário digitou nomes novos,
      // pra que apareçam no autocomplete em divulgações futuras (após aprovação).
      try {
        if (!selectedEstabId && user?.id && clean(values.locationName)) {
          const { data: novoLocal } = await supabaseClient
            .from("estabelecimentos")
            .insert({
              nome: clean(values.locationName)!,
              tipo: clean((values as any).localTipo),
              bairro: clean(values.addressNeighborhood),
              endereco: clean(values.eventAddress),
              cep: clean((values as any).locationCep),
              contato: clean(values.locationContact),
              responsavel_id: user.id,
              created_by: user.id,
            })
            .select("id")
            .maybeSingle();
          if (novoLocal?.id) {
            await supabaseClient
              .from("submissions")
              .update({ estabelecimento_id: novoLocal.id })
              .eq("id", result.id);
            emitEntityCreated("estabelecimento");
          }
        }

        const atrativoLinkedType = (values as any).atrativoSourceType;
        const atrativoLinkedId = (values as any).atrativoSourceId;
        if (
          user?.id &&
          clean(values.atrativoName) &&
          !(atrativoLinkedType === "atrativo" && atrativoLinkedId)
        ) {
          await supabaseClient.from("atrativos").insert({
            name: clean(values.atrativoName)!,
            type: clean(values.atrativoType),
            style: clean(values.atrativoStyle),
            description: clean(values.atrativoDescription),
            contact_whatsapp: clean(values.atrativoContact),
            responsavel_id: user.id,
            created_by: user.id,
          });
          emitEntityCreated("atrativo");
        }
      } catch (e) {
        // Não bloqueia o envio se o reuso falhar (ex.: nome duplicado).
        console.warn("[SubmissionForm] auto-create local/atrativo falhou", e);
      }

      // Atualiza/cria o perfil de Promotor/Divulgador do usuário logado,
      // pra pré-preencher os campos nas próximas divulgações.
      try {
        if (user?.id && clean(values.responsavelNome)) {
          await upsertPromotorProfile({
            user_id: user.id,
            promotor_nome: clean(values.responsavelNome)!,
            promotor_whatsapp: clean(values.duvidasWhatsapp),
            tipo_promotor: values.tipoResponsavel || null,
          });
        }
      } catch (e) {
        console.warn("[SubmissionForm] upsert promotor_profile falhou", e);
      }

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
      atrativoName: 4, atrativoType: 4, atrativoStyle: 4, atrativoDescription: 4, atrativoContact: 4, atrativoEmail: 4, atrativoCategory: 4,
      locationName: 5, localTipo: 5, addressNeighborhood: 5, eventAddress: 5, locationType: 5, locationContact: 5, locationCep: 5,
      legalAcceptance: 7,
      duvidasWhatsapp: 7,
      duvidasAuthorized: 7,
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
          {currentStep >= 3 && currentStep < 8 && (
            <PublishChecklist form={form} goToStep={setCurrentStep} variant="compact" />
          )}
          {currentStep === 1 && <ContactStep form={form} onRestoreFromProfile={restoreContactFromProfile} hasProfile={!!(profile?.phone || profile?.responsible_name || profile?.email)} />}
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
