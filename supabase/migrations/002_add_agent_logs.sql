-- Add agent_logs column to audit_events table
-- This stores the glass box AI reasoning logs for transparency

ALTER TABLE audit_events 
ADD COLUMN IF NOT EXISTS agent_logs JSONB;

-- Add comment
COMMENT ON COLUMN audit_events.agent_logs IS 'Glass box transparency: Array of agent decision logs showing reasoning process';

-- Optional: Create an index for querying logs
CREATE INDEX IF NOT EXISTS idx_audit_events_agent_logs ON audit_events USING GIN (agent_logs);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully added agent_logs column to audit_events table';
END $$;
