import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { 
  Music, 
  User as UserIcon, 
  Globe, 
  Video, 
  LayoutDashboard, 
  Eye, 
  Save, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { ProfileStatus } from "@/components/artist-setup/ProfileStatus";
import { BasicInfoForm } from "@/components/artist-setup/BasicInfoForm";
import { PresentationForm } from "@/components/artist-setup/PresentationForm";
import { SocialLinksForm } from "@/components/artist-setup/SocialLinksForm";
import { MediaUploadForm } from "@/components/artist-setup/MediaUploadForm";
import Header from "@/components/Header";

export default function ArtistSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [artistProfile, setArtistProfile] = useState<any>(null);
  
  const form = useForm({
    defaultValues: {
      name: "",
      genre: "",
      neighborhood: "",
      member_count: 1,
      artist_type: "cover",
      bio: "",
      work_description: "",
      styles: [],
      differentials: "",
      instagram: "",
      youtube: "",
      spotify_url: "",
      website_url: "",
      whatsapp: "",
    }
  });

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("artist_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setArtistProfile(data);
        form.reset({
          name: data.name || "",
          genre: data.genre || "",
          neighborhood: data.neighborhood || "",
          member_count: data.member_count || 1,
          artist_type: data.artist_type || "cover",
          bio: data.bio || "",
          work_description: data.work_description || "",
          styles: data.styles || [],
          differentials: data.differentials || "",
          instagram: data.instagram || "",
          youtube: data.youtube || "",
          spotify_url: data.spotify_url || "",
          website_url: data.website_url || "",
          whatsapp: data.whatsapp || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const onSave = async (values: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("artist_profiles")
        .upsert({
          user_id: user.id,
          ...values,
          moderation_status: artistProfile?.moderation_status || 'incomplete'
        })
        .select()
        .single();

      if (error) throw error;
      setArtistProfile(data);
      toast.success("Perfil salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  };

  const calculateCompleteness = () => {
    const fields = [
      'name', 'genre', 'neighborhood', 'artist_type', 
      'bio', 'work_description', 'styles', 'whatsapp'
    ];
    const values = form.getValues();
    const filled = fields.filter(f => {
      const val = values[f as keyof typeof values];
      if (Array.isArray(val)) return val.length > 0;
      return !!val;
    });
    return Math.round((filled.length / fields.length) * 100);
  };

  const getMissingFields = () => {
    const labels: Record<string, string> = {
      name: "Nome Artístico",
      genre: "Gênero Principal",
      neighborhood: "Bairro",
      artist_type: "Tipo (Cover/Autoral)",
      bio: "Biografia Curta",
      work_description: "Descrição do Trabalho",
      styles: "Estilos Musicais",
      whatsapp: "WhatsApp Profissional"
    };
    const values = form.getValues();
    return Object.keys(labels).filter(f => {
      const val = values[f as keyof typeof values];
      if (Array.isArray(val)) return val.length === 0;
      return !val;
    }).map(f => labels[f]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar: Status & Actions */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white overflow-hidden rounded-3xl">
              <CardContent className="p-6">
                <ProfileStatus 
                  status={artistProfile?.moderation_status || 'incomplete'}
                  completeness={calculateCompleteness()}
                  missingFields={getMissingFields()}
                />
                
                <div className="mt-8 space-y-3">
                  <Button 
                    className="w-full h-12 rounded-xl gradient-sunset font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all"
                    onClick={form.handleSubmit(onSave)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Perfil
                  </Button>
                  
                  {artistProfile && (
                    <Button 
                      variant="outline" 
                      className="w-full h-12 rounded-xl border-2 font-bold flex items-center justify-center gap-2"
                      onClick={() => navigate(`/artista/${artistProfile.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                      Ver Perfil Público
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="hidden lg:block bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-3">
              <h4 className="font-bold text-primary flex items-center gap-2 text-sm">
                <Music className="h-4 w-4" /> Dica de Ouro
              </h4>
              <p className="text-xs text-primary/70 leading-relaxed">
                Perfis com descrição detalhada e estilos bem definidos têm 3x mais chances de serem contratados.
              </p>
            </div>
          </div>

          {/* Main Content: Form Hub */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <Tabs defaultValue="basic" className="w-full">
                <div className="px-6 pt-6 border-b border-slate-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h1 className="text-2xl font-black font-display text-primary uppercase tracking-tight">Hub do Artista</h1>
                      <p className="text-sm text-muted-foreground font-medium">Gerencie sua identidade artística no AgendIlha.</p>
                    </div>
                  </div>
                  
                  <TabsList className="bg-slate-100/50 p-1 h-12 rounded-xl w-full justify-start overflow-x-auto overflow-y-hidden scrollbar-none gap-1">
                    <TabsTrigger value="basic" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-bold uppercase tracking-wider">
                      <UserIcon className="h-3.5 w-3.5" /> Básico
                    </TabsTrigger>
                    <TabsTrigger value="presentation" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-bold uppercase tracking-wider">
                      <Music className="h-3.5 w-3.5" /> Show
                    </TabsTrigger>
                    <TabsTrigger value="links" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-bold uppercase tracking-wider">
                      <Globe className="h-3.5 w-3.5" /> Links
                    </TabsTrigger>
                    <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2 text-xs font-bold uppercase tracking-wider">
                      <Video className="h-3.5 w-3.5" /> Mídia
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="basic" className="mt-0 outline-none">
                    <BasicInfoForm form={form} />
                  </TabsContent>
                  
                  <TabsContent value="presentation" className="mt-0 outline-none">
                    <PresentationForm form={form} />
                  </TabsContent>
                  
                  <TabsContent value="links" className="mt-0 outline-none">
                    <SocialLinksForm form={form} />
                  </TabsContent>
                  
                  <TabsContent value="media" className="mt-0 outline-none">
                    <MediaUploadForm 
                      artistId={artistProfile?.id} 
                      onMediaUploaded={fetchProfile} 
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            <div className="lg:hidden bg-primary/5 p-6 rounded-3xl border border-primary/10">
               <h4 className="font-bold text-primary flex items-center gap-2 text-sm mb-2">
                <Music className="h-4 w-4" /> Dica de Ouro
              </h4>
              <p className="text-xs text-primary/70 leading-relaxed">
                Perfis com descrição detalhada e estilos bem definidos têm 3x mais chances de serem contratados.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}