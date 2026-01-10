// src/lib/supabase.ts
// Supabase client singleton configuration

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

// Lazy initialization of Supabase client
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
    }

    if (!supabaseAnonKey) {
      throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    // Create the Supabase client
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We're not using auth for this project
      },
    });
  }
  
  return supabaseInstance;
}

// Export a getter that will be called at runtime
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return (getSupabaseClient() as any)[prop];
  }
});

// Export a type helper for the database
export type Database = {
  public: {
    Tables: {
      suppliers: {
        Row: {
          id: string;
          name: string;
          location: string;
          bill_max_load_kwh: number;
          grid_carbon_intensity: number;
          created_at: string;
        };
      };
      iot_logs: {
        Row: {
          id: string;
          supplier_id: string;
          timestamp: string;
          energy_kwh: number;
          voltage: number;
          current_amps: number;
          power_watts: number;
          raw_json: Record<string, any> | null;
          created_at: string;
        };
      };
      audit_events: {
        Row: {
          id: string;
          log_reference_id: string;
          status: string;
          agent_reasoning: string;
          confidence_score: number;
          human_action: string | null;
          human_action_timestamp: string | null;
          created_at: string;
        };
      };
    };
  };
};
