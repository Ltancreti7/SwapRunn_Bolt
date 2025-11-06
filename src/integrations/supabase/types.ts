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
      assignments: {
        Row: {
          accepted_at: string | null;
          assigned_at: string | null;
          completed_at: string | null;
          driver_id: string;
          id: string;
          job_id: string;
          started_at: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          assigned_at?: string | null;
          completed_at?: string | null;
          driver_id: string;
          id?: string;
          job_id: string;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          assigned_at?: string | null;
          completed_at?: string | null;
          driver_id?: string;
          id?: string;
          job_id?: string;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      dealers: {
        Row: {
          address: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          store: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          store?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          store?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      dealership_profiles: {
        Row: {
          address: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          store: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          store?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          store?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      dealership_staff: {
        Row: {
          dealer_id: string;
          id: string;
          invited_by: string | null;
          is_active: boolean | null;
          joined_at: string | null;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          dealer_id: string;
          id?: string;
          invited_by?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
          role: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          dealer_id?: string;
          id?: string;
          invited_by?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dealership_staff_dealer_id_fkey";
            columns: ["dealer_id"];
            isOneToOne: false;
            referencedRelation: "dealership_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          dealer_id: string;
          id: string;
          invited_by: string | null;
          is_active: boolean | null;
          joined_at: string | null;
          role: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          dealer_id: string;
          id?: string;
          invited_by?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
          role: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          dealer_id?: string;
          id?: string;
          invited_by?: string | null;
          is_active?: boolean | null;
          joined_at?: string | null;
          role?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dealership_staff_dealer_id_fkey";
            columns: ["dealer_id"];
            isOneToOne: false;
            referencedRelation: "dealership_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      driver_requests: {
        Row: {
          created_by: string | null;
          dealership_id: string | null;
          driver_id: string | null;
          dropoff: string | null;
          id: number;
          inserted_at: string | null;
          notes: string | null;
          pickup: string | null;
          status: string | null;
          type: string | null;
          vehicle_info: Json | null;
        };
        Insert: {
          created_by?: string | null;
          dealership_id?: string | null;
          driver_id?: string | null;
          dropoff?: string | null;
          id?: number;
          inserted_at?: string | null;
          notes?: string | null;
          pickup?: string | null;
          status?: string | null;
          type?: string | null;
          vehicle_info?: Json | null;
        };
        Update: {
          created_by?: string | null;
          dealership_id?: string | null;
          driver_id?: string | null;
          dropoff?: string | null;
          id?: number;
          inserted_at?: string | null;
          notes?: string | null;
          pickup?: string | null;
          status?: string | null;
          type?: string | null;
          vehicle_info?: Json | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          dealer_id: string;
          delivery_address: string;
          distance_miles: number | null;
          id: string;
          make: string | null;
          model: string | null;
          notes: string | null;
          pickup_address: string;
          requires_two: boolean | null;
          status: string | null;
          timeframe: string | null;
          track_token: string | null;
          trade_make: string | null;
          trade_model: string | null;
          trade_transmission: string | null;
          trade_vin: string | null;
          trade_year: number | null;
          type: Database["public"]["Enums"]["job_type"];
          updated_at: string | null;
          vin: string | null;
          year: number | null;
          assigned_driver: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          dealer_id: string;
          delivery_address: string;
          distance_miles?: number | null;
          id?: string;
          make?: string | null;
          model?: string | null;
          notes?: string | null;
          pickup_address: string;
          requires_two?: boolean | null;
          status?: string | null;
          timeframe?: string | null;
          track_token?: string | null;
          trade_make?: string | null;
          trade_model?: string | null;
          trade_transmission?: string | null;
          trade_vin?: string | null;
          trade_year?: number | null;
          type: Database["public"]["Enums"]["job_type"];
          updated_at?: string | null;
          vin?: string | null;
          year?: number | null;
          assigned_driver?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          dealer_id?: string;
          delivery_address?: string;
          distance_miles?: number | null;
          id?: string;
          make?: string | null;
          model?: string | null;
          notes?: string | null;
          pickup_address?: string;
          requires_two?: boolean | null;
          status?: string | null;
          timeframe?: string | null;
          track_token?: string | null;
          trade_make?: string | null;
          trade_model?: string | null;
          trade_transmission?: string | null;
          trade_vin?: string | null;
          trade_year?: number | null;
          type?: Database["public"]["Enums"]["job_type"];
          updated_at?: string | null;
          vin?: string | null;
          year?: number | null;
          assigned_driver?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_dealer_id_fkey";
            columns: ["dealer_id"];
            isOneToOne: false;
            referencedRelation: "dealers";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          dealer_id: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
          user_type: Database["public"]["Enums"]["user_type"] | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          dealer_id?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          user_type?: Database["public"]["Enums"]["user_type"] | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          dealer_id?: string | null;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          user_type?: Database["public"]["Enums"]["user_type"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_dealer_id_fkey";
            columns: ["dealer_id"];
            isOneToOne: false;
            referencedRelation: "dealers";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          dealer_id: string;
          email: string;
          expires_at: string;
          id: string;
          invite_token: string;
          invited_by: string | null;
          role: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          dealer_id: string;
          email: string;
          expires_at: string;
          id?: string;
          invite_token: string;
          invited_by?: string | null;
          role: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          dealer_id?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invite_token?: string;
          invited_by?: string | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_invitations_dealer_id_fkey";
            columns: ["dealer_id"];
            isOneToOne: false;
            referencedRelation: "dealers";
            referencedColumns: ["id"];
          },
        ];
      };
      swap_usage_records: {
        Row: {
          amount_cents: number;
          billing_period: string | null;
          created_at: string | null;
          dealer_id: string;
          id: string;
          job_id: string | null;
          usage_type: string;
        };
        Insert: {
          amount_cents: number;
          billing_period?: string | null;
          created_at?: string | null;
          dealer_id: string;
          id?: string;
          job_id?: string | null;
          usage_type: string;
        };
        Update: {
          amount_cents?: number;
          billing_period?: string | null;
          created_at?: string | null;
          dealer_id?: string;
          id?: string;
          job_id?: string | null;
          usage_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "swap_usage_records_dealer_id_fkey";
            columns: ["dealer_id"];
            isOneToOne: false;
            referencedRelation: "dealers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "swap_usage_records_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_staff_invitation: {
        Args: {
          p_invite_token: string;
        };
        Returns: {
          dealer_id: string | null;
          error: string | null;
          success: boolean;
        } | null;
      };
      create_profile_for_current_user: {
        Args: {
          _company_name?: string;
          _name?: string;
          _phone?: string;
          _user_type: string;
        };
        Returns: {
          avatar_url: string | null;
          created_at: string | null;
          dealer_id: string | null;
          full_name: string | null;
          id: string;
          phone: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
          user_type: Database["public"]["Enums"]["user_type"] | null;
        };
      };
      get_driver_schedule: {
        Args: { _user_id: string };
        Returns: {
          assignment_id: string;
          created_at: string;
          delivery_address: string;
          driver_id: string;
          driver_name: string;
          driver_phone: string;
          job_id: string;
          job_status: string;
          pickup_address: string;
          specific_date: string;
          specific_time: string;
        }[];
      };
      get_open_jobs_for_drivers: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          dealer_id: string | null;
          dealer_name: string | null;
          dealer_store: string | null;
          delivery_address: string | null;
          distance_miles: number | null;
          id: string;
          make: string | null;
          model: string | null;
          notes: string | null;
          pickup_address: string | null;
          requires_two: boolean | null;
          status: string | null;
          type: string | null;
          vin: string | null;
          year: number | null;
          estimated_pay_cents: number | null;
        }[];
      };
      get_user_profile: {
        Args: Record<PropertyKey, never>;
        Returns: {
          avatar_url: string;
          dealer_id: string;
          full_name: string;
          id: string;
          phone: string;
          status: string;
          user_id: string;
          user_type: Database["public"]["Enums"]["user_type"];
        }[];
      };
      pay_rate_for_distance: {
        Args: { distance_miles: number };
        Returns: number;
      };
    };
    Enums: {
      job_type: "delivery" | "swap" | "parts" | "service";
      user_type: "dealer" | "driver" | "swap_coordinator";
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
    Enums: {
      job_type: ["delivery", "swap", "parts", "service"],
      user_type: ["dealer", "driver", "swap_coordinator"],
    },
  },
} as const;
