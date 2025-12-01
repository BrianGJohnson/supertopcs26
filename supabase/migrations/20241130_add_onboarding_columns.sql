-- Add onboarding columns to channels table
-- This migration adds all fields needed to store onboarding data from the 4-step flow

-- YouTube channel URL (from step 2)
ALTER TABLE channels ADD COLUMN IF NOT EXISTS youtube_channel_url text;

-- Niche score from GPT analysis (step 3)
ALTER TABLE channels ADD COLUMN IF NOT EXISTS niche_score integer;

-- Onboarding progress tracking
ALTER TABLE channels ADD COLUMN IF NOT EXISTS onboarding_step integer;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;

-- Goals array (step 2) - e.g., ["growth", "adsense", "sell_products"]
ALTER TABLE channels ADD COLUMN IF NOT EXISTS goals jsonb;

-- Content pillars array (step 3) - e.g., ["AI Tools", "No-Code Builds", "Cursor Tips"]
ALTER TABLE channels ADD COLUMN IF NOT EXISTS content_pillars jsonb;

-- Audience details (step 4)
ALTER TABLE channels ADD COLUMN IF NOT EXISTS audience_who text;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS audience_struggle text;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS audience_goal text;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS audience_expertise text;

-- Full GPT analysis cache (step 3) - stores complete response for reference
ALTER TABLE channels ADD COLUMN IF NOT EXISTS niche_analysis jsonb;

-- Add comments for documentation
COMMENT ON COLUMN channels.youtube_channel_url IS 'Full YouTube channel URL from onboarding step 2';
COMMENT ON COLUMN channels.niche_score IS '1-10 demand score from GPT-5-mini analysis';
COMMENT ON COLUMN channels.onboarding_step IS 'Current step (1-4), null if not started';
COMMENT ON COLUMN channels.onboarding_completed_at IS 'Timestamp when user finished all 4 steps';
COMMENT ON COLUMN channels.goals IS 'Array of goal IDs: growth, adsense, sell_products, affiliate, authority, community';
COMMENT ON COLUMN channels.content_pillars IS 'Array of 3-5 content pillar strings selected in step 3';
COMMENT ON COLUMN channels.audience_who IS 'Target audience description from step 4';
COMMENT ON COLUMN channels.audience_struggle IS 'What problem the audience faces';
COMMENT ON COLUMN channels.audience_goal IS 'What outcome the audience wants';
COMMENT ON COLUMN channels.audience_expertise IS 'Audience expertise level: beginner, intermediate, advanced';
COMMENT ON COLUMN channels.niche_analysis IS 'Full GPT-5-mini response including relatedTopics and scores';
