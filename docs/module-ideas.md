# SuperTopics Module Ideas

> **Future modules and features for SuperTopics.app**

---

## Document Purpose

This document tracks future module ideas, their purpose, and implementation notes. Each module supports the core mission: **help YouTube creators find SuperTopics and grow their channels strategically.**

---

## 🔴 PRIORITY: Fundamentals First

Before building new modules, these fundamentals must work:

### 1. Dashboard Onboarding Gate
**Status**: 📋 Needs Design  
**Priority**: 🔴 HIGH  

**Problem**: Users who haven't completed onboarding can access modules that won't work without their data (pillars, niche, audience).

**Solution** (Light Touch - No Redirects):
- Dashboard shows modules as locked/grayed if `onboarding_completed_at` is null
- Clear message: "Complete onboarding to unlock all features"
- Prominent "Continue Onboarding" button that takes them to their current step
- Individual pages (like Target) show fallback "Complete Onboarding" message if data missing
- NO middleware guards or redirects (keeps auth simple)

### 2. Built for the Viewer - Target Page
**Status**: ✅ Created, needs testing  
**Priority**: 🔴 HIGH  

- Step 1 of 7-step Builder flow
- Shows 3 pillar cards (Evergreen, Trending, Monetization)
- Pulls sub-niches from user's saved pillar_strategy
- Fixed: Now correctly reads from API response

### 3. Member Dashboard
**Status**: 📋 Needs Work  
**Priority**: 🔴 HIGH  

- Entry point after login
- Shows available modules (locked if onboarding incomplete)
- Quick stats/overview

---

## Core Module: Built for the Viewer

**Status**: 🔨 In Development  
**Priority**: HIGH  
**URL**: `/members/build/*`

### Purpose
The core SuperTopic identification engine. Users enter a seed phrase and we guide them through validation, refinement, title creation, and thumbnail planning.

### Current Flow
1. **Seed** - Enter a 2-word topic idea
2. **Refine** - AI suggests related angles and variations
3. **Super** - Validate the topic with demand/competition scoring
4. **Title** - Generate compelling title options
5. **Package** - Plan the video packaging (thumbnail concepts)

### Planned Enhancements

#### Pillar Selection (Step 0)
**What**: Before entering a seed, let users choose which content pillar they're targeting
**Why**: Connects their strategic pillars (from onboarding) to every video they plan
**Implementation**:
- New entry page at `/members/build/`
- Show 3 pillar cards: Evergreen, Trending, Monetization
- Display saved sub-niches/seeds under each pillar
- Clicking a seed pre-fills Step 1
- Options: "I Already Know My Idea" or "Inspire Me"

#### Pillar Coaching Tips
**What**: Based on Pillar Progress data, suggest which pillar to focus on
**Why**: Helps creators maintain a balanced content mix
**Implementation**:
- Show tip at bottom: "Your last 4 videos were monetization-focused. Consider an Evergreen video to balance your content."
- Gently highlight the underused pillar
- Never force—just recommend

---

## Module: Pillar Progress Tracker

**Status**: 📋 Specified  
**Priority**: MEDIUM  
**URL**: `/members/pulse` or `/members/progress`

### Purpose
Let creators track their published videos against their content pillar strategy. Provides insights on content mix balance and video performance patterns.

### How It Works

1. **Pull Video Feed** - Fetch recent videos from user's YouTube RSS feed
2. **Tag Videos** - User categorizes each video by pillar:
   - 💰 Monetization
   - 🚀 Trending
   - 🌲 Evergreen
   - — None/Other
3. **Rate Performance** - Quick assessment:
   - 😕 Underperformed
   - 😐 About Average
   - 🎉 Overperformed
4. **View Mix Analysis** - See pillar distribution vs. recommended percentages

### UI Concept

```
┌─────────────────────────────────────────────────────────────────┐
│   📊 Your Pillar Mix (Last 10 Videos)                           │
│                                                                 │
│   MONETIZATION  ████████░░░░░░  40%  (Target: 20-30%)  ⚠️ Heavy │
│   TRENDING      ████░░░░░░░░░░  20%  (Target: 20-30%)  ✓ Good   │
│   EVERGREEN     ████░░░░░░░░░░  20%  (Target: 40-50%)  ⚠️ Light │
│   UNTAGGED      ████░░░░░░░░░░  20%                             │
│                                                                 │
│   💡 "Consider an Evergreen video next to balance your mix."   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│   🆕 New Videos To Tag (2)                                      │
│                                                                 │
│   "How I Grew to 10K Subscribers"            Nov 28             │
│   Pillar: [💰] [🚀] [🌲] [—]    Performance: [😕] [😐] [🎉]      │
│   ▶ Advanced Metrics                                            │
│                                                                 │
│   "YouTube Shorts Are DEAD?!"                Nov 25             │
│   Pillar: [💰] [🚀] [🌲] [—]    Performance: [😕] [😐] [🎉]      │
│   ▶ Advanced Metrics                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Advanced Metrics (Optional)
- CTR (%)
- Average View Duration
- Views at 24 hours
- Comments count
- Quick notes

### Data Model

```typescript
interface VideoTracking {
  videoId: string;
  title: string;
  publishedAt: string;
  pillarTag: "monetization" | "trending" | "evergreen" | "none" | null;
  performanceRating: "underperformed" | "average" | "overperformed" | null;
  metrics?: {
    ctr?: number;
    avgViewDuration?: string;
    viewsAt24h?: number;
    comments?: number;
    notes?: string;
  };
}
```

### Connection to Other Modules
- **Built for the Viewer Step 0**: Uses pillar balance data to suggest which pillar to focus on next
- **Onboarding Step 5**: Pillar definitions and recommended percentages come from here
- **Niche Pulse**: Performance data can inform trending topic detection

---

## Module: Just Born Topics

**Status**: 💡 Idea  
**Priority**: MEDIUM  
**URL**: `/members/trends` or `/members/just-born`

### Purpose
Surface trending topics in the user's niche that are "just born"—meaning they're brand new and haven't been covered extensively yet. This is the opportunity window where early creators can capture demand.

### Why "Just Born"?
The term emphasizes:
- Topics that are NEW (hours to days old)
- First-mover advantage
- Time-sensitive opportunities
- Fresh content the algorithm favors

### How It Works

1. **Monitor Sources** - Track multiple data streams:
   - YouTube Trending in relevant categories
   - Google Trends for niche keywords
   - Twitter/X trending topics
   - Reddit hot posts in relevant subreddits
   - News APIs for niche-specific publications
   
2. **AI Pattern Detection** - Use GPT to:
   - Identify topic themes across sources
   - Assess relevance to user's niche
   - Estimate "freshness" (how new is this?)
   - Predict demand window (how long until saturated?)

3. **Alert System** - Notify users when high-potential topics emerge

### UI Concept

```
┌─────────────────────────────────────────────────────────────────┐
│   🌱 Just Born Topics                                           │
│   Fresh opportunities in YouTube Education                       │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  🔥 HOT - Act Fast                                      │   │
│   │                                                         │   │
│   │  "YouTube just announced new monetization rules"        │   │
│   │  First seen: 4 hours ago                                │   │
│   │  Coverage so far: Low (12 videos)                       │   │
│   │  Estimated window: 24-48 hours                          │   │
│   │                                                         │   │
│   │  [Build This Topic →]                                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  🌱 EMERGING                                            │   │
│   │                                                         │   │
│   │  "New AI tool for YouTube thumbnails"                   │   │
│   │  First seen: 12 hours ago                               │   │
│   │  Coverage so far: Very Low (3 videos)                   │   │
│   │  Estimated window: 3-5 days                             │   │
│   │                                                         │   │
│   │  [Build This Topic →]                                   │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Connection to Built for the Viewer
- Clicking "Build This Topic" takes user to Built for the Viewer with seed pre-filled
- Sets `target_pillar` to "trending" automatically

---

## Module: Niche Pulse

**Status**: 💡 Idea  
**Priority**: MEDIUM  
**URL**: `/members/pulse`

### Purpose
Monitor competitor channels via RSS feeds to detect patterns and opportunities. When multiple channels in your niche suddenly cover the same topic, something is happening worth investigating.

### How It Works

1. **Channel Tracking** - User adds competitor channel URLs (or we suggest based on niche)
2. **RSS Aggregation** - Pull recent videos from all tracked channels (last 24-48 hours)
3. **Pattern Detection** - AI analyzes for commonalities:
   - Same topics across multiple channels
   - Similar title patterns
   - Common keywords appearing
4. **Opportunity Alerts** - Surface patterns worth acting on

### Example Scenario

User tracks 50 channels in the YouTube education niche. In the last 24 hours:
- 5 channels published videos about "YouTube's new feature"
- 3 channels covered "How to use the new AI tool"
- 2 channels reacted to "Creator controversy"

**Niche Pulse** surfaces: "5 channels are talking about YouTube's new feature. This might be a trending opportunity."

### UI Concept

```
┌─────────────────────────────────────────────────────────────────┐
│   📡 Niche Pulse                                                │
│   Tracking 50 channels in YouTube Education                      │
│                                                                 │
│   🔴 PULSE DETECTED                                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  "YouTube's New Monetization Rules"                     │   │
│   │                                                         │   │
│   │  5 channels covered this in the last 24 hours:          │   │
│   │  • Think Media - "YouTube Changed EVERYTHING"           │   │
│   │  • vidIQ - "New Rules You Need to Know"                 │   │
│   │  • Nick Nimmin - "Breaking News: YouTube Update"        │   │
│   │  • Roberto Blake - "My Thoughts on the New Rules"       │   │
│   │  • Channel Makers - "What This Means for Small..."      │   │
│   │                                                         │   │
│   │  Your angle could be different. [Explore This Topic →]  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   Recent Activity (Last 48 Hours)                               │
│                                                                 │
│   📹 Think Media posted 2 videos                                │
│   📹 vidIQ posted 3 videos                                      │
│   📹 Nick Nimmin posted 1 video                                 │
│   ... (12 more channels active)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Technical Implementation

1. **RSS Feed Storage**
   ```sql
   CREATE TABLE tracked_channels (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     channel_url TEXT NOT NULL,
     channel_name TEXT,
     rss_url TEXT,
     last_fetched_at TIMESTAMP,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE TABLE channel_videos (
     id UUID PRIMARY KEY,
     tracked_channel_id UUID REFERENCES tracked_channels(id),
     video_id TEXT NOT NULL,
     title TEXT NOT NULL,
     published_at TIMESTAMP,
     fetched_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(tracked_channel_id, video_id)
   );
   ```

2. **Pattern Detection (GPT)**
   - Group videos by 24/48 hour windows
   - Send titles + descriptions to GPT
   - Ask: "What topics are multiple channels covering? What themes are emerging?"

3. **Cron Job**
   - Fetch RSS feeds every 4-6 hours
   - Run pattern detection
   - Store alerts for user's next visit

---

## Module: Onboarding Completion Page

**Status**: 💡 Idea  
**Priority**: HIGH (after current onboarding work)  
**URL**: `/members/onboarding/step-6` (or new step-7)

### Purpose
After completing onboarding, give users a clear understanding of what they've unlocked and how to use Built for the Viewer effectively.

### Current State
Step 6 is minimal. After the celebration screen on Step 5, users land on a simple dashboard.

### Proposed Enhancement
Add a transitional "Getting Started" page that:
1. Summarizes what they set up
2. Explains how Built for the Viewer works
3. Guides them to find their first SuperTopic

### UI Concept

```
┌─────────────────────────────────────────────────────────────────┐
│   🎯 You're Ready to Find SuperTopics                           │
│                                                                 │
│   Here's what we set up for you:                                │
│                                                                 │
│   ✅ Niche: YouTube Education (Demand: 8/10)                    │
│   ✅ Audience: New YouTubers under 1K subs                      │
│   ✅ Content Style: The Explainer                               │
│   ✅ Pillars: Evergreen, Trending, Monetization themes saved    │
│                                                                 │
│   ─────────────────────────────────────────────────────────     │
│                                                                 │
│   📚 How Built for the Viewer Works                             │
│                                                                 │
│   Built for the Viewer is our core topic research engine.       │
│   Here's how to use it:                                         │
│                                                                 │
│   1️⃣ SEED - Start with a 2-word topic idea                     │
│      Use your saved pillar themes or type your own              │
│                                                                 │
│   2️⃣ REFINE - We suggest related angles and variations         │
│      AI helps you find the best version of your idea            │
│                                                                 │
│   3️⃣ SUPER - Validate it's a SuperTopic                        │
│      Check demand, competition, and audience fit                │
│                                                                 │
│   4️⃣ TITLE - Generate compelling titles                        │
│      We create click-worthy options optimized for CTR           │
│                                                                 │
│   5️⃣ PACKAGE - Plan your thumbnail                             │
│      Complete your video packaging strategy                     │
│                                                                 │
│   [Find My First SuperTopic →]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Alternative: Multi-Page Tutorial
Could be 2-3 quick pages:
1. **Summary** - What we set up
2. **How It Works** - Built for the Viewer overview
3. **Your First Topic** - Choose a pillar and go

---

## Module: Quick Phrase Checker (Budget-Friendly Topic Validator)

**Status**: 💡 Idea - HIGH VALUE  
**Priority**: 🟡 MEDIUM-HIGH  
**URL**: `/members/check` or `/members/quick`
**Cost**: ~$0.001 per phrase (0.1 cents)

### Purpose
A lightweight, budget-friendly alternative to the full Builder expansion. Users who want to validate topic ideas quickly without running a full expansion (~$0.04) can check individual phrases for ~$0.001 each.

### Why This Matters
- **Full expansion**: 38 API calls, ~$0.04, generates 300-400 phrases
- **Quick check**: 1 API call, ~$0.001, validates 1 phrase with rich signal data

For budget-conscious users:
- Run 40-50 quick checks for the same cost as 1 expansion
- Get immediate Go/Caution/Stop signal
- See exact match ratio, topic match ratio, viewer vibes
- Decide which phrase is worth a full expansion

### The Data We Get (Per Phrase)

Each autocomplete query returns:
```typescript
{
  phrase: "how to introduce yourself on youtube",
  suggestionCount: 14,          // Total suggestions returned
  exactMatchCount: 1,           // Start with exact phrase
  topicMatchCount: 14,          // Semantically related
  exactMatchRatio: 7%,          // Low = less literal competition
  topicMatchRatio: 100%,        // High = strong semantic demand
  signal: "Go" | "Caution" | "Stop",
  topFive: [...],               // Actual suggestions
  viewerVibe: {...}             // Emotional breakdown
}
```

### The Key Insight: Long-Tail Sweet Spot

**Example: "How to introduce yourself on YouTube"**
- Exact match: 1 of 14 (7%)
- Topic match: 14 of 14 (100%)
- Current algorithm says: "Caution" ❌ WRONG

**Reality**: This is a SWEET SPOT because:
- **Low exact match** = Few videos target this EXACT phrase = low competition
- **High topic match** = Many people search variations = high demand
- **Result**: Easy #1 ranking, 30K views in 10 months

The algorithm needs to recognize:
- Low exact + High topic = **Opportunity** (not Caution)
- High exact + High topic = Competitive but in-demand
- Low exact + Low topic = True low demand

### UI Flow

1. **Enter phrase** (any length, not just 2 words)
2. **See instant results**:
   - Traffic light signal (Go/Caution/Stop)
   - Exact vs Topic match breakdown
   - Top 5 related searches
   - Viewer vibe distribution
3. **Actions**:
   - "Run Full Expansion" → Go to Builder
   - "Check Another" → Reset form
   - "Save to Ideas" → Bookmark for later

### Cost Comparison

| Action | API Calls | Cost |
|--------|-----------|------|
| Quick check (1 phrase) | 1 | $0.001 |
| Quick check (50 phrases) | 50 | $0.05 |
| Full expansion | 38 | $0.04 |

**Value prop**: Check 50 ideas for the cost of 1.25 expansions.

### Connection to Builder
- "This phrase looks promising! Run Full Expansion?" → Pre-fills Builder
- Save checked phrases to a "Validated Ideas" list
- Show previous quick-check results when entering Builder

---

## Module Priority Matrix

| Module | Purpose | Priority | Dependencies |
|--------|---------|----------|--------------|
| **Built for the Viewer** | Core topic research | 🔴 HIGH | None (in progress) |
| **Step 0 (Pillar Selection)** | Connect pillars to Builder | 🔴 HIGH | Onboarding complete |
| **Onboarding Completion** | Transition to using app | 🔴 HIGH | Current onboarding |
| **Quick Phrase Checker** | Budget-friendly validation | 🟡 MED-HIGH | Viewer Landscape API |
| **Pillar Progress Tracker** | Track content mix | 🟡 MEDIUM | RSS integration |
| **Just Born Topics** | Fresh trending topics | 🟡 MEDIUM | External APIs |
| **Niche Pulse** | Competitor monitoring | 🟡 MEDIUM | RSS integration |

---

## Technical Notes

### RSS Feed Integration
Both **Pillar Progress** and **Niche Pulse** require RSS feed handling:

```typescript
// YouTube channel RSS format
const getRssFeedUrl = (channelId: string) => 
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

// Or from channel URL
const getChannelRss = async (channelUrl: string) => {
  // 1. Fetch channel page
  // 2. Extract channel ID from HTML
  // 3. Build RSS URL
};
```

### GPT Integration Pattern
All modules using GPT should follow the established pattern:
```typescript
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 2500,
  reasoning_effort: "minimal",
  response_format: { type: "json_object" },
};
```

### Database Considerations
- **Pillar Progress**: `video_tracking` table (user-owned data)
- **Just Born Topics**: Might be shared cache across all users in a niche
- **Niche Pulse**: `tracked_channels` + `channel_videos` tables (per-user tracking)
- **Quick Phrase Checker**: `phrase_checks` table (user's validated ideas)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.2 | 2025-12-04 | Added Quick Phrase Checker module, updated priority matrix |
| 0.1 | 2025-12-01 | Initial document with module ideas from pillar-strategy.md and conversation notes |

