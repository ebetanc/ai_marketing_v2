export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          additional_information: string | null
          brand_name: string | null
          brand_tone: string | null
          created_at: string
          id: number
          key_offer: string | null
          owner_id: string
          target_audience: string | null
          website: string | null
        }
        Insert: {
          additional_information?: string | null
          brand_name?: string | null
          brand_tone?: string | null
          created_at?: string
          id?: number
          key_offer?: string | null
          owner_id?: string
          target_audience?: string | null
          website?: string | null
        }
        Update: {
          additional_information?: string | null
          brand_name?: string | null
          brand_tone?: string | null
          created_at?: string
          id?: number
          key_offer?: string | null
          owner_id?: string
          target_audience?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ideas: {
        Row: {
          angle_id: number | null
          angle_number: number | null
          company_id: number
          created_at: string
          description: string | null
          header: string | null
          id: number
          idea_description1: string | null
          idea_description10: string | null
          idea_description2: string | null
          idea_description3: string | null
          idea_description4: string | null
          idea_description5: string | null
          idea_description6: string | null
          idea_description7: string | null
          idea_description8: string | null
          idea_description9: string | null
          image_prompt1: string | null
          image_prompt10: string | null
          image_prompt2: string | null
          image_prompt3: string | null
          image_prompt4: string | null
          image_prompt5: string | null
          image_prompt6: string | null
          image_prompt7: string | null
          image_prompt8: string | null
          image_prompt9: string | null
          platforms: string | null
          strategy_id: number
          topic1: string | null
          topic10: string | null
          topic2: string | null
          topic3: string | null
          topic4: string | null
          topic5: string | null
          topic6: string | null
          topic7: string | null
          topic8: string | null
          topic9: string | null
        }
        Insert: {
          angle_id?: number | null
          angle_number?: number | null
          company_id: number
          created_at?: string
          description?: string | null
          header?: string | null
          id?: number
          idea_description1?: string | null
          idea_description10?: string | null
          idea_description2?: string | null
          idea_description3?: string | null
          idea_description4?: string | null
          idea_description5?: string | null
          idea_description6?: string | null
          idea_description7?: string | null
          idea_description8?: string | null
          idea_description9?: string | null
          image_prompt1?: string | null
          image_prompt10?: string | null
          image_prompt2?: string | null
          image_prompt3?: string | null
          image_prompt4?: string | null
          image_prompt5?: string | null
          image_prompt6?: string | null
          image_prompt7?: string | null
          image_prompt8?: string | null
          image_prompt9?: string | null
          platforms?: string | null
          strategy_id: number
          topic1?: string | null
          topic10?: string | null
          topic2?: string | null
          topic3?: string | null
          topic4?: string | null
          topic5?: string | null
          topic6?: string | null
          topic7?: string | null
          topic8?: string | null
          topic9?: string | null
        }
        Update: {
          angle_id?: number | null
          angle_number?: number | null
          company_id?: number
          created_at?: string
          description?: string | null
          header?: string | null
          id?: number
          idea_description1?: string | null
          idea_description10?: string | null
          idea_description2?: string | null
          idea_description3?: string | null
          idea_description4?: string | null
          idea_description5?: string | null
          idea_description6?: string | null
          idea_description7?: string | null
          idea_description8?: string | null
          idea_description9?: string | null
          image_prompt1?: string | null
          image_prompt10?: string | null
          image_prompt2?: string | null
          image_prompt3?: string | null
          image_prompt4?: string | null
          image_prompt5?: string | null
          image_prompt6?: string | null
          image_prompt7?: string | null
          image_prompt8?: string | null
          image_prompt9?: string | null
          platforms?: string | null
          strategy_id?: number
          topic1?: string | null
          topic10?: string | null
          topic2?: string | null
          topic3?: string | null
          topic4?: string | null
          topic5?: string | null
          topic6?: string | null
          topic7?: string | null
          topic8?: string | null
          topic9?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_content: {
        Row: {
          content_body: string
          created_at: string
          id: number
          idea_id: number
          post: boolean | null
        }
        Insert: {
          content_body: string
          created_at?: string
          id?: number
          idea_id: number
          post?: boolean | null
        }
        Update: {
          content_body?: string
          created_at?: string
          id?: number
          idea_id?: number
          post?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_content_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_content: {
        Row: {
          content_body: string
          created_at: string
          id: number
          idea_id: number
          post: boolean | null
        }
        Insert: {
          content_body: string
          created_at?: string
          id?: number
          idea_id: number
          post?: boolean | null
        }
        Update: {
          content_body?: string
          created_at?: string
          id?: number
          idea_id?: number
          post?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_content_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_content: {
        Row: {
          created_at: string
          id: number
          link_final: string | null
          link_origin: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          link_final?: string | null
          link_origin?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          link_final?: string | null
          link_origin?: string | null
        }
        Relationships: []
      }
      strategies: {
        Row: {
          angle1_description: string | null
          angle1_header: string | null
          angle1_objective: string | null
          angle1_tonality: string | null
          angle10_description: string | null
          angle10_header: string | null
          angle10_objective: string | null
          angle10_tonality: string | null
          angle2_description: string | null
          angle2_header: string | null
          angle2_objective: string | null
          angle2_tonality: string | null
          angle3_description: string | null
          angle3_header: string | null
          angle3_objective: string | null
          angle3_tonality: string | null
          angle4_description: string | null
          angle4_header: string | null
          angle4_objective: string | null
          angle4_tonality: string | null
          angle5_description: string | null
          angle5_header: string | null
          angle5_objective: string | null
          angle5_tonality: string | null
          angle6_description: string | null
          angle6_header: string | null
          angle6_objective: string | null
          angle6_tonality: string | null
          angle7_description: string | null
          angle7_header: string | null
          angle7_objective: string | null
          angle7_tonality: string | null
          angle8_description: string | null
          angle8_header: string | null
          angle8_objective: string | null
          angle8_tonality: string | null
          angle9_description: string | null
          angle9_header: string | null
          angle9_objective: string | null
          angle9_tonality: string | null
          company_id: number
          created_at: string
          id: number
          platforms: string | null
        }
        Insert: {
          angle1_description?: string | null
          angle1_header?: string | null
          angle1_objective?: string | null
          angle1_tonality?: string | null
          angle10_description?: string | null
          angle10_header?: string | null
          angle10_objective?: string | null
          angle10_tonality?: string | null
          angle2_description?: string | null
          angle2_header?: string | null
          angle2_objective?: string | null
          angle2_tonality?: string | null
          angle3_description?: string | null
          angle3_header?: string | null
          angle3_objective?: string | null
          angle3_tonality?: string | null
          angle4_description?: string | null
          angle4_header?: string | null
          angle4_objective?: string | null
          angle4_tonality?: string | null
          angle5_description?: string | null
          angle5_header?: string | null
          angle5_objective?: string | null
          angle5_tonality?: string | null
          angle6_description?: string | null
          angle6_header?: string | null
          angle6_objective?: string | null
          angle6_tonality?: string | null
          angle7_description?: string | null
          angle7_header?: string | null
          angle7_objective?: string | null
          angle7_tonality?: string | null
          angle8_description?: string | null
          angle8_header?: string | null
          angle8_objective?: string | null
          angle8_tonality?: string | null
          angle9_description?: string | null
          angle9_header?: string | null
          angle9_objective?: string | null
          angle9_tonality?: string | null
          company_id: number
          created_at?: string
          id?: number
          platforms?: string | null
        }
        Update: {
          angle1_description?: string | null
          angle1_header?: string | null
          angle1_objective?: string | null
          angle1_tonality?: string | null
          angle10_description?: string | null
          angle10_header?: string | null
          angle10_objective?: string | null
          angle10_tonality?: string | null
          angle2_description?: string | null
          angle2_header?: string | null
          angle2_objective?: string | null
          angle2_tonality?: string | null
          angle3_description?: string | null
          angle3_header?: string | null
          angle3_objective?: string | null
          angle3_tonality?: string | null
          angle4_description?: string | null
          angle4_header?: string | null
          angle4_objective?: string | null
          angle4_tonality?: string | null
          angle5_description?: string | null
          angle5_header?: string | null
          angle5_objective?: string | null
          angle5_tonality?: string | null
          angle6_description?: string | null
          angle6_header?: string | null
          angle6_objective?: string | null
          angle6_tonality?: string | null
          angle7_description?: string | null
          angle7_header?: string | null
          angle7_objective?: string | null
          angle7_tonality?: string | null
          angle8_description?: string | null
          angle8_header?: string | null
          angle8_objective?: string | null
          angle8_tonality?: string | null
          angle9_description?: string | null
          angle9_header?: string | null
          angle9_objective?: string | null
          angle9_tonality?: string | null
          company_id?: number
          created_at?: string
          id?: number
          platforms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      twitter_content: {
        Row: {
          content_body: string
          created_at: string
          id: number
          idea_id: number
          post: boolean | null
        }
        Insert: {
          content_body: string
          created_at?: string
          id?: number
          idea_id: number
          post?: boolean | null
        }
        Update: {
          content_body?: string
          created_at?: string
          id?: number
          idea_id?: number
          post?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "twitter_content_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

