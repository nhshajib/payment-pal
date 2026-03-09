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
      free_trials: {
        Row: {
          cancel_url: string
          created_at: string
          expires_on: string
          id: string
          is_cancelled: boolean
          name: string
          notes: string
          user_id: string
        }
        Insert: {
          cancel_url?: string
          created_at?: string
          expires_on: string
          id?: string
          is_cancelled?: boolean
          name: string
          notes?: string
          user_id: string
        }
        Update: {
          cancel_url?: string
          created_at?: string
          expires_on?: string
          id?: string
          is_cancelled?: boolean
          name?: string
          notes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_trials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          category: string
          confirmation_number: string
          created_at: string
          due_date: string
          id: string
          is_paid: boolean
          is_recurring: boolean
          is_shared: boolean
          name: string
          notes: string
          payment_url: string
          previous_amount: number
          receipt_url: string
          reminder_days: number
          total_amount: number
          user_id: string
          user_share_amount: number
        }
        Insert: {
          amount?: number
          category?: string
          confirmation_number?: string
          created_at?: string
          due_date: string
          id?: string
          is_paid?: boolean
          is_recurring?: boolean
          is_shared?: boolean
          name: string
          notes?: string
          payment_url?: string
          previous_amount?: number
          receipt_url?: string
          reminder_days?: number
          total_amount?: number
          user_id: string
          user_share_amount?: number
        }
        Update: {
          amount?: number
          category?: string
          confirmation_number?: string
          created_at?: string
          due_date?: string
          id?: string
          is_paid?: boolean
          is_recurring?: boolean
          is_shared?: boolean
          name?: string
          notes?: string
          payment_url?: string
          previous_amount?: number
          receipt_url?: string
          reminder_days?: number
          total_amount?: number
          user_id?: string
          user_share_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      roommates: {
        Row: {
          created_at: string
          id: string
          nickname: string
          partner_id: string | null
          phone_hash: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nickname?: string
          partner_id?: string | null
          phone_hash: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nickname?: string
          partner_id?: string | null
          phone_hash?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roommates_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roommates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      split_expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          group_id: string
          id: string
          notes: string
          paid_by: string
          title: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          group_id: string
          id?: string
          notes?: string
          paid_by: string
          title: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          group_id?: string
          id?: string
          notes?: string
          paid_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "split_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "split_members"
            referencedColumns: ["id"]
          },
        ]
      }
      split_groups: {
        Row: {
          created_at: string
          emoji: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_split_groups_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      split_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_owner: boolean
          name: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_owner?: boolean
          name: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_owner?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "split_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      split_shares: {
        Row: {
          amount: number
          created_at: string
          expense_id: string
          id: string
          is_settled: boolean
          member_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          expense_id: string
          id?: string
          is_settled?: boolean
          member_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expense_id?: string
          id?: string
          is_settled?: boolean
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "split_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "split_shares_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "split_members"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          created_at: string
          default_reminder_days: number
          id: string
          is_premium: boolean
          monthly_budget: number | null
          name: string
          paid_clear_day: number
          phone_hash: string
          pin_hash: string
        }
        Insert: {
          auth_id?: string | null
          created_at?: string
          default_reminder_days?: number
          id?: string
          is_premium?: boolean
          monthly_budget?: number | null
          name?: string
          paid_clear_day?: number
          phone_hash: string
          pin_hash?: string
        }
        Update: {
          auth_id?: string | null
          created_at?: string
          default_reminder_days?: number
          id?: string
          is_premium?: boolean
          monthly_budget?: number | null
          name?: string
          paid_clear_day?: number
          phone_hash?: string
          pin_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_internal_user_id: { Args: never; Returns: string }
      owns_split_expense: { Args: { _expense_id: string }; Returns: boolean }
      owns_split_group: { Args: { _group_id: string }; Returns: boolean }
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
