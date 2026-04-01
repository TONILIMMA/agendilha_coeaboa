import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { z } from "zod";
import { toast } from "sonner";
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

const formSchema = z.object({
  companyName: z.string().trim().min(1, "Campo obrigatório").max(100),
  responsibleName: z.string().trim().min(1, "Campo obrigatório").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(1, "Campo obrigatório").max(30),
  eventTitle: z.string().trim().min(1, "Campo obrigatório").max(150),
  dateTime: z.string().trim().min(1, "Campo obrigatório").max(100),
  location: z.string().trim().min(1, "Campo obrigatório").max(200),
  description: z.string().trim().min(1, "Campo obrigatório").max(300, "Máximo de 300 caracteres"),
  videoLink: z.string().url("URL inválida").optional().or(z.literal("")),
  category: z.string().min(1, "Selecione uma categoria"),
  authorization: z.literal(true, {
    errorMap: () => ({ message: "Você precisa autorizar a publicação" }),
  }),
});

type FormData = z.infer<typeof formSchema>;

const categories = [
  { value: "musica", label: "Música / Show", icon: Music },
  { value: "gastronomia", label: "Gastronomia", icon: UtensilsCrossed },
  { value: "cultura", label: "Cultura / Arte", icon: Palette },
  { value: "esporte", label: "Esporte", icon: Trophy },
  { value: "promocoes", label: "Promoções / Ofertas", icon: Tag },
  { value: "outros", label: "Outros", icon: MoreHorizontal },
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

export default function SubmissionForm() {
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "", responsibleName: "", email: "", phone: "",
      eventTitle: "", dateTime: "", location: "", description: "",
      videoLink: "", category: "", authorization: undefined,
    },
  });

  const descriptionLength = form.watch("description")?.length || 0;

  function onSubmit(data: FormData) {
    console.log("Form data:", data, { flyerFile, bannerFile });
    toast.success("🎉 Envio realizado com sucesso!", {
      description: "Sua divulgação será publicada em breve no AgendIlha!",
    });
    form.reset();
    setFlyerFile(null);
    setBannerFile(null);
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
          {/* Description */}
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8">
            O <strong className="text-secondary">Coé a Boa?</strong> é o portal que conecta a comunidade às melhores experiências locais.
            No <strong className="text-secondary">AgendIlha</strong>, você pode divulgar seus eventos, promoções e novidades com visibilidade garantida.
            Preencha o formulário, envie seu flyer ou banner e sua divulgação estará pronta para alcançar o público certo.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Seção: Dados do Anunciante */}
              <Section title="👤 Dados do Anunciante">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField control={form.control} name="companyName" label="Nome da empresa/organização" />
                  <TextField control={form.control} name="responsibleName" label="Nome do responsável" />
                  <TextField control={form.control} name="email" label="E-mail de contato" type="email" />
                  <TextField control={form.control} name="phone" label="Telefone/WhatsApp" />
                </div>
              </Section>

              {/* Seção: Informações do Evento */}
              <Section title="🎉 Informações do Evento / Promoção">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField control={form.control} name="eventTitle" label="Título do evento ou promoção" className="sm:col-span-2" />
                  <TextField control={form.control} name="dateTime" label="Data e horário" />
                  <TextField control={form.control} name="location" label="Local" />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Breve descrição – "Qual é a boa?"</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          maxLength={300}
                          rows={3}
                          placeholder="Descreva o que vai rolar..."
                          className="resize-none"
                        />
                      </FormControl>
                      <div className="flex justify-between">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">{descriptionLength}/300</span>
                      </div>
                    </FormItem>
                  )}
                />
              </Section>

              {/* Seção: Upload */}
              <Section title="📎 Upload de Materiais">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FileUpload label="Flyer" accept=".pdf,.jpg,.jpeg,.png" file={flyerFile} onFileChange={setFlyerFile} />
                  <FileUpload label="Banner" accept=".jpg,.jpeg,.png" file={bannerFile} onFileChange={setBannerFile} />
                </div>
                <div className="mt-4">
                  <TextField control={form.control} name="videoLink" label="Link para vídeo (YouTube/Instagram)" required={false} />
                </div>
              </Section>

              {/* Seção: Categoria */}
              <Section title="📂 Categoria do Evento">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {categories.map((cat) => {
                            const Icon = cat.icon;
                            const selected = field.value === cat.value;
                            return (
                              <Label
                                key={cat.value}
                                htmlFor={cat.value}
                                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-3 cursor-pointer transition-all text-sm font-medium ${
                                  selected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/40"
                                }`}
                              >
                                <RadioGroupItem value={cat.value} id={cat.value} className="sr-only" />
                                <Icon className="h-4 w-4 shrink-0" />
                                {cat.label}
                              </Label>
                            );
                          })}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              {/* Autorização */}
              <FormField
                control={form.control}
                name="authorization"
                render={({ field }) => (
                  <FormItem className="rounded-lg border border-border bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
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

              {/* Submit */}
              <Button type="submit" size="lg" className="w-full gradient-sunset text-primary-foreground font-display font-bold text-base tracking-wide shadow-elevated hover:opacity-90 transition-opacity">
                <Send className="mr-2 h-5 w-5" />
                Enviar Divulgação
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
      <h2 className="font-display text-lg font-bold text-foreground border-b border-border pb-2">
        {title}
      </h2>
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
          <FormLabel>
            {label} {required && <span className="text-accent">*</span>}
          </FormLabel>
          <FormControl>
            <Input {...field} type={type} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
