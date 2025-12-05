// Database types - matches Drizzle schema in src/server/db/schema.ts
// Run `npx drizzle-kit push` after schema changes

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================
// HIERARCHY: User Account → Channels → Sessions → Super Topics
// ============================================================

// ============================================================
// USER PROFILES
// ============================================================
export type DisplayMode = 'essentials' | 'full';

export interface UserProfile {
  id: string;
  user_id: string;
  account_tier: 'basic' | 'plus' | 'pro' | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  display_mode: DisplayMode | null;
  preferences: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserProfileInsert {
  id?: string;
  user_id: string;
  account_tier?: 'basic' | 'plus' | 'pro';
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  preferences?: Json | null;
}

export interface UserProfileUpdate {
  account_tier?: 'basic' | 'plus' | 'pro';
  display_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  preferences?: Json | null;
  updated_at?: string;
}

// Account tier channel limits
export const CHANNEL_LIMITS = {
  basic: 1,
  plus: 3,
  pro: 10,
} as const;

// ============================================================
// CHANNELS
// ============================================================
export interface Channel {
  id: string;
  user_id: string;
  name: string;
  youtube_channel_id: string | null;
  thumbnail_url: string | null;
  niche: string | null;
  target_audience: string | null;
  channel_description: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  is_active: boolean | null;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChannelInsert {
  id?: string;
  user_id: string;
  name: string;
  youtube_channel_id?: string | null;
  thumbnail_url?: string | null;
  niche?: string | null;
  target_audience?: string | null;
  channel_description?: string | null;
  subscriber_count?: number | null;
  video_count?: number | null;
  is_active?: boolean;
  is_default?: boolean;
}

export interface ChannelUpdate {
  name?: string;
  youtube_channel_id?: string | null;
  thumbnail_url?: string | null;
  niche?: string | null;
  target_audience?: string | null;
  channel_description?: string | null;
  subscriber_count?: number | null;
  video_count?: number | null;
  is_active?: boolean;
  is_default?: boolean;
  updated_at?: string;
}

// ============================================================
// SESSIONS
// ============================================================
export interface Session {
  id: string;
  user_id: string;
  channel_id: string;
  name: string;
  seed_phrase: string | null;
  current_step: number | null;
  status: 'active' | 'completed' | 'archived' | 'deleted' | null;
  total_phrases_generated: number | null;
  total_super_topics: number | null;
  intake_stats: Json | null;
  created_at: string | null;
  updated_at: string | null;
  completed_at: string | null;
  deleted_at: string | null;
}

export interface SessionInsert {
  id?: string;
  user_id: string;
  channel_id?: string | null; // Optional during migration - will be required once channels UI is built
  name: string;
  seed_phrase?: string | null;
  current_step?: number;
  status?: 'active' | 'completed' | 'archived' | 'deleted';
  total_phrases_generated?: number | null;
  total_super_topics?: number | null;
  intake_stats?: Json | null;
}

export interface SessionUpdate {
  name?: string;
  seed_phrase?: string | null;
  current_step?: number;
  status?: 'active' | 'completed' | 'archived' | 'deleted';
  total_phrases_generated?: number | null;
  total_super_topics?: number | null;
  intake_stats?: Json | null;
  updated_at?: string;
  completed_at?: string | null;
  deleted_at?: string | null;
}

// ============================================================
// SEEDS
// ============================================================
export interface Seed {
  id: string;
  session_id: string;
  phrase: string;
  generation_method: string | null; // top10, child, a2z, prefix
  parent_seed_id: string | null;
  position: number | null;
  is_selected: boolean | null;
  is_finalist: boolean | null;
  created_at: string | null;
}

export interface SeedInsert {
  id?: string;
  session_id: string;
  phrase: string;
  generation_method?: string | null;
  parent_seed_id?: string | null;
  position?: number | null;
  is_selected?: boolean;
  is_finalist?: boolean;
}

export interface SeedUpdate {
  phrase?: string;
  generation_method?: string | null;
  parent_seed_id?: string | null;
  position?: number | null;
  is_selected?: boolean;
  is_finalist?: boolean;
}

// ============================================================
// SEED ANALYSIS
// ============================================================
export interface SeedAnalysis {
  id: string;
  seed_id: string;
  
  // Scores
  topic_strength: number | null;
  audience_fit: number | null;
  demand: number | null; // Autocomplete-based demand score (0-99)
  demand_base: number | null; // Before session size multiplier
  opportunity: number | null; // Opportunity score (0-99) - to be implemented
  overall_score: number | null;
  
  // LTV (Long-Term Views) - measures Top 10 alignment
  // Hidden on Page 2, boosts Demand, badge on Page 3 for score >= 50
  ltv_score: number | null;
  ltv_strategy: 'FULL_TOP10' | 'FULL_ANCHOR' | 'BIGRAM' | 'SINGLE' | null;
  ltv_match: string | null;
  ltv_boost: number | null; // +0, +3, +5, +8, or +10
  
  // Emotions & Intent
  primary_emotion: string | null;
  secondary_emotion: string | null;
  viewer_intent: string | null;
  
  // Modifiers
  modifier_type: string | null;
  is_rare_modifier: boolean | null;
  
  // Reasons
  topic_strength_reason: string | null;
  audience_fit_reason: string | null;
  demand_reason: string | null;
  opportunity_reason: string | null;
  overall_reason: string | null;
  primary_emotion_reason: string | null;
  viewer_intent_reason: string | null;
  
  // Planning
  video_angle_ideas: Json | null;
  bullet_points: Json | null;
  extra: Json | null;
  
  created_at: string | null;
}

export interface SeedAnalysisInsert {
  id?: string;
  seed_id: string;
  topic_strength?: number | null;
  audience_fit?: number | null;
  demand?: number | null;
  demand_base?: number | null;
  opportunity?: number | null;
  overall_score?: number | null;
  ltv_score?: number | null;
  ltv_strategy?: 'FULL_TOP10' | 'FULL_ANCHOR' | 'BIGRAM' | 'SINGLE' | null;
  ltv_match?: string | null;
  ltv_boost?: number | null;
  primary_emotion?: string | null;
  secondary_emotion?: string | null;
  viewer_intent?: string | null;
  modifier_type?: string | null;
  is_rare_modifier?: boolean;
  topic_strength_reason?: string | null;
  audience_fit_reason?: string | null;
  demand_reason?: string | null;
  opportunity_reason?: string | null;
  overall_reason?: string | null;
  primary_emotion_reason?: string | null;
  viewer_intent_reason?: string | null;
  video_angle_ideas?: Json | null;
  bullet_points?: Json | null;
  extra?: Json | null;
}

export interface SeedAnalysisUpdate {
  topic_strength?: number | null;
  audience_fit?: number | null;
  demand?: number | null;
  demand_base?: number | null;
  opportunity?: number | null;
  overall_score?: number | null;
  ltv_score?: number | null;
  ltv_strategy?: 'FULL_TOP10' | 'FULL_ANCHOR' | 'BIGRAM' | 'SINGLE' | null;
  ltv_match?: string | null;
  ltv_boost?: number | null;
  primary_emotion?: string | null;
  secondary_emotion?: string | null;
  viewer_intent?: string | null;
  modifier_type?: string | null;
  is_rare_modifier?: boolean;
  topic_strength_reason?: string | null;
  audience_fit_reason?: string | null;
  demand_reason?: string | null;
  opportunity_reason?: string | null;
  overall_reason?: string | null;
  primary_emotion_reason?: string | null;
  viewer_intent_reason?: string | null;
  video_angle_ideas?: Json | null;
  bullet_points?: Json | null;
  extra?: Json | null;
}

// ============================================================
// SUPER TOPICS - Permanent storage, survives session deletion
// ============================================================
export interface SuperTopic {
  id: string;
  channel_id: string;
  user_id: string;
  
  // Origin tracking (preserved after session deletion)
  source_session_id: string | null;
  source_session_name: string | null;
  source_seed_phrase: string | null;
  source_seed_id: string | null;
  
  // The phrase
  phrase: string;
  
  // Scores at time of promotion
  topic_strength: number | null;
  audience_fit: number | null;
  search_volume: number | null;
  demand: number | null;
  demand_base: number | null; // Before LTV boost
  opportunity: number | null;
  overall_score: number | null;
  
  // LTV preserved for Page 3 badge display
  ltv_score: number | null;
  ltv_strategy: 'FULL_TOP10' | 'FULL_ANCHOR' | 'BIGRAM' | 'SINGLE' | null;
  ltv_match: string | null;
  
  // P&C breakdown
  pc_breakdown: Json | null;
  
  // Analysis
  primary_emotion: string | null;
  secondary_emotion: string | null;
  viewer_intent: string | null;
  modifier_type: string | null;
  
  // Reasons
  topic_strength_reason: string | null;
  audience_fit_reason: string | null;
  
  // User additions
  notes: string | null;
  tags: Json | null;
  
  // Usage tracking
  status: 'active' | 'used' | 'archived' | null;
  used_in_video_id: string | null;
  used_at: string | null;
  
  // Timestamps
  created_at: string | null;
  promoted_at: string | null;
}

export interface SuperTopicInsert {
  id?: string;
  channel_id: string;
  user_id: string;
  source_session_id?: string | null;
  source_session_name?: string | null;
  source_seed_phrase?: string | null;
  source_seed_id?: string | null;
  phrase: string;
  topic_strength?: number | null;
  audience_fit?: number | null;
  search_volume?: number | null;
  demand?: number | null;
  demand_base?: number | null;
  opportunity?: number | null;
  overall_score?: number | null;
  ltv_score?: number | null;
  ltv_strategy?: 'FULL_TOP10' | 'FULL_ANCHOR' | 'BIGRAM' | 'SINGLE' | null;
  ltv_match?: string | null;
  pc_breakdown?: Json | null;
  primary_emotion?: string | null;
  secondary_emotion?: string | null;
  viewer_intent?: string | null;
  modifier_type?: string | null;
  topic_strength_reason?: string | null;
  audience_fit_reason?: string | null;
  notes?: string | null;
  tags?: Json | null;
  status?: 'active' | 'used' | 'archived';
}

export interface SuperTopicUpdate {
  notes?: string | null;
  tags?: Json | null;
  status?: 'active' | 'used' | 'archived';
  used_in_video_id?: string | null;
  used_at?: string | null;
}

// ============================================================
// INTAKE STATS - Shape of the intake_stats JSONB field
// ============================================================
export interface IntakeStats {
  // Raw frequency maps
  wordFrequency: Record<string, number>;
  bigramFrequency: Record<string, number>;
  trigramFrequency: Record<string, number>;
  
  // Seed-relative patterns
  seedPlus1: Record<string, number>;
  seedPlus2: Record<string, number>;
  prefixes: Record<string, number>;
  suffixes: Record<string, number>;
  
  // Precomputed percentiles for fast P&C scoring
  seedPlus1Percentiles: Record<string, number>;
  seedPlus2Percentiles: Record<string, number>;
  prefixPercentiles: Record<string, number>;
  suffixPercentiles: Record<string, number>;
  
  // TOP 9 DEMAND SCORING
  // Position-weighted demand signals from Top 9 topic results
  // Now includes session-wide frequency analysis
  top9Demand?: {
    // The Top 9 phrases in position order (index 0 = position 1)
    phrases: string[];
    // Position weights: [1.00, 0.60, 0.50, 0.40, 0.35, 0.32, 0.28, 0.25, 0.22]
    positionWeights: number[];
    // Anchor words that appear multiple times in Top 9, with their bonus
    // e.g., { "2025": 6, "explained": 3 } (count * 3 = bonus points)
    anchorBonuses: Record<string, number>;
    // Pre-calculated demand scores for each phrase in the session
    // Key is normalized phrase, value is 0-100 demand score
    phraseScores: Record<string, number>;
    // Session-wide bigram percentiles (excluding seed-only bigrams)
    bigramPercentiles: Record<string, number>;
    // Session-wide word percentiles (excluding seed words and fillers)
    wordPercentiles: Record<string, number>;
    // Two-word starter frequency: "how to" -> 22
    twoWordStarters: Record<string, number>;
    // Single-word starter frequency: "how" -> 38
    oneWordStarters: Record<string, number>;
    // Max frequencies for scaling
    maxTwoWordFreq: number;
    maxOneWordFreq: number;
  };
  
  // Metadata
  seedPhrase: string;  // The original seed phrase (for anchor exclusion)
  totalPhrases: number;
  uniqueWords: number;
  processedAt: string;
}

// ============================================================
// P&C BREAKDOWN - Shape of pc_breakdown JSONB field
// ============================================================
export interface PCBreakdown {
  prefixScore: number;
  seedPlus1Score: number;
  seedPlus2Score: number;
  suffixScore: number;
  demandFormula: string; // e.g., "20*45 + 30*72 + 30*68 + 20*55 = 62"
  opportunityFormula: string;
}

// ============================================================
// LTV TYPES - Long-Term Views scoring
// ============================================================

/**
 * LTV Anchor types extracted from Top 10 phrases
 * Used to calculate LTV scores for other phrases
 */
export interface LTVAnchors {
  singleAnchors: Map<string, number>; // word -> frequency in Top 10
  bigramAnchors: Map<string, number>; // "word word" -> frequency
  fullAnchors: Map<string, string>;   // anchor text -> source Top 10 phrase
  top10Phrases: string[];             // Original Top 10 phrases
  seedWords: Set<string>;             // Words from the seed phrase
}

/**
 * Result of LTV calculation for a single phrase
 */
export interface LTVResult {
  score: number;                      // 0-100
  strategy: 'FULL_TOP10' | 'FULL_ANCHOR' | 'BIGRAM' | 'SINGLE' | null;
  match: string | null;               // The text that matched
}

/**
 * LTV score tiers and their Demand boosts
 * | LTV Score | Demand Boost |
 * |-----------|------------------|
 * | 0-19      | +0               |
 * | 20-29     | +3               |
 * | 30-39     | +5               |
 * | 40-49     | +8               |
 * | 50+       | +10              |
 */
export type LTVBoostTier = 0 | 3 | 5 | 8 | 10;

/**
 * Badge eligibility threshold
 * Phrases with LTV >= 50 get the "🌱 Long-Term Views" badge on Page 3
 */
export const LTV_BADGE_THRESHOLD = 50;
