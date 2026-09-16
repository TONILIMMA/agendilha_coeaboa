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
      ad_plans: {
        Row: {
          benefits: string[]
          created_at: string
          description: string | null
          display_order: number
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          benefits?: string[]
          created_at?: string
          description?: string | null
          display_order?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          benefits?: string[]
          created_at?: string
          description?: string | null
          display_order?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_configs: {
        Row: {
          created_at: string | null
          id: string
          last_changed_at: string | null
          pin_hash: string | null
          requires_change: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_changed_at?: string | null
          pin_hash?: string | null
          requires_change?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_changed_at?: string | null
          pin_hash?: string | null
          requires_change?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_pin_attempts: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_pin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          last_verified_at: string
          token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_verified_at?: string
          token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_verified_at?: string
          token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_type: string
          category: string
          city: string | null
          contact_whatsapp: string
          created_at: string
          description: string
          event_date: string | null
          highlight_plan_id: string | null
          highlight_until: string | null
          id: string
          is_highlight: boolean
          neighborhood: string | null
          photos: string[]
          price_cents: number | null
          published_at: string | null
          rejection_reason: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          ad_type?: string
          category: string
          city?: string | null
          contact_whatsapp: string
          created_at?: string
          description: string
          event_date?: string | null
          highlight_plan_id?: string | null
          highlight_until?: string | null
          id?: string
          is_highlight?: boolean
          neighborhood?: string | null
          photos?: string[]
          price_cents?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          ad_type?: string
          category?: string
          city?: string | null
          contact_whatsapp?: string
          created_at?: string
          description?: string
          event_date?: string | null
          highlight_plan_id?: string | null
          highlight_until?: string | null
          id?: string
          is_highlight?: boolean
          neighborhood?: string | null
          photos?: string[]
          price_cents?: number | null
          published_at?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ads_highlight_plan_id_fkey"
            columns: ["highlight_plan_id"]
            isOneToOne: false
            referencedRelation: "ad_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      app_notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_table: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
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
      app_settings: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
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
          display_order: number
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
          display_order?: number
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
          display_order?: number
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
          {
            foreignKeyName: "artist_media_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "public_artist_profiles"
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
          contact_email: string | null
          cover_url: string | null
          created_at: string
          differentials: string | null
          genre: string | null
          id: string
          instagram: string | null
          is_approved: boolean | null
          is_verified: boolean | null
          member_count: number | null
          members: string[] | null
          moderation_status: string | null
          name: string
          neighborhood: string | null
          rejection_reason: string | null
          representative_name: string | null
          representative_phone: string | null
          spotify: string | null
          spotify_url: string | null
          styles: string[] | null
          technical_needs: string | null
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
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string
          differentials?: string | null
          genre?: string | null
          id?: string
          instagram?: string | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          members?: string[] | null
          moderation_status?: string | null
          name: string
          neighborhood?: string | null
          rejection_reason?: string | null
          representative_name?: string | null
          representative_phone?: string | null
          spotify?: string | null
          spotify_url?: string | null
          styles?: string[] | null
          technical_needs?: string | null
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
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string
          differentials?: string | null
          genre?: string | null
          id?: string
          instagram?: string | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          members?: string[] | null
          moderation_status?: string | null
          name?: string
          neighborhood?: string | null
          rejection_reason?: string | null
          representative_name?: string | null
          representative_phone?: string | null
          spotify?: string | null
          spotify_url?: string | null
          styles?: string[] | null
          technical_needs?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          whatsapp?: string | null
          work_description?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      artistas: {
        Row: {
          cache_faixa: string | null
          categoria: string | null
          contato_id: string
          created_at: string
          genero: string | null
          id: string
          instagram: string | null
          necessidades_tecnicas: string | null
          nome_artistico: string
          portfolio_url: string | null
          possui_estrutura: boolean | null
          quantidade_integrantes: number | null
          release_curto: string | null
          tempo_apresentacao: string | null
          updated_at: string
        }
        Insert: {
          cache_faixa?: string | null
          categoria?: string | null
          contato_id: string
          created_at?: string
          genero?: string | null
          id?: string
          instagram?: string | null
          necessidades_tecnicas?: string | null
          nome_artistico: string
          portfolio_url?: string | null
          possui_estrutura?: boolean | null
          quantidade_integrantes?: number | null
          release_curto?: string | null
          tempo_apresentacao?: string | null
          updated_at?: string
        }
        Update: {
          cache_faixa?: string | null
          categoria?: string | null
          contato_id?: string
          created_at?: string
          genero?: string | null
          id?: string
          instagram?: string | null
          necessidades_tecnicas?: string | null
          nome_artistico?: string
          portfolio_url?: string | null
          possui_estrutura?: boolean | null
          quantidade_integrantes?: number | null
          release_curto?: string | null
          tempo_apresentacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artistas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      atrativos: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category_other: string | null
          cidade_regiao: string | null
          contact_info: string | null
          contact_whatsapp: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estabelecimento_id: string | null
          estado: string | null
          estilos: string[] | null
          fotos: string[] | null
          id: string
          is_approved: boolean
          logo_url: string | null
          membros_equipe: string | null
          name: string
          pais: string | null
          responsavel_email: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          responsavel_redes: string | null
          responsavel_telefone: string | null
          style: string | null
          tipo_atrativo: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_other?: string | null
          cidade_regiao?: string | null
          contact_info?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estabelecimento_id?: string | null
          estado?: string | null
          estilos?: string[] | null
          fotos?: string[] | null
          id?: string
          is_approved?: boolean
          logo_url?: string | null
          membros_equipe?: string | null
          name: string
          pais?: string | null
          responsavel_email?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          responsavel_redes?: string | null
          responsavel_telefone?: string | null
          style?: string | null
          tipo_atrativo?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_other?: string | null
          cidade_regiao?: string | null
          contact_info?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estabelecimento_id?: string | null
          estado?: string | null
          estilos?: string[] | null
          fotos?: string[] | null
          id?: string
          is_approved?: boolean
          logo_url?: string | null
          membros_equipe?: string | null
          name?: string
          pais?: string | null
          responsavel_email?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          responsavel_redes?: string | null
          responsavel_telefone?: string | null
          style?: string | null
          tipo_atrativo?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atrativos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atrativos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos_public"
            referencedColumns: ["id"]
          },
        ]
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
      contatos: {
        Row: {
          bairro: string
          created_at: string
          endereco: string | null
          id: string
          nome: string
          status: string
          tipo_perfil: Database["public"]["Enums"]["tipo_perfil_cadastro"]
          updated_at: string
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          bairro: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          status?: string
          tipo_perfil: Database["public"]["Enums"]["tipo_perfil_cadastro"]
          updated_at?: string
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          bairro?: string
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          status?: string
          tipo_perfil?: Database["public"]["Enums"]["tipo_perfil_cadastro"]
          updated_at?: string
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      divulgador_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          motivo: string | null
          nome: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tipo_divulgador: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          nome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tipo_divulgador?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          nome?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tipo_divulgador?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      divulgadores: {
        Row: {
          contato_id: string
          cpf: string | null
          cpf_hash: string | null
          cpf_last2: string | null
          created_at: string
          id: string
          instagram: string | null
          nome_projeto: string | null
          observacoes: string | null
          updated_at: string
          validado: boolean
        }
        Insert: {
          contato_id: string
          cpf?: string | null
          cpf_hash?: string | null
          cpf_last2?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          nome_projeto?: string | null
          observacoes?: string | null
          updated_at?: string
          validado?: boolean
        }
        Update: {
          contato_id?: string
          cpf?: string | null
          cpf_hash?: string | null
          cpf_last2?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          nome_projeto?: string | null
          observacoes?: string | null
          updated_at?: string
          validado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "divulgadores_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimentos: {
        Row: {
          anotacoes: string | null
          approved_at: string | null
          approved_by: string | null
          bairro: string | null
          cep: string | null
          cnpj: string | null
          complemento: string | null
          contato: string | null
          created_at: string
          created_by: string | null
          endereco: string | null
          fotos: string[] | null
          id: string
          is_approved: boolean
          nome: string
          numero: string | null
          responsavel_email: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          responsavel_redes: string | null
          responsavel_telefone: string | null
          tipo: string | null
          tipos: string[] | null
          updated_at: string
        }
        Insert: {
          anotacoes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bairro?: string | null
          cep?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          endereco?: string | null
          fotos?: string[] | null
          id?: string
          is_approved?: boolean
          nome: string
          numero?: string | null
          responsavel_email?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          responsavel_redes?: string | null
          responsavel_telefone?: string | null
          tipo?: string | null
          tipos?: string[] | null
          updated_at?: string
        }
        Update: {
          anotacoes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          bairro?: string | null
          cep?: string | null
          cnpj?: string | null
          complemento?: string | null
          contato?: string | null
          created_at?: string
          created_by?: string | null
          endereco?: string | null
          fotos?: string[] | null
          id?: string
          is_approved?: boolean
          nome?: string
          numero?: string | null
          responsavel_email?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          responsavel_redes?: string | null
          responsavel_telefone?: string | null
          tipo?: string | null
          tipos?: string[] | null
          updated_at?: string
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
      event_publication_log: {
        Row: {
          channel: string
          copy_used: string | null
          created_at: string
          event_id: string
          id: string
          published_at: string
          responsible_id: string | null
          template_id: string | null
        }
        Insert: {
          channel: string
          copy_used?: string | null
          created_at?: string
          event_id: string
          id?: string
          published_at?: string
          responsible_id?: string | null
          template_id?: string | null
        }
        Update: {
          channel?: string
          copy_used?: string | null
          created_at?: string
          event_id?: string
          id?: string
          published_at?: string
          responsible_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_publication_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_publication_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
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
      highlight_packages: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          price_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
          updated_by?: string | null
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
      pin_reset_attempts: {
        Row: {
          created_at: string
          id: string
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          success?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          success?: boolean
          user_id?: string
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
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          avatar_url: string | null
          city: string | null
          company_name: string | null
          company_type: string | null
          contact_social: string | null
          country: string | null
          coverage_area: string[] | null
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
          social_links: Json | null
          updated_at: string
          user_id: string
          user_type: string | null
          whatsapp_phone: string | null
          work_neighborhood: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          company_type?: string | null
          contact_social?: string | null
          country?: string | null
          coverage_area?: string[] | null
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
          social_links?: Json | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          whatsapp_phone?: string | null
          work_neighborhood?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          company_type?: string | null
          contact_social?: string | null
          country?: string | null
          coverage_area?: string[] | null
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
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          whatsapp_phone?: string | null
          work_neighborhood?: string | null
        }
        Relationships: []
      }
      promotor_profiles: {
        Row: {
          created_at: string
          id: string
          promotor_nome: string
          promotor_whatsapp: string | null
          tipo_promotor: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promotor_nome: string
          promotor_whatsapp?: string | null
          tipo_promotor?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promotor_nome?: string
          promotor_whatsapp?: string | null
          tipo_promotor?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      segmentos_notificacao: {
        Row: {
          ativo: boolean
          bairro: string
          categoria_evento: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bairro: string
          categoria_evento: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bairro?: string
          categoria_evento?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      submission_atrativos: {
        Row: {
          atrativo_id: string | null
          category: string | null
          category_other: string | null
          created_at: string
          display_order: number
          email: string | null
          id: string
          name: string
          submission_id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          atrativo_id?: string | null
          category?: string | null
          category_other?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          name: string
          submission_id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          atrativo_id?: string | null
          category?: string | null
          category_other?: string | null
          created_at?: string
          display_order?: number
          email?: string | null
          id?: string
          name?: string
          submission_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_atrativos_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_atrativos_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_atrativos_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_atrativos_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_change_requests: {
        Row: {
          created_at: string
          current_whatsapp: string | null
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          id: string
          proposed_whatsapp: string | null
          reason: string
          request_type: string
          requested_by: string
          revoke_authorization: boolean
          status: string
          submission_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_whatsapp?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          proposed_whatsapp?: string | null
          reason: string
          request_type?: string
          requested_by: string
          revoke_authorization?: boolean
          status?: string
          submission_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_whatsapp?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          id?: string
          proposed_whatsapp?: string | null
          reason?: string
          request_type?: string
          requested_by?: string
          revoke_authorization?: boolean
          status?: string
          submission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_change_requests_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_change_requests_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
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
          admin_notes: string | null
          age_rating: string | null
          ai_moderation_labels: string[] | null
          ai_moderation_score: number | null
          approved_at: string | null
          approved_by: string | null
          artist_id: string | null
          atrativo_contact: string | null
          atrativo_id: string | null
          atrativo_name: string | null
          atrativo_style: string | null
          atrativo_type: string | null
          category: string | null
          checklist_envio_registrado: boolean
          checklist_publ_canal: boolean
          checklist_visivel_agenda: boolean
          commission: string | null
          company_name: string | null
          concept_description: string | null
          confirmed_at: string | null
          contact_social: string | null
          created_at: string
          date: string | null
          deleted_at: string | null
          description: string | null
          duvidas_source: string
          editorial_published_at: string | null
          editorial_status: Database["public"]["Enums"]["editorial_status"]
          email: string | null
          end_time: string | null
          estabelecimento_id: string | null
          event_title: string | null
          flyer_approved_at: string | null
          flyer_aprovado: boolean
          fotos: string[] | null
          highlight_hidden: boolean
          highlight_package_id: string | null
          highlight_starts_at: string | null
          highlight_until: string | null
          id: string
          image_url: string | null
          image_url_story: string | null
          image_url_whatsapp: string | null
          is_highlight: boolean | null
          is_suitable_for_minors: boolean | null
          latitude: number | null
          legal_acceptance: boolean | null
          legal_acceptance_date: string | null
          local_tipo: string | null
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
          published_channels: string[]
          ready_at: string | null
          received_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          report_count: number | null
          responsavel_duvidas_whatsapp: string | null
          responsavel_perfil: Json | null
          responsavel_tipo: string | null
          responsible_name: string | null
          responsible_person: string | null
          review_started_at: string | null
          sale_price: string | null
          scheduled_at: string | null
          scheduled_channel: string | null
          scheduled_for_at: string | null
          shares_count: number | null
          short_copy: string | null
          slug: string | null
          stage: string
          start_time: string | null
          status: string
          subscription_info: string | null
          target_audience: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
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
          admin_notes?: string | null
          age_rating?: string | null
          ai_moderation_labels?: string[] | null
          ai_moderation_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          artist_id?: string | null
          atrativo_contact?: string | null
          atrativo_id?: string | null
          atrativo_name?: string | null
          atrativo_style?: string | null
          atrativo_type?: string | null
          category?: string | null
          checklist_envio_registrado?: boolean
          checklist_publ_canal?: boolean
          checklist_visivel_agenda?: boolean
          commission?: string | null
          company_name?: string | null
          concept_description?: string | null
          confirmed_at?: string | null
          contact_social?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          duvidas_source?: string
          editorial_published_at?: string | null
          editorial_status?: Database["public"]["Enums"]["editorial_status"]
          email?: string | null
          end_time?: string | null
          estabelecimento_id?: string | null
          event_title?: string | null
          flyer_approved_at?: string | null
          flyer_aprovado?: boolean
          fotos?: string[] | null
          highlight_hidden?: boolean
          highlight_package_id?: string | null
          highlight_starts_at?: string | null
          highlight_until?: string | null
          id?: string
          image_url?: string | null
          image_url_story?: string | null
          image_url_whatsapp?: string | null
          is_highlight?: boolean | null
          is_suitable_for_minors?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          local_tipo?: string | null
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
          published_channels?: string[]
          ready_at?: string | null
          received_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          responsavel_duvidas_whatsapp?: string | null
          responsavel_perfil?: Json | null
          responsavel_tipo?: string | null
          responsible_name?: string | null
          responsible_person?: string | null
          review_started_at?: string | null
          sale_price?: string | null
          scheduled_at?: string | null
          scheduled_channel?: string | null
          scheduled_for_at?: string | null
          shares_count?: number | null
          short_copy?: string | null
          slug?: string | null
          stage?: string
          start_time?: string | null
          status?: string
          subscription_info?: string | null
          target_audience?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
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
          admin_notes?: string | null
          age_rating?: string | null
          ai_moderation_labels?: string[] | null
          ai_moderation_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          artist_id?: string | null
          atrativo_contact?: string | null
          atrativo_id?: string | null
          atrativo_name?: string | null
          atrativo_style?: string | null
          atrativo_type?: string | null
          category?: string | null
          checklist_envio_registrado?: boolean
          checklist_publ_canal?: boolean
          checklist_visivel_agenda?: boolean
          commission?: string | null
          company_name?: string | null
          concept_description?: string | null
          confirmed_at?: string | null
          contact_social?: string | null
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          duvidas_source?: string
          editorial_published_at?: string | null
          editorial_status?: Database["public"]["Enums"]["editorial_status"]
          email?: string | null
          end_time?: string | null
          estabelecimento_id?: string | null
          event_title?: string | null
          flyer_approved_at?: string | null
          flyer_aprovado?: boolean
          fotos?: string[] | null
          highlight_hidden?: boolean
          highlight_package_id?: string | null
          highlight_starts_at?: string | null
          highlight_until?: string | null
          id?: string
          image_url?: string | null
          image_url_story?: string | null
          image_url_whatsapp?: string | null
          is_highlight?: boolean | null
          is_suitable_for_minors?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          local_tipo?: string | null
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
          published_channels?: string[]
          ready_at?: string | null
          received_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          responsavel_duvidas_whatsapp?: string | null
          responsavel_perfil?: Json | null
          responsavel_tipo?: string | null
          responsible_name?: string | null
          responsible_person?: string | null
          review_started_at?: string | null
          sale_price?: string | null
          scheduled_at?: string | null
          scheduled_channel?: string | null
          scheduled_for_at?: string | null
          shares_count?: number | null
          short_copy?: string | null
          slug?: string | null
          stage?: string
          start_time?: string | null
          status?: string
          subscription_info?: string | null
          target_audience?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
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
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "public_artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_atrativo_id_fkey"
            columns: ["atrativo_id"]
            isOneToOne: false
            referencedRelation: "atrativos_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_highlight_package_id_fkey"
            columns: ["highlight_package_id"]
            isOneToOne: false
            referencedRelation: "highlight_packages"
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
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pins: {
        Row: {
          created_at: string
          last_changed_at: string
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_changed_at?: string
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_changed_at?: string
          pin_hash?: string
          updated_at?: string
          user_id?: string
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
      usuarios_publicos: {
        Row: {
          aceita_notificacoes: boolean
          contato_id: string
          created_at: string
          frequencia_notificacao: string
          id: string
          interesses: string[]
          origem_cadastro: string | null
          updated_at: string
        }
        Insert: {
          aceita_notificacoes?: boolean
          contato_id: string
          created_at?: string
          frequencia_notificacao?: string
          id?: string
          interesses?: string[]
          origem_cadastro?: string | null
          updated_at?: string
        }
        Update: {
          aceita_notificacoes?: boolean
          contato_id?: string
          created_at?: string
          frequencia_notificacao?: string
          id?: string
          interesses?: string[]
          origem_cadastro?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_publicos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      atrativos_public: {
        Row: {
          cidade_regiao: string | null
          created_at: string | null
          description: string | null
          estabelecimento_id: string | null
          estado: string | null
          estilos: string[] | null
          fotos: string[] | null
          id: string | null
          logo_url: string | null
          name: string | null
          pais: string | null
          style: string | null
          tipo_atrativo: string | null
          type: string | null
        }
        Insert: {
          cidade_regiao?: string | null
          created_at?: string | null
          description?: string | null
          estabelecimento_id?: string | null
          estado?: string | null
          estilos?: string[] | null
          fotos?: string[] | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          pais?: string | null
          style?: string | null
          tipo_atrativo?: string | null
          type?: string | null
        }
        Update: {
          cidade_regiao?: string | null
          created_at?: string | null
          description?: string | null
          estabelecimento_id?: string | null
          estado?: string | null
          estilos?: string[] | null
          fotos?: string[] | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          pais?: string | null
          style?: string | null
          tipo_atrativo?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atrativos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atrativos_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos_public"
            referencedColumns: ["id"]
          },
        ]
      }
      estabelecimentos_public: {
        Row: {
          bairro: string | null
          cep: string | null
          complemento: string | null
          created_at: string | null
          endereco: string | null
          fotos: string[] | null
          id: string | null
          nome: string | null
          numero: string | null
          tipo: string | null
          tipos: string[] | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          complemento?: string | null
          created_at?: string | null
          endereco?: string | null
          fotos?: string[] | null
          id?: string | null
          nome?: string | null
          numero?: string | null
          tipo?: string | null
          tipos?: string[] | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          complemento?: string | null
          created_at?: string | null
          endereco?: string | null
          fotos?: string[] | null
          id?: string | null
          nome?: string | null
          numero?: string | null
          tipo?: string | null
          tipos?: string[] | null
        }
        Relationships: []
      }
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
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      public_artist_profiles: {
        Row: {
          artist_type: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          contact_email: string | null
          cover_url: string | null
          created_at: string | null
          differentials: string | null
          genre: string | null
          id: string | null
          instagram: string | null
          is_approved: boolean | null
          is_verified: boolean | null
          member_count: number | null
          moderation_status: string | null
          name: string | null
          neighborhood: string | null
          rejection_reason: string | null
          spotify: string | null
          spotify_url: string | null
          styles: string[] | null
          updated_at: string | null
          user_id: string | null
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
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string | null
          differentials?: string | null
          genre?: string | null
          id?: string | null
          instagram?: string | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          moderation_status?: string | null
          name?: string | null
          neighborhood?: string | null
          rejection_reason?: string | null
          spotify?: string | null
          spotify_url?: string | null
          styles?: string[] | null
          updated_at?: string | null
          user_id?: string | null
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
          contact_email?: string | null
          cover_url?: string | null
          created_at?: string | null
          differentials?: string | null
          genre?: string | null
          id?: string | null
          instagram?: string | null
          is_approved?: boolean | null
          is_verified?: boolean | null
          member_count?: number | null
          moderation_status?: string | null
          name?: string | null
          neighborhood?: string | null
          rejection_reason?: string | null
          spotify?: string | null
          spotify_url?: string | null
          styles?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website_url?: string | null
          whatsapp?: string | null
          work_description?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      public_submissions: {
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
          atrativo_name: string | null
          atrativo_style: string | null
          atrativo_type: string | null
          category: string | null
          commission: string | null
          company_name: string | null
          concept_description: string | null
          created_at: string | null
          date: string | null
          deleted_at: string | null
          description: string | null
          duvidas_phone: string | null
          duvidas_source: string | null
          end_time: string | null
          event_title: string | null
          fotos: string[] | null
          highlight_active: boolean | null
          highlight_hidden: boolean | null
          highlight_until: string | null
          id: string | null
          image_url: string | null
          image_url_story: string | null
          image_url_whatsapp: string | null
          is_highlight: boolean | null
          is_suitable_for_minors: boolean | null
          latitude: number | null
          legal_acceptance: boolean | null
          legal_acceptance_date: string | null
          location: string | null
          location_type: string | null
          long_copy: string | null
          longitude: number | null
          maintenance_cost: string | null
          moderation_status: string | null
          predicted_duration: string | null
          promotion_rules: string | null
          promotion_type: string | null
          published_at: string | null
          rejection_reason: string | null
          report_count: number | null
          responsavel_duvidas_whatsapp: string | null
          sale_price: string | null
          shares_count: number | null
          short_copy: string | null
          slug: string | null
          stage: string | null
          start_time: string | null
          status: string | null
          subscription_info: string | null
          target_audience: string | null
          user_id: string | null
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
          atrativo_name?: string | null
          atrativo_style?: string | null
          atrativo_type?: string | null
          category?: string | null
          commission?: string | null
          company_name?: string | null
          concept_description?: string | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          duvidas_phone?: never
          duvidas_source?: string | null
          end_time?: string | null
          event_title?: string | null
          fotos?: string[] | null
          highlight_active?: never
          highlight_hidden?: boolean | null
          highlight_until?: string | null
          id?: string | null
          image_url?: string | null
          image_url_story?: string | null
          image_url_whatsapp?: string | null
          is_highlight?: boolean | null
          is_suitable_for_minors?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          location?: string | null
          location_type?: string | null
          long_copy?: string | null
          longitude?: number | null
          maintenance_cost?: string | null
          moderation_status?: string | null
          predicted_duration?: string | null
          promotion_rules?: string | null
          promotion_type?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          responsavel_duvidas_whatsapp?: string | null
          sale_price?: string | null
          shares_count?: number | null
          short_copy?: string | null
          slug?: string | null
          stage?: string | null
          start_time?: string | null
          status?: string | null
          subscription_info?: string | null
          target_audience?: string | null
          user_id?: string | null
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
          atrativo_name?: string | null
          atrativo_style?: string | null
          atrativo_type?: string | null
          category?: string | null
          commission?: string | null
          company_name?: string | null
          concept_description?: string | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          duvidas_phone?: never
          duvidas_source?: string | null
          end_time?: string | null
          event_title?: string | null
          fotos?: string[] | null
          highlight_active?: never
          highlight_hidden?: boolean | null
          highlight_until?: string | null
          id?: string | null
          image_url?: string | null
          image_url_story?: string | null
          image_url_whatsapp?: string | null
          is_highlight?: boolean | null
          is_suitable_for_minors?: boolean | null
          latitude?: number | null
          legal_acceptance?: boolean | null
          legal_acceptance_date?: string | null
          location?: string | null
          location_type?: string | null
          long_copy?: string | null
          longitude?: number | null
          maintenance_cost?: string | null
          moderation_status?: string | null
          predicted_duration?: string | null
          promotion_rules?: string | null
          promotion_type?: string | null
          published_at?: string | null
          rejection_reason?: string | null
          report_count?: number | null
          responsavel_duvidas_whatsapp?: string | null
          sale_price?: string | null
          shares_count?: number | null
          short_copy?: string | null
          slug?: string | null
          stage?: string | null
          start_time?: string | null
          status?: string | null
          subscription_info?: string | null
          target_audience?: string | null
          user_id?: string | null
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
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "public_artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _cpf_hash: { Args: { _cpf: string }; Returns: string }
      admin_pin_status: {
        Args: never
        Returns: {
          has_pin: boolean
          is_admin: boolean
          requires_change: boolean
        }[]
      }
      can_create_events: { Args: { _user_id: string }; Returns: boolean }
      cleanup_admin_pin_sessions: { Args: never; Returns: undefined }
      cleanup_expired_reset_codes: { Args: never; Returns: undefined }
      contains_bad_words: { Args: { text_to_check: string }; Returns: boolean }
      count_recent_failed_pin_attempts: {
        Args: { _user_id: string }
        Returns: number
      }
      create_admin_pin_session: {
        Args: { input_pin: string }
        Returns: {
          error_message: string
          requires_change: boolean
          session_token: string
        }[]
      }
      generate_slug: { Args: { title: string }; Returns: string }
      get_admin_dashboard_stats: {
        Args: {
          p_category?: string
          p_neighborhood?: string
          p_period?: string
        }
        Returns: Json
      }
      get_artist_private_contacts: {
        Args: { p_artist_id: string }
        Returns: {
          representative_name: string
          representative_phone: string
        }[]
      }
      get_atrativo_internal: {
        Args: { _id: string }
        Returns: {
          responsavel_email: string
          responsavel_nome: string
          responsavel_redes: string
          responsavel_telefone: string
        }[]
      }
      get_estabelecimento_internal: {
        Args: { _id: string }
        Returns: {
          responsavel_email: string
          responsavel_nome: string
          responsavel_redes: string
          responsavel_telefone: string
        }[]
      }
      get_pipeline_metrics: { Args: never; Returns: Json }
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
      increment_ad_views: { Args: { target_ad_id: string }; Returns: undefined }
      increment_shares: { Args: { event_id: string }; Returns: undefined }
      increment_views: { Args: { event_id: string }; Returns: undefined }
      is_admin_or_master: { Args: { p_user_id: string }; Returns: boolean }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      is_promotor: { Args: { _user_id: string }; Returns: boolean }
      owns_artist_media_path: { Args: { _name: string }; Returns: boolean }
      process_expired_highlights: {
        Args: never
        Returns: {
          nome_tabela: string
          registro_id: string
        }[]
      }
      report_event: {
        Args: {
          report_description?: string
          report_reason: string
          target_event_id: string
        }
        Returns: undefined
      }
      reset_admin_pin_as_master: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      reset_admin_pin_with_password: {
        Args: { current_password: string; new_pin: string }
        Returns: undefined
      }
      resolve_user_id_by_email: { Args: { p_email: string }; Returns: string }
      revoke_admin_pin_session: {
        Args: { input_token: string }
        Returns: undefined
      }
      search_atrativos_autocomplete: {
        Args: { _limit?: number; _offset?: number; _q?: string }
        Returns: {
          cidade_regiao: string
          contact_whatsapp: string
          description: string
          estabelecimento_id: string
          estado: string
          estilos: string[]
          fotos: string[]
          id: string
          is_approved: boolean
          logo_url: string
          name: string
          pais: string
          style: string
          tipo_atrativo: string
          type: string
        }[]
      }
      search_estabelecimentos_autocomplete: {
        Args: { _limit?: number; _offset?: number; _q?: string }
        Returns: {
          bairro: string
          cep: string
          complemento: string
          contato: string
          endereco: string
          fotos: string[]
          id: string
          is_approved: boolean
          nome: string
          numero: string
          tipo: string
          tipos: string[]
        }[]
      }
      set_user_pin: {
        Args: { current_password: string; new_pin: string }
        Returns: undefined
      }
      setup_admin_pin: {
        Args: { new_pin: string }
        Returns: {
          error_message: string
          session_token: string
        }[]
      }
      update_admin_pin: {
        Args: { current_pin: string; new_pin: string }
        Returns: undefined
      }
      user_pin_status: { Args: never; Returns: boolean }
      verify_admin_pin: { Args: { input_pin: string }; Returns: boolean }
      verify_admin_pin_session: {
        Args: { input_token: string }
        Returns: boolean
      }
      verify_user_pin_for_reset: {
        Args: { p_pin: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "master"
      editorial_status:
        | "recebido"
        | "em_revisao"
        | "flyer_aprovado"
        | "pronto_divulgar"
        | "agendado"
        | "publicado"
        | "confirmado"
        | "rejeitado"
      tipo_perfil_cadastro: "publico" | "divulgador" | "artista"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      editorial_status: [
        "recebido",
        "em_revisao",
        "flyer_aprovado",
        "pronto_divulgar",
        "agendado",
        "publicado",
        "confirmado",
        "rejeitado",
      ],
      tipo_perfil_cadastro: ["publico", "divulgador", "artista"],
    },
  },
} as const
