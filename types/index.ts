/**
 * GreenGuard AI Type Definitions
 * 
 * Core TypeScript types for the GreenGuard AI platform
 */

// ========================================
// Database Types (matching Supabase schema)
// ========================================

export interface Supplier {
    id: string;
    name: string;
    location: string;
    contact_email?: string;
    created_at: string;
    updated_at: string;
}

export interface IoTLog {
    id: string;
    supplier_id: string;
    timestamp: string;
    device_id: string;
    energy_kwh: number;
    current_amps?: number;
    voltage_volts?: number;
    power_watts?: number;
    raw_json?: Record<string, any>;
    created_at: string;
}

export type AuditStatus = 'PENDING' | 'VERIFIED' | 'ANOMALY' | 'REJECTED' | 'WARNING';

export type HumanAction = 'APPROVE' | 'REJECT' | 'FLAG_SUPPLIER';

export interface AuditEvent {
    id: string;
    log_reference_id?: string;
    supplier_id: string;
    status: AuditStatus;
    agent_reasoning: string;
    confidence_score?: number;
    flagged_by_agent?: string;
    human_action?: HumanAction;
    human_action_timestamp?: string;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface ElectricityBill {
    id: string;
    supplier_id: string;
    billing_period_start: string;
    billing_period_end: string;
    total_kwh?: number;
    peak_load_kw?: number;
    vendor_name?: string;
    file_url?: string;
    extracted_data?: Record<string, any>;
    uploaded_at: string;
}

// ========================================
// Agent Types
// ========================================

export type AgentType = 'BillReaderAgent' | 'ContextAgent' | 'AuditorAgent';

export interface AgentLog {
    timestamp: string;
    agent: AgentType;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
}

export interface BillExtractionResult {
    billing_period: {
        start: string;
        end: string;
    };
    total_kwh: number;
    peak_load: number;
    vendor_name: string;
    raw_text?: string;
}

export interface ContextData {
    temperature_celsius?: number;
    grid_intensity_gco2_kwh?: number;
    weather_condition?: string;
    location: string;
    timestamp: string;
}

export interface AuditorDecision {
    status: AuditStatus;
    reasoning_log: string;
    confidence_score: number;
    flagged_issues?: string[];
    metadata?: Record<string, any>;
}

// ========================================
// IoT Types
// ========================================

export interface IoTPacket {
    device_id: string;
    timestamp: string;
    current: number;
    voltage: number;
    power: number;
    energy?: number;
}

// ========================================
// UI Component Types
// ========================================

export interface NotificationItem {
    id: string;
    title: string;
    message: string;
    type: 'anomaly' | 'warning' | 'info';
    audit_event_id: string;
    created_at: string;
    read: boolean;
}

export interface DashboardStats {
    total_suppliers: number;
    active_devices: number;
    pending_reviews: number;
    verified_audits: number;
    anomalies_detected: number;
}
