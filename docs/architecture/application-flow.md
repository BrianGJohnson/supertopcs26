# Super Topics - Application Flow

> **The Big Picture**: Users generate hundreds of keyword phrases, refine them down to the best 6-7%, and permanently save those as "Super Topics" tied to their channel.

---

## Database Hierarchy

```
USER ACCOUNT (auth.users + user_profiles)
│
├── Account Tier: basic | plus | pro
│   └── Determines max channels: 1 | 3 | 10
│
└── CHANNELS (YouTube channels owned by user)
    │
    └── SESSIONS (Research workspaces - TEMPORARY)
        │
        ├── seeds (generated phrases)
        ├── seed_analysis (scoring data)
        ├── intake_stats (pattern data)
        │
        └── SUPER TOPICS (promoted phrases - PERMANENT)
            └── Survive session deletion
            └── Retain origin info
```

### Key Principles

1. **User works within ONE channel at a time** - they select their active channel
2. **Sessions are temporary workspaces** - can be deleted after use
3. **Super Topics are permanent** - they survive session deletion
4. **History is preserved** - even after deletion, user sees origin info:
   - "January 2, 2026 - 20 Super Topics from 'Content Creation' session"

---

## Account Tiers & Channel Limits

| Tier | Max Channels | Price |
|------|-------------|-------|
| Basic | 1 | Free |
| Plus | 3 | $9/mo |
| Pro | 10 | $29/mo |

---

## The Three-Step Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   STEP 1        │     │   STEP 2        │     │   STEP 3        │
│   SEED          │────▶│   REFINE        │────▶│   SUPER         │
│                 │     │                 │     │                 │
│  Generate 300-  │     │  Score & filter │     │  Save the best  │
│  500 phrases    │     │  down to 6-7%   │     │  as Super Topics│
└─────────────────┘     └─────────────────┘     └─────────────────┘
     │                       │                       │
     ▼                       ▼                       ▼
  Temporary               Temporary              Permanent
  (Session)               (Session)              (Channel)
```

---

## Step 1: Seed (Page 1)

**URL**: `/members/build/seed`

**Purpose**: Generate a massive pool of keyword phrases from a 2-word seed.

### What Happens
1. User enters a 2-word seed phrase (e.g., "Content Creation")
2. System runs 4 expansion methods:
   - **Top 10**: Direct autocomplete suggestions
   - **Child**: Recursive expansion of top results
   - **A-Z**: Alphabet suffix variations
   - **Prefix**: 19 question/action prefixes
3. Generates **300-500 unique phrases**
4. All saved to `seeds` table (temporary, session-scoped)

### Data Storage
- **Table**: `seeds`
- **Lifecycle**: Temporary (tied to session)
- **Cleanup**: Deleted when session is archived or after 30 days of inactivity

### Output
- 300-500 phrases ready for refinement
- Data Intake stats generated and stored in `sessions.intake_stats`

---

## Step 2: Refine (Page 2)

**URL**: `/members/build/refine`

**Purpose**: Score and filter phrases down to the best candidates.

### What Happens
1. **Progressive Scoring** (3 rounds):
   - Round 1: **Topic Strength** (AI, ~$0.02 per 100 phrases)
   - Round 2: **P&C + LTV** (FREE, from Data Intake) - LTV boosts Popularity
   - Round 3: **Audience Fit** (AI, ~$0.02 per 100 phrases)

2. **Smart Filtering**: Each round eliminates ~50% of phrases
   - Start: 400 phrases
   - After Round 1: ~200 phrases
   - After Round 2: ~100 phrases
   - After Round 3: ~50 phrases
   - After Round 4: ~25-30 phrases (finalist pool)

3. **User Selection**: User picks their final Super Topics from the finalist pool

### Data Storage
- **Table**: `seed_analysis` (scoring data)
- **Lifecycle**: Temporary (tied to session)
- **Fields updated**: `is_selected`, `is_finalist` on seeds table

### Output
- 25-30 high-quality finalist phrases
- User selects ~15-30 to become Super Topics

---

## Step 3: Super (Page 3)

**URL**: `/members/build/super`

**Purpose**: Finalize and permanently save selected phrases as Super Topics.

### What Happens
1. User reviews their selected phrases from Step 2
2. User confirms final selection
3. Phrases are **permanently saved** as Super Topics
4. Super Topics are tied to the user's **Channel** (not just the session)

### Data Storage
- **Table**: `super_topics` (NEW - permanent storage)
- **Lifecycle**: Permanent (tied to channel/user)
- **Includes**: All scoring data, analysis, and metadata

### Output
- Permanent Super Topics saved to user's channel
- Available for future features (video planning, tracking, etc.)

---

## Data Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SESSION (Temporary)                 CHANNEL (Permanent)          │
│  ┌─────────────────────┐            ┌─────────────────────┐      │
│  │ seeds               │            │ super_topics        │      │
│  │ seed_analysis       │ ────────▶  │ (promoted phrases)  │      │
│  │ intake_stats        │   Step 3   │                     │      │
│  └─────────────────────┘            └─────────────────────┘      │
│         │                                    │                    │
│         ▼                                    ▼                    │
│    Deleted after               Kept forever (within limits)       │
│    30 days inactive                                               │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Requirements

### Tables (in hierarchical order)

#### 1. `user_profiles`
Extended user data beyond Supabase auth.

```typescript
{
  id: uuid,
  user_id: uuid,              // References auth.users(id)
  account_tier: 'basic' | 'plus' | 'pro',
  display_name: text,
  email: text,
  avatar_url: text,
  preferences: jsonb,
  created_at, updated_at
}
```

#### 2. `channels`
YouTube channels owned by a user.

```typescript
{
  id: uuid,
  user_id: uuid,
  name: text,                 // "My Tech Channel"
  youtube_channel_id: text,   // "UCxxxxxx" (optional)
  thumbnail_url: text,
  niche: text,                // "Tech Reviews"
  target_audience: text,      // "Beginners learning to code"
  channel_description: text,
  subscriber_count: integer,
  video_count: integer,
  is_active: boolean,
  is_default: boolean,        // User's primary channel
  created_at, updated_at
}
```

#### 3. `sessions`
Research workspaces (temporary).

```typescript
{
  id: uuid,
  user_id: uuid,              // Denormalized
  channel_id: uuid,           // FK to channels
  name: text,                 // "Content Creation"
  seed_phrase: text,          // "Content Creation"
  current_step: 1 | 2 | 3,
  status: 'active' | 'completed' | 'archived' | 'deleted',
  total_phrases_generated: integer,
  total_super_topics: integer,
  intake_stats: jsonb,        // Full Data Intake results
  created_at, updated_at,
  completed_at,               // When finished Page 3
  deleted_at                  // Soft delete timestamp
}
```

#### 4. `seeds`
Generated phrases (temporary).

```typescript
{
  id: uuid,
  session_id: uuid,           // FK to sessions (CASCADE DELETE)
  phrase: text,
  generation_method: 'seed' | 'top10' | 'child' | 'az' | 'prefix',
  parent_seed_id: uuid,
  position: integer,
  is_selected: boolean,
  is_finalist: boolean,
  created_at
}
```

#### 5. `seed_analysis`
Scoring data per phrase (temporary).

```typescript
{
  id: uuid,
  seed_id: uuid,              // FK to seeds (CASCADE DELETE)
  topic_strength: 0-100,
  audience_fit: 0-100,
  demand: 0-100,              // Renamed from popularity (Dec 2025)
  demand_base: 0-100,
  opportunity: 0-100,         // Renamed from competition (Dec 2025)
  overall_score: 0-100,
  primary_emotion: text,
  viewer_intent: text,
  modifier_type: text,
  *_reason: text,             // Explanations
  extra: jsonb,
  created_at
}
```

#### 6. `super_topics` ⭐ PERMANENT
Promoted keyword phrases (survives session deletion).

```typescript
{
  id: uuid,
  channel_id: uuid,           // FK to channels (CASCADE DELETE)
  user_id: uuid,              // Denormalized

  // Origin tracking (preserved after session deletion)
  source_session_id: uuid,    // No FK - session may be deleted
  source_session_name: text,  // "Content Creation"
  source_seed_phrase: text,   // "Content Creation"
  source_seed_id: uuid,       // No FK - seed may be deleted

  // The phrase
  phrase: text,               // "How To Start Content Creation For Beginners"

  // Scores at time of promotion (snapshot)
  topic_strength: 0-100,
  audience_fit: 0-100,
  search_volume: 0-100,
  demand: 0-100,              // Renamed from popularity (Dec 2025)
  opportunity: 0-100,         // Renamed from competition (Dec 2025)
  pc_breakdown: jsonb,        // Component scores

  // Analysis
  primary_emotion: text,
  viewer_intent: text,
  modifier_type: text,
  topic_strength_reason: text,
  audience_fit_reason: text,

  // User additions
  notes: text,                // User's personal notes
  tags: jsonb,                // ["tutorial", "beginner"]

  // Usage tracking
  status: 'active' | 'used' | 'archived',
  used_in_video_id: text,     // YouTube video ID
  used_at: timestamp,

  // Timestamps
  created_at,                 // When phrase was first generated
  promoted_at                 // When it became a Super Topic
}
```

---

## What User Sees After Session Deletion

When a user goes to their Channel → Super Topics page:

```
┌─────────────────────────────────────────────────────────────┐
│  MY SUPER TOPICS                                      [+New]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📅 January 2, 2026 • "Content Creation" session           │
│  ├── 20 Super Topics                                        │
│  │                                                          │
│  │  ✓ How To Start Content Creation For Beginners     92   │
│  │  ✓ Content Creation Tips For Beginners             88   │
│  │  ✓ Content Creation Psychology                     76   │
│  │  ... 17 more                                             │
│                                                             │
│  📅 January 5, 2026 • "YouTube Algorithm" session          │
│  ├── 15 Super Topics                                        │
│  │                                                          │
│  │  ✓ How YouTube Algorithm Works 2026                85   │
│  │  ... 14 more                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Even though the sessions were deleted, the user can see:
- When the session was created
- The original seed phrase
- All their saved Super Topics with scores

---

## Intake Stats Structure

The `intake_stats` JSONB field stores all Data Intake results:

---

## Storage Limits & Pricing Tiers

### The Math

**Per Super Topic storage cost**:
- ~1KB per super_topic row (with all fields)
- Supabase free tier: 500MB
- Supabase Pro ($25/mo): 8GB

**Capacity at different limits**:

| Super Topics per User | 3,000 Users | Total Storage |
|----------------------|-------------|---------------|
| 50 | 3,000 | ~150MB |
| 100 | 3,000 | ~300MB |
| 200 | 3,000 | ~600MB |
| 500 | 3,000 | ~1.5GB |

### Recommended Tier Limits

| Plan | Super Topics Limit | Monthly Price |
|------|-------------------|---------------|
| Free | 25 | $0 |
| Starter | 100 | $9/mo |
| Pro | 500 | $29/mo |
| Unlimited | No limit | $99/mo |

**Note**: Even with 3,000 users at 500 Super Topics each, total storage is only ~1.5GB. Storage is NOT a real constraint - the limits are purely for monetization.

### Why Limits?

1. **Perceived Value**: Unlimited feels less valuable than tiered
2. **Upgrade Path**: Clear reason to upgrade
3. **User Focus**: Forces users to be selective (quality over quantity)
4. **Revenue**: Multiple price points capture different user segments

---

## User Flow Summary

```
User Journey
============

1. SIGN UP
   └─▶ Auto-create Channel (or link YouTube)

2. NEW SESSION
   └─▶ Enter seed phrase
   └─▶ Page 1: Generate 300-500 phrases (stored in `seeds`)
   
3. REFINE
   └─▶ Page 2: Score phrases, select finalists
   └─▶ Data stored in `seed_analysis`
   
4. PROMOTE
   └─▶ Page 3: Review finalists
   └─▶ Confirm selection
   └─▶ Create `super_topics` records (PERMANENT)
   └─▶ Linked to user's Channel
   
5. LATER
   └─▶ Session data can be cleaned up
   └─▶ Super Topics remain forever
   └─▶ User can mark as "used" when they make videos
```

---

## Implementation Priority

1. **Phase 1**: Create `channels` table, auto-create on signup
2. **Phase 2**: Create `super_topics` table with all fields
3. **Phase 3**: Build Page 3 UI with promotion flow
4. **Phase 4**: Add tier limits and upgrade prompts
5. **Phase 5**: Add "used in video" tracking feature

---

## Open Questions

1. **Channel Creation**: Auto-create on signup, or require onboarding step?
2. **Multiple Channels**: Support multiple channels per user from day 1?
3. **Session Cleanup**: How long to keep session data? 30 days? 90 days?
4. **Export**: Allow exporting Super Topics to CSV/spreadsheet?
5. **Sharing**: Allow sharing Super Topics between team members?
