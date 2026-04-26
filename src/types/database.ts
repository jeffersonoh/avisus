export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          attempts: number
          channel: string
          created_at: string
          error_message: string | null
          id: string
          opportunity_id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          attempts?: number
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          opportunity_id: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          opportunity_id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_margins: {
        Row: {
          channel: string
          created_at: string
          fee_pct: number
          id: string
          market_price: number
          net_margin: number
          opportunity_id: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          fee_pct: number
          id?: string
          market_price: number
          net_margin: number
          opportunity_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          fee_pct?: number
          id?: string
          market_price?: number
          net_margin?: number
          opportunity_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_margins_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_sellers: {
        Row: {
          created_at: string
          id: string
          is_live: boolean
          last_checked_at: string | null
          last_live_at: string | null
          platform: string
          seller_name: string | null
          seller_url: string
          seller_username: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_live?: boolean
          last_checked_at?: string | null
          last_live_at?: string | null
          platform: string
          seller_name?: string | null
          seller_url: string
          seller_username: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_live?: boolean
          last_checked_at?: string | null
          last_live_at?: string | null
          platform?: string
          seller_name?: string | null
          seller_url?: string
          seller_username?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          active: boolean
          created_at: string
          id: string
          last_scanned_at: string | null
          term: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          last_scanned_at?: string | null
          term: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          last_scanned_at?: string | null
          term?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_alerts: {
        Row: {
          channel: string
          clicked_at: string | null
          created_at: string
          id: string
          live_title: string | null
          live_url: string
          platform: string
          seller_id: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          live_title?: string | null
          live_url: string
          platform: string
          seller_id: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          created_at?: string
          id?: string
          live_title?: string | null
          live_url?: string
          platform?: string
          seller_id?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_alerts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "favorite_sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_fees: {
        Row: {
          category: string
          fee_pct: number
          marketplace: string
          updated_at: string
        }
        Insert: {
          category?: string
          fee_pct: number
          marketplace: string
          updated_at?: string
        }
        Update: {
          category?: string
          fee_pct?: number
          marketplace?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          buy_url: string
          category: string | null
          detected_at: string
          discount_pct: number
          expires_at: string | null
          external_id: string | null
          freight: number
          freight_free: boolean
          hot: boolean
          id: string
          image_url: string | null
          margin_best: number | null
          margin_best_channel: string | null
          marketplace: string
          name: string
          original_price: number
          price: number
          product_id: string | null
          quality: string | null
          raw_data: Json | null
          region_city: string | null
          region_uf: string | null
          status: string
        }
        Insert: {
          buy_url: string
          category?: string | null
          detected_at?: string
          discount_pct: number
          expires_at?: string | null
          external_id?: string | null
          freight?: number
          freight_free?: boolean
          hot?: boolean
          id?: string
          image_url?: string | null
          margin_best?: number | null
          margin_best_channel?: string | null
          marketplace: string
          name: string
          original_price: number
          price: number
          product_id?: string | null
          quality?: string | null
          raw_data?: Json | null
          region_city?: string | null
          region_uf?: string | null
          status?: string
        }
        Update: {
          buy_url?: string
          category?: string | null
          detected_at?: string
          discount_pct?: number
          expires_at?: string | null
          external_id?: string | null
          freight?: number
          freight_free?: boolean
          hot?: boolean
          id?: string
          image_url?: string | null
          margin_best?: number | null
          margin_best_channel?: string | null
          marketplace?: string
          name?: string
          original_price?: number
          price?: number
          product_id?: string | null
          quality?: string | null
          raw_data?: Json | null
          region_city?: string | null
          region_uf?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          discount_pct: number | null
          id: number
          marketplace: string
          original_price: number | null
          price: number
          product_id: string
          recorded_at: string
          units_sold: number | null
        }
        Insert: {
          discount_pct?: number | null
          id?: never
          marketplace: string
          original_price?: number | null
          price: number
          product_id: string
          recorded_at?: string
          units_sold?: number | null
        }
        Update: {
          discount_pct?: number | null
          id?: never
          marketplace?: string
          original_price?: number | null
          price?: number
          product_id?: string
          recorded_at?: string
          units_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          external_id: string | null
          id: string
          image_url: string | null
          last_price: number | null
          last_seen_at: string | null
          marketplace: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          last_price?: number | null
          last_seen_at?: string | null
          marketplace: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          last_price?: number | null
          last_seen_at?: string | null
          marketplace?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alert_channels: string[]
          city: string | null
          created_at: string
          id: string
          max_freight: number | null
          min_discount_pct: number
          name: string
          onboarded: boolean
          phone: string | null
          plan: string
          resale_channels: Json
          resale_fee_pct: Json
          resale_margin_mode: string
          silence_end: string | null
          silence_start: string | null
          telegram_chat_id: string | null
          telegram_link_code: string | null
          telegram_linked_at: string | null
          telegram_username: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          alert_channels?: string[]
          city?: string | null
          created_at?: string
          id: string
          max_freight?: number | null
          min_discount_pct?: number
          name?: string
          onboarded?: boolean
          phone?: string | null
          plan?: string
          resale_channels?: Json
          resale_fee_pct?: Json
          resale_margin_mode?: string
          silence_end?: string | null
          silence_start?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          alert_channels?: string[]
          city?: string | null
          created_at?: string
          id?: string
          max_freight?: number | null
          min_discount_pct?: number
          name?: string
          onboarded?: boolean
          phone?: string | null
          plan?: string
          resale_channels?: Json
          resale_fee_pct?: Json
          resale_margin_mode?: string
          silence_end?: string | null
          silence_start?: string | null
          telegram_chat_id?: string | null
          telegram_link_code?: string | null
          telegram_linked_at?: string | null
          telegram_username?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_opportunity_status: {
        Row: {
          created_at: string
          opportunity_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opportunity_id: string
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          opportunity_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_opportunity_status_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_opportunity_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      alerts_sent_today: { Args: { p_user_id: string }; Returns: number }
      refresh_hot_flags: { Args: never; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
