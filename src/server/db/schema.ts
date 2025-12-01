import { pgTable, text, timestamp, integer, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';

// ============================================================
// SUPER TOPICS DATABASE SCHEMA
// Managed by Drizzle - DO NOT edit tables directly in Supabase
// To add columns: edit this file, then run: npx drizzle-kit push
// ============================================================

// ============================================================
// HIERARCHY: User Account → Channels → Sessions → Super Topics
// ============================================================

// ------------------------------------------------------------
// USER_PROFILES - Extended user data (beyond Supabase auth.users)
// ------------------------------------------------------------
export const user_profiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().unique(), // References auth.users(id)
  
  // Account tier determines channel limits
  // basic: 1 channel, plus: 3 channels, pro: 10 channels
  account_tier: text('account_tier').default('basic'), // basic, plus, pro
  
  // Profile info
  display_name: text('display_name'),
  email: text('email'),
  avatar_url: text('avatar_url'),
  
  // Preferences
  preferences: jsonb('preferences'), // UI settings, defaults, etc.
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ------------------------------------------------------------
// CHANNELS - YouTube channels owned by a user
// Limit based on account_tier: basic=1, plus=3, pro=10
// ------------------------------------------------------------
export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(), // References auth.users(id)
  
  // Channel identity
  name: text('name').notNull(),
  youtube_channel_id: text('youtube_channel_id'), // e.g., "UCxxxxxx" (optional)
  youtube_channel_url: text('youtube_channel_url'), // Full URL from onboarding
  thumbnail_url: text('thumbnail_url'),
  
  // Channel context (used for AI scoring)
  niche: text('niche'), // e.g., "Tech Reviews", "Cooking", "Gaming"
  niche_score: integer('niche_score'), // 1-10 demand score from GPT analysis
  target_audience: text('target_audience'), // e.g., "Beginners learning to code"
  channel_description: text('channel_description'),
  
  // Onboarding data
  onboarding_step: integer('onboarding_step'), // 1-4, null = not started
  onboarding_completed_at: timestamp('onboarding_completed_at'),
  
  // Goals (from onboarding step 2)
  goals: jsonb('goals'), // ["growth", "adsense", "sell_products"]
  motivations: jsonb('motivations'), // Same as goals, alternate name
  primary_motivation: text('primary_motivation'), // Their #1 goal
  
  // Monetization (from onboarding step 3)
  monetization_methods: jsonb('monetization_methods'), // ["adsense", "affiliates", "products"] - ordered by priority
  monetization_priority: jsonb('monetization_priority'), // Priority order of methods
  primary_monetization: text('primary_monetization'), // First item in monetization_methods
  monetization_details: jsonb('monetization_details'), // { adsense_status, affiliate_products, products_description }
  products_description: text('products_description'), // What they sell
  affiliate_products: text('affiliate_products'), // What affiliate products they promote
  adsense_status: text('adsense_status'), // monetized, not_yet, etc.
  sponsorship_niche: text('sponsorship_niche'), // Brands they want to work with
  has_channel: boolean('has_channel'), // Whether they have an existing YouTube channel
  
  // Niche & Content Style (from onboarding step 4)
  topic_ideas: jsonb('topic_ideas'), // Initial topic ideas they entered
  content_style: integer('content_style'), // 1-7 scale: 1=Scholar, 7=Performer
  content_style_name: text('content_style_name'), // "The Scholar", "The Teacher", etc.
  video_formats: jsonb('video_formats'), // ["tutorials", "reviews", "vlogs"] - formats they create
  
  // Content pillars (from onboarding step 5 - AI generated)
  content_pillars: jsonb('content_pillars'), // ["AI Tools", "No-Code Builds", "Cursor Tips"] - legacy
  pillar_strategy: jsonb('pillar_strategy'), // Full pillar data: { evergreen: {...}, trending: {...}, monetization: {...} }
  niche_demand_score: integer('niche_demand_score'), // 1-10 from GPT validation
  niche_validated: boolean('niche_validated'), // Whether GPT has validated their niche
  
  // Audience details (from onboarding step 4)
  audience_who: text('audience_who'), // "Developers wanting to speed up coding"
  audience_struggle: text('audience_struggle'), // "Spending too much time on boilerplate"
  audience_goal: text('audience_goal'), // "Ship projects faster"
  audience_expertise: text('audience_expertise'), // "beginner", "intermediate", "advanced"
  
  // GPT analysis cache (from onboarding step 3)
  niche_analysis: jsonb('niche_analysis'), // Full GPT response for reference
  
  // Stats (can be synced from YouTube API later)
  subscriber_count: integer('subscriber_count'),
  video_count: integer('video_count'),
  
  // Status
  is_active: boolean('is_active').default(true),
  is_default: boolean('is_default').default(false), // User's primary channel
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// ------------------------------------------------------------
// SESSIONS - Research workspaces built around a seed phrase
// Belongs to a CHANNEL, not directly to user
// ------------------------------------------------------------
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(), // Denormalized for easy queries
  channel_id: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }), // Nullable during migration
  
  // Core
  name: text('name').notNull(),
  seed_phrase: text('seed_phrase'), // The 2-word starter phrase
  current_step: integer('current_step').default(1), // 1=Seed, 2=Refine, 3=Super
  status: text('status').default('active'), // active, completed, archived, deleted
  
  // Session stats (summary for display after deletion)
  total_phrases_generated: integer('total_phrases_generated'),
  total_super_topics: integer('total_super_topics'),
  
  // Data intake stats (modifiers, anchors, rare words, percentiles)
  // This is the full pattern extraction from Page 1
  intake_stats: jsonb('intake_stats'),
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  completed_at: timestamp('completed_at'), // When user finished Page 3
  deleted_at: timestamp('deleted_at'), // Soft delete - keep for history
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
  seed_id: uuid('seed_id').notNull().unique().references(() => seeds.id, { onDelete: 'cascade' }),
  
  // Core scores (0-100)
  topic_strength: integer('topic_strength'),
  audience_fit: integer('audience_fit'),
  popularity: integer('popularity'),
  popularity_base: integer('popularity_base'), // Before LTV boost
  competition: integer('competition'),
  overall_score: integer('overall_score'),
  
  // Visibility state (for Refine page bulk hide)
  is_hidden: boolean('is_hidden').default(false),
  
  // LTV (Long-Term Views) - measures Top 10 alignment
  // Hidden on Page 2, boosts Popularity, badge on Page 3 for score >= 50
  ltv_score: integer('ltv_score').default(0),
  ltv_strategy: text('ltv_strategy'), // FULL_TOP10, FULL_ANCHOR, BIGRAM, SINGLE, or null
  ltv_match: text('ltv_match'), // The text that matched
  ltv_boost: integer('ltv_boost').default(0), // +0, +3, +5, +8, or +10
  
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

// ------------------------------------------------------------
// SUPER_TOPICS - Permanently saved keyword phrases
// These SURVIVE session deletion - tied to CHANNEL not session
// ------------------------------------------------------------
export const super_topics = pgTable('super_topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Ownership - tied to channel, survives session deletion
  channel_id: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull(), // Denormalized for easy queries
  
  // Origin tracking - preserved even after session deletion
  source_session_id: uuid('source_session_id'), // No FK - session may be deleted
  source_session_name: text('source_session_name'), // Preserved copy
  source_seed_phrase: text('source_seed_phrase'), // Preserved copy: "Content Creation"
  source_seed_id: uuid('source_seed_id'), // No FK - seed may be deleted
  
  // The phrase itself
  phrase: text('phrase').notNull(),
  
  // All scores at time of promotion (preserved snapshot)
  topic_strength: integer('topic_strength'),
  audience_fit: integer('audience_fit'),
  search_volume: integer('search_volume'),
  popularity: integer('popularity'),
  popularity_base: integer('popularity_base'), // Before LTV boost
  competition: integer('competition'),
  opportunity_score: integer('opportunity_score'), // Composite for Page 3
  
  // LTV preserved for Page 3 badge display
  ltv_score: integer('ltv_score'),
  ltv_strategy: text('ltv_strategy'),
  ltv_match: text('ltv_match'),
  
  // P&C component breakdown (for transparency)
  pc_breakdown: jsonb('pc_breakdown'), // { prefix: 45, seedPlus1: 72, seedPlus2: 68, suffix: 55 }
  
  // Analysis preserved
  primary_emotion: text('primary_emotion'),
  secondary_emotion: text('secondary_emotion'),
  viewer_intent: text('viewer_intent'),
  modifier_type: text('modifier_type'),
  
  // Reasons preserved
  topic_strength_reason: text('topic_strength_reason'),
  audience_fit_reason: text('audience_fit_reason'),
  
  // User additions
  notes: text('notes'), // User's personal notes
  tags: jsonb('tags'), // e.g., ["tutorial", "beginner", "monetization"]
  
  // Usage tracking
  status: text('status').default('active'), // active, used, archived
  used_in_video_id: text('used_in_video_id'), // YouTube video ID if they made a video
  used_at: timestamp('used_at'), // When they marked it as used
  
  // Timestamps
  created_at: timestamp('created_at').defaultNow(), // When phrase was first generated
  promoted_at: timestamp('promoted_at').defaultNow(), // When it became a Super Topic
});

// ============================================================
// TYPE EXPORTS - Use these in your app code
// ============================================================
export type UserProfile = typeof user_profiles.$inferSelect;
export type NewUserProfile = typeof user_profiles.$inferInsert;

export type Channel = typeof channels.$inferSelect;
export type NewChannel = typeof channels.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;

export type SeedAnalysis = typeof seed_analysis.$inferSelect;
export type NewSeedAnalysis = typeof seed_analysis.$inferInsert;

export type SuperTopic = typeof super_topics.$inferSelect;
export type NewSuperTopic = typeof super_topics.$inferInsert;
