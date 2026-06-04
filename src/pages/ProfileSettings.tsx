import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [artistLoaded, setArtistLoaded] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [musicalPreferences, setMusicalPreferences] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [coverageArea, setCoverageArea] = useState<string[]>([]);
  
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
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) {
      setArtistProfile(data);
      setArtisticName(data.name || "");
      setGenre(data.genre || "");
      setTechNeeds(data.technical_needs || "");
      setRepName(data.representative_name || "");
      setRepPhone(data.representative_phone || "");
    }
    setArtistLoaded(true);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const profileData: any = {
        responsible_name: name,
        home_location: homeLocation,
        musical_preferences: musicalPreferences,
        social_links: { instagram, facebook },
        coverage_area: coverageArea,
      };

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
            Informações Gerais
          </CardTitle>
          <CardDescription>Dados básicos da sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" /> Bairro onde mora
            </Label>
            <Select value={homeLocation} onValueChange={setHomeLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu bairro" />
              </SelectTrigger>
              <SelectContent>
                {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
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
