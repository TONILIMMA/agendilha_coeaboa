import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { 
  User, 
  MapPin, 
  Sparkles, 
  Globe, 
  Music, 
  Save, 
  Loader2,
  ShieldCheck,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mask "DD NNNNN-NNNN" (aceita 10 ou 11 dígitos; até 11)
function formatPhoneMask(raw: string): string {
  const d = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2)}`;
  const isMobile = d.length === 11;
  const mid = isMobile ? d.slice(2, 7) : d.slice(2, 6);
  const end = isMobile ? d.slice(7) : d.slice(6);
  return `${d.slice(0, 2)} ${mid}-${end}`;
}

function validateAdminPhone(raw: string): string | null {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length === 0) return null; // vazio permitido para limpar
  if (d.length < 10 || d.length > 11) return "Use DDD + número (10 ou 11 dígitos).";
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return "DDD inválido.";
  if (d.length === 11 && d[2] !== "9") return "Celular deve começar com 9 após o DDD.";
  return null;
}

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

export default function ProfileSettings() {
  const { user } = useAuth();
  const { profile, loaded, saveProfile } = useProfile();
  const { isAdmin } = useAppPermissions();
  const [loading, setLoading] = useState(false);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [artistLoaded, setArtistLoaded] = useState(false);
  const [baseErrors, setBaseErrors] = useState<{ name?: string; whatsapp?: string; bairro?: string }>({});

  // Form states
  const [name, setName] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [musicalPreferences, setMusicalPreferences] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [coverageArea, setCoverageArea] = useState<string[]>([]);

  // Promotor extras
  const [whatsappPhone, setWhatsappPhone] = useState("");
  // Admin-only editable phone (profiles.phone)
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPhoneError, setAdminPhoneError] = useState<string | null>(null);
  const [initialAdminPhone, setInitialAdminPhone] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [socialNetworks, setSocialNetworks] = useState("");
  
  // Artist specific
  const [artisticName, setArtisticName] = useState("");
  const [genre, setGenre] = useState("");
  const [techNeeds, setTechNeeds] = useState("");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");

  useEffect(() => {
    if (loaded && profile) {
      setName(profile.responsible_name || "");
      setHomeLocation(profile.home_location || "");
      setMusicalPreferences(profile.musical_preferences || []);
      
      const social = (profile as any).social_links || {};
      setInstagram(social.instagram || "");
      setFacebook(social.facebook || "");
      setCoverageArea((profile as any).coverage_area || []);

      setWhatsappPhone((profile as any).whatsapp_phone || profile.phone || "");
      setAdminPhone(formatPhoneMask(profile.phone || ""));
      setInitialAdminPhone(profile.phone || "");
      setAddressStreet((profile as any).address_street || "");
      setAddressNumber((profile as any).address_number || "");
      setAddressComplement((profile as any).address_complement || "");
      setAddressNeighborhood((profile as any).address_neighborhood || "");
      setAddressCity((profile as any).address_city || "");
      setAddressState((profile as any).address_state || "");
      setCountry((profile as any).country || "Brasil");
      setAvatarUrl((profile as any).avatar_url || "");
      setSocialNetworks((profile as any).contact_social || "");
      
      if (profile.role === 'artist' || (profile as any).user_type === 'artist') {
        loadArtistProfile();
      } else {
        setArtistLoaded(true);
      }
    }
  }, [loaded, profile]);

  async function loadArtistProfile() {
    if (!user) return;
    const { data, error } = await supabase
      .from("artist_profiles")
      .select("id,user_id,name,genre,technical_needs,instagram,whatsapp,bio,avatar_url,cover_url,is_approved,is_verified,artist_type,member_count,work_description,styles,differentials,city,neighborhood,youtube,spotify,spotify_url,website_url,moderation_status,rejection_reason")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setArtistProfile(data);
      setArtisticName(data.name || "");
      setGenre(data.genre || "");
      setTechNeeds(data.technical_needs || "");
      // representative_* are private; fetch through secured RPC.
      const { data: contacts } = await supabase
        .rpc("get_artist_private_contacts", { p_artist_id: data.id });
      const row = Array.isArray(contacts) ? contacts[0] : contacts;
      setRepName(row?.representative_name || "");
      setRepPhone(row?.representative_phone || "");
    }
    setArtistLoaded(true);
  }

  async function handleSave() {
    // Cadastro base único (nome, WhatsApp principal, bairro) — obrigatório
    // pra qualquer usuário conseguir divulgar evento depois.
    const nextErrors: { name?: string; whatsapp?: string; bairro?: string } = {};
    if (!name.trim()) nextErrors.name = "Informe seu nome.";
    const waErr = validateAdminPhone(whatsappPhone);
    if (!whatsappPhone.trim()) nextErrors.whatsapp = "Informe seu WhatsApp com DDD.";
    else if (waErr) nextErrors.whatsapp = waErr;
    if (!homeLocation.trim()) nextErrors.bairro = "Escolha o bairro onde mora ou trabalha.";
    setBaseErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Complete seu cadastro base", {
        description: Object.values(nextErrors).join(" "),
      });
      return;
    }
    // Validate admin phone before saving
    if (isAdmin) {
      const err = validateAdminPhone(adminPhone);
      if (err) {
        setAdminPhoneError(err);
        toast.error("Telefone inválido", { description: err });
        return;
      }
    }
    setLoading(true);
    try {
      const profileData: any = {
        responsible_name: name,
        home_location: homeLocation,
        musical_preferences: musicalPreferences,
        social_links: { instagram, facebook },
        coverage_area: coverageArea,
        whatsapp_phone: whatsappPhone,
        // whatsapp_phone é o "WhatsApp principal" do cadastro base — vale pra todos os perfis.
        // Se o usuário não for admin (que edita `phone` num campo separado), espelhamos
        // esse valor em `profiles.phone` também, pra o app buscar sempre no mesmo lugar.
        ...(isAdmin ? {} : { phone: (whatsappPhone || "").replace(/\D/g, "") || null }),
        address_street: addressStreet,
        address_number: addressNumber,
        address_complement: addressComplement,
        address_neighborhood: addressNeighborhood,
        address_city: addressCity,
        address_state: addressState,
        country,
        avatar_url: avatarUrl,
        contact_social: socialNetworks,
      };

      // Admin/Master pode editar diretamente o telefone principal do perfil.
      // A trigger `trg_log_profile_phone_change` registra a mudança em audit_logs.
      if (isAdmin) {
        const digits = adminPhone.replace(/\D/g, "");
        profileData.phone = digits || null;
      }

      await saveProfile(profileData);

      if (profile.role === 'artist' || (profile as any).user_type === 'artist') {
        const { error } = await supabase
          .from("artist_profiles")
          .upsert({
            user_id: user?.id,
            name: artisticName,
            genre: genre,
            technical_needs: techNeeds,
            representative_name: repName,
            representative_phone: repPhone,
            instagram: instagram
          }, { onConflict: 'user_id' });
        
        if (error) throw error;
      }

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  if (!loaded || !artistLoaded) return <LoadingState />;

  const userType = (profile as any).user_type || profile.role;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <SectionHeader
        title="Meu Perfil"
        subtitle="Complemente suas informações e personalize sua experiência."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Cadastro base
          </CardTitle>
          <CardDescription>
            Esses três dados são obrigatórios pra qualquer usuário — inclusive pra divulgar evento depois.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              aria-invalid={!!baseErrors.name}
            />
            {baseErrors.name && <p className="text-xs text-destructive">{baseErrors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-principal" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> WhatsApp principal <span className="text-destructive">*</span>
            </Label>
            <Input
              id="whatsapp-principal"
              inputMode="tel"
              placeholder="21 9XXXX-XXXX"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(formatPhoneMask(e.target.value))}
              aria-invalid={!!baseErrors.whatsapp}
            />
            {baseErrors.whatsapp ? (
              <p className="text-xs text-destructive">{baseErrors.whatsapp}</p>
            ) : (
              <p className="text-xs text-muted-foreground">DDD + número. Esse WhatsApp vai ser usado como contato principal.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" /> Bairro <span className="text-destructive">*</span>
            </Label>
            <Select value={homeLocation} onValueChange={setHomeLocation}>
              <SelectTrigger aria-invalid={!!baseErrors.bairro}>
                <SelectValue placeholder="Selecione seu bairro" />
              </SelectTrigger>
              <SelectContent>
                {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            {baseErrors.bairro ? (
              <p className="text-xs text-destructive">{baseErrors.bairro}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Bairro onde mora ou trabalha.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participante Specific */}
      {userType === 'usuario' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Preferências
            </CardTitle>
            <CardDescription>O que você gosta de ouvir e assistir?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Estilos Musicais</Label>
              <div className="flex flex-wrap gap-2">
                {MUSICAL_INTERESTS.map(style => (
                  <Badge
                    key={style.id}
                    variant="outline"
                    className={cn(
                      "cursor-pointer px-3 py-1 rounded-full transition-all",
                      musicalPreferences.includes(style.id) 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "hover:bg-primary/10"
                    )}
                    onClick={() => {
                      setMusicalPreferences(prev => 
                        prev.includes(style.id) ? prev.filter(id => id !== style.id) : [...prev, style.id]
                      );
                    }}
                  >
                    {style.label}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promoter / Divulgador Specific */}
      {(userType === 'promoter' || userType === 'divulgador') && (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Redes e Atuação
            </CardTitle>
            <CardDescription>Como você divulga seus eventos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <span className="text-pink-500 font-bold">IG</span> Instagram
                </Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuinsta" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" /> Facebook
                </Label>
                <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Link da página" />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Área de Cobertura Principais</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border rounded-md">
                {NEIGHBORHOODS.map(n => (
                  <div key={n} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cov-${n}`} 
                      checked={coverageArea.includes(n)}
                      onCheckedChange={(checked) => {
                        setCoverageArea(prev => checked ? [...prev, n] : prev.filter(item => item !== n));
                      }}
                    />
                    <label htmlFor={`cov-${n}`} className="text-xs cursor-pointer">{n}</label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Dados para ser divulgador
            </CardTitle>
            <CardDescription>Usamos esses dados para contato e divulgação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* WhatsApp principal agora é campo do "Cadastro base" acima — evita duplicar. */}
            <div className="space-y-2">
              <Label>Redes sociais (links ou @)</Label>
              <Textarea value={socialNetworks} onChange={(e) => setSocialNetworks(e.target.value)} rows={2} placeholder="@instagram, facebook.com/..." />
            </div>
            <div className="space-y-2">
              <Label>Foto / avatar (URL)</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-2">
                <Label>Rua / Avenida</Label>
                <Input value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Complemento (opcional)</Label>
              <Input value={addressComplement} onChange={(e) => setAddressComplement(e.target.value)} placeholder="Bloco, apto…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={addressNeighborhood} onChange={(e) => setAddressNeighborhood(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={addressCity} onChange={(e) => setAddressCity(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estado (UF)</Label>
                <Input value={addressState} onChange={(e) => setAddressState(e.target.value)} placeholder="RJ" />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Artist Specific */}
      {userType === 'artist' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Perfil Artístico
            </CardTitle>
            <CardDescription>Detalhes sobre seu trabalho musical.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="artName">Nome Artístico / Banda</Label>
              <Input id="artName" value={artisticName} onChange={(e) => setArtisticName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Gênero Musical</Label>
              <Select value={genre} onValueChange={setGenre}>
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
              <Textarea id="tech" value={techNeeds} onChange={(e) => setTechNeeds(e.target.value)} placeholder="Ex: Som próprio, 3 microfones..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Representante</Label>
                <Input value={repName} onChange={(e) => setRepName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Rep.</Label>
                <Input value={repPhone} onChange={(e) => setRepPhone(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Instagram / Link de Portfólio</Label>
              <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Link ou @arroba" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin/Master only: editar telefone principal */}
      {isAdmin && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Telefone (Admin)
            </CardTitle>
            <CardDescription>
              Campo visível apenas para Administradores. Toda alteração fica registrada no log de auditoria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="admin-phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Telefone
            </Label>
            <Input
              id="admin-phone"
              inputMode="numeric"
              placeholder="21 99999-9999"
              value={adminPhone}
              maxLength={13}
              aria-invalid={!!adminPhoneError}
              onChange={(e) => {
                const masked = formatPhoneMask(e.target.value);
                setAdminPhone(masked);
                setAdminPhoneError(validateAdminPhone(masked));
              }}
            />
            {adminPhoneError ? (
              <p className="text-sm text-destructive">{adminPhoneError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Formato brasileiro: DDD + número (ex.: 21 99999-9999). Apenas dígitos.
                {initialAdminPhone && adminPhone.replace(/\D/g, "") !== initialAdminPhone
                  ? " Alteração pendente — será registrada ao salvar."
                  : ""}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" disabled={loading}>Cancelar</Button>
        <Button onClick={handleSave} disabled={loading} className="gradient-sunset text-white min-w-[120px]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
