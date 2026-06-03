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
      admin_configs: {
        Row: {
          created_at: string | null
          id: string
          pin_hash: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pin_hash?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pin_hash?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      app_role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "app_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      app_user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_media: {
        Row: {
          ai_score: number | null
          artist_id: string
          created_at: string
          id: string
          is_approved: boolean | null
          media_type: string | null
          moderation_status: string | null
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          ai_score?: number | null
          artist_id: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          media_type?: string | null
          moderation_status?: string | null
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          ai_score?: number | null
          artist_id?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          media_type?: string | null
          moderation_status?: string | null
          thumbnail_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_media_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_profiles: {
        Row: {
          artist_type: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          differentials: string | null
          genre: string | null
          id: string
          instagram: string | null
          is_approved: boolean | null
          is_verified: boolean | null
          member_count: number | null
          moderation_status: string | null
          name: string
          neighborhood: string | null
          rejection_reason: string | null
          spotify: string | null
          spotify_url: string | null
          styles: string[] | null
          updated_at: string
          user_id: string
          website_url: string | null
          whatsapp: string | null
          work_description: string | null
          youtube: string | null
        }
        Insert: {
          artist_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          differentials?: string | null
          genre?: string | null
          id?: string
          instagram?: string | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          moderation_status?: string | null
          name: string
          neighborhood?: string | null
          rejection_reason?: string | null
          spotify?: string | null
          spotify_url?: string | null
          styles?: string[] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          whatsapp?: string | null
          work_description?: string | null
          youtube?: string | null
        }
        Update: {
          artist_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          differentials?: string | null
          genre?: string | null
          id?: string
          instagram?: string | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          moderation_status?: string | null
          name?: string
          neighborhood?: string | null
          rejection_reason?: string | null
          spotify?: string | null
          spotify_url?: string | null
          styles?: string[] | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          whatsapp?: string | null
          work_description?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          previous_value: Json | null
          reason: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          previous_value?: Json | null
          reason?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
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
      event_reports: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          reason: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          reason: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          reason?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          comment: string | null
          created_at: string
          event_id: string
          id: string
          is_flagged: boolean | null
          rating: number
          status: string | null
          user_name: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          event_id: string
          id?: string
          is_flagged?: boolean | null
          rating: number
          status?: string | null
          user_name?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          event_id?: string
          id?: string
          is_flagged?: boolean | null
          rating?: number
          status?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
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
      moderation_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          moderator_id: string | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          neighborhood: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          neighborhood?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          neighborhood?: string | null
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
          city: string | null
          company_name: string | null
          contact_social: string | null
          created_at: string
          email: string | null
          email_notifications_enabled: boolean | null
          event_type_preferences: string[] | null
          followed_neighborhoods: string[] | null
          followed_styles: string[] | null
          home_location: string | null
          id: string
          musical_preferences: string[] | null
          must_change_password: boolean
          nick_name: string | null
          notification_frequency: string | null
          onboarding_completed: boolean | null
          phone: string | null
          push_notifications_enabled: boolean | null
          responsible_name: string | null
          role: string | null
          updated_at: string
          user_id: string
          work_neighborhood: string | null
        }
        Insert: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          city?: string | null
          company_name?: string | null
          contact_social?: string | null
          created_at?: string
          email?: string | null
          email_notifications_enabled?: boolean | null
          event_type_preferences?: string[] | null
          followed_neighborhoods?: string[] | null
          followed_styles?: string[] | null
          home_location?: string | null
          id?: string
          musical_preferences?: string[] | null
          must_change_password?: boolean
          nick_name?: string | null
          notification_frequency?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          push_notifications_enabled?: boolean | null
          responsible_name?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
          work_neighborhood?: string | null
        }
        Update: {
          address_city?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          city?: string | null
          company_name?: string | null
          contact_social?: string | null
          created_at?: string
          email?: string | null
          email_notifications_enabled?: boolean | null
          event_type_preferences?: string[] | null
          followed_neighborhoods?: string[] | null
          followed_styles?: string[] | null
          home_location?: string | null
          id?: string
          musical_preferences?: string[] | null
          must_change_password?: boolean
          nick_name?: string | null
          notification_frequency?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          push_notifications_enabled?: boolean | null
          responsible_name?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
          work_neighborhood?: string | null
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
          age_rating: string | null
          ai_moderation_labels: string[] | null
          ai_moderation_score: number | null
          approved_at: string | null
          approved_by: string | null
          artist_id: string | null
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
          image_url_story: string | null
          image_url_whatsapp: string | null
          is_highlight: boolean | null
          is_suitable_for_minors: boolean | null
          latitude: number | null
          legal_acceptance: boolean | null
          legal_acceptance_date: string | null
          location: string | null
          location_contact: string | null
          location_type: string | null
          long_copy: string | null
          longitude: number | null
          maintenance_cost: string | null
          moderation_status: string | null
          phone: string | null
          predicted_duration: string | null
          promotion_rules: string | null
          promotion_type: string | null
          published_at: string | null
          rejection_reason: string | null
          report_count: number | null
          responsible_name: string | null
          responsible_person: string | null
          sale_price: string | null
          shares_count: number | null
          short_copy: string | null
          slug: string | null
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
          age_rating?: string | null
          ai_moderation_labels?: string[] | null
          ai_moderation_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          artist_id?: string | null
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
          image_url_story?: string | null
          image_url_whatsapp?: string | null
          is_highlight?: boolean | null
          is_suitable_for_minors?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          location?: string | null
          location_contact?: string | null
          location_type?: string | null
          long_copy?: string | null
          longitude?: number | null
          maintenance_cost?: string | null
          moderation_status?: string | null
          phone?: string | null
          predicted_duration?: string | null
          promotion_rules?: string | null
          promotion_type?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          responsible_name?: string | null
          responsible_person?: string | null
          sale_price?: string | null
          shares_count?: number | null
          short_copy?: string | null
          slug?: string | null
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
          age_rating?: string | null
          ai_moderation_labels?: string[] | null
          ai_moderation_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          artist_id?: string | null
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
          image_url_story?: string | null
          image_url_whatsapp?: string | null
          is_highlight?: boolean | null
          is_suitable_for_minors?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          location?: string | null
          location_contact?: string | null
          location_type?: string | null
          long_copy?: string | null
          longitude?: number | null
          maintenance_cost?: string | null
          moderation_status?: string | null
          phone?: string | null
          predicted_duration?: string | null
          promotion_rules?: string | null
          promotion_type?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          responsible_name?: string | null
          responsible_person?: string | null
          sale_price?: string | null
          shares_count?: number | null
          short_copy?: string | null
          slug?: string | null
          stage?: string
          start_time?: string | null
          status?: string
          subscription_info?: string | null
          target_audience?: string | null
          user_id?: string
          video_link?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
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
      event_ratings_summary: {
        Row: {
          average_rating: number | null
          event_id: string | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_reset_codes: { Args: never; Returns: undefined }
      contains_bad_words: { Args: { text_to_check: string }; Returns: boolean }
      generate_slug: { Args: { title: string }; Returns: string }
      get_admin_dashboard_stats: {
        Args: {
          p_category?: string
          p_neighborhood?: string
          p_period?: string
        }
        Returns: Json
      }
      get_user_permissions: { Args: { p_user_id: string }; Returns: string[] }
      has_app_permission: {
        Args: { p_permission_name: string; p_user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_shares: { Args: { event_id: string }; Returns: undefined }
      increment_views: { Args: { event_id: string }; Returns: undefined }
      is_admin_or_master: { Args: { p_user_id: string }; Returns: boolean }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      report_event: {
        Args: {
          report_description?: string
          report_reason: string
          target_event_id: string
        }
        Returns: undefined
      }
      update_admin_pin: { Args: { new_pin: string }; Returns: undefined }
      verify_admin_pin: { Args: { input_pin: string }; Returns: boolean }
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
