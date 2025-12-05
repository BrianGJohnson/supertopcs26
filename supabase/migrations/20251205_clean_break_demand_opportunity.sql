-- ============================================================================
-- CLEAN BREAK MIGRATION: Delete popularity/competition, Keep demand, Add opportunity
-- Date: December 5, 2025
-- Purpose: Remove legacy scoring columns and create clean structure
-- ============================================================================

-- ============================================================================
-- STEP 1: SEED_ANALYSIS TABLE
-- ============================================================================

-- Delete legacy popularity columns
ALTER TABLE seed_analysis DROP COLUMN IF EXISTS popularity;
ALTER TABLE seed_analysis DROP COLUMN IF EXISTS popularity_base;
ALTER TABLE seed_analysis DROP COLUMN IF EXISTS popularity_reason;

-- Delete legacy competition columns  
ALTER TABLE seed_analysis DROP COLUMN IF EXISTS competition;
ALTER TABLE seed_analysis DROP COLUMN IF EXISTS competition_reason;

-- Add fresh opportunity column (starts as NULL - will be scored later)
ALTER TABLE seed_analysis ADD COLUMN IF NOT EXISTS opportunity INTEGER;

-- ============================================================================
-- STEP 2: SUPER_TOPICS TABLE
-- ============================================================================

-- Delete legacy popularity columns
ALTER TABLE super_topics DROP COLUMN IF EXISTS popularity;
ALTER TABLE super_topics DROP COLUMN IF EXISTS popularity_base;

-- Delete legacy competition columns
ALTER TABLE super_topics DROP COLUMN IF EXISTS competition;

-- Add fresh opportunity column
ALTER TABLE super_topics ADD COLUMN IF NOT EXISTS opportunity INTEGER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running, verify with:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'seed_analysis';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'super_topics';

-- Expected: No popularity, popularity_base, popularity_reason, competition, competition_reason
-- Expected: demand (existing), opportunity (new)
