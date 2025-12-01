# Pillar Strategy

> **The SuperTopics framework for intentional content creation that drives growth AND revenue.**

---

## Document Purpose

This document defines:
1. The strategic pillar system (Monetization, Trending, Evergreen)
2. How pillars are created during onboarding
3. How pillars power the Builder module (Step 0)
4. The optional Pillar Progress tracking module

---

## The Problem

Most YouTube creators fall into one of two traps:

1. **Random Content Trap** - They make whatever video sounds fun that day. No strategy, no consistency, no compounding growth.

2. **Single Focus Trap** - They only chase views (trending) OR only make evergreen content OR only promote their products. Imbalanced = limited results.

**The result?** Creators who work hard but don't see the growth or revenue they deserve.

---

## The Three Strategic Pillars

Every successful creator needs **3 Strategic Content Pillars**:

| Pillar | Purpose | Why It Matters |
|--------|---------|----------------|
| **Monetization Pillar** | Videos that promote their offers directly | Converts viewers to customers, drives income |
| **Trending Pillar** | Topics likely to have short-term spikes | Gets discovered, grows subscribers, rides algorithm waves |
| **Evergreen Pillar** | Durable, search-driven topics | Ranks in search, builds authority, compounds over time |

### The Key Insight

**You need all three.** Here's why:

- **Monetization only** = Feels salesy, audience tunes out, limited reach
- **Trending only** = Viral hits but no lasting audience or revenue
- **Evergreen only** = You rank but don't get discovered or make money

The magic happens when you **balance all three** with intentional ratios.

---

## Recommended Content Mix

Based on monetization method, here's the optimal split:

### If You Sell Products/Services (Courses, Coaching, Software, etc.)

| Pillar | % of Content | Example Topics |
|--------|--------------|----------------|
| Evergreen | 40-50% | "How to...", "Best way to...", Tutorials |
| Trending | 20-30% | News, reactions, hot takes, new features |
| Monetization | 20-30% | Topics directly related to what you sell |

**Why this works:** Your monetization pillar builds trust and expertise in your offer area. When viewers are ready to buy, YOU are the obvious choice.

### If You Promote Affiliate Products

| Pillar | % of Content | Example Topics |
|--------|--------------|----------------|
| Evergreen | 40-50% | Educational content, how-tos |
| Trending | 20-30% | News, comparisons, "X vs Y" |
| Monetization | 20-30% | Reviews, tutorials featuring products you promote |

**Why this works:** You're not just reviewing products—you're building authority in the space. Reviews convert better when viewers trust you.

### If You Monetize with YouTube Ads (AdSense)

| Pillar | % of Content | Example Topics |
|--------|--------------|----------------|
| Evergreen | 50-60% | Searchable, long watch time content |
| Trending | 30-40% | Viral potential, high view counts |
| Monetization (High-CPM) | 10-20% | Topics advertisers pay premium for |

**Why this works:** AdSense revenue = Views × CPM. You need volume (trending) AND quality views (evergreen with high CPM topics).

---

## Complete Onboarding Flow (6 Steps)

The pillar system is created during onboarding, then reused everywhere.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Step 1        │ ──▶ │   Step 2        │ ──▶ │   Step 3        │
│   Welcome       │     │   Your Goals    │     │   Make Money    │
│   (Why We're    │     │   (Motivation)  │     │   (How + Has    │
│   Different)    │     │                 │     │   Channel?)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     ~30 sec                 ~45 sec                 ~60 sec
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Step 4        │ ──▶ │   Step 5        │ ──▶ │   Step 6        │
│   Your Niche    │     │   Pillars &     │     │   Your          │
│   & Topics      │     │   Purpose (AI)  │     │   Audience      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     ~45 sec                 ~30 sec                 ~45 sec
```

**Total Time**: ~4-5 minutes for thoughtful completion

---

## Step 1: Welcome (Existing - Keep As-Is)

### Purpose
Set expectations, build excitement, and help them understand this is NOT another generic keyword tool.

### Key Messages
- It's YOUR tool - Everything is personalized to your channel
- We learn & grow - The more you use it, the smarter it gets
- Our data is different - Direct from YouTube, AI-enhanced, context-aware

**Status**: ✅ Already built and polished

---

## Step 2: Your Goals (NEW)

### Purpose
Understand WHY they're creating content before talking about money. This sets the emotional context.

### UI Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   🎯 Why Are You Creating Content?                                          │
│                                                                             │
│   Understanding your motivation helps us tailor everything to your path.    │
│                                                                             │
│   ┌───────────────────────────────────┐  ┌───────────────────────────────┐ │
│   │  🎨 FOR FUN                       │  │  💰 TO MAKE MONEY             │ │
│   │                                   │  │                               │ │
│   │  I enjoy creating and sharing     │  │  YouTube is part of my        │ │
│   │  content with the world           │  │  business or income plan      │ │
│   └───────────────────────────────────┘  └───────────────────────────────┘ │
│                                                                             │
│   ┌───────────────────────────────────┐  ┌───────────────────────────────┐ │
│   │  🏢 TO BUILD A BRAND              │  │  👥 TO BUILD COMMUNITY        │ │
│   │                                   │  │                               │ │
│   │  Establishing authority and       │  │  Connecting with like-minded  │ │
│   │  recognition in my field          │  │  people around shared passion │ │
│   └───────────────────────────────────┘  └───────────────────────────────┘ │
│                                                                             │
│   (Can select multiple, but first selection = primary motivation)           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `motivations` | array | Yes (1+) | ["money", "brand"] |
| `primary_motivation` | text | Yes | "money" (first selection) |

### Why This Matters

If someone's primary motivation is "fun", we shouldn't push aggressive monetization pillars. If it's "brand", we emphasize authority-building content. This shapes the AI-generated pillars in Step 5.

---

## Step 3: How Do You Want To Make Money? (Existing Step 2, Enhanced)

### Purpose
Understand their monetization strategy AND whether they have an existing channel.

### UI Design (Already Built - Great Card Sizing)

Keep the existing large card layout:
- YouTube Ads
- Sell Products
- Affiliate Sales
- Sponsorships
- Not Sure Yet

**Enhancement**: Move "Do you have a channel?" question to this step (currently at end of Step 2).

### Follow-Up Questions

Based on monetization selection:
- **YouTube Ads**: "Are you currently monetized?" (Yes / Working towards it / Not yet)
- **Sell Products**: "What do you sell or plan to sell?"
- **Affiliate**: "What kind of products do you promote?"
- **Sponsorships**: "What's your niche for attracting sponsors?"

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `monetization_methods` | array | Yes (1+) | ["sell_products", "affiliate"] |
| `primary_monetization` | text | Yes | "sell_products" (first selection) |
| `has_channel` | boolean | Yes | true |
| `channel_url` | text | If has_channel | "youtube.com/@..." |
| `monetization_details` | object | Varies | { productsDescription: "..." } |

**Status**: ✅ Already built with great card sizing

---

## Step 4: Your Niche & Topics (Existing Step 3, Resized)

### Purpose
Capture their niche and 3 example topic ideas they care about.

### UI Design (Needs Sizing Update)

**Current Issue**: Input fields are much smaller than Step 3's cards.

**Fix**: Use larger, more prominent input fields that match Step 3's visual weight.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   📍 What's Your Channel About?                                             │
│                                                                             │
│   Describe your primary niche and general direction in a few words.         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                                                                     │  │
│   │  YouTube Education                                      (Large)     │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   Examples: "Tech Reviews", "Budget Travel", "Minecraft Builds"             │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   📝 List 3 Topics or Series Ideas You Care About                          │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  1. Algorithm tips and growth strategies                            │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  2. AI tools for content creators                                   │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  3. YouTube Shorts strategy                                         │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Change from Current Design

- **Remove**: The "Discover Opportunities" AI analysis button (moves to Step 5)
- **Simplify**: Just capture niche + 3 topics
- **Resize**: Larger input fields matching Step 3's card sizing

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `niche` | text | Yes | "YouTube Education" |
| `topic_ideas` | array | Yes (3) | ["Algorithm tips", "AI tools", "Shorts strategy"] |

---

## Step 5: Pillars & Purpose (NEW - AI-Generated)

### Purpose
Transform all onboarding data into a persistent pillar map with actionable seed phrases.

### AI Generation

**Input to GPT-5 mini:**
- Motivations (why creating content)
- Monetization methods + details
- Products/services they sell (if applicable)
- Niche description
- 3 example topics

**Prompt:**

```
Based on this YouTube creator's profile, generate their 3 Strategic Content Pillars:

CREATOR PROFILE:
- Primary motivation: ${motivation}
- Monetization: ${monetizationMethod}
- Products/Services: ${productsDescription || "N/A"}
- Niche: ${niche}
- Topics they mentioned: ${topics.join(", ")}

Generate:
1. MONETIZATION PILLAR
   - Label: Short human-friendly name
   - Description: One sentence on why this matters
   - Example seed phrases: 3-5 two-word phrases for video ideas

2. TRENDING PILLAR  
   - Label: Topics likely to have spikes in their niche
   - Description: One sentence on why this matters
   - Example seed phrases: 3-5 two-word phrases for timely content

3. EVERGREEN PILLAR
   - Label: Durable, search-driven topics
   - Description: One sentence on why this matters
   - Example seed phrases: 3-5 two-word phrases for ranking content

Return as JSON:
{
  "monetization": { "label": "", "description": "", "seeds": [] },
  "trending": { "label": "", "description": "", "seeds": [] },
  "evergreen": { "label": "", "description": "", "seeds": [] }
}
```

### UI Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ✨ Your Strategic Pillars                                                 │
│                                                                             │
│   Based on your goals and niche, here's your personalized content strategy. │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  💰 MAKE MONEY                                                      │  │
│   │                                                                     │  │
│   │  "YouTube Coaching Offers"                                          │  │
│   │  Videos that promote your courses and coaching directly             │  │
│   │                                                                     │  │
│   │  Seed ideas:                                                        │  │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │
│   │  │ YouTube    │ │ Channel    │ │ Content    │ │ Growth     │       │  │
│   │  │ Coaching   │ │ Review     │ │ Strategy   │ │ Consulting │       │  │
│   │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  🚀 RIDE TRENDS                                                     │  │
│   │                                                                     │  │
│   │  "YouTube Updates & News"                                           │  │
│   │  Timely content that rides algorithm waves and gets discovered      │  │
│   │                                                                     │  │
│   │  Seed ideas:                                                        │  │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │
│   │  │ YouTube    │ │ MrBeast    │ │ Algorithm  │ │ Creator    │       │  │
│   │  │ Updates    │ │ Analysis   │ │ Changes    │ │ News       │       │  │
│   │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  🌲 BUILD EVERGREEN VIEWS                                           │  │
│   │                                                                     │  │
│   │  "YouTube Basics & Foundations"                                     │  │
│   │  Durable content that ranks in search and compounds over time       │  │
│   │                                                                     │  │
│   │  Seed ideas:                                                        │  │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │  │
│   │  │ How to     │ │ YouTube    │ │ Gear       │ │ Beginner   │       │  │
│   │  │ Start      │ │ Basics     │ │ Setup      │ │ Guide      │       │  │
│   │  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   [ Save These Pillars To My Channel Plan ]                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### UX Notes
- **Quick step** - User just reviews and confirms
- **Editable** - They can click to edit pillar labels if desired
- **Seed chips are clickable** - Later in Builder, clicking a chip pre-fills Step 1

### Data Captured & Persisted

```typescript
interface PillarStrategy {
  monetization: {
    label: string;          // "YouTube Coaching Offers"
    description: string;    // "Videos that promote your courses..."
    seeds: string[];        // ["YouTube Coaching", "Channel Review", ...]
  };
  trending: {
    label: string;
    description: string;
    seeds: string[];
  };
  evergreen: {
    label: string;
    description: string;
    seeds: string[];
  };
  createdAt: string;
  lastUpdated: string;
}
```

---

## Step 6: Your Audience (Existing Step 4 Placeholder)

### Purpose
Create a specific, detailed description of their target viewer.

### UI Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   👥 Who Is Your Ideal Viewer?                                              │
│                                                                             │
│   The more specific you are, the better we can match topics to YOUR         │
│   audience. Vague = weak scores. Specific = powerful.                       │
│                                                                             │
│   My viewers are...                                                         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  Who are they?                                                      │  │
│   │  Small YouTubers with under 1,000 subscribers                       │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  What's their main struggle or goal?                                │  │
│   │  Struggling to get views and grow their channel                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  What do they want to learn or achieve?                             │  │
│   │  Understand how the algorithm works and get discovered              │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   📊 What's Their Expertise Level?                                          │
│                                                                             │
│   ○ Beginners - Just getting started                                        │
│   ○ Intermediate - Know the basics, want to level up                        │
│   ○ Advanced - Experienced, looking for edge cases                          │
│   ○ Mixed - All skill levels watch my content                               │
│                                                                             │
│   [ Complete Setup → ]                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `audience_who` | text | Yes | "Small YouTubers under 1K subs" |
| `audience_struggle` | text | Yes | "Struggling to get views" |
| `audience_goal` | text | Yes | "Understand the algorithm" |
| `audience_expertise` | text | Yes | "beginner" |

---

## Builder Integration: Step 0 Entry Screen

### Purpose
When users enter "Built for the Viewer", show a light welcome mat that reduces "blank page" pain.

### Where It Lives
`/members/build/` - New entry component before routing to `/members/build/seed`

### UI Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ✨ What Would You Like To Work On Today?                                  │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  📍 USE A PILLAR                                                    │  │
│   │                                                                     │  │
│   │  Start from your strategic content pillars                          │  │
│   │                                                                     │  │
│   │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐       │  │
│   │  │ 💰 Make Money   │ │ 🚀 Ride Trends  │ │ 🌲 Evergreen    │       │  │
│   │  │ YouTube         │ │ YouTube         │ │ How to          │       │  │
│   │  │ Coaching        │ │ Updates         │ │ Start           │       │  │
│   │  │ ───────         │ │ ───────         │ │ ───────         │       │  │
│   │  │ Channel Review  │ │ Algorithm       │ │ YouTube         │       │  │
│   │  │ Content         │ │ Changes         │ │ Basics          │       │  │
│   │  │ Strategy        │ │ Creator News    │ │ Gear Setup      │       │  │
│   │  └─────────────────┘ └─────────────────┘ └─────────────────┘       │  │
│   │                                                                     │  │
│   │  (Click a seed to start with it pre-filled)                        │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ─── OR ───                                                                │
│                                                                             │
│   ┌───────────────────────────────────┐  ┌───────────────────────────────┐ │
│   │  💡 I ALREADY KNOW MY IDEA        │  │  ✨ INSPIRE ME                │ │
│   │                                   │  │                               │ │
│   │  Jump straight to entering        │  │  Generate fresh seed ideas    │ │
│   │  your seed phrase                 │  │  from your pillars            │ │
│   │                                   │  │                               │ │
│   │  [ Enter My Seed → ]              │  │  [ Get Ideas → ]              │ │
│   └───────────────────────────────────┘  └───────────────────────────────┘ │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   💡 TIP: Your last 4 videos were monetization-focused.                    │
│   Consider an Evergreen video to balance your content mix.                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Behavior

**"Use a Pillar" Flow:**
1. User sees their 3 pillar cards with seed suggestions
2. User clicks a seed phrase (e.g., "YouTube Coaching")
3. System navigates to `/members/build/seed` with `?seed=YouTube+Coaching` pre-filled
4. Step 1 (Seed) input is pre-populated and focused

**"I Already Know My Idea" Flow:**
1. User clicks "Enter My Seed"
2. System navigates directly to `/members/build/seed`
3. Input field is empty and focused

**"Inspire Me" Flow:**
1. User clicks "Get Ideas"
2. System calls GPT-5 mini with pillar context
3. Shows 5-6 fresh seed candidates per pillar
4. User picks one, proceeds to Step 1 with seed pre-filled

### Connection to Pillar Progress

If the user has Pillar Progress data showing imbalance:
- Show a coaching tip at the bottom
- Gently highlight the underused pillar card
- **Never force** - just recommend

---

## Pillar Progress Module (Optional)

### Purpose
A separate, optional module that helps creators track their content against their pillar strategy.

### Where It Lives
`/members/progress` or `/members/pulse` (Channel Compass / Pillar Progress)

### Data Source
- User's YouTube RSS feed for published videos
- Optional: YouTube Data API for view counts (later enhancement)

### Core Workflow

**When user opens the module:**
1. Show count of new videos since last check-in
2. For each video, let user tag:
   - Which pillar? (Monetization / Trending / Evergreen / None)
   - Quick performance rating (Underperformed / About Average / Overperformed)
3. Optional "Advanced metrics" accordion for manual entry

### UI Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   📊 Your Pillar Mix                                                        │
│                                                                             │
│   Last 10 videos vs recommended mix                                         │
│                                                                             │
│   MONETIZATION  ████████░░░░░░░░░░░░  40%  (Target: 20-30%)  ⚠️ Heavy      │
│   TRENDING      ████░░░░░░░░░░░░░░░░  20%  (Target: 20-30%)  ✓ Good        │
│   EVERGREEN     ████░░░░░░░░░░░░░░░░  20%  (Target: 40-50%)  ⚠️ Light      │
│   UNTAGGED      ████░░░░░░░░░░░░░░░░  20%                                  │
│                                                                             │
│   💡 "You haven't published an Evergreen video in your last 5 uploads."    │
│   💡 "Consider balancing with a search-focused topic next."                 │
│                                                                             │
│   ─────────────────────────────────────────────────────────────────────    │
│                                                                             │
│   🆕 New Videos To Review (2)                                               │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  "How I Grew to 10K Subscribers"             Published: Nov 28      │  │
│   │                                                                     │  │
│   │  Pillar: [💰] [🚀] [🌲] [—]    Performance: [😕] [😐] [🎉]           │  │
│   │                                                                     │  │
│   │  ▶ Advanced Metrics                                                 │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  "YouTube Shorts Are DEAD?!"                 Published: Nov 25      │  │
│   │                                                                     │  │
│   │  Pillar: [💰] [🚀] [🌲] [—]    Performance: [😕] [😐] [🎉]           │  │
│   │                                                                     │  │
│   │  ▶ Advanced Metrics                                                 │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Advanced Metrics (Optional Accordion)

When expanded:
- CTR (text input, %)
- Average View Duration (text input)
- Views at 24 hours (number)
- Comments (number)
- Quick notes (textarea)

**Design principle**: Completely optional. Never overwhelming.

### Data Schema

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
  lastUpdatedAt: string;
}
```

---

## Database Schema

```sql
-- Pillar strategy (stored on user/channel)
ALTER TABLE channels ADD COLUMN IF NOT EXISTS pillar_strategy JSONB;
-- {
--   monetization: { label, description, seeds: [] },
--   trending: { label, description, seeds: [] },
--   evergreen: { label, description, seeds: [] },
--   createdAt, lastUpdated
-- }

-- Motivation and goals (from new Step 2)
ALTER TABLE channels ADD COLUMN IF NOT EXISTS motivations JSONB;
-- ["money", "brand"]

ALTER TABLE channels ADD COLUMN IF NOT EXISTS primary_motivation TEXT;
-- "money"

-- Session pillar tagging (for Builder sessions)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS target_pillar TEXT;
-- "monetization" | "trending" | "evergreen" | null

-- Video tracking (for Pillar Progress)
CREATE TABLE IF NOT EXISTS video_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  channel_id UUID REFERENCES channels(id),
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  published_at TIMESTAMP NOT NULL,
  pillar_tag TEXT,
  performance_rating TEXT,
  metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);
```

---

## Implementation Priority

### Phase 1: Complete Onboarding
1. Add Step 2 (Motivations/Goals) - NEW
2. Resize Step 4 inputs to match Step 3's card sizing
3. Build Step 5 (Pillars & Purpose AI generation) - NEW
4. Build Step 6 (Audience) - Currently placeholder
5. Update database schema

### Phase 2: Builder Step 0
1. Create Step 0 entry screen at `/members/build/`
2. Wire pillar seeds to pre-fill Step 1
3. Add "Inspire Me" GPT integration
4. Connect to Pillar Progress data for coaching tips

### Phase 3: Pillar Progress Module
1. Create RSS feed integration
2. Build video tagging UI
3. Add pillar mix visualization
4. Connect coaching tips to Builder Step 0

### Phase 4: Enhancements (Later)
1. YouTube Analytics API integration (optional)
2. Automatic pillar suggestions based on video titles
3. Weekly/monthly pillar reports

---

## Success Metrics

How we know the Pillar Strategy is working:

1. **Onboarding Completion** - Do users finish all 6 steps?
2. **Pillar Usage** - Are users selecting from pillars in Builder Step 0?
3. **Balance Tracking** - Are users tagging videos in Pillar Progress?
4. **Strategy Adherence** - Are users hitting their target percentages?
5. **Outcomes** - Do users who follow pillar strategy report better results?

---

## Summary

The Pillar Strategy transforms SuperTopics from "a topic research tool" into **"the system that helps creators grow AND make money."**

**Key Components:**
1. ✅ Strategic 3-pillar system (Monetization, Trending, Evergreen)
2. ✅ AI-generated pillars during onboarding (Step 5)
3. ✅ Builder Step 0 that reduces blank-page friction
4. ✅ Optional Pillar Progress module for tracking
5. ✅ Coaching tips that connect tracking to recommendations

**What makes it work:**
- Onboarding creates pillars ONCE
- Builder reads from persistent pillars to reduce friction
- Advanced users can bypass with "I Already Know My Idea"
- Light-touch tracking keeps users strategic without being tedious

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-11-30 | Initial specification |
| 0.2 | 2025-12-01 | **Major update**: Reorganized as 6-step onboarding flow. Added Step 2 (Motivations). Added Step 5 (AI-generated Pillars & Purpose). Added Builder Step 0 entry screen. Added Pillar Progress module specification. Renamed pillars to Monetization/Trending/Evergreen. |
