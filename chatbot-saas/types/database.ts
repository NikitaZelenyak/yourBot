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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          key_hash: string
          label: string | null
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          key_hash: string
          label?: string | null
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          key_hash?: string
          label?: string | null
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "api_keys_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_knowledge_bases: {
        Row: {
          bot_id: string
          created_at: string
          kb_id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          kb_id: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          kb_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_knowledge_bases_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "bot_knowledge_bases_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_knowledge_bases_kb_id_fkey"
            columns: ["kb_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      bots: {
        Row: {
          allowed_domains: string[] | null
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          persona: string | null
          primary_color: string
          slug: string
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          allowed_domains?: string[] | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          persona?: string | null
          primary_color?: string
          slug: string
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          allowed_domains?: string[] | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          persona?: string | null
          primary_color?: string
          slug?: string
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          bot_id: string
          ended_at: string | null
          id: string
          message_count: number
          outcome: string | null
          page_title: string | null
          page_url: string | null
          started_at: string
          visitor_email: string | null
          visitor_id: string | null
          visitor_id_custom: string | null
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          bot_id: string
          ended_at?: string | null
          id?: string
          message_count?: number
          outcome?: string | null
          page_title?: string | null
          page_url?: string | null
          started_at?: string
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_id_custom?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          bot_id?: string
          ended_at?: string | null
          id?: string
          message_count?: number
          outcome?: string | null
          page_title?: string | null
          page_url?: string | null
          started_at?: string
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_id_custom?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "chat_sessions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          abandoned_count: number
          avg_messages_per_session: number
          bot_id: string
          date: string
          id: string
          performance_score: number
          resolution_rate: number
          resolved_count: number
          total_messages: number
          total_sessions: number
          unique_pages: number
          unique_visitors: number
          unresolved_count: number
        }
        Insert: {
          abandoned_count?: number
          avg_messages_per_session?: number
          bot_id: string
          date: string
          id?: string
          performance_score?: number
          resolution_rate?: number
          resolved_count?: number
          total_messages?: number
          total_sessions?: number
          unique_pages?: number
          unique_visitors?: number
          unresolved_count?: number
        }
        Update: {
          abandoned_count?: number
          avg_messages_per_session?: number
          bot_id?: string
          date?: string
          id?: string
          performance_score?: number
          resolution_rate?: number
          resolved_count?: number
          total_messages?: number
          total_sessions?: number
          unique_pages?: number
          unique_visitors?: number
          unresolved_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "daily_metrics_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          message: string
          original_question: string | null
          session_id: string
          status: string
          visitor_email: string
          visitor_name: string | null
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          message: string
          original_question?: string | null
          session_id: string
          status?: string
          visitor_email: string
          visitor_name?: string | null
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          message?: string
          original_question?: string | null
          session_id?: string
          status?: string
          visitor_email?: string
          visitor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "escalations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          kb_id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          kb_id: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          kb_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "kb_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_chunks_kb_id_fkey"
            columns: ["kb_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          chunk_count: number
          created_at: string
          error_message: string | null
          file_type: string
          filename: string
          id: string
          kb_id: string
          status: string
          storage_path: string
        }
        Insert: {
          chunk_count?: number
          created_at?: string
          error_message?: string | null
          file_type: string
          filename: string
          id?: string
          kb_id: string
          status?: string
          storage_path: string
        }
        Update: {
          chunk_count?: number
          created_at?: string
          error_message?: string | null
          file_type?: string
          filename?: string
          id?: string
          kb_id?: string
          status?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_documents_kb_id_fkey"
            columns: ["kb_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          analyzed_at: string
          bot_id: string
          id: string
          intent: string | null
          is_answered: boolean | null
          performance_score: number | null
          sentiment: string | null
          session_id: string
          topics: string[] | null
          unanswered_questions: string[] | null
        }
        Insert: {
          analyzed_at?: string
          bot_id: string
          id?: string
          intent?: string | null
          is_answered?: boolean | null
          performance_score?: number | null
          sentiment?: string | null
          session_id: string
          topics?: string[] | null
          unanswered_questions?: string[] | null
        }
        Update: {
          analyzed_at?: string
          bot_id?: string
          id?: string
          intent?: string | null
          is_answered?: boolean | null
          performance_score?: number | null
          sentiment?: string | null
          session_id?: string
          topics?: string[] | null
          unanswered_questions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "session_analytics_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "session_analytics_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_clusters: {
        Row: {
          bot_id: string
          computed_date: string
          id: string
          question_count: number
          sample_questions: string[] | null
          topic_label: string
          trend: string | null
        }
        Insert: {
          bot_id: string
          computed_date?: string
          id?: string
          question_count?: number
          sample_questions?: string[] | null
          topic_label: string
          trend?: string | null
        }
        Update: {
          bot_id?: string
          computed_date?: string
          id?: string
          question_count?: number
          sample_questions?: string[] | null
          topic_label?: string
          trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_clusters_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "topic_clusters_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      unanswered_questions: {
        Row: {
          asked_at: string
          bot_id: string
          frequency: number
          id: string
          page_url: string | null
          question: string
          session_id: string | null
          status: string
        }
        Insert: {
          asked_at?: string
          bot_id: string
          frequency?: number
          id?: string
          page_url?: string | null
          question: string
          session_id?: string | null
          status?: string
        }
        Update: {
          asked_at?: string
          bot_id?: string
          frequency?: number
          id?: string
          page_url?: string | null
          question?: string
          session_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "unanswered_questions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bot_analytics_summary"
            referencedColumns: ["bot_id"]
          },
          {
            foreignKeyName: "unanswered_questions_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unanswered_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bot_analytics_summary: {
        Row: {
          abandoned_sessions: number | null
          avg_messages: number | null
          bot_id: string | null
          bot_name: string | null
          last_session_at: string | null
          open_unanswered_questions: number | null
          resolution_rate: number | null
          resolved_sessions: number | null
          total_messages: number | null
          total_sessions: number | null
          unresolved_sessions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      compute_session_outcome: {
        Args: { p_session_id: string }
        Returns: string
      }
      hybrid_search: {
        Args: {
          kb_ids: string[]
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          kb_id: string
          metadata: Json
          similarity: number
        }[]
      }
      is_unanswered_response: {
        Args: { message_content: string }
        Returns: boolean
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
