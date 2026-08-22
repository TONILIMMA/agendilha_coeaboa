import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DiscoveryEventCard } from "@/components/DiscoveryEventCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, MessageCircle, MapPin, Megaphone } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { AppShell } from "@/components/layout/AppShell";
import { SeoHead } from "@/components/seo/SeoHead";
import { cn } from "@/lib/utils";

export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["public-profile-events", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_submissions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "aprovado")
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (loadingProfile) return <LoadingState fullPage message="Carregando perfil..." />;
  if (!profile) {
    return (
      <AppShell maxWidth="md">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Perfil não encontrado</h1>
          <Button asChild className="mt-4 rounded-full">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const socialUrl = profile.contact_social || "";
  const isInstagram = socialUrl.includes("instagram.com") || socialUrl.startsWith("@");
  const instaHandle = socialUrl.startsWith("@") ? socialUrl : socialUrl.split("instagram.com/")[1]?.split("/")[0];

  return (
    <div className="min-h-screen bg-background">
      <SeoHead 
        title={`${profile.responsible_name || profile.company_name || 'Divulgador'} — AgendIlha`}
        description={`Veja todos os eventos publicados por ${profile.responsible_name || profile.company_name} na Ilha do Governador.`}
        path={`/divulgador/${userId}`}
      />
      
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-accent/20 border-b">
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0">
          <div className="h-24 w-24 rounded-3xl bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden ring-1 ring-border">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.responsible_name || ""} className="h-full w-full object-cover" />
            ) : (
              <Megaphone className="h-10 w-10 text-primary/40" />
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 pt-16 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <h1 className="text-3xl font-black tracking-tight">
                {profile.company_name || profile.responsible_name || "Divulgador AgendIlha"}
              </h1>
              {/* profile.is_trusted_divulgador check removed as column does not exist */}

            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
              {profile.address_neighborhood && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                  <MapPin className="h-3.5 w-3.5" /> {profile.address_neighborhood}
                </span>
              )}
              {profile.user_type === 'divulgador' && (
                <span className="flex items-center gap-1 uppercase tracking-widest text-[10px] font-black">
                  Divulgador Oficial
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            {profile.whatsapp_phone && (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => window.open(`https://wa.me/55${profile.whatsapp_phone?.replace(/\D/g, "")}`, "_blank")}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            )}
            {socialUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full h-10 border-primary/20"
                onClick={() => window.open(socialUrl.startsWith("http") ? socialUrl : `https://instagram.com/${instaHandle}`, "_blank")}
              >
                <Globe className="h-4 w-4 mr-2" />
                {isInstagram ? (instaHandle ? `@${instaHandle}` : "Instagram") : "Website"}
              </Button>
            )}
          </div>
        </div>


        <div className="h-px w-full bg-border my-10" />

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight">Rolês publicados</h2>
            <Badge variant="secondary" className="font-bold">
              {events.length} {events.length === 1 ? 'evento' : 'eventos'}
            </Badge>
          </div>

          {loadingEvents ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
              <p className="text-muted-foreground">Nenhum evento ativo no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {events.map(ev => (
                <DiscoveryEventCard 
                  key={ev.id} 
                  event={ev as any} 
                  variant="compact"
                  onClick={() => navigate(`/evento/${ev.slug || ev.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
