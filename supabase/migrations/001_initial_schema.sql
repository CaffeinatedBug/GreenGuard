-- GreenGuard AI Database Schema
-- This migration creates the complete database structure for IoT energy monitoring and auditing

-- Enable UUID extension for auto-generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: suppliers
-- Stores information about energy suppliers being monitored
-- ============================================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  bill_max_load_kwh NUMERIC NOT NULL, -- Maximum allowed load from electricity bill
  grid_carbon_intensity NUMERIC NOT NULL DEFAULT 800, -- grams CO2 per kWh (default: coal-heavy grid)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment to explain the table
COMMENT ON TABLE suppliers IS 'Stores supplier/facility information with their electricity bill limits and carbon intensity metrics';
COMMENT ON COLUMN suppliers.bill_max_load_kwh IS 'Maximum allowed energy load from the electricity bill (in kWh)';
COMMENT ON COLUMN suppliers.grid_carbon_intensity IS 'Carbon intensity of the grid in grams CO2 per kWh';

-- ============================================================================
-- TABLE 2: iot_logs
-- Stores real-time IoT sensor readings from energy monitoring devices
-- ============================================================================
CREATE TABLE iot_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL,
  energy_kwh NUMERIC NOT NULL,
  voltage NUMERIC NOT NULL,
  current_amps NUMERIC NOT NULL,
  power_watts NUMERIC NOT NULL,
  raw_json JSONB, -- Complete IoT payload for debugging and additional metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient querying by supplier and time
CREATE INDEX idx_iot_logs_supplier_timestamp ON iot_logs(supplier_id, timestamp DESC);

-- Add comments
COMMENT ON TABLE iot_logs IS 'Real-time IoT sensor readings from energy monitoring devices';
COMMENT ON COLUMN iot_logs.raw_json IS 'Complete raw payload from IoT device for debugging and additional sensor data';

-- ============================================================================
-- TABLE 3: audit_events
-- Tracks AI audit results and human verification actions
-- ============================================================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_reference_id UUID NOT NULL REFERENCES iot_logs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'ANOMALY', 'WARNING', 'REJECTED')),
  agent_reasoning TEXT NOT NULL, -- AI's explanation for the audit decision
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  human_action TEXT CHECK (human_action IN ('APPROVED', 'FLAGGED')),
  human_action_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for filtering by status
CREATE INDEX idx_audit_events_status ON audit_events(status);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);

-- Add comments
COMMENT ON TABLE audit_events IS 'AI audit results with human verification actions for energy consumption patterns';
COMMENT ON COLUMN audit_events.status IS 'Audit status: PENDING (awaiting review), VERIFIED (normal), ANOMALY (flagged), WARNING (borderline), REJECTED (denied)';
COMMENT ON COLUMN audit_events.agent_reasoning IS 'AI agent explanation for its decision (glass box transparency)';
COMMENT ON COLUMN audit_events.confidence_score IS 'AI confidence level (0-100) for the audit decision';
COMMENT ON COLUMN audit_events.human_action IS 'Human override: APPROVED or FLAGGED';

-- ============================================================================
-- SEED DATA
-- Insert mock suppliers for development and testing
-- ============================================================================

INSERT INTO suppliers (name, location, bill_max_load_kwh, grid_carbon_intensity) VALUES
  ('Ahmedabad Textiles Ltd', 'Ahmedabad, Gujarat', 350, 820),
  ('Mumbai Electronics Co', 'Mumbai, Maharashtra', 500, 650);

-- Add a comment about the seed data
COMMENT ON TABLE suppliers IS 'Stores supplier information. Includes 2 seed suppliers: Ahmedabad Textiles Ltd and Mumbai Electronics Co';

-- ============================================================================
-- UTILITY FUNCTIONS (Optional but useful)
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
  WHERE ae.status IN ('PENDING', 'WARNING')
    AND ae.human_action IS NULL
  ORDER BY ae.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'GreenGuard AI database schema created successfully!';
  RAISE NOTICE 'Created tables: suppliers, iot_logs, audit_events';
  RAISE NOTICE 'Inserted 2 seed suppliers: Ahmedabad Textiles Ltd, Mumbai Electronics Co';
END $$;
