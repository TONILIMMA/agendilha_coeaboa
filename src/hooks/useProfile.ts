import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

 export interface ProfileAddress {
   company_name: string;
   responsible_name: string;
   email: string;
   phone: string;
   address_street: string;
   address_number: string;
   address_neighborhood: string;
   address_city: string;
   address_state: string;
   address_zip: string;
    contact_social: string;
    nick_name?: string;
    home_location?: string;
    work_neighborhood?: string;
    musical_preferences?: string[];
    event_type_preferences?: string[];
    role?: string;
  }
 
 const emptyAddress: ProfileAddress = {
   company_name: "",
   responsible_name: "",
   email: "",
   phone: "",
   address_street: "",
   address_number: "",
   address_neighborhood: "",
   address_city: "",
   address_state: "",
   address_zip: "",
    contact_social: "",
     nick_name: "",
     home_location: "",
     work_neighborhood: "",
      musical_preferences: [],
      event_type_preferences: [],
      role: "public",
    };

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileAddress>(emptyAddress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(emptyAddress);
      setLoaded(false);
      return;
    }
    loadProfile(user.id);
  }, [user]);

    async function loadProfile(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("company_name, responsible_name, email, phone, address_street, address_number, address_neighborhood, address_city, address_state, address_zip, contact_social, nick_name, home_location, work_neighborhood, musical_preferences, event_type_preferences, role")
        .eq("user_id", userId)
        .maybeSingle();
 
     if (data) {
       setProfile({
         company_name: data.company_name || "",
         responsible_name: data.responsible_name || "",
         email: data.email || "",
         phone: data.phone || "",
         address_street: data.address_street || "",
         address_number: data.address_number || "",
         address_neighborhood: data.address_neighborhood || "",
         address_city: data.address_city || "",
         address_state: data.address_state || "",
         address_zip: data.address_zip || "",
         contact_social: data.contact_social || "",
           nick_name: data.nick_name || "",
           home_location: data.home_location || "",
           work_neighborhood: data.work_neighborhood || "",
            musical_preferences: data.musical_preferences || [],
            event_type_preferences: data.event_type_preferences || [],
            role: data.role || "public",
          });
     }
     setLoaded(true);
   }

  async function saveProfile(data: Partial<ProfileAddress>) {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      setProfile((prev) => ({ ...prev, ...data }));
      toast.success("Perfil atualizado!");
    }
  }

  return { profile, loaded, saveProfile };
}
