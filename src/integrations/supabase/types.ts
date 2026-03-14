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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          input_text: string
          result: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          input_text: string
          result?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          input_text?: string
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          area_do_direito: string | null
          created_at: string
          id: string
          leis_citadas: string[] | null
          mensagem_resumo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_do_direito?: string | null
          created_at?: string
          id?: string
          leis_citadas?: string[] | null
          mensagem_resumo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_do_direito?: string | null
          created_at?: string
          id?: string
          leis_citadas?: string[] | null
          mensagem_resumo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          area: string | null
          contact: string | null
          created_at: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          area?: string | null
          contact?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          area?: string | null
          contact?: string | null
          created_at?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      decisions: {
        Row: {
          argumentos_principais: string[] | null
          autor_recorrente: string | null
          comarca: string | null
          comarca_pequena: boolean | null
          created_at: string | null
          data_decisao: string | null
          embedding: string | null
          ementa: string | null
          external_id: string | null
          full_text: string | null
          id: string
          instancia: string | null
          jurisprudencias_citadas: string[] | null
          legislacao_citada: string[] | null
          numero_processo: string | null
          ramos_direito: string[] | null
          relator: string | null
          resultado: string | null
          resultado_descricao: string | null
          resumo_ia: string | null
          reu_recorrido: string | null
          score_utilidade: number | null
          source: string
          source_url: string | null
          temas_juridicos: string[] | null
          tipo_decisao: string | null
          tribunal: string | null
          uf: string | null
          updated_at: string | null
          upvotes: number | null
          vara: string | null
          verified: boolean | null
          view_count: number | null
        }
        Insert: {
          argumentos_principais?: string[] | null
          autor_recorrente?: string | null
          comarca?: string | null
          comarca_pequena?: boolean | null
          created_at?: string | null
          data_decisao?: string | null
          embedding?: string | null
          ementa?: string | null
          external_id?: string | null
          full_text?: string | null
          id?: string
          instancia?: string | null
          jurisprudencias_citadas?: string[] | null
          legislacao_citada?: string[] | null
          numero_processo?: string | null
          ramos_direito?: string[] | null
          relator?: string | null
          resultado?: string | null
          resultado_descricao?: string | null
          resumo_ia?: string | null
          reu_recorrido?: string | null
          score_utilidade?: number | null
          source?: string
          source_url?: string | null
          temas_juridicos?: string[] | null
          tipo_decisao?: string | null
          tribunal?: string | null
          uf?: string | null
          updated_at?: string | null
          upvotes?: number | null
          vara?: string | null
          verified?: boolean | null
          view_count?: number | null
        }
        Update: {
          argumentos_principais?: string[] | null
          autor_recorrente?: string | null
          comarca?: string | null
          comarca_pequena?: boolean | null
          created_at?: string | null
          data_decisao?: string | null
          embedding?: string | null
          ementa?: string | null
          external_id?: string | null
          full_text?: string | null
          id?: string
          instancia?: string | null
          jurisprudencias_citadas?: string[] | null
          legislacao_citada?: string[] | null
          numero_processo?: string | null
          ramos_direito?: string[] | null
          relator?: string | null
          resultado?: string | null
          resultado_descricao?: string | null
          resumo_ia?: string | null
          reu_recorrido?: string | null
          score_utilidade?: number | null
          source?: string
          source_url?: string | null
          temas_juridicos?: string[] | null
          tipo_decisao?: string | null
          tribunal?: string | null
          uf?: string | null
          updated_at?: string | null
          upvotes?: number | null
          vara?: string | null
          verified?: boolean | null
          view_count?: number | null
        }
        Relationships: []
      }
      petition_templates: {
        Row: {
          area: string | null
          created_at: string | null
          form_data: Json | null
          generated_text: string | null
          id: string
          name: string
          petition_type: string
          user_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          form_data?: Json | null
          generated_text?: string | null
          id?: string
          name: string
          petition_type: string
          user_id: string
        }
        Update: {
          area?: string | null
          created_at?: string | null
          form_data?: Json | null
          generated_text?: string | null
          id?: string
          name?: string
          petition_type?: string
          user_id?: string
        }
        Relationships: []
      }
      petitions: {
        Row: {
          client_id: string | null
          created_at: string
          form_data: Json
          generated_text: string
          id: string
          petition_type: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          form_data?: Json
          generated_text?: string
          id?: string
          petition_type: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          form_data?: Json
          generated_text?: string
          id?: string
          petition_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petitions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          formatting_preferences: Json | null
          id: string
          oab_number: string | null
          oab_state: string | null
          office_address: string | null
          office_email: string | null
          office_logo_url: string | null
          office_name: string | null
          office_phone: string | null
          profile_type: string
          specialties: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          formatting_preferences?: Json | null
          id?: string
          oab_number?: string | null
          oab_state?: string | null
          office_address?: string | null
          office_email?: string | null
          office_logo_url?: string | null
          office_name?: string | null
          office_phone?: string | null
          profile_type?: string
          specialties?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          formatting_preferences?: Json | null
          id?: string
          oab_number?: string | null
          oab_state?: string | null
          office_address?: string | null
          office_email?: string | null
          office_logo_url?: string | null
          office_name?: string | null
          office_phone?: string | null
          profile_type?: string
          specialties?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_decisions: {
        Args: {
          filter_comarca_pequena?: boolean
          filter_instancia?: string
          filter_ramo?: string
          filter_tribunal?: string
          filter_uf?: string
          result_limit?: number
          result_offset?: number
          search_query: string
        }
        Returns: {
          comarca: string
          comarca_pequena: boolean
          created_at: string
          data_decisao: string
          ementa: string
          id: string
          instancia: string
          numero_processo: string
          ramos_direito: string[]
          rank: number
          relator: string
          resultado: string
          resultado_descricao: string
          resumo_ia: string
          score_utilidade: number
          source_url: string
          temas_juridicos: string[]
          tipo_decisao: string
          tribunal: string
          uf: string
          upvotes: number
          view_count: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
