-- GreenGuard AI - Complete Database Setup Script
-- Run this in Supabase SQL Editor to set up all required tables
-- 
-- ⚠️ IMPORTANT: Run this in your Supabase project's SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

-- ============================================================================
-- STEP 1: Enable UUID Extension
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: Create Tables
-- ============================================================================

-- TABLE 1: suppliers
-- Stores information about energy suppliers being monitored
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS iot_logs CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  bill_max_load_kwh NUMERIC NOT NULL DEFAULT 350,
  grid_carbon_intensity NUMERIC NOT NULL DEFAULT 800,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 2: iot_logs
-- Stores real-time IoT sensor readings
CREATE TABLE iot_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  energy_kwh NUMERIC NOT NULL,
  voltage NUMERIC NOT NULL,
  current_amps NUMERIC NOT NULL,
  power_watts NUMERIC NOT NULL,
  raw_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABLE 3: audit_events
-- Tracks AI audit results and human verification actions
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_reference_id UUID NOT NULL REFERENCES iot_logs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'ANOMALY', 'WARNING', 'REJECTED')),
  agent_reasoning TEXT NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  human_action TEXT CHECK (human_action IN ('APPROVED', 'FLAGGED')),
  human_action_timestamp TIMESTAMPTZ,
  agent_logs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create Indexes for Performance
-- ============================================================================
CREATE INDEX idx_iot_logs_supplier_timestamp ON iot_logs(supplier_id, timestamp DESC);
CREATE INDEX idx_audit_events_status ON audit_events(status);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_agent_logs ON audit_events USING GIN (agent_logs);

-- ============================================================================
-- STEP 4: Seed Data (Mock Suppliers)
-- ============================================================================
INSERT INTO suppliers (name, location, bill_max_load_kwh, grid_carbon_intensity) VALUES
  ('Ahmedabad Textiles Ltd', 'Ahmedabad, Gujarat', 350, 820),
  ('Mumbai Electronics Co', 'Mumbai, Maharashtra', 500, 650),
  ('Delhi Manufacturing Inc', 'Delhi, NCR', 450, 900);

-- ============================================================================
-- STEP 5: Enable Row Level Security (Optional but Recommended)
-- ============================================================================
-- For demo purposes, we'll allow all operations
-- In production, configure proper RLS policies

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Allow all operations (FOR DEMO ONLY - configure properly for production)
CREATE POLICY "Allow all operations on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on iot_logs" ON iot_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on audit_events" ON audit_events FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- STEP 6: Utility Functions
-- ============================================================================

-- Function to get recent logs for a supplier
CREATE OR REPLACE FUNCTION get_recent_logs(supplier_uuid UUID, log_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  energy_kwh NUMERIC,
  voltage NUMERIC,
  current_amps NUMERIC,
  power_watts NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    iot_logs.id,
    iot_logs.timestamp,
    iot_logs.energy_kwh,
    iot_logs.voltage,
    iot_logs.current_amps,
    iot_logs.power_watts
  FROM iot_logs
  WHERE iot_logs.supplier_id = supplier_uuid
  ORDER BY iot_logs.timestamp DESC
  LIMIT log_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending audits
CREATE OR REPLACE FUNCTION get_pending_audits()
RETURNS TABLE (
  audit_id UUID,
  log_id UUID,
  supplier_name TEXT,
  timestamp TIMESTAMPTZ,
  energy_kwh NUMERIC,
  status TEXT,
  agent_reasoning TEXT,
  confidence_score INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ae.id AS audit_id,
    ae.log_reference_id AS log_id,
    s.name AS supplier_name,
    il.timestamp,
    il.energy_kwh,
    ae.status,
    ae.agent_reasoning,
    ae.confidence_score,
    ae.created_at
  FROM audit_events ae
  JOIN iot_logs il ON ae.log_reference_id = il.id
  JOIN suppliers s ON il.supplier_id = s.id
  WHERE ae.status IN ('PENDING', 'WARNING', 'ANOMALY')
    AND ae.human_action IS NULL
  ORDER BY ae.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ GreenGuard AI database setup complete!';
  RAISE NOTICE 'Created tables: suppliers, iot_logs, audit_events';
  RAISE NOTICE 'Inserted 3 seed suppliers: Ahmedabad Textiles Ltd, Mumbai Electronics Co, Delhi Manufacturing Inc';
  RAISE NOTICE 'RLS policies enabled (allow all for demo)';
END $$;
