import { pgTable, text, timestamp, integer, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';

// ============================================================
// SUPER TOPICS DATABASE SCHEMA
// Managed by Drizzle - DO NOT edit tables directly in Supabase
// To add columns: edit this file, then run: npx drizzle-kit push
// ============================================================

// ------------------------------------------------------------
// SESSIONS - Research workspaces built around a seed phrase
// ------------------------------------------------------------
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  channel_id: uuid('channel_id'), // nullable until channels feature built
  
  // Core
  name: text('name').notNull(),
  seed_phrase: text('seed_phrase'), // The 2-word starter phrase
  current_step: integer('current_step').default(1),
  status: text('status').default('active'), // active, archived
  
  // Data intake stats (modifiers, anchors, rare words)
  intake_stats: jsonb('intake_stats'),
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ------------------------------------------------------------
// SEEDS - All generated phrases from a session
// Generation methods: top10, child, a2z, prefix
// ------------------------------------------------------------
export const seeds = pgTable('seeds', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  
  // The phrase itself
  phrase: text('phrase').notNull(),
  
  // How it was generated
  generation_method: text('generation_method'), // top10, child, a2z, prefix
  parent_seed_id: uuid('parent_seed_id'), // For child phrases
  position: integer('position'), // Order in results (1-10 for top10)
  
  // User selection state
  is_selected: boolean('is_selected').default(false),
  is_finalist: boolean('is_finalist').default(false),
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(),
});

// ------------------------------------------------------------
// SEED_ANALYSIS - Scoring and analysis per seed
// All the 50+ data points live here
// ------------------------------------------------------------
export const seed_analysis = pgTable('seed_analysis', {
  id: uuid('id').primaryKey().defaultRandom(),
  seed_id: uuid('seed_id').notNull().references(() => seeds.id, { onDelete: 'cascade' }),
  
  // Core scores (0-100)
  topic_strength: integer('topic_strength'),
  audience_fit: integer('audience_fit'),
  popularity: integer('popularity'),
  competition: integer('competition'),
  overall_score: integer('overall_score'),
  
  // Emotions
  primary_emotion: text('primary_emotion'),
  secondary_emotion: text('secondary_emotion'),
  
  // Intent
  viewer_intent: text('viewer_intent'), // learn, buy, compare, etc.
  
  // Modifiers
  modifier_type: text('modifier_type'), // how_to, what_is, best, etc.
  is_rare_modifier: boolean('is_rare_modifier').default(false),
  
  // Reasons/explanations (3-5 sentences each)
  topic_strength_reason: text('topic_strength_reason'),
  audience_fit_reason: text('audience_fit_reason'),
  popularity_reason: text('popularity_reason'),
  competition_reason: text('competition_reason'),
  overall_reason: text('overall_reason'),
  primary_emotion_reason: text('primary_emotion_reason'),
  viewer_intent_reason: text('viewer_intent_reason'),
  
  // Video planning (for later)
  video_angle_ideas: jsonb('video_angle_ideas'),
  bullet_points: jsonb('bullet_points'),
  
  // Catch-all for anything else
  extra: jsonb('extra'),
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(),
});

// ============================================================
// TYPE EXPORTS - Use these in your app code
// ============================================================
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;

export type SeedAnalysis = typeof seed_analysis.$inferSelect;
export type NewSeedAnalysis = typeof seed_analysis.$inferInsert;
