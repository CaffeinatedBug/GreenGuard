-- GreenGuard AI - Row Level Security (RLS) Configuration
-- Enables RLS for multi-tenant security

-- Enable Row Level Security on all tables
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE electricity_bills ENABLE ROW LEVEL SECURITY;

-- Note: Add RLS policies based on your authentication setup
-- Example policies can be added here after setting up auth
