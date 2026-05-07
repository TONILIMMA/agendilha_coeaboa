export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atrativos: {
        Row: {
          contact_whatsapp: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          style: string | null
          type: string | null
        }
        Insert: {
          contact_whatsapp?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          style?: string | null
          type?: string | null
        }
        Update: {
          contact_whatsapp?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          style?: string | null
          type?: string | null
        }
        Relationships: []
      }
      collaborators: {
        Row: {
          can_approve: boolean
          can_delete: boolean
          can_edit: boolean
          can_submit: boolean
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          role_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_submit?: boolean
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          role_title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_submit?: boolean
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          role_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_audit_log: {
        Row: {
          action: string
          created_at: string
          event_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      location_requests: {
        Row: {
          created_at: string | null
          id: string
          requested_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          requested_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          requested_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used: boolean
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used?: boolean
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used?: boolean
        }
        Relationships: []
      }
      places: {
        Row: {
          address: string | null
          contact_responsible: string | null
          created_at: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          address?: string | null
          contact_responsible?: string | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          address?: string | null
          contact_responsible?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      portal_locations: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_city: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          company_name: string | null
          contact_social: string | null
          created_at: string
          email: string | null
          home_location: string | null
          id: string
          nick_name: string | null
          phone: string | null
          pin_code: string | null
          responsible_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          contact_social?: string | null
          created_at?: string
          email?: string | null
          home_location?: string | null
          id?: string
          nick_name?: string | null
          phone?: string | null
          pin_code?: string | null
          responsible_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          contact_social?: string | null
          created_at?: string
          email?: string | null
          home_location?: string | null
          id?: string
          nick_name?: string | null
          phone?: string | null
          pin_code?: string | null
          responsible_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          additional_details: string | null
          address_city: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          atrativo_contact: string | null
          atrativo_name: string | null
          atrativo_style: string | null
          atrativo_type: string | null
          category: string | null
          commission: string | null
          company_name: string | null
          concept_description: string | null
          contact_social: string | null
          created_at: string
          date: string | null
          deleted_at: string | null
          description: string | null
          email: string | null
          end_time: string | null
          event_title: string
          id: string
          image_url: string | null
          is_highlight: boolean | null
          latitude: number | null
          legal_acceptance: boolean | null
          legal_acceptance_date: string | null
          location: string | null
          location_contact: string | null
          location_type: string | null
          longitude: number | null
          maintenance_cost: string | null
          phone: string | null
          predicted_duration: string | null
          promotion_rules: string | null
          promotion_type: string | null
          rejection_reason: string | null
          responsible_name: string | null
          responsible_person: string | null
          sale_price: string | null
          shares_count: number | null
          stage: string
          start_time: string | null
          status: string
          subscription_info: string | null
          target_audience: string | null
          user_id: string
          video_link: string | null
          views_count: number | null
        }
        Insert: {
          additional_details?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          atrativo_contact?: string | null
          atrativo_name?: string | null
          atrativo_style?: string | null
          atrativo_type?: string | null
          category?: string | null
          commission?: string | null
          company_name?: string | null
          concept_description?: string | null
          contact_social?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          end_time?: string | null
          event_title: string
          id?: string
          image_url?: string | null
          is_highlight?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          location?: string | null
          location_contact?: string | null
          location_type?: string | null
          longitude?: number | null
          maintenance_cost?: string | null
          phone?: string | null
          predicted_duration?: string | null
          promotion_rules?: string | null
          promotion_type?: string | null
          rejection_reason?: string | null
          responsible_name?: string | null
          responsible_person?: string | null
          sale_price?: string | null
          shares_count?: number | null
          stage?: string
          start_time?: string | null
          status?: string
          subscription_info?: string | null
          target_audience?: string | null
          user_id: string
          video_link?: string | null
          views_count?: number | null
        }
        Update: {
          additional_details?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          atrativo_contact?: string | null
          atrativo_name?: string | null
          atrativo_style?: string | null
          atrativo_type?: string | null
          category?: string | null
          commission?: string | null
          company_name?: string | null
          concept_description?: string | null
          contact_social?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          end_time?: string | null
          event_title?: string
          id?: string
          image_url?: string | null
          is_highlight?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          location?: string | null
          location_contact?: string | null
          location_type?: string | null
          longitude?: number | null
          maintenance_cost?: string | null
          phone?: string | null
          predicted_duration?: string | null
          promotion_rules?: string | null
          promotion_type?: string | null
          rejection_reason?: string | null
          responsible_name?: string | null
          responsible_person?: string | null
          sale_price?: string | null
          shares_count?: number | null
          stage?: string
          start_time?: string | null
          status?: string
          subscription_info?: string | null
          target_audience?: string | null
          user_id?: string
          video_link?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_reset_codes: { Args: never; Returns: undefined }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_shares: { Args: { event_id: string }; Returns: undefined }
      increment_views: { Args: { event_id: string }; Returns: undefined }
      is_master: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "master"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "master"],
    },
  },
} as const
