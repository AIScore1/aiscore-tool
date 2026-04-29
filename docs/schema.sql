-- AI Score Database Schema for Supabase

-- Audits table (expires after 4 hours)
CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  domain TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_domain ON audits(domain);
CREATE INDEX IF NOT EXISTS idx_audits_expires_at ON audits(expires_at);

-- Improvements table (expires after 4 hours)
CREATE TABLE IF NOT EXISTS improvements (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_improvements_expires_at ON improvements(expires_at);

-- Leads table (never expires)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- API Usage table
CREATE TABLE IF NOT EXISTS api_usage (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp DESC);

-- Credit Balance table (single row)
CREATE TABLE IF NOT EXISTS credit_balance (
  id SERIAL PRIMARY KEY,
  initial_credits_usd NUMERIC DEFAULT 0,
  initial_credits_zar NUMERIC DEFAULT 0,
  spent_usd NUMERIC DEFAULT 0,
  spent_zar NUMERIC DEFAULT 0,
  remaining_usd NUMERIC DEFAULT 0,
  remaining_zar NUMERIC DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize credit_balance with a single row if it doesn't exist
INSERT INTO credit_balance (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Auto-delete expired audits (runs daily at midnight)
CREATE OR REPLACE FUNCTION delete_expired_audits()
RETURNS void AS $$
BEGIN
  DELETE FROM audits WHERE expires_at < NOW();
  DELETE FROM improvements WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up a cron job in Supabase to run the cleanup daily
-- This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('delete_expired_audits', '0 0 * * *', 'SELECT delete_expired_audits();');
