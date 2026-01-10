-- GreenGuard AI - Complete Database Schema
-- Combined schema file for easy deployment
-- This file contains all table definitions and configurations in one place

-- ============================================
-- TABLES
-- ============================================

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IoT Logs Table
CREATE TABLE IF NOT EXISTS iot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  device_id TEXT NOT NULL,
  energy_kwh DECIMAL(10, 2) NOT NULL,
  current_amps DECIMAL(8, 2),
  voltage_volts DECIMAL(8, 2),
  power_watts DECIMAL(10, 2),
  raw_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Events Table
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_reference_id UUID REFERENCES iot_logs(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'ANOMALY', 'REJECTED', 'WARNING')),
  agent_reasoning TEXT NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  flagged_by_agent TEXT,
  human_action TEXT,
  human_action_timestamp TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Electricity Bills Table
CREATE TABLE IF NOT EXISTS electricity_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  total_kwh DECIMAL(10, 2),
  peak_load_kw DECIMAL(10, 2),
  vendor_name TEXT,
  file_url TEXT,
  extracted_data JSONB,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- IoT Logs Indexes
CREATE INDEX IF NOT EXISTS idx_iot_logs_supplier ON iot_logs(supplier_id);
CREATE INDEX IF NOT EXISTS idx_iot_logs_timestamp ON iot_logs(timestamp DESC);

-- Audit Events Indexes
CREATE INDEX IF NOT EXISTS idx_audit_events_status ON audit_events(status);
CREATE INDEX IF NOT EXISTS idx_audit_events_supplier ON audit_events(supplier_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);

-- Electricity Bills Indexes
CREATE INDEX IF NOT EXISTS idx_bills_supplier ON electricity_bills(supplier_id);
CREATE INDEX IF NOT EXISTS idx_bills_period ON electricity_bills(billing_period_start, billing_period_end);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_bills ENABLE ROW LEVEL SECURITY;
