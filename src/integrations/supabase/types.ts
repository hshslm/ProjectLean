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
      client_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coaching_responses: {
        Row: {
          checkin_date: string
          checkin_id: string
          created_at: string
          id: string
          response_text: string
          user_id: string
        }
        Insert: {
          checkin_date: string
          checkin_id: string
          created_at?: string
          id?: string
          response_text: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          checkin_id?: string
          created_at?: string
          id?: string
          response_text?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          aligned_eating_hit: boolean
          checkin_date: string
          cognitive_patterns: string[]
          created_at: string
          id: string
          mood_score: number | null
          protein_hit: boolean
          reset_protocol_used: boolean
          sleep_hit: boolean
          steps_hit: boolean
          stress_score: number | null
          training_hit: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          aligned_eating_hit?: boolean
          checkin_date?: string
          cognitive_patterns?: string[]
          created_at?: string
          id?: string
          mood_score?: number | null
          protein_hit?: boolean
          reset_protocol_used?: boolean
          sleep_hit?: boolean
          steps_hit?: boolean
          stress_score?: number | null
          training_hit?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          aligned_eating_hit?: boolean
          checkin_date?: string
          cognitive_patterns?: string[]
          created_at?: string
          id?: string
          mood_score?: number | null
          protein_hit?: boolean
          reset_protocol_used?: boolean
          sleep_hit?: boolean
          steps_hit?: boolean
          stress_score?: number | null
          training_hit?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_logs: {
        Row: {
          calories_high: number
          calories_low: number
          carbs_high: number
          carbs_low: number
          confidence: string | null
          fat_high: number
          fat_low: number
          food_identified: string
          id: string
          image_url: string | null
          logged_at: string
          meal_date: string
          notes: string | null
          protein_high: number
          protein_low: number
          user_id: string
        }
        Insert: {
          calories_high: number
          calories_low: number
          carbs_high: number
          carbs_low: number
          confidence?: string | null
          fat_high: number
          fat_low: number
          food_identified: string
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_date?: string
          notes?: string | null
          protein_high: number
          protein_low: number
          user_id: string
        }
        Update: {
          calories_high?: number
          calories_low?: number
          carbs_high?: number
          carbs_low?: number
          confidence?: string | null
          fat_high?: number
          fat_low?: number
          food_identified?: string
          id?: string
          image_url?: string | null
          logged_at?: string
          meal_date?: string
          notes?: string | null
          protein_high?: number
          protein_low?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_templates: {
        Row: {
          calories_high: number
          calories_low: number
          carbs_high: number
          carbs_low: number
          created_at: string
          fat_high: number
          fat_low: number
          food_identified: string
          id: string
          image_url: string | null
          name: string
          protein_high: number
          protein_low: number
          user_id: string
        }
        Insert: {
          calories_high: number
          calories_low: number
          carbs_high: number
          carbs_low: number
          created_at?: string
          fat_high: number
          fat_low: number
          food_identified: string
          id?: string
          image_url?: string | null
          name: string
          protein_high: number
          protein_low: number
          user_id: string
        }
        Update: {
          calories_high?: number
          calories_low?: number
          carbs_high?: number
          carbs_low?: number
          created_at?: string
          fat_high?: number
          fat_low?: number
          food_identified?: string
          id?: string
          image_url?: string | null
          name?: string
          protein_high?: number
          protein_low?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          breakfast_reminder: string | null
          created_at: string
          dinner_reminder: string | null
          id: string
          lunch_reminder: string | null
          push_enabled: boolean
          push_subscription: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          breakfast_reminder?: string | null
          created_at?: string
          dinner_reminder?: string | null
          id?: string
          lunch_reminder?: string | null
          push_enabled?: boolean
          push_subscription?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          breakfast_reminder?: string | null
          created_at?: string
          dinner_reminder?: string | null
          id?: string
          lunch_reminder?: string | null
          push_enabled?: boolean
          push_subscription?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_coaching_client: boolean
          is_subscribed: boolean
          scan_count: number
          stripe_customer_id: string | null
          subscription_expires_at: string | null
          subscription_updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_coaching_client?: boolean
          is_subscribed?: boolean
          scan_count?: number
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_coaching_client?: boolean
          is_subscribed?: boolean
          scan_count?: number
          stripe_customer_id?: string | null
          subscription_expires_at?: string | null
          subscription_updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string
          daily_calories: number | null
          daily_protein: number | null
          goal_type: string | null
          height_cm: number | null
          id: string
          sex: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          daily_calories?: number | null
          daily_protein?: number | null
          goal_type?: string | null
          height_cm?: number | null
          id?: string
          sex?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          daily_calories?: number | null
          daily_protein?: number | null
          goal_type?: string | null
          height_cm?: number | null
          id?: string
          sex?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
