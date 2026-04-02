import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useProfile } from "@/hooks/useProfile";
import { z } from "zod";
import { Upload, Send, X, ChevronDown, ChevronUp } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  companyName: z.string().trim().min(1, "Campo obrigatório").max(100),
  responsibleName: z.string().trim().min(1, "Campo obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(1, "Campo obrigatório").max(30).regex(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/, "Por favor, insira um número de WhatsApp válido com DDD. Exemplo: (21) 98765-4321"),
  eventTitle: z.string().trim().min(1, "Campo obrigatório").max(150),
  date: z.string().trim().min(1, "Campo obrigatório").max(50).regex(/^\d{2}\/\d{2}\/\d{4}$/, "Use o formato dd/mm/aaaa"),
  startTime: z.string().trim().min(1, "Campo obrigatório").max(20),
  location: z.string().trim().min(1, "Campo obrigatório").max(200),
  addressStreet: z.string().trim().max(200).optional().or(z.literal("")),
  addressNumber: z.string().trim().max(20).optional().or(z.literal("")),
  addressNeighborhood: z.string().trim().max(100).optional().or(z.literal("")),
  addressCity: z.string().trim().max(100).optional().or(z.literal("")),
  addressState: z.string().trim().max(50).optional().or(z.literal("")),
  addressZip: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().min(1, "Campo obrigatório").max(300, "Máximo de 300 caracteres"),
  videoLink: z.string().url("URL inválida").optional().or(z.literal("")),
  category: z.string().min(1, "Selecione uma categoria"),
  promotionType: z.string().trim().max(100).optional().or(z.literal("")),
  targetAudience: z.string().trim().max(200).optional().or(z.literal("")),
  promotionRules: z.string().trim().max(500).optional().or(z.literal("")),
  contactSocial: z.string().trim().max(300).optional().or(z.literal("")),
  additionalDetails: z.string().trim().max(500).optional().or(z.literal("")),
  authorization: z.literal(true, {
    errorMap: () => ({ message: "Você precisa autorizar a publicação" }),
  }),
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
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    anunciante: true,
    evento: true,
    promocao: false,
    upload: false,
    contato: false,
    categoria: true,
  });
  const { addSubmission } = useSubmissions();
  const { profile, loaded, saveProfile } = useProfile();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "", responsibleName: "", email: "", phone: "",
      eventTitle: "", date: "", startTime: "", location: "",
      addressStreet: "", addressNumber: "", addressNeighborhood: "",
      addressCity: "", addressState: "", addressZip: "",
      description: "", videoLink: "", category: "",
      promotionType: "", targetAudience: "", promotionRules: "",
      contactSocial: "", additionalDetails: "",
      authorization: undefined,
    },
  });

  useEffect(() => {
    if (!loaded) return;
    const fields = {
      companyName: profile.company_name,
      responsibleName: profile.responsible_name,
      email: profile.email,
      phone: profile.phone,
      addressStreet: profile.address_street,
      addressNumber: profile.address_number,
      addressNeighborhood: profile.address_neighborhood,
      addressCity: profile.address_city,
      addressState: profile.address_state,
      addressZip: profile.address_zip,
      contactSocial: profile.contact_social,
    };
    Object.entries(fields).forEach(([key, value]) => {
      if (value) form.setValue(key as any, value);
    });
  }, [loaded, profile]);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const descriptionLength = form.watch("description")?.length || 0;

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    const success = await addSubmission({
      company_name: data.companyName,
      responsible_name: data.responsibleName,
      email: data.email,
      phone: data.phone,
      event_title: data.eventTitle,
      date: data.date,
      start_time: data.startTime,
      location: data.location,
      address_street: data.addressStreet || null,
      address_number: data.addressNumber || null,
      address_neighborhood: data.addressNeighborhood || null,
      address_city: data.addressCity || null,
      address_state: data.addressState || null,
      address_zip: data.addressZip || null,
      description: data.description,
      video_link: data.videoLink || null,
      category: data.category,
      promotion_type: data.promotionType || null,
      target_audience: data.targetAudience || null,
      promotion_rules: data.promotionRules || null,
      contact_social: data.contactSocial || null,
      additional_details: data.additionalDetails || null,
    });
    setSubmitting(false);
    if (success) {
      saveProfile({
        company_name: data.companyName,
        responsible_name: data.responsibleName,
        email: data.email,
        phone: data.phone,
        address_street: data.addressStreet || "",
        address_number: data.addressNumber || "",
        address_neighborhood: data.addressNeighborhood || "",
        address_city: data.addressCity || "",
        address_state: data.addressState || "",
        address_zip: data.addressZip || "",
        contact_social: data.contactSocial || "",
      });
      form.reset();
      setFlyerFile(null);
      setBannerFile(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-40 xs:h-48 sm:h-64 md:h-80 overflow-hidden">
        <img src={heroBanner} alt="Paisagem tropical" className="absolute inset-0 w-full h-full object-cover" width={1920} height={640} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-3 sm:px-4">
          <h1 className="font-display text-xl xs:text-2xl sm:text-3xl md:text-5xl font-extrabold text-primary-foreground drop-shadow-lg leading-tight">
            📌 Informações de Eventos
          </h1>
          <p className="mt-1 sm:mt-2 font-display text-sm xs:text-base sm:text-lg md:text-xl font-semibold text-primary-foreground/90 drop-shadow">
            AgendIlha / Coé a Boa?
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="mx-auto max-w-2xl px-2 xs:px-3 sm:px-4 -mt-6 xs:-mt-8 sm:-mt-10 relative z-20 pb-12 sm:pb-16">
        <div className="rounded-xl sm:rounded-2xl bg-card shadow-elevated p-3 xs:p-4 sm:p-6 md:p-10">
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 sm:mb-8">
            O <strong className="text-secondary">Coé a Boa?</strong> é o portal que conecta a comunidade às melhores experiências locais.
            No <strong className="text-secondary">AgendIlha</strong>, você pode divulgar seus eventos, promoções e novidades com visibilidade garantida.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-8">
              <CollapsibleSection title="👤 Dados do Anunciante" sectionKey="anunciante" expanded={expandedSections.anunciante} onToggle={toggleSection}>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <TextField control={form.control} name="companyName" label="Nome da empresa/organização" />
                  <TextField control={form.control} name="responsibleName" label="Nome do responsável" />
                  <TextField control={form.control} name="email" label="E-mail de contato" type="email" inputMode="email" />
                  <TextField control={form.control} name="phone" label="Telefone/WhatsApp" type="tel" inputMode="tel" />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="🎉 Informações do Evento" sectionKey="evento" expanded={expandedSections.evento} onToggle={toggleSection}>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <TextField control={form.control} name="eventTitle" label="Título do evento ou promoção" className="sm:col-span-2" />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Data <span className="text-accent">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="dd/mm/aaaa"
                            inputMode="numeric"
                            maxLength={10}
                            className="h-12 text-base"
                            onChange={(e) => {
                              let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                              if (v.length > 4) v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
                              else if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                              field.onChange(v);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <TextField control={form.control} name="startTime" label="Horário de início" type="time" />
                  <TextField control={form.control} name="location" label="Nome do local / estabelecimento" className="sm:col-span-2" />
                </div>

                {/* Endereço detalhado */}
                <div className="mt-3 sm:mt-4 rounded-lg border border-border bg-muted/30 p-3 sm:p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">📍 Endereço completo <span className="text-muted-foreground font-normal">(opcional)</span></p>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                    <CepField control={form.control} onCepFound={(data) => {
                      form.setValue("addressStreet", data.logradouro || "");
                      form.setValue("addressNeighborhood", data.bairro || "");
                      form.setValue("addressCity", data.localidade || "");
                      form.setValue("addressState", data.uf || "");
                    }} />
                    <TextField control={form.control} name="addressNumber" label="Número" required={false} inputMode="numeric" />
                    <TextField control={form.control} name="addressStreet" label="Rua" required={false} />
                    <TextField control={form.control} name="addressNeighborhood" label="Bairro" required={false} />
                    <TextField control={form.control} name="addressCity" label="Cidade" required={false} />
                    <TextField control={form.control} name="addressState" label="Estado" required={false} />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mt-3 sm:mt-4">
                      <FormLabel>Breve descrição – "Qual é a boa?"</FormLabel>
                      <FormControl>
                        <Textarea {...field} maxLength={300} rows={3} placeholder="Descreva o que vai rolar..." className="resize-none text-base min-h-[100px]" />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">{descriptionLength}/300</span>
                      </div>
                    </FormItem>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection title="🎯 Detalhes da Promoção" sectionKey="promocao" expanded={expandedSections.promocao} onToggle={toggleSection}>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="promotionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de promoção</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {promotionTypes.map((type) => (
                              <SelectItem key={type} value={type} className="py-3 text-base">{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <TextField control={form.control} name="targetAudience" label="Público-alvo" required={false} />
                </div>
                <FormField
                  control={form.control}
                  name="promotionRules"
                  render={({ field }) => (
                    <FormItem className="mt-3 sm:mt-4">
                      <FormLabel>Regras ou condições</FormLabel>
                      <FormControl>
                        <Textarea {...field} maxLength={500} rows={2} placeholder='Ex.: "Válido para compras acima de R$ 100"...' className="resize-none text-base min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleSection>

              <CollapsibleSection title="📎 Upload de Materiais" sectionKey="upload" expanded={expandedSections.upload} onToggle={toggleSection}>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <FileUpload label="Flyer" accept=".pdf,.jpg,.jpeg,.png" file={flyerFile} onFileChange={setFlyerFile} />
                  <FileUpload label="Banner" accept=".jpg,.jpeg,.png" file={bannerFile} onFileChange={setBannerFile} />
                </div>
                <div className="mt-3 sm:mt-4">
                  <TextField control={form.control} name="videoLink" label="Link para vídeo (YouTube/Instagram)" required={false} type="url" inputMode="url" />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="📞 Contato e Informações Adicionais" sectionKey="contato" expanded={expandedSections.contato} onToggle={toggleSection}>
                <div className="grid gap-3 sm:gap-4 grid-cols-1">
                  <TextField control={form.control} name="contactSocial" label="Redes sociais (Instagram, Facebook, etc.)" required={false} />
                  <FormField
                    control={form.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outros detalhes relevantes</FormLabel>
                        <FormControl>
                          <Textarea {...field} maxLength={500} rows={3} placeholder="Ex.: estacionamento disponível, local acessível..." className="resize-none text-base min-h-[80px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="📂 Categoria do Evento" sectionKey="categoria" expanded={expandedSections.categoria} onToggle={toggleSection}>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria <span className="text-accent">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value} className="py-3 text-base">{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("category") === "outros" && (
                  <div className="mt-3">
                    <TextField control={form.control} name="additionalDetails" label="Especifique a categoria" required={false} />
                  </div>
                )}
              </CollapsibleSection>

              <FormField
                control={form.control}
                name="authorization"
                render={({ field }) => (
                  <FormItem className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5 h-5 w-5" />
                      </FormControl>
                      <div className="space-y-1">
                        <FormLabel className="text-sm font-medium leading-snug cursor-pointer">
                          Autorizo a publicação dos materiais enviados no portal AgendIlha/Coé a Boa?
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </div>
                  </FormItem>
                )}
              />

               <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full gradient-sunset text-primary-foreground font-display font-bold text-sm xs:text-base tracking-wide shadow-elevated hover:opacity-90 active:scale-[0.98] transition-all min-h-[48px] sm:min-h-[52px]"
              >
                <Send className="mr-2 h-5 w-5" />
                {submitting ? "Enviando..." : "Enviar Divulgação"}
              </Button>
            </form>
          </Form>
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
