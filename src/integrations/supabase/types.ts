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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      member_login_attempts: {
        Row: {
          created_at: string
          id: string
          membership_id: string
          succeeded: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          membership_id: string
          succeeded?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          membership_id?: string
          succeeded?: boolean
        }
        Relationships: []
      }
      mock_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          candidate_count: number
          created_at: string
          currency: string
          id: string
          mock_type_id: string | null
          order_number: string
          payment_status: string
          product_id: string
          registration_fee: number
          school_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          amount: number
          candidate_count: number
          created_at?: string
          currency?: string
          id?: string
          mock_type_id?: string | null
          order_number?: string
          payment_status?: string
          product_id: string
          registration_fee?: number
          school_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          amount?: number
          candidate_count?: number
          created_at?: string
          currency?: string
          id?: string
          mock_type_id?: string | null
          order_number?: string
          payment_status?: string
          product_id?: string
          registration_fee?: number
          school_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_mock_type_id_fkey"
            columns: ["mock_type_id"]
            isOneToOne: false
            referencedRelation: "mock_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "prediction_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          channel: string | null
          created_at: string
          currency: string
          id: string
          order_id: string
          paid_at: string | null
          paystack_reference: string
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          channel?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          paid_at?: string | null
          paystack_reference: string
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          channel?: string | null
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          paystack_reference?: string
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_access: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          id: string
          is_active: boolean
          order_id: string
          product_id: string
          school_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean
          order_id: string
          product_id: string
          school_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          is_active?: boolean
          order_id?: string
          product_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_access_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_access_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "prediction_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_access_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_candidates: number | null
          min_candidates: number
          mock_type_id: string | null
          name: string
          pdf_path: string | null
          price_per_candidate: number
          pricing_mode: string
          sort_order: number
          subjects: string[]
          updated_at: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_candidates?: number | null
          min_candidates?: number
          mock_type_id?: string | null
          name: string
          pdf_path?: string | null
          price_per_candidate?: number
          pricing_mode?: string
          sort_order?: number
          subjects?: string[]
          updated_at?: string
          validity_days?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_candidates?: number | null
          min_candidates?: number
          mock_type_id?: string | null
          name?: string
          pdf_path?: string | null
          price_per_candidate?: number
          pricing_mode?: string
          sort_order?: number
          subjects?: string[]
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "prediction_products_mock_type_id_fkey"
            columns: ["mock_type_id"]
            isOneToOne: false
            referencedRelation: "mock_types"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          academic_year: string | null
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          pricing_mode: string
          product_type: string
          sort_order: number
          subject: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          pricing_mode?: string
          product_type?: string
          sort_order?: number
          subject?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          pricing_mode?: string
          product_type?: string
          sort_order?: number
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          access_expires_at: string | null
          amount: number
          created_at: string
          currency: string
          id: string
          member_id: string
          payment_channel: string | null
          payment_status: string
          product_id: string
          purchased_at: string | null
          quantity: number
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          access_expires_at?: string | null
          amount: number
          created_at?: string
          currency?: string
          id?: string
          member_id: string
          payment_channel?: string | null
          payment_status?: string
          product_id: string
          purchased_at?: string | null
          quantity?: number
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          access_expires_at?: string | null
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          member_id?: string
          payment_channel?: string | null
          payment_status?: string
          product_id?: string
          purchased_at?: string | null
          quantity?: number
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_year: string
          contact_person: string | null
          coordinator_email: string | null
          coordinator_name: string | null
          coordinator_phone: string | null
          coordinator_whatsapp: string | null
          created_at: string
          district: string
          head_teacher_name: string | null
          id: string
          membership_id: string
          membership_status: string
          mock_candidates: number
          pin_hash: string | null
          region: string
          school_address: string | null
          school_email: string
          school_name: string
          school_phone: string
          school_type: string
          total_jhs_students: number
          updated_at: string
          user_id: string | null
          whatsapp_number: string | null
        }
        Insert: {
          academic_year?: string
          contact_person?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          coordinator_whatsapp?: string | null
          created_at?: string
          district: string
          head_teacher_name?: string | null
          id?: string
          membership_id?: string
          membership_status?: string
          mock_candidates?: number
          pin_hash?: string | null
          region: string
          school_address?: string | null
          school_email: string
          school_name: string
          school_phone: string
          school_type?: string
          total_jhs_students?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          academic_year?: string
          contact_person?: string | null
          coordinator_email?: string | null
          coordinator_name?: string | null
          coordinator_phone?: string | null
          coordinator_whatsapp?: string | null
          created_at?: string
          district?: string
          head_teacher_name?: string | null
          id?: string
          membership_id?: string
          membership_status?: string
          mock_candidates?: number
          pin_hash?: string | null
          region?: string
          school_address?: string | null
          school_email?: string
          school_name?: string
          school_phone?: string
          school_type?: string
          total_jhs_students?: number
          updated_at?: string
          user_id?: string | null
          whatsapp_number?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_member_pin: {
        Args: { _member_id: string; _pin: string }
        Returns: undefined
      }
      verify_member_credentials: {
        Args: { _membership_id: string; _pin: string }
        Returns: {
          id: string
          membership_id: string
          membership_status: string
          school_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "school"
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
      app_role: ["admin", "school"],
    },
  },
} as const
