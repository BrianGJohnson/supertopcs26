-- Migration: Add seed_phrases table for caching AI-generated seed phrases
-- Date: 2024-12-01
-- Purpose: Store 75 diverse 2-word seed phrases per sub-niche per user

-- Create the seed_phrases table
CREATE TABLE IF NOT EXISTS seed_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('evergreen', 'trending', 'monetization')),
  sub_niche TEXT NOT NULL,
  phrases JSONB NOT NULL DEFAULT '[]',
  used_phrases JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One entry per user/pillar/sub-niche combination
  UNIQUE(user_id, pillar, sub_niche)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_seed_phrases_user_pillar 
  ON seed_phrases(user_id, pillar);

CREATE INDEX IF NOT EXISTS idx_seed_phrases_lookup 
  ON seed_phrases(user_id, pillar, sub_niche);

-- Enable RLS
ALTER TABLE seed_phrases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own seed phrases
CREATE POLICY "Users can view own seed phrases"
  ON seed_phrases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own seed phrases
CREATE POLICY "Users can insert own seed phrases"
  ON seed_phrases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own seed phrases
CREATE POLICY "Users can update own seed phrases"
  ON seed_phrases
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_seed_phrases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seed_phrases_updated_at
  BEFORE UPDATE ON seed_phrases
  FOR EACH ROW
  EXECUTE FUNCTION update_seed_phrases_updated_at();

-- Comment for documentation
COMMENT ON TABLE seed_phrases IS 'Caches AI-generated 2-word seed phrases per user/pillar/sub-niche. Generated once, used forever.';
COMMENT ON COLUMN seed_phrases.phrases IS 'Array of 75 diverse 2-word seed phrases';
COMMENT ON COLUMN seed_phrases.used_phrases IS 'Array of phrases the user has already selected (for tracking)';
