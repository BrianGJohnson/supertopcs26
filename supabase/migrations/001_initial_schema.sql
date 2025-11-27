-- ============================================================
-- SUPER TOPICS DATABASE SCHEMA
-- Version: 1.0.0
-- ============================================================
-- 
-- DESIGN OVERVIEW:
-- This schema is massively overprovisioned to support the Super Topics
-- product without requiring frequent migrations. Every core table includes
-- extensive flex columns (text_field_X, int_field_X, json_bucket_X) for
-- future expansion.
--
-- TABLE CATEGORIES:
-- 1. DISPOSABLE (cascade delete with session):
--    - seed_phrases, refine_selections, imported_items, session_ui_state
--
-- 2. PERMANENT (survive session deletion):
--    - super_items, saved_titles, saved_packages, audience_insights_reports,
--      library_items, channel_profiles, video_publish_plans, scoring_runs,
--      user_settings
--
-- NAMING CONVENTIONS:
-- - snake_case for all tables and columns
-- - Plural table names
-- - UUID primary keys with gen_random_uuid()
-- - *_score for INT scores (0-100)
-- - *_reason for TEXT explanations
-- - *_at for timestamps
-- - is_* for boolean flags
--
-- RLS: Enabled on all tables with user_id = auth.uid() policies
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- TABLE: sessions
-- Core session table for builder runs. Disposable tables cascade from here.
-- ============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields
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
  
  -- Session metadata
  total_phrases_generated INT,
  total_phrases_refined INT,
  total_super_items INT,
  total_titles_saved INT,
  total_packages_saved INT,
  
  -- Flex text fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  
  -- Flex int fields
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  
  -- Flex JSON buckets
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  extra JSONB
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);


-- ============================================================
-- TABLE: seed_phrases
-- Page 1 generated phrases. DISPOSABLE - cascades with session.
-- ============================================================
CREATE TABLE seed_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Core phrase data
  phrase TEXT NOT NULL,
  seed_phrase_id UUID REFERENCES seed_phrases(id) ON DELETE SET NULL,
  parent_phrase_id UUID REFERENCES seed_phrases(id) ON DELETE SET NULL,
  
  -- Source tags (micro)
  builder_source_tag TEXT, -- top10, child, a2z, prefix, suffix, questions, modifiers, manual
  
  -- Source tags (macro)
  origin_source_module TEXT, -- seed, niche, justborn, onboarding, manual, imported
  
  -- Hierarchy
  hierarchy_path TEXT, -- "seed > top10 > child"
  hierarchy_depth INT,
  hierarchy_data JSONB,
  
  -- Phrase level tags
  funnel_stage TEXT, -- awareness, consideration, decision, retention
  tone_tag TEXT,
  platform_tag TEXT,
  niche_tag TEXT,
  difficulty_tag TEXT,
  freshness_tag TEXT,
  time_sensitivity_tag TEXT,
  audience_segment_tag TEXT,
  content_format_tag TEXT,
  
  -- Selection state
  is_selected BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_finalist BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  is_promoted_to_super BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- ============================================================
  -- SCORING SECTION - Heavily overprovisioned
  -- Each score is 0-100 INT with TEXT reason
  -- ============================================================
  
  -- Topic strength
  topic_strength_score INT,
  topic_strength_reason TEXT,
  
  -- Popularity
  popularity_score INT,
  popularity_reason TEXT,
  
  -- Competition / Uniqueness
  competition_score INT,
  competition_reason TEXT,
  uniqueness_score INT,
  uniqueness_reason TEXT,
  
  -- Audience fit
  audience_fit_score INT,
  audience_fit_reason TEXT,
  
  -- Intent
  intent_score INT,
  intent_reason TEXT,
  intent_tag TEXT,
  intent_category TEXT,
  
  -- Click intensity
  click_intensity_score INT,
  click_intensity_reason TEXT,
  
  -- Growth fit
  growth_fit_score INT,
  growth_fit_reason TEXT,
  
  -- Creator fit
  creator_fit_score INT,
  creator_fit_reason TEXT,
  
  -- Binge potential
  binge_score INT,
  binge_reason TEXT,
  
  -- Subscribe potential
  subscribe_score INT,
  subscribe_reason TEXT,
  
  -- Effort level
  effort_score INT,
  effort_reason TEXT,
  
  -- Natural language quality
  natural_language_score INT,
  natural_language_reason TEXT,
  
  -- Specificity
  specificity_score INT,
  specificity_reason TEXT,
  
  -- Supply likelihood
  supply_likelihood_score INT,
  supply_likelihood_reason TEXT,
  
  -- Trend velocity
  trend_velocity_score INT,
  trend_velocity_reason TEXT,
  
  -- Emotional resonance
  emotional_resonance_score INT,
  emotional_resonance_reason TEXT,
  
  -- Search volume proxy
  search_volume_score INT,
  search_volume_reason TEXT,
  
  -- Monetization potential
  monetization_score INT,
  monetization_reason TEXT,
  
  -- Evergreen vs trending
  evergreen_score INT,
  evergreen_reason TEXT,
  
  -- Composite / overall
  composite_score INT,
  composite_reason TEXT,
  overall_score INT,
  overall_reason TEXT,
  
  -- Emotional triggers
  emotional_triggers JSONB, -- {primary, secondary, ranked[]}
  click_triggers JSONB,
  
  -- Additional score placeholders
  score_a INT,
  score_a_reason TEXT,
  score_b INT,
  score_b_reason TEXT,
  score_c INT,
  score_c_reason TEXT,
  score_d INT,
  score_d_reason TEXT,
  score_e INT,
  score_e_reason TEXT,
  
  -- ============================================================
  -- FLEX FIELDS - 20 text, 20 int, 10 json
  -- ============================================================
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  text_field_11 TEXT,
  text_field_12 TEXT,
  text_field_13 TEXT,
  text_field_14 TEXT,
  text_field_15 TEXT,
  text_field_16 TEXT,
  text_field_17 TEXT,
  text_field_18 TEXT,
  text_field_19 TEXT,
  text_field_20 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  int_field_11 INT,
  int_field_12 INT,
  int_field_13 INT,
  int_field_14 INT,
  int_field_15 INT,
  int_field_16 INT,
  int_field_17 INT,
  int_field_18 INT,
  int_field_19 INT,
  int_field_20 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  json_bucket_6 JSONB,
  json_bucket_7 JSONB,
  json_bucket_8 JSONB,
  json_bucket_9 JSONB,
  json_bucket_10 JSONB,
  extra JSONB
);

CREATE INDEX idx_seed_phrases_session_id ON seed_phrases(session_id);
CREATE INDEX idx_seed_phrases_user_id ON seed_phrases(user_id);
CREATE INDEX idx_seed_phrases_builder_source_tag ON seed_phrases(builder_source_tag);
CREATE INDEX idx_seed_phrases_is_selected ON seed_phrases(is_selected);
CREATE INDEX idx_seed_phrases_is_finalist ON seed_phrases(is_finalist);
CREATE INDEX idx_seed_phrases_phrase ON seed_phrases(phrase);
CREATE INDEX idx_seed_phrases_created_at ON seed_phrases(created_at);


-- ============================================================
-- TABLE: refine_selections
-- Page 2 shortlist state. DISPOSABLE - cascades with session.
-- ============================================================
CREATE TABLE refine_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES seed_phrases(id) ON DELETE CASCADE,
  
  -- Selection state
  is_finalist BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  is_maybe BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  
  -- Scores at refine time (snapshot)
  temp_score INT,
  rank_position INT,
  
  -- Notes and flags
  notes TEXT,
  flag_color TEXT,
  flag_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  extra JSONB
);

CREATE INDEX idx_refine_selections_session_id ON refine_selections(session_id);
CREATE INDEX idx_refine_selections_phrase_id ON refine_selections(phrase_id);
CREATE INDEX idx_refine_selections_is_finalist ON refine_selections(is_finalist);


-- ============================================================
-- TABLE: imported_items
-- Cross-module imports. DISPOSABLE - cascades with session.
-- ============================================================
CREATE TABLE imported_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Import metadata
  source_module TEXT NOT NULL, -- niche, justborn, onboarding, manual
  item_type TEXT NOT NULL, -- phrase, title, context, video_idea
  
  -- Payload
  payload JSONB NOT NULL,
  
  -- Processing state
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  extra JSONB
);

CREATE INDEX idx_imported_items_session_id ON imported_items(session_id);
CREATE INDEX idx_imported_items_user_id ON imported_items(user_id);
CREATE INDEX idx_imported_items_source_module ON imported_items(source_module);
CREATE INDEX idx_imported_items_processed ON imported_items(processed);


-- ============================================================
-- TABLE: session_ui_state
-- Per-page UI state. DISPOSABLE - cascades with session.
-- ============================================================
CREATE TABLE session_ui_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Page identifier
  page_key TEXT NOT NULL, -- seed, refine, super, title, package, upload, reports
  
  -- State blob
  state_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  extra JSONB,
  
  UNIQUE(session_id, page_key)
);

CREATE INDEX idx_session_ui_state_session_id ON session_ui_state(session_id);


-- ============================================================
-- TABLE: super_items
-- Page 3 Super Topics. PERMANENT - survives session deletion.
-- This is the most critical table - extremely overprovisioned.
-- ============================================================
CREATE TABLE super_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- References (nullable, no cascade)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  seed_phrase_id UUID,
  main_phrase_id UUID,
  channel_profile_id UUID,
  
  -- Core phrase data
  phrase TEXT NOT NULL,
  original_phrase TEXT,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, archived, deleted
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  promoted_at TIMESTAMPTZ,
  
  -- ============================================================
  -- INTENT AND VIEWER STAGE
  -- ============================================================
  intent_tag TEXT,
  intent_category TEXT,
  intent_reason TEXT,
  viewer_stage_tag TEXT, -- Explore, Decide, Do, Improve
  viewer_stage_reason TEXT,
  
  -- ============================================================
  -- COMPREHENSIVE SCORING - All 0-100 with reasons
  -- ============================================================
  
  -- Core scores
  topic_strength_score INT,
  topic_strength_reason TEXT,
  
  popularity_score INT,
  popularity_reason TEXT,
  
  competition_score INT,
  competition_reason TEXT,
  
  uniqueness_score INT,
  uniqueness_reason TEXT,
  
  audience_fit_score INT,
  audience_fit_reason TEXT,
  
  intent_score INT,
  intent_score_reason TEXT,
  
  click_intensity_score INT,
  click_intensity_reason TEXT,
  
  growth_fit_score INT,
  growth_fit_reason TEXT,
  
  creator_fit_score INT,
  creator_fit_reason TEXT,
  
  binge_score INT,
  binge_reason TEXT,
  
  subscribe_score INT,
  subscribe_reason TEXT,
  
  effort_score INT,
  effort_reason TEXT,
  
  natural_language_score INT,
  natural_language_reason TEXT,
  
  specificity_score INT,
  specificity_reason TEXT,
  
  supply_likelihood_score INT,
  supply_likelihood_reason TEXT,
  
  trend_velocity_score INT,
  trend_velocity_reason TEXT,
  
  emotional_resonance_score INT,
  emotional_resonance_reason TEXT,
  
  search_volume_score INT,
  search_volume_reason TEXT,
  
  monetization_score INT,
  monetization_reason TEXT,
  
  evergreen_score INT,
  evergreen_reason TEXT,
  
  viral_potential_score INT,
  viral_potential_reason TEXT,
  
  authority_score INT,
  authority_reason TEXT,
  
  controversy_score INT,
  controversy_reason TEXT,
  
  shareability_score INT,
  shareability_reason TEXT,
  
  comment_potential_score INT,
  comment_potential_reason TEXT,
  
  rewatch_score INT,
  rewatch_reason TEXT,
  
  -- Composite scores
  composite_score INT,
  composite_reason TEXT,
  overall_score INT,
  overall_reason TEXT,
  final_rank INT,
  
  -- Additional score slots
  score_a INT,
  score_a_reason TEXT,
  score_b INT,
  score_b_reason TEXT,
  score_c INT,
  score_c_reason TEXT,
  score_d INT,
  score_d_reason TEXT,
  score_e INT,
  score_e_reason TEXT,
  score_f INT,
  score_f_reason TEXT,
  score_g INT,
  score_g_reason TEXT,
  score_h INT,
  score_h_reason TEXT,
  score_i INT,
  score_i_reason TEXT,
  score_j INT,
  score_j_reason TEXT,
  
  -- ============================================================
  -- EMOTIONAL AND PSYCHOLOGICAL
  -- ============================================================
  emotional_triggers JSONB, -- {primary, secondary, ranked[], intensity}
  click_triggers JSONB,
  psychological_hooks JSONB,
  fear_triggers JSONB,
  desire_triggers JSONB,
  curiosity_triggers JSONB,
  
  -- ============================================================
  -- TAGS AND CLASSIFICATIONS
  -- ============================================================
  funnel_stage TEXT,
  tone_tag TEXT,
  platform_tag TEXT,
  niche_tag TEXT,
  difficulty_tag TEXT,
  freshness_tag TEXT,
  time_sensitivity_tag TEXT,
  audience_segment_tag TEXT,
  content_format_tag TEXT,
  series_potential_tag TEXT,
  
  tags_array TEXT[],
  categories_array TEXT[],
  
  -- ============================================================
  -- LONG EXPLANATIONS
  -- ============================================================
  long_explanation_1 TEXT,
  long_explanation_2 TEXT,
  long_explanation_3 TEXT,
  long_explanation_4 TEXT,
  long_explanation_5 TEXT,
  
  summary_paragraph TEXT,
  why_this_works TEXT,
  potential_risks TEXT,
  suggested_angles TEXT,
  
  -- ============================================================
  -- METADATA
  -- ============================================================
  source_module TEXT,
  builder_source_tag TEXT,
  hierarchy_path TEXT,
  
  -- ============================================================
  -- FLEX FIELDS - 30 text, 30 int, 15 json
  -- ============================================================
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  text_field_11 TEXT,
  text_field_12 TEXT,
  text_field_13 TEXT,
  text_field_14 TEXT,
  text_field_15 TEXT,
  text_field_16 TEXT,
  text_field_17 TEXT,
  text_field_18 TEXT,
  text_field_19 TEXT,
  text_field_20 TEXT,
  text_field_21 TEXT,
  text_field_22 TEXT,
  text_field_23 TEXT,
  text_field_24 TEXT,
  text_field_25 TEXT,
  text_field_26 TEXT,
  text_field_27 TEXT,
  text_field_28 TEXT,
  text_field_29 TEXT,
  text_field_30 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  int_field_11 INT,
  int_field_12 INT,
  int_field_13 INT,
  int_field_14 INT,
  int_field_15 INT,
  int_field_16 INT,
  int_field_17 INT,
  int_field_18 INT,
  int_field_19 INT,
  int_field_20 INT,
  int_field_21 INT,
  int_field_22 INT,
  int_field_23 INT,
  int_field_24 INT,
  int_field_25 INT,
  int_field_26 INT,
  int_field_27 INT,
  int_field_28 INT,
  int_field_29 INT,
  int_field_30 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  json_bucket_6 JSONB,
  json_bucket_7 JSONB,
  json_bucket_8 JSONB,
  json_bucket_9 JSONB,
  json_bucket_10 JSONB,
  json_bucket_11 JSONB,
  json_bucket_12 JSONB,
  json_bucket_13 JSONB,
  json_bucket_14 JSONB,
  json_bucket_15 JSONB,
  extra JSONB
);

CREATE INDEX idx_super_items_user_id ON super_items(user_id);
CREATE INDEX idx_super_items_session_id ON super_items(session_id);
CREATE INDEX idx_super_items_status ON super_items(status);
CREATE INDEX idx_super_items_phrase ON super_items(phrase);
CREATE INDEX idx_super_items_overall_score ON super_items(overall_score);
CREATE INDEX idx_super_items_created_at ON super_items(created_at);


-- ============================================================
-- TABLE: saved_titles
-- Page 4 titles. PERMANENT - survives session deletion.
-- ============================================================
CREATE TABLE saved_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- References (nullable, no cascade from session)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  super_item_id UUID REFERENCES super_items(id) ON DELETE SET NULL,
  
  -- Core title data
  title_text TEXT NOT NULL,
  original_title TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- ============================================================
  -- SCORING
  -- ============================================================
  click_score INT,
  click_reason TEXT,
  
  fit_score INT,
  fit_reason TEXT,
  
  clarity_score INT,
  clarity_reason TEXT,
  
  curiosity_score INT,
  curiosity_reason TEXT,
  
  urgency_score INT,
  urgency_reason TEXT,
  
  promise_score INT,
  promise_reason TEXT,
  
  overall_score INT,
  overall_reason TEXT,
  
  score_a INT,
  score_a_reason TEXT,
  score_b INT,
  score_b_reason TEXT,
  score_c INT,
  score_c_reason TEXT,
  
  -- ============================================================
  -- EMOTIONAL AND TONE
  -- ============================================================
  tone TEXT,
  emotional_triggers JSONB,
  click_triggers JSONB,
  
  -- Notes
  notes TEXT,
  feedback TEXT,
  
  -- Performance placeholders
  actual_ctr NUMERIC(5,2),
  actual_impressions INT,
  actual_clicks INT,
  
  -- ============================================================
  -- FLEX FIELDS - 20 text, 20 int, 10 json
  -- ============================================================
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  text_field_11 TEXT,
  text_field_12 TEXT,
  text_field_13 TEXT,
  text_field_14 TEXT,
  text_field_15 TEXT,
  text_field_16 TEXT,
  text_field_17 TEXT,
  text_field_18 TEXT,
  text_field_19 TEXT,
  text_field_20 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  int_field_11 INT,
  int_field_12 INT,
  int_field_13 INT,
  int_field_14 INT,
  int_field_15 INT,
  int_field_16 INT,
  int_field_17 INT,
  int_field_18 INT,
  int_field_19 INT,
  int_field_20 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  json_bucket_6 JSONB,
  json_bucket_7 JSONB,
  json_bucket_8 JSONB,
  json_bucket_9 JSONB,
  json_bucket_10 JSONB,
  extra JSONB
);

CREATE INDEX idx_saved_titles_user_id ON saved_titles(user_id);
CREATE INDEX idx_saved_titles_session_id ON saved_titles(session_id);
CREATE INDEX idx_saved_titles_super_item_id ON saved_titles(super_item_id);
CREATE INDEX idx_saved_titles_status ON saved_titles(status);


-- ============================================================
-- TABLE: saved_packages
-- Page 5-6 video packages. PERMANENT - survives session deletion.
-- ============================================================
CREATE TABLE saved_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- References (nullable, no cascade from session)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  super_item_id UUID REFERENCES super_items(id) ON DELETE SET NULL,
  title_id UUID REFERENCES saved_titles(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'active',
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- ============================================================
  -- THUMBNAIL
  -- ============================================================
  thumbnail_layout_type TEXT,
  thumbnail_text TEXT,
  thumbnail_subject TEXT,
  thumbnail_color_vibe TEXT,
  thumbnail_style TEXT,
  thumbnail_emotion TEXT,
  thumbnail_do_list TEXT,
  thumbnail_dont_list TEXT,
  thumbnail_notes TEXT,
  thumbnail_reference_urls TEXT[],
  
  -- ============================================================
  -- HOOK AND ANGLE
  -- ============================================================
  hook TEXT,
  hook_type TEXT,
  hook_notes TEXT,
  angle TEXT,
  angle_notes TEXT,
  opening_line TEXT,
  
  -- ============================================================
  -- OUTLINE AND STRUCTURE
  -- ============================================================
  outline TEXT,
  outline_sections JSONB,
  key_points TEXT[],
  cta_primary TEXT,
  cta_secondary TEXT,
  
  -- ============================================================
  -- DESCRIPTION
  -- ============================================================
  description_draft TEXT,
  description_notes TEXT,
  description_keywords TEXT[],
  
  -- ============================================================
  -- UPLOAD PLANNING
  -- ============================================================
  target_publish_date DATE,
  target_publish_time TIME,
  visibility TEXT, -- public, unlisted, private
  playlist_ids TEXT[],
  tags_array TEXT[],
  category TEXT,
  language TEXT,
  
  -- ============================================================
  -- PERFORMANCE PLACEHOLDERS
  -- ============================================================
  actual_views INT,
  actual_likes INT,
  actual_comments INT,
  actual_ctr NUMERIC(5,2),
  actual_avg_view_duration INT,
  actual_retention_curve JSONB,
  
  -- ============================================================
  -- NOTES
  -- ============================================================
  notes TEXT,
  feedback TEXT,
  revision_notes TEXT,
  
  -- ============================================================
  -- FLEX FIELDS - 20 text, 20 int, 10 json
  -- ============================================================
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  text_field_11 TEXT,
  text_field_12 TEXT,
  text_field_13 TEXT,
  text_field_14 TEXT,
  text_field_15 TEXT,
  text_field_16 TEXT,
  text_field_17 TEXT,
  text_field_18 TEXT,
  text_field_19 TEXT,
  text_field_20 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  int_field_11 INT,
  int_field_12 INT,
  int_field_13 INT,
  int_field_14 INT,
  int_field_15 INT,
  int_field_16 INT,
  int_field_17 INT,
  int_field_18 INT,
  int_field_19 INT,
  int_field_20 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  json_bucket_6 JSONB,
  json_bucket_7 JSONB,
  json_bucket_8 JSONB,
  json_bucket_9 JSONB,
  json_bucket_10 JSONB,
  extra JSONB
);

CREATE INDEX idx_saved_packages_user_id ON saved_packages(user_id);
CREATE INDEX idx_saved_packages_session_id ON saved_packages(session_id);
CREATE INDEX idx_saved_packages_super_item_id ON saved_packages(super_item_id);
CREATE INDEX idx_saved_packages_status ON saved_packages(status);


-- ============================================================
-- TABLE: channel_profiles
-- User YouTube channels. PERMANENT.
-- ============================================================
CREATE TABLE channel_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Channel data
  channel_id TEXT,
  channel_url TEXT,
  channel_name TEXT,
  channel_handle TEXT,
  
  -- Channel metadata
  niche TEXT,
  sub_niche TEXT,
  audience_description TEXT,
  goals TEXT,
  
  -- Stats placeholders
  subscriber_count INT,
  video_count INT,
  view_count BIGINT,
  
  -- Flags
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_synced_at TIMESTAMPTZ,
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  extra JSONB
);

CREATE INDEX idx_channel_profiles_user_id ON channel_profiles(user_id);
CREATE INDEX idx_channel_profiles_channel_id ON channel_profiles(channel_id);


-- ============================================================
-- TABLE: audience_insights_reports
-- Cached audience analysis. PERMANENT.
-- ============================================================
CREATE TABLE audience_insights_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- References (nullable)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  channel_profile_id UUID REFERENCES channel_profiles(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT DEFAULT 'active',
  report_type TEXT, -- full, quick, custom
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  generated_at TIMESTAMPTZ,
  
  -- ============================================================
  -- SUMMARIES
  -- ============================================================
  anchors_summary TEXT,
  anchors_list JSONB,
  
  modifiers_summary TEXT,
  modifiers_list JSONB,
  
  rare_words_summary TEXT,
  rare_words_list JSONB,
  
  -- ============================================================
  -- DISTRIBUTIONS
  -- ============================================================
  funnel_distribution JSONB,
  tone_distribution JSONB,
  intent_distribution JSONB,
  difficulty_distribution JSONB,
  
  -- ============================================================
  -- TIME AND TRENDS
  -- ============================================================
  time_sensitivity JSONB,
  trend_analysis JSONB,
  seasonality_notes TEXT,
  
  -- ============================================================
  -- NARRATIVES
  -- ============================================================
  narrative_main TEXT,
  narrative_summary TEXT,
  key_insights TEXT,
  
  -- ============================================================
  -- SUGGESTIONS
  -- ============================================================
  suggested_video_angles JSONB,
  suggested_series_ideas JSONB,
  suggested_next_steps TEXT,
  
  -- ============================================================
  -- METRICS
  -- ============================================================
  total_phrases_analyzed INT,
  avg_overall_score INT,
  top_phrases JSONB,
  
  -- ============================================================
  -- FLEX FIELDS - 20 text, 20 int, 10 json
  -- ============================================================
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  text_field_11 TEXT,
  text_field_12 TEXT,
  text_field_13 TEXT,
  text_field_14 TEXT,
  text_field_15 TEXT,
  text_field_16 TEXT,
  text_field_17 TEXT,
  text_field_18 TEXT,
  text_field_19 TEXT,
  text_field_20 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  int_field_11 INT,
  int_field_12 INT,
  int_field_13 INT,
  int_field_14 INT,
  int_field_15 INT,
  int_field_16 INT,
  int_field_17 INT,
  int_field_18 INT,
  int_field_19 INT,
  int_field_20 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  json_bucket_6 JSONB,
  json_bucket_7 JSONB,
  json_bucket_8 JSONB,
  json_bucket_9 JSONB,
  json_bucket_10 JSONB,
  extra JSONB
);

CREATE INDEX idx_audience_insights_reports_user_id ON audience_insights_reports(user_id);
CREATE INDEX idx_audience_insights_reports_session_id ON audience_insights_reports(session_id);


-- ============================================================
-- TABLE: library_items
-- Generic library linking. PERMANENT.
-- ============================================================
CREATE TABLE library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Item reference
  item_type TEXT NOT NULL, -- super, title, package, report, phrase
  item_id UUID NOT NULL,
  
  -- Organization
  tags TEXT[],
  categories TEXT[],
  folder TEXT,
  notes TEXT,
  
  -- Flags
  is_favorite BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  extra JSONB
);

CREATE INDEX idx_library_items_user_id ON library_items(user_id);
CREATE INDEX idx_library_items_item_type ON library_items(item_type);
CREATE INDEX idx_library_items_item_id ON library_items(item_id);
CREATE INDEX idx_library_items_is_favorite ON library_items(is_favorite);


-- ============================================================
-- TABLE: scoring_runs
-- Track scoring batch runs. PERMANENT.
-- ============================================================
CREATE TABLE scoring_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- References (nullable)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  
  -- Run metadata
  target_table TEXT NOT NULL, -- seed_phrases, super_items, saved_titles
  run_type TEXT NOT NULL, -- intent, clickability, audience_fit, composite, full
  
  -- Model info
  model_name TEXT,
  model_version TEXT,
  prompt_version TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  error_message TEXT,
  
  -- Counts
  input_count INT,
  output_count INT,
  success_count INT,
  error_count INT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Meta
  meta JSONB,
  config JSONB,
  results_summary JSONB,
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  extra JSONB
);

CREATE INDEX idx_scoring_runs_user_id ON scoring_runs(user_id);
CREATE INDEX idx_scoring_runs_session_id ON scoring_runs(session_id);
CREATE INDEX idx_scoring_runs_status ON scoring_runs(status);
CREATE INDEX idx_scoring_runs_run_type ON scoring_runs(run_type);


-- ============================================================
-- TABLE: video_publish_plans
-- Upload planning. PERMANENT.
-- ============================================================
CREATE TABLE video_publish_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- References (nullable)
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  super_item_id UUID REFERENCES super_items(id) ON DELETE SET NULL,
  saved_title_id UUID REFERENCES saved_titles(id) ON DELETE SET NULL,
  saved_package_id UUID REFERENCES saved_packages(id) ON DELETE SET NULL,
  channel_profile_id UUID REFERENCES channel_profiles(id) ON DELETE SET NULL,
  
  -- Platform
  platform TEXT DEFAULT 'youtube',
  
  -- Core fields
  title TEXT,
  description TEXT,
  tags_array TEXT[],
  
  -- Scheduling
  visibility TEXT DEFAULT 'private', -- public, unlisted, private, scheduled
  schedule_time TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- YouTube specific
  playlist_ids TEXT[],
  category_id TEXT,
  language TEXT,
  default_language TEXT,
  
  -- Engagement
  pinned_comment_template TEXT,
  end_screen_template TEXT,
  cards_config JSONB,
  
  -- Experiment
  experiment_group TEXT,
  variation_name TEXT,
  ab_test_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, scheduled, published, archived
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Performance placeholders
  actual_views INT,
  actual_likes INT,
  actual_comments INT,
  actual_shares INT,
  actual_ctr NUMERIC(5,2),
  actual_avg_view_duration INT,
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  text_field_6 TEXT,
  text_field_7 TEXT,
  text_field_8 TEXT,
  text_field_9 TEXT,
  text_field_10 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  int_field_6 INT,
  int_field_7 INT,
  int_field_8 INT,
  int_field_9 INT,
  int_field_10 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  json_bucket_4 JSONB,
  json_bucket_5 JSONB,
  extra JSONB
);

CREATE INDEX idx_video_publish_plans_user_id ON video_publish_plans(user_id);
CREATE INDEX idx_video_publish_plans_session_id ON video_publish_plans(session_id);
CREATE INDEX idx_video_publish_plans_status ON video_publish_plans(status);


-- ============================================================
-- TABLE: user_settings
-- User preferences. PERMANENT.
-- ============================================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Defaults
  default_channel_id UUID REFERENCES channel_profiles(id) ON DELETE SET NULL,
  
  -- Scoring weights
  default_weights JSONB,
  
  -- Feature flags
  feature_flags JSONB,
  
  -- UI preferences
  preferences JSONB,
  theme TEXT DEFAULT 'dark',
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INT DEFAULT 0,
  onboarding_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Flex fields
  text_field_1 TEXT,
  text_field_2 TEXT,
  text_field_3 TEXT,
  text_field_4 TEXT,
  text_field_5 TEXT,
  
  int_field_1 INT,
  int_field_2 INT,
  int_field_3 INT,
  int_field_4 INT,
  int_field_5 INT,
  
  json_bucket_1 JSONB,
  json_bucket_2 JSONB,
  json_bucket_3 JSONB,
  extra JSONB
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);


-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE refine_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_ui_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_insights_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_publish_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS POLICIES - User owns their data
-- ============================================================

-- Sessions
CREATE POLICY sessions_user_policy ON sessions
  FOR ALL USING (user_id = auth.uid());

-- Seed phrases
CREATE POLICY seed_phrases_user_policy ON seed_phrases
  FOR ALL USING (user_id = auth.uid());

-- Refine selections (via session)
CREATE POLICY refine_selections_policy ON refine_selections
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- Imported items
CREATE POLICY imported_items_user_policy ON imported_items
  FOR ALL USING (user_id = auth.uid());

-- Session UI state (via session)
CREATE POLICY session_ui_state_policy ON session_ui_state
  FOR ALL USING (
    session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())
  );

-- Super items
CREATE POLICY super_items_user_policy ON super_items
  FOR ALL USING (user_id = auth.uid());

-- Saved titles
CREATE POLICY saved_titles_user_policy ON saved_titles
  FOR ALL USING (user_id = auth.uid());

-- Saved packages
CREATE POLICY saved_packages_user_policy ON saved_packages
  FOR ALL USING (user_id = auth.uid());

-- Channel profiles
CREATE POLICY channel_profiles_user_policy ON channel_profiles
  FOR ALL USING (user_id = auth.uid());

-- Audience insights reports
CREATE POLICY audience_insights_reports_user_policy ON audience_insights_reports
  FOR ALL USING (user_id = auth.uid());

-- Library items
CREATE POLICY library_items_user_policy ON library_items
  FOR ALL USING (user_id = auth.uid());

-- Scoring runs
CREATE POLICY scoring_runs_user_policy ON scoring_runs
  FOR ALL USING (user_id = auth.uid());

-- Video publish plans
CREATE POLICY video_publish_plans_user_policy ON video_publish_plans
  FOR ALL USING (user_id = auth.uid());

-- User settings
CREATE POLICY user_settings_user_policy ON user_settings
  FOR ALL USING (user_id = auth.uid());


-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seed_phrases_updated_at BEFORE UPDATE ON seed_phrases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refine_selections_updated_at BEFORE UPDATE ON refine_selections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_imported_items_updated_at BEFORE UPDATE ON imported_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_ui_state_updated_at BEFORE UPDATE ON session_ui_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_super_items_updated_at BEFORE UPDATE ON super_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_titles_updated_at BEFORE UPDATE ON saved_titles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_packages_updated_at BEFORE UPDATE ON saved_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_profiles_updated_at BEFORE UPDATE ON channel_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audience_insights_reports_updated_at BEFORE UPDATE ON audience_insights_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_items_updated_at BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scoring_runs_updated_at BEFORE UPDATE ON scoring_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_publish_plans_updated_at BEFORE UPDATE ON video_publish_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TYPESCRIPT TYPES (for reference)
-- ============================================================
/*

// Core Types

export interface Session {
  id: string;
  user_id: string;
  name: string;
  seed_phrase: string | null;
  current_step: number;
  source_module: string;
  status: string;
  last_activity_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  total_phrases_generated: number | null;
  total_phrases_refined: number | null;
  total_super_items: number | null;
  total_titles_saved: number | null;
  total_packages_saved: number | null;
  extra: Record<string, any> | null;
}

export interface SeedPhrase {
  id: string;
  user_id: string;
  session_id: string;
  phrase: string;
  seed_phrase_id: string | null;
  parent_phrase_id: string | null;
  builder_source_tag: string | null;
  origin_source_module: string | null;
  hierarchy_path: string | null;
  hierarchy_depth: number | null;
  funnel_stage: string | null;
  tone_tag: string | null;
  is_selected: boolean;
  is_favorite: boolean;
  is_finalist: boolean;
  topic_strength_score: number | null;
  topic_strength_reason: string | null;
  popularity_score: number | null;
  popularity_reason: string | null;
  competition_score: number | null;
  competition_reason: string | null;
  audience_fit_score: number | null;
  audience_fit_reason: string | null;
  intent_score: number | null;
  intent_reason: string | null;
  click_intensity_score: number | null;
  click_intensity_reason: string | null;
  overall_score: number | null;
  emotional_triggers: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  extra: Record<string, any> | null;
}

export interface SuperItem {
  id: string;
  user_id: string;
  session_id: string | null;
  phrase: string;
  status: string;
  intent_tag: string | null;
  viewer_stage_tag: string | null;
  topic_strength_score: number | null;
  popularity_score: number | null;
  competition_score: number | null;
  audience_fit_score: number | null;
  click_intensity_score: number | null;
  growth_fit_score: number | null;
  creator_fit_score: number | null;
  binge_score: number | null;
  subscribe_score: number | null;
  overall_score: number | null;
  emotional_triggers: Record<string, any> | null;
  summary_paragraph: string | null;
  created_at: string;
  updated_at: string;
  extra: Record<string, any> | null;
}

export interface SavedTitle {
  id: string;
  user_id: string;
  session_id: string | null;
  super_item_id: string | null;
  title_text: string;
  status: string;
  click_score: number | null;
  fit_score: number | null;
  overall_score: number | null;
  tone: string | null;
  emotional_triggers: Record<string, any> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  extra: Record<string, any> | null;
}

export interface SavedPackage {
  id: string;
  user_id: string;
  session_id: string | null;
  super_item_id: string | null;
  title_id: string | null;
  status: string;
  thumbnail_layout_type: string | null;
  thumbnail_text: string | null;
  thumbnail_subject: string | null;
  hook: string | null;
  angle: string | null;
  outline: string | null;
  description_draft: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  extra: Record<string, any> | null;
}

export interface AudienceInsightsReport {
  id: string;
  user_id: string;
  session_id: string | null;
  channel_profile_id: string | null;
  status: string;
  anchors_summary: string | null;
  modifiers_summary: string | null;
  funnel_distribution: Record<string, any> | null;
  tone_distribution: Record<string, any> | null;
  narrative_main: string | null;
  suggested_video_angles: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  extra: Record<string, any> | null;
}

*/
