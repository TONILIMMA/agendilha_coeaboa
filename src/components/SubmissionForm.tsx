import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useProfile } from "@/hooks/useProfile";
import { z } from "zod";
import { Upload, Music, UtensilsCrossed, Palette, Trophy, Tag, MoreHorizontal, Send, X } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  date: z.string().trim().min(1, "Campo obrigatório").max(50),
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
        className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-6 cursor-pointer transition-all hover:border-primary/60 hover:bg-primary/10"
      >
        <Upload className="h-6 w-6 text-primary/60" />
        {file ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{file.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFileChange(null); }}
              className="rounded-full p-0.5 hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Clique para enviar ({accept})</span>
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
              placeholder="00000-000"
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

  // Pre-fill form with saved profile data
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
      // Save reusable data to profile
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
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={heroBanner} alt="Paisagem tropical" className="absolute inset-0 w-full h-full object-cover" width={1920} height={640} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-primary-foreground drop-shadow-lg">
            📌 Envio de Flyers e Banners
          </h1>
          <p className="mt-2 font-display text-lg md:text-xl font-semibold text-primary-foreground/90 drop-shadow">
            AgendIlha / Coé a Boa?
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="mx-auto max-w-2xl px-4 -mt-10 relative z-20 pb-16">
        <div className="rounded-2xl bg-card shadow-elevated p-6 md:p-10">
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8">
            O <strong className="text-secondary">Coé a Boa?</strong> é o portal que conecta a comunidade às melhores experiências locais.
            No <strong className="text-secondary">AgendIlha</strong>, você pode divulgar seus eventos, promoções e novidades com visibilidade garantida.
            Preencha o formulário, envie seu flyer ou banner e sua divulgação estará pronta para alcançar o público certo.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Section title="👤 Dados do Anunciante">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField control={form.control} name="companyName" label="Nome da empresa/organização" />
                  <TextField control={form.control} name="responsibleName" label="Nome do responsável" />
                  <TextField control={form.control} name="email" label="E-mail de contato" type="email" />
                  <TextField control={form.control} name="phone" label="Telefone/WhatsApp" />
                </div>
              </Section>

              <Section title="🎉 Informações do Evento / Promoção">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField control={form.control} name="eventTitle" label="Título do evento ou promoção" className="sm:col-span-2" />
                  <TextField control={form.control} name="date" label="Data" type="date" />
                  <TextField control={form.control} name="startTime" label="Horário de início" type="time" />
                  <TextField control={form.control} name="location" label="Nome do local / estabelecimento" className="sm:col-span-2" />
                </div>

                {/* Endereço detalhado */}
                <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-medium text-foreground">📍 Endereço completo <span className="text-muted-foreground font-normal">(opcional)</span></p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <CepField control={form.control} onCepFound={(data) => {
                      form.setValue("addressStreet", data.logradouro || "");
                      form.setValue("addressNeighborhood", data.bairro || "");
                      form.setValue("addressCity", data.localidade || "");
                      form.setValue("addressState", data.uf || "");
                    }} />
                    <TextField control={form.control} name="addressNumber" label="Número" required={false} />
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
                    <FormItem className="mt-4">
                      <FormLabel>Breve descrição – "Qual é a boa?"</FormLabel>
                      <FormControl>
                        <Textarea {...field} maxLength={300} rows={3} placeholder="Descreva o que vai rolar..." className="resize-none" />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">{descriptionLength}/300</span>
                      </div>
                    </FormItem>
                  )}
                />
              </Section>

              <Section title="🎯 Detalhes da Promoção">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="promotionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de promoção</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {promotionTypes.map((type) => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
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
                    <FormItem className="mt-4">
                      <FormLabel>Regras ou condições</FormLabel>
                      <FormControl>
                        <Textarea {...field} maxLength={500} rows={2} placeholder='Ex.: "Válido para compras acima de R$ 100", "Necessário apresentar CPF"...' className="resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section title="📎 Upload de Materiais">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FileUpload label="Flyer" accept=".pdf,.jpg,.jpeg,.png" file={flyerFile} onFileChange={setFlyerFile} />
                  <FileUpload label="Banner" accept=".jpg,.jpeg,.png" file={bannerFile} onFileChange={setBannerFile} />
                </div>
                <div className="mt-4">
                  <TextField control={form.control} name="videoLink" label="Link para vídeo (YouTube/Instagram)" required={false} />
                </div>
              </Section>

              <Section title="📞 Contato e Informações Adicionais">
                <div className="grid gap-4 sm:grid-cols-1">
                  <TextField control={form.control} name="contactSocial" label="Redes sociais (Instagram, Facebook, etc.)" required={false} />
                  <FormField
                    control={form.control}
                    name="additionalDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outros detalhes relevantes</FormLabel>
                        <FormControl>
                          <Textarea {...field} maxLength={500} rows={3} placeholder="Ex.: estacionamento disponível, local acessível, necessário inscrição prévia..." className="resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section title="📂 Categoria do Evento">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria <span className="text-accent">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
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
              </Section>

              <FormField
                control={form.control}
                name="authorization"
                render={({ field }) => (
                  <FormItem className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
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
                className="w-full gradient-sunset text-primary-foreground font-display font-bold text-base tracking-wide shadow-elevated hover:opacity-90 transition-opacity"
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-foreground border-b border-border pb-2">{title}</h2>
      {children}
    </div>
  );
}

function TextField({
  control, name, label, type = "text", className = "", required = true,
}: {
  control: any; name: string; label: string; type?: string; className?: string; required?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label} {required && <span className="text-accent">*</span>}</FormLabel>
          <FormControl><Input {...field} type={type} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
