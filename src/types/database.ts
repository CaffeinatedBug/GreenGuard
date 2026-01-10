// src/types/database.ts
// TypeScript interfaces matching the Supabase database schema

export type AuditStatus = 'PENDING' | 'VERIFIED' | 'ANOMALY' | 'WARNING' | 'REJECTED';
export type HumanAction = 'APPROVED' | 'FLAGGED' | null;

export interface Supplier {
  id: string;
  name: string;
  location: string;
  bill_max_load_kwh: number;
  grid_carbon_intensity: number;
  created_at: string;
}

export interface IotLog {
  id: string;
  supplier_id: string;
  timestamp: string;
  energy_kwh: number;
  voltage: number;
  current_amps: number;
  power_watts: number;
  raw_json?: Record<string, any>;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  log_reference_id: string;
  status: AuditStatus;
  agent_reasoning: string;
  confidence_score: number;
  human_action?: HumanAction;
  human_action_timestamp?: string;
  agent_logs?: Array<{
    timestamp: string;
    agent: string;
    message: string;
    status: string;
  }>;
  created_at: string;
}

// Extended interface for audit events with joined data
export interface AuditEventWithDetails extends AuditEvent {
  supplier_name?: string;
  timestamp?: string;
  energy_kwh?: number;
  iot_logs?: IotLog;
}

// Interface for chart data
export interface ChartDataPoint {
  timestamp: string;
  energy_kwh: number;
}
