export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      apartments: {
        Row: {
          created_at: string;
          due_day: number;
          id: string;
          name: string;
          owner_id: string;
          rent_cents: number;
          start_month: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          due_day: number;
          id: string;
          name: string;
          owner_id: string;
          rent_cents: number;
          start_month: string;
        };
        Update: {
          created_at?: string;
          due_day?: number;
          id?: string;
          name?: string;
          owner_id?: string;
          rent_cents?: number;
          start_month?: string;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          amount_cents: number;
          apartment_id: string;
          created_at: string;
          id: string;
          note: string;
          owner_id: string;
          received_on: string;
          rental_month: string;
        };
        ComputedFields: never;
        Insert: {
          amount_cents: number;
          apartment_id: string;
          created_at?: string;
          id: string;
          note?: string;
          owner_id: string;
          received_on: string;
          rental_month: string;
        };
        Update: {
          amount_cents?: number;
          apartment_id?: string;
          created_at?: string;
          id?: string;
          note?: string;
          owner_id?: string;
          received_on?: string;
          rental_month?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_apartment_id_owner_id_fkey";
            columns: ["apartment_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id", "owner_id"];
          },
          {
            foreignKeyName: "receipts_apartment_id_rental_month_fkey";
            columns: ["apartment_id", "rental_month"];
            isOneToOne: false;
            referencedRelation: "rent_months";
            referencedColumns: ["apartment_id", "rental_month"];
          },
        ];
      };
      rent_months: {
        Row: {
          apartment_id: string;
          due_date: string;
          expected_cents: number;
          owner_id: string;
          rental_month: string;
        };
        ComputedFields: never;
        Insert: {
          apartment_id: string;
          due_date: string;
          expected_cents: number;
          owner_id: string;
          rental_month: string;
        };
        Update: {
          apartment_id?: string;
          due_date?: string;
          expected_cents?: number;
          owner_id?: string;
          rental_month?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rent_months_apartment_id_owner_id_fkey";
            columns: ["apartment_id", "owner_id"];
            isOneToOne: false;
            referencedRelation: "apartments";
            referencedColumns: ["id", "owner_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_apartment: {
        Args: {
          p_due_day: number;
          p_id: string;
          p_month: string;
          p_name: string;
          p_rent_cents: number;
        };
        Returns: undefined;
      };
      monthly_receipts: { Args: { p_month: string }; Returns: Json };
      monthly_rent: {
        Args: { p_month: string };
        Returns: {
          apartment_id: string;
          due_date: string;
          expected_cents: number;
          name: string;
        }[];
      };
      record_receipt: {
        Args: {
          p_amount_cents: number;
          p_apartment_id: string;
          p_id: string;
          p_month: string;
          p_note: string;
          p_received_on: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
