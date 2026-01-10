-- GreenGuard AI - Seed Data
-- Sample data for development and testing

-- Insert sample suppliers
INSERT INTO suppliers (name, location, contact_email) VALUES
  ('TechFab Industries', 'Ahmedabad, Gujarat', 'contact@techfab.com'),
  ('GreenTech Manufacturing', 'Bangalore, Karnataka', 'info@greentech.in'),
  ('EcoTextiles Ltd', 'Mumbai, Maharashtra', 'support@ecotextiles.com');

-- Store supplier IDs for reference
DO $$
DECLARE
  supplier1_id UUID;
  supplier2_id UUID;
  supplier3_id UUID;
BEGIN
  -- Get supplier IDs
  SELECT id INTO supplier1_id FROM suppliers WHERE name = 'TechFab Industries';
  SELECT id INTO supplier2_id FROM suppliers WHERE name = 'GreenTech Manufacturing';
  SELECT id INTO supplier3_id FROM suppliers WHERE name = 'EcoTextiles Ltd';

  -- Insert sample IoT logs for TechFab Industries
  INSERT INTO iot_logs (supplier_id, timestamp, device_id, energy_kwh, current_amps, voltage_volts, power_watts, raw_json)
  VALUES
    (supplier1_id, NOW() - INTERVAL '1 hour', 'ESP32-001', 15.5, 22.3, 230.0, 5129.0, '{"temp": 28.5, "humidity": 65}'::jsonb),
    (supplier1_id, NOW() - INTERVAL '30 minutes', 'ESP32-001', 8.2, 18.7, 230.0, 4301.0, '{"temp": 29.1, "humidity": 62}'::jsonb),
    (supplier1_id, NOW() - INTERVAL '15 minutes', 'ESP32-001', 12.3, 20.5, 230.0, 4715.0, '{"temp": 28.8, "humidity": 63}'::jsonb);

  -- Insert sample IoT logs for GreenTech Manufacturing
  INSERT INTO iot_logs (supplier_id, timestamp, device_id, energy_kwh, current_amps, voltage_volts, power_watts, raw_json)
  VALUES
    (supplier2_id, NOW() - INTERVAL '2 hours', 'ESP32-002', 25.7, 35.2, 230.0, 8096.0, '{"temp": 30.2, "humidity": 58}'::jsonb),
    (supplier2_id, NOW() - INTERVAL '1 hour', 'ESP32-002', 22.1, 31.8, 230.0, 7314.0, '{"temp": 29.5, "humidity": 60}'::jsonb);

  -- Insert sample audit events
  INSERT INTO audit_events (supplier_id, status, agent_reasoning, confidence_score, flagged_by_agent)
  VALUES
    (supplier1_id, 'VERIFIED', 'Energy consumption within normal operational range. No anomalies detected.', 95, 'AuditorAgent'),
    (supplier2_id, 'WARNING', 'High energy spike detected during non-peak hours. Peak load exceeded expected threshold by 15%.', 87, 'AuditorAgent'),
    (supplier3_id, 'PENDING', 'New supplier onboarded. Awaiting baseline data collection for anomaly detection calibration.', 75, 'OnboardingAgent');

  -- Insert sample electricity bill
  INSERT INTO electricity_bills (supplier_id, billing_period_start, billing_period_end, total_kwh, peak_load_kw, vendor_name, extracted_data)
  VALUES
    (supplier1_id, '2025-12-01', '2025-12-31', 15420.5, 125.0, 'Gujarat State Electricity Corporation', '{"bill_number": "GSEC-2025-12-001", "charges": {"energy": 92520, "surcharge": 4626}}'::jsonb);
END $$;
