# GreenGuard AI - Supabase Database Schema

This document defines the database schema for the GreenGuard AI platform as specified in the PRD.

## Tables

### `suppliers`

Stores information about supplier companies whose emissions are being audited.

```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique identifier for the supplier
- `name`: Company/Supplier name
- `location`: Physical location (e.g., "Ahmedabad, Gujarat")
- `contact_email`: Contact email for notifications
- `created_at`: Timestamp of record creation
- `updated_at`: Timestamp of last update

---

### `iot_logs`

Stores raw IoT sensor data from energy monitoring devices.

```sql
CREATE TABLE iot_logs (
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

CREATE INDEX idx_iot_logs_supplier ON iot_logs(supplier_id);
CREATE INDEX idx_iot_logs_timestamp ON iot_logs(timestamp DESC);
```

**Columns:**
- `id`: Unique identifier for the log entry
- `supplier_id`: Reference to the supplier this data belongs to
- `timestamp`: When the measurement was taken
- `device_id`: Identifier of the IoT device (e.g., "ESP32-552")
- `energy_kwh`: Calculated energy consumption in kilowatt-hours
- `current_amps`: Current measurement in amperes
- `voltage_volts`: Voltage measurement in volts
- `power_watts`: Power measurement in watts
- `raw_json`: Complete raw JSON payload from the device
- `created_at`: When this record was inserted into the database

---

### `audit_events`

Stores the results of agent verification processes and human approvals.

```sql
CREATE TABLE audit_events (
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

CREATE INDEX idx_audit_events_status ON audit_events(status);
CREATE INDEX idx_audit_events_supplier ON audit_events(supplier_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);
```

**Columns:**
- `id`: Unique identifier for the audit event
- `log_reference_id`: Reference to the IoT log that triggered this audit
- `supplier_id`: Reference to the supplier being audited
- `status`: Current status of the audit
  - `PENDING`: Awaiting human review
  - `VERIFIED`: Confirmed as legitimate
  - `ANOMALY`: Flagged as suspicious
  - `REJECTED`: Human rejected the data
  - `WARNING`: High carbon impact event
- `agent_reasoning`: The AI agent's explanation (displayed in Glass Box Terminal)
- `confidence_score`: Agent's confidence level (0-100)
- `flagged_by_agent`: Name of the agent that created this event (e.g., "AuditorAgent")
- `human_action`: Action taken by human reviewer ("APPROVE", "REJECT", "FLAG_SUPPLIER")
- `human_action_timestamp`: When the human took action
- `metadata`: Additional context (e.g., weather data, grid intensity)
- `created_at`: When this audit event was created
- `updated_at`: Last modification timestamp

---

### `electricity_bills`

Stores uploaded electricity bill information extracted by the BillReaderAgent.

```sql
CREATE TABLE electricity_bills (
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

CREATE INDEX idx_bills_supplier ON electricity_bills(supplier_id);
CREATE INDEX idx_bills_period ON electricity_bills(billing_period_start, billing_period_end);
```

**Columns:**
- `id`: Unique identifier for the bill
- `supplier_id`: Reference to the supplier
- `billing_period_start`: Start date of billing period
- `billing_period_end`: End date of billing period
- `total_kwh`: Total energy consumption in the period
- `peak_load_kw`: Maximum load capacity allowed
- `vendor_name`: Electricity provider name
- `file_url`: Storage URL for the uploaded PDF
- `extracted_data`: Full OCR/extraction results
- `uploaded_at`: When the bill was uploaded

---

## Row Level Security (RLS)

After creating tables, enable RLS for multi-tenant security:

```sql
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_bills ENABLE ROW LEVEL SECURITY;
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the table creation SQL statements
4. Execute them in order
5. Enable RLS policies as needed for your authentication setup

## Next Steps

- Set up Supabase Storage for PDF bill uploads
- Configure authentication (if multi-user)
- Create database functions for common queries
- Set up real-time subscriptions for live dashboard updates
