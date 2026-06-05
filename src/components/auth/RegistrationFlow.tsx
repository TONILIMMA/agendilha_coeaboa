import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  User, 
  Megaphone, 
  Music, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Loader2,
  Globe,
  MapPin,
  Sparkles,
  Search,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NEIGHBORHOODS = [
  "Bancários", "Cacuia", "Cidade Universitária", "Cocotá", "Freguesia",
  "Galeão", "Jardim Carioca", "Jardim Guanabara", "Moneró", "Pitangueiras",
  "Portuguesa", "Praia da Bandeira", "Ribeira", "Tauá", "Zumbi"
].sort();

const MUSICAL_INTERESTS = [
  { id: "samba", label: "Samba & Pagode" },
  { id: "rock", label: "Rock" },
  { id: "mpb", label: "MPB" },
  { id: "pop", label: "Pop" },
  { id: "funk", label: "Funk" },
  { id: "eletronico", label: "Eletrônico" },
  { id: "sertanejo", label: "Sertanejo" },
  { id: "jazz", label: "Jazz & Blues" }
];

const EVENT_TYPES = [
  { id: "show", label: "Shows" },
  { id: "teatro", label: "Teatro" },
  { id: "gastronomia", label: "Gastronomia" },
  { id: "feira", label: "Feiras" },
  { id: "esporte", label: "Esportes" },
  { id: "infantil", label: "Infantil" }
];

type RegistrationType = "public" | "promoter" | "artist";

const STORAGE_KEY = "agendilha_draft_registration";

export function RegistrationFlow({ onComplete }: { onComplete: () => void }) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<RegistrationType | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    // User specific
    homeLocation: "",
    musicalInterests: [] as string[],
    eventTypeInterests: [] as string[],
    // Promoter specific
    promoterType: "promoter" as "promoter" | "divulgador",
    socialInstagram: "",
    socialFacebook: "",
    coverageArea: [] as string[],
    // Artist specific
    artisticName: "",
    representativeName: "",
    representativePhone: "",
    genre: "",
    techNeeds: "",
  });

  // Load draft from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { data, lastStep, savedType } = JSON.parse(saved);
        setFormData(data);
        setStep(lastStep || 1);
        setType(savedType || null);
        toast.info("Retomando cadastro de onde você parou.");
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
  }, []);

  // Save draft to local storage
  useEffect(() => {
    if (step < 4) { // Don't save after completion
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: formData,
        lastStep: step,
        savedType: type
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [formData, step, type]);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const additionalData: any = { profile: {}, artist: null };

      if (type === "public") {
        additionalData.profile = {
          user_type: "usuario",
          home_location: formData.homeLocation,
          musical_preferences: formData.musicalInterests,
          event_type_preferences: formData.eventTypeInterests,
        };
      } else if (type === "promoter") {
        additionalData.profile = {
          user_type: formData.promoterType,
          email: formData.email,
          company_type: formData.promoterType,
          coverage_area: formData.coverageArea,
          social_links: {
            instagram: formData.socialInstagram,
            facebook: formData.socialFacebook,
          }
        };
      } else if (type === "artist") {
        additionalData.profile = {
          user_type: "artist",
          email: formData.email,
        };
        additionalData.artist = {
          name: formData.artisticName,
          genre: formData.genre,
          representative_name: formData.representativeName,
          representative_phone: formData.representativePhone,
          technical_needs: formData.techNeeds,
          instagram: formData.socialInstagram,
        };
      }

      const { error } = await signUp(
        formData.phone,
        formData.password,
        formData.name,
        additionalData,
        type === "public" ? "usuario" : (type === "promoter" ? formData.promoterType : "artist")
      );

      if (error) {
        toast.error("Erro no cadastro", { description: error.message });
      } else {
        toast.success("Conta criada com sucesso!");
        setStep(5); // Success step (moved from 4 to 5 because of summary)
      }
    } catch (err: any) {
      toast.error("Erro inesperado", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold font-display">Como você quer usar o AgendIlha?</h2>
              <p className="text-sm text-muted-foreground">Escolha o perfil que melhor descreve você.</p>
            </div>
            <div className="grid gap-4">
              <CardOption
                icon={<User className="h-6 w-6" />}
                title="Participante"
                description="Quero descobrir eventos e salvar meus favoritos."
                selected={type === "public"}
                onClick={() => { setType("public"); nextStep(); }}
              />
              <CardOption
                icon={<Megaphone className="h-6 w-6" />}
                title="Promotor / Divulgador"
                description="Quero divulgar eventos e gerenciar meu público."
                selected={type === "promoter"}
                onClick={() => { setType("promoter"); nextStep(); }}
              />
              <CardOption
                icon={<Music className="h-6 w-6" />}
                title="Músico / Artista"
                description="Quero criar meu portfólio e ser encontrado por contratantes."
                selected={type === "artist"}
                onClick={() => { setType("artist"); nextStep(); }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold font-display">Informações Básicas</h2>
              <p className="text-sm text-muted-foreground">Precisamos desses dados para criar sua conta.</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {type === "promoter" ? "Nome do Responsável ou Organização" : "Nome Completo"}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva ou Agência Festas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(21) 98765-4321"
                />
              </div>
              {(type === "promoter" || type === "artist") && (
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail (Para contato comercial)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@exemplo.com"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <PasswordInput
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={nextStep}
                disabled={!formData.name || !formData.phone || formData.password.length < 6}
              >
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold font-display">Personalize seu Perfil</h2>
              <p className="text-sm text-muted-foreground">Conte-nos um pouco mais sobre você.</p>
            </div>
            
            {type === "public" && renderUserSpecific()}
            {type === "promoter" && renderPromoterSpecific()}
            {type === "artist" && renderArtistSpecific()}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={nextStep}
              >
                Revisar Cadastro <Search className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4: // Summary Review Step
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold font-display">Resumo do Cadastro</h2>
              <p className="text-sm text-muted-foreground">Confira seus dados antes de finalizar.</p>
            </div>
            
            <div className="bg-muted/50 rounded-xl p-4 space-y-4 text-sm border border-border">
              <div className="grid grid-cols-2 gap-y-3">
                <SummaryItem label="Perfil" value={type === 'public' ? 'Participante' : type === 'artist' ? 'Músico/Artista' : formData.promoterType === 'promoter' ? 'Promotor' : 'Divulgador'} />
                <SummaryItem label="Nome" value={formData.name} />
                <SummaryItem label="WhatsApp" value={formData.phone} />
                {formData.email && <SummaryItem label={type === 'public' ? 'WhatsApp (Fique por dentro)' : 'E-mail'} value={formData.email} />}
                
                {type === 'public' && (
                  <>
                    <SummaryItem label="Bairro" value={formData.homeLocation || "Não informado"} />
                    <SummaryItem label="Interesses" value={formData.musicalInterests.length ? formData.musicalInterests.map(id => MUSICAL_INTERESTS.find(m => m.id === id)?.label).join(", ") : "Nenhum selecionado"} full />
                  </>
                )}

                {type === 'promoter' && (
                  <>
                    <SummaryItem label="Instagram" value={formData.socialInstagram || "Não informado"} />
                    <SummaryItem label="Área de Cobertura" value={formData.coverageArea.length ? formData.coverageArea.join(", ") : "Não informada"} full />
                  </>
                )}

                {type === 'artist' && (
                  <>
                    <SummaryItem label="Nome Artístico" value={formData.artisticName} />
                    <SummaryItem label="Gênero" value={MUSICAL_INTERESTS.find(m => m.id === formData.genre)?.label || "Não informado"} />
                    <SummaryItem label="Necessidades" value={formData.techNeeds || "Não informado"} full />
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button 
                className="flex-1 gradient-sunset text-white" 
                onClick={handleSignUp}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finalizar Cadastro"}
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="text-center space-y-6 py-8">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-display">Bem-vindo ao AgendIlha!</h2>
              <p className="text-muted-foreground">Sua conta foi criada com sucesso. Aproveite o melhor da Ilha do Governador.</p>
            </div>
            <Button className="w-full" onClick={onComplete}>
              Começar a Explorar
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const renderUserSpecific = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Onde você mora?
        </Label>
        <Select 
          value={formData.homeLocation} 
          onValueChange={(v) => setFormData({ ...formData, homeLocation: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione seu bairro" />
          </SelectTrigger>
          <SelectContent>
            {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Estilos Musicais
        </Label>
        <div className="flex flex-wrap gap-2">
          {MUSICAL_INTERESTS.map(style => (
            <Badge
              key={style.id}
              variant="outline"
              className={cn(
                "cursor-pointer px-3 py-1 rounded-full transition-all",
                formData.musicalInterests.includes(style.id) 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "hover:bg-primary/10"
              )}
              onClick={() => {
                const current = formData.musicalInterests;
                setFormData({
                  ...formData,
                  musicalInterests: current.includes(style.id) 
                    ? current.filter(id => id !== style.id) 
                    : [...current, style.id]
                });
              }}
            >
              {style.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Tipos de Evento Favoritos</Label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map(type => (
            <div key={type.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`type-${type.id}`} 
                checked={formData.eventTypeInterests.includes(type.id)}
                onCheckedChange={(checked) => {
                  const current = formData.eventTypeInterests;
                  setFormData({
                    ...formData,
                    eventTypeInterests: checked 
                      ? [...current, type.id] 
                      : current.filter(id => id !== type.id)
                  });
                }}
              />
              <label htmlFor={`type-${type.id}`} className="text-xs font-medium cursor-pointer">
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-start space-x-3 bg-primary/5 p-4 rounded-xl border border-primary/10">
          <Checkbox 
            id="opt-in-whatsapp" 
            className="mt-1"
            checked={!!formData.email}
            onCheckedChange={(checked) => {
              setFormData({
                ...formData,
                email: checked ? formData.phone : ""
              });
            }}
          />
          <div className="grid gap-1.5 leading-tight">
            <label htmlFor="opt-in-whatsapp" className="text-sm font-bold cursor-pointer">
              Fique por dentro da Ilha
            </label>
            <p className="text-[10px] text-muted-foreground">
              Autorizo o envio de notificações, sugestões de eventos personalizadas e a agenda cultural semanal diretamente no meu WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPromoterSpecific = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Você atua como:</Label>
        <div className="flex p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, promoterType: "promoter" })}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              formData.promoterType === "promoter" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            Promotor
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, promoterType: "divulgador" })}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              formData.promoterType === "divulgador" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            Divulgador
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Redes Sociais</Label>
        <div className="space-y-2">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Instagram (ex: @meuevento)"
              value={formData.socialInstagram}
              onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Facebook (Link da página)"
              value={formData.socialFacebook}
              onChange={(e) => setFormData({ ...formData, socialFacebook: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Área de Cobertura (Bairros principais)</Label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
          {NEIGHBORHOODS.map(n => (
            <div key={n} className="flex items-center space-x-2">
              <Checkbox 
                id={`cov-${n}`} 
                checked={formData.coverageArea.includes(n)}
                onCheckedChange={(checked) => {
                  const current = formData.coverageArea;
                  setFormData({
                    ...formData,
                    coverageArea: checked ? [...current, n] : current.filter(item => item !== n)
                  });
                }}
              />
              <label htmlFor={`cov-${n}`} className="text-xs cursor-pointer">{n}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderArtistSpecific = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="artName">Nome Artístico / Banda</Label>
        <Input
          id="artName"
          value={formData.artisticName}
          onChange={(e) => setFormData({ ...formData, artisticName: e.target.value })}
          placeholder="Como você é conhecido?"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="repName">Representante</Label>
          <Input
            id="repName"
            value={formData.representativeName}
            onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
            placeholder="Nome"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="repPhone">Celular Rep.</Label>
          <Input
            id="repPhone"
            value={formData.representativePhone}
            onChange={(e) => setFormData({ ...formData, representativePhone: e.target.value })}
            placeholder="(21) 9..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Gênero Musical Principal</Label>
        <Select 
          value={formData.genre} 
          onValueChange={(v) => setFormData({ ...formData, genre: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o gênero" />
          </SelectTrigger>
          <SelectContent>
            {MUSICAL_INTERESTS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tech">Necessidades Técnicas</Label>
        <Input
          id="tech"
          value={formData.techNeeds}
          onChange={(e) => setFormData({ ...formData, techNeeds: e.target.value })}
          placeholder="Ex: Som próprio, palco, 3 microfones..."
        />
      </div>

      <div className="space-y-2">
        <Label>Link de Portfólio ou Instagram</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Link (ex: youtube, spotify, instagram)"
            value={formData.socialInstagram}
            onChange={(e) => setFormData({ ...formData, socialInstagram: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full mx-1 transition-all duration-300",
                step >= i ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="flex justify-between px-1">
          <span className="text-[9px] font-bold uppercase text-muted-foreground">Perfil</span>
          <span className="text-[9px] font-bold uppercase text-muted-foreground">Básico</span>
          <span className="text-[9px] font-bold uppercase text-muted-foreground">Detalhes</span>
          <span className="text-[9px] font-bold uppercase text-muted-foreground">Revisão</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CardOption({ icon, title, description, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-start p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 group",
        selected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg mr-4 transition-colors",
        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
      )}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-sm font-display">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}

function SummaryItem({ label, value, full }: { label: string, value: string, full?: boolean }) {
  return (
    <div className={cn("space-y-1", full ? "col-span-2" : "col-span-1")}>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</span>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
