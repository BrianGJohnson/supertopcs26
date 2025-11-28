-- ============================================================
-- SESSIONS TABLE - Complete Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing table if it exists (fresh start)
DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table with ALL required columns
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields (used by createSession)
  name TEXT NOT NULL,
  seed_phrase TEXT,
  current_step INT DEFAULT 1,
  source_module TEXT DEFAULT 'builder',
  status TEXT DEFAULT 'active',
  
  -- Timestamps
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Session metadata (used by updateSession)
  total_phrases_generated INT,
  total_phrases_refined INT,
  total_super_items INT,
  total_titles_saved INT,
  total_packages_saved INT,
  
  -- Flex fields for future expansion
  extra JSONB
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access their own sessions
CREATE POLICY sessions_user_policy ON sessions
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- VERIFICATION QUERY - Run after to confirm success
-- ============================================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'sessions' 
-- ORDER BY ordinal_position;
