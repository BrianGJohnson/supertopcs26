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
// SESSIONS
// ============================================================
export interface Session {
  id: string;
  user_id: string;
  channel_id: string | null;
  name: string;
  seed_phrase: string | null;
  current_step: number | null;
  status: string | null;
  intake_stats: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SessionInsert {
  id?: string;
  user_id: string;
  channel_id?: string | null;
  name: string;
  seed_phrase?: string | null;
  current_step?: number;
  status?: string;
  intake_stats?: Json | null;
}

export interface SessionUpdate {
  channel_id?: string | null;
  name?: string;
  seed_phrase?: string | null;
  current_step?: number;
  status?: string;
  intake_stats?: Json | null;
  updated_at?: string;
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
  popularity: number | null;
  competition: number | null;
  overall_score: number | null;
  
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
  popularity_reason: string | null;
  competition_reason: string | null;
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
  popularity?: number | null;
  competition?: number | null;
  overall_score?: number | null;
  primary_emotion?: string | null;
  secondary_emotion?: string | null;
  viewer_intent?: string | null;
  modifier_type?: string | null;
  is_rare_modifier?: boolean;
  topic_strength_reason?: string | null;
  audience_fit_reason?: string | null;
  popularity_reason?: string | null;
  competition_reason?: string | null;
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
  popularity?: number | null;
  competition?: number | null;
  overall_score?: number | null;
  primary_emotion?: string | null;
  secondary_emotion?: string | null;
  viewer_intent?: string | null;
  modifier_type?: string | null;
  is_rare_modifier?: boolean;
  topic_strength_reason?: string | null;
  audience_fit_reason?: string | null;
  popularity_reason?: string | null;
  competition_reason?: string | null;
  overall_reason?: string | null;
  primary_emotion_reason?: string | null;
  viewer_intent_reason?: string | null;
  video_angle_ideas?: Json | null;
  bullet_points?: Json | null;
  extra?: Json | null;
}
