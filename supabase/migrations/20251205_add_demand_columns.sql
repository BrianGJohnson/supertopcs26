-- Add dedicated demand columns (separate from legacy popularity)
-- Demand = Apify autocomplete-based scoring
-- Popularity = Legacy heuristic-based scoring (kept for backward compatibility)

ALTER TABLE seed_analysis 
ADD COLUMN IF NOT EXISTS demand integer,
ADD COLUMN IF NOT EXISTS demand_base integer;

-- Add index for demand queries
CREATE INDEX IF NOT EXISTS idx_seed_analysis_demand ON seed_analysis(demand);

COMMENT ON COLUMN seed_analysis.demand IS 'Demand score (0-99) from Apify autocomplete API';
COMMENT ON COLUMN seed_analysis.demand_base IS 'Raw demand score before session size multiplier';
COMMENT ON COLUMN seed_analysis.popularity IS 'Legacy popularity score from heuristic calculation';
