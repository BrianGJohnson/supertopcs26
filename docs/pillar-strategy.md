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

## Step 3: What's Your Main Money Focus? (Enhanced)

### Purpose
Understand their monetization strategy AND whether they have an existing channel. **This data is CRITICAL for GPT-5 mini to generate personalized monetization pillars.**

### UI Design (Already Built - Great Card Sizing)

Keep the existing large card layout:
- YouTube Ads
- Sell Products
- Affiliate Sales
- Sponsorships
- Not Sure Yet

**Key UX**: Users can select ANY number of options. First selection = primary focus. Order matters for priority.

### Follow-Up Questions (Expand When Selected)

Based on monetization selection:
- **YouTube Ads**: "What's your current AdSense status?" (Dropdown)
- **Sell Products**: "What do you sell or plan to sell?" (Text input - CRITICAL for GPT!)
- **Affiliate**: "What types of products would you promote?" (Text input - CRITICAL for GPT!)
- **Sponsorships**: "What brands align with your channel?" (Text input)

### Data Captured (ALL MUST BE SAVED!)

| Field | Type | Required | Example | Used By GPT |
|-------|------|----------|---------|-------------|
| `monetization_methods` | array | Yes (1+) | ["products", "affiliate"] | ✅ Yes |
| `monetization_priority` | array | Yes | ["products", "affiliate"] (ordered) | ✅ Yes |
| `products_description` | text | If selected | "my own youtube tool called SuperTopics that helps youtubers identify topics" | ✅ **CRITICAL** |
| `affiliate_products` | text | If selected | "Software products, products that Youtubers would buy" | ✅ **CRITICAL** |
| `adsense_status` | text | If selected | "earning" / "just_started" / "not_eligible" | ✅ Yes |
| `sponsorship_niche` | text | If selected | "Tech companies, creator tools" | ✅ Yes |
| `has_channel` | boolean | Yes | true | ✅ Yes |
| `channel_url` | text | If has_channel | "youtube.com/@..." | For future use |

### Why This Data Matters

When GPT-5 mini generates the Monetization pillar in Step 5, it needs to know:

**If user sells products:**
> "Since you're selling **SuperTopics, a YouTube topic research tool**, these are the exact phrases your ideal customers search for..."

**If user does affiliate:**
> "Since you promote **software and tools for YouTubers**, these topics attract viewers who are actively shopping..."

Without this specific data, the monetization pillar would be generic and useless.

**Status**: ⚠️ UI built, but save functionality needs to be connected!

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
Transform all onboarding data into a persistent pillar map with actionable seed phrases. This is a **teaching moment** where we validate their niche AND set up their content strategy.

### Progressive Reveal (Single Page, Multiple Sections)

The page reveals information progressively as the user digests each section:

1. **Section 1: Niche Validation** - First thing they see
2. **Section 2: Strategy Introduction** - After they click "Continue"
3. **Section 3: Evergreen Pillar** - With selectable seed phrases
4. **Section 4: Trending Pillar** - With topic categories to watch
5. **Section 5: Monetization Pillar** - With product-specific seed phrases

### Single GPT-5 Mini Call

**When**: When user lands on Step 5, we call GPT-5 mini ONCE with all saved onboarding data.

**Model Config** (same as refine page):
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

**Input to GPT-5 mini:**
- From Step 2: Motivations (why creating content)
- From Step 3: Monetization methods + details + priority order
- From Step 3: Products/services they sell (CRITICAL for monetization pillar)
- From Step 3: Has channel + channel URL
- From Step 4: Niche description
- From Step 4: 3 example topics they care about

**System Prompt:**

```
You are helping a YouTube creator understand their niche and build a content strategy.

Your job is to:
1. VALIDATE their niche - Score demand 1-10 and give honest, encouraging feedback
2. GENERATE three content pillars with specific seed phrases

IMPORTANT RULES FOR SEED PHRASES:
- ALL seed phrases must be exactly 2 words
- Evergreen seeds: Search-driven phrases viewers type into YouTube (e.g., "youtube basics", "thumbnail design")
- Trending seeds: Topic CATEGORIES to watch for timely content (e.g., "algorithm updates", "creator news")
- Monetization seeds: Phrases directly related to their products/services that buyers would search

The creator wants to make money. Their monetization pillar should be highly specific to what they sell or promote.

Return valid JSON only.
```

**User Prompt:**

```
CREATOR PROFILE:
- Primary motivation: ${primaryMotivation}
- All motivations: ${motivations.join(", ")}
- Primary revenue focus: ${primaryMonetization}
- All revenue methods: ${monetizationMethods.join(", ")}
- Product/Service details: ${productsDescription || "N/A"}
- Affiliate focus: ${affiliateProducts || "N/A"}
- Has existing channel: ${hasChannel}
- Niche: ${niche}
- Topics they mentioned: ${topics.join(", ")}

Generate their niche validation and 3 strategic pillars.
```

**Expected Response:**

```json
{
  "nicheValidation": {
    "nicheName": "YouTube Education",
    "demandScore": 8,
    "demandLabel": "Strong",
    "summary": "This is a proven niche with consistent viewer demand. Creators like vidIQ, Think Media, and Channel Makers have built large audiences here.",
    "topChannels": ["vidIQ", "Think Media", "Channel Makers"]
  },
  "pillars": {
    "evergreen": {
      "label": "YouTube Fundamentals",
      "teachingMoment": "These topics get searched every single day. New creators are always looking for the basics. This content compounds over time and keeps getting views for years.",
      "seeds": ["youtube basics", "channel setup", "video editing", "thumbnail design", "content planning", "filming tips", "audio quality", "lighting setup"]
    },
    "trending": {
      "label": "Creator News & Updates",
      "teachingMoment": "When YouTube announces changes or big creators make news, viewers search for reactions and explanations. These videos spike fast but require you to move quickly.",
      "seeds": ["algorithm updates", "youtube news", "creator drama", "new features", "platform changes", "monetization news"]
    },
    "monetization": {
      "label": "SuperTopics & Topic Research",
      "teachingMoment": "Since you're selling SuperTopics, a YouTube topic research tool, these are the exact phrases your ideal customers are searching for. Videos on these topics attract viewers who are ready to invest in their channel.",
      "seeds": ["topic research", "find ideas", "niche selection", "keyword strategy", "video planning", "content ideas", "what to upload", "video topics"]
    }
  }
}
```

### Seed Phrase Requirements

| Pillar | Seed Type | Count | Example |
|--------|-----------|-------|---------|
| **Evergreen** | 2-word search phrases viewers type | 5-8 | "youtube basics", "thumbnail design" |
| **Trending** | 2-word topic categories to monitor | 4-6 | "algorithm updates", "creator news" |
| **Monetization** | 2-word phrases related to their product/service | 5-8 | "topic research", "find ideas" |

### User Interaction: Seed Selection

For **Evergreen** and **Monetization** pillars:
- Seeds are displayed as clickable chips
- User clicks seeds to add them to their "basket" (saved pillars)
- These become quick-start options in Builder later

For **Trending** pillar:
- Seeds are topic CATEGORIES, not specific phrases
- User understands these are areas to watch
- When they're ready to make a trending video, they check the Trending module OR ask GPT for current ideas

### UI Design: Progressive Reveal

**Section 1: Niche Validation (First View)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                        🎯 Your Channel Direction                            │
│                                                                             │
│                        "YouTube Education"                                  │
│                                                                             │
│                  Demand: 8/10 ████████░░ Strong                             │
│                                                                             │
│   "This is a proven niche with consistent viewer demand. Creators like      │
│    vidIQ, Think Media, and Channel Makers have built large audiences here." │
│                                                                             │
│                      [See Your Content Strategy →]                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Section 2: Strategy Introduction (After Click)**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    📊 Your Personalized Content Strategy                    │
│                                                                             │
│   The most successful YouTubers don't make random videos.                   │
│   They balance THREE types of content:                                      │
│                                                                             │
│   🌲 Evergreen    Videos that get views for months or years                 │
│   🚀 Trending     Videos that spike when news breaks                        │
│   💰 Monetization Videos that drive revenue for your business               │
│                                                                             │
│   We've built your personalized pillars based on your goals.                │
│   Click the seed phrases you want to save to your account.                  │
│                                                                             │
│                         [Show My Pillars →]                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Section 3: Evergreen Pillar**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   🌲 EVERGREEN: YouTube Fundamentals                                        │
│                                                                             │
│   "These topics get searched every single day. New creators are always      │
│    looking for the basics. This content compounds over time."               │
│                                                                             │
│   Click to add to your saved seeds:                                         │
│                                                                             │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│   │ ✓ youtube    │ │   channel    │ │ ✓ video      │ │   thumbnail  │      │
│   │   basics     │ │   setup      │ │   editing    │ │   design     │      │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│   │   content    │ │   filming    │ │   audio      │ │   lighting   │      │
│   │   planning   │ │   tips       │ │   quality    │ │   setup      │      │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                                             │
│   Selected: 2 seeds                              [Continue to Trending →]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Section 4: Trending Pillar**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   🚀 TRENDING: Creator News & Updates                                       │
│                                                                             │
│   "When YouTube announces changes or big creators make news, viewers        │
│    search for reactions. These videos spike fast but require quick action." │
│                                                                             │
│   These are TOPIC CATEGORIES to watch. When news breaks, check our          │
│   Trending module or come back here for fresh ideas.                        │
│                                                                             │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│   │  algorithm   │ │   youtube    │ │   creator    │ │    new       │      │
│   │  updates     │ │   news       │ │   drama      │ │   features   │      │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│   ┌──────────────┐ ┌──────────────┐                                        │
│   │  platform    │ │ monetization │                                        │
│   │  changes     │ │   news       │                                        │
│   └──────────────┘ └──────────────┘                                        │
│                                                                             │
│   💡 Trending topics change fast. We'll help you catch waves in real-time. │
│                                                                             │
│                                          [Continue to Monetization →]       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Section 5: Monetization Pillar**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   💰 MONETIZATION: SuperTopics & Topic Research                             │
│                                                                             │
│   "Since you're selling SuperTopics, a YouTube topic research tool,         │
│    these are the exact phrases your ideal customers search for.             │
│    Videos on these topics attract viewers ready to invest."                 │
│                                                                             │
│   Click to add to your saved seeds:                                         │
│                                                                             │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│   │ ✓ topic      │ │ ✓ find       │ │   niche      │ │   keyword    │      │
│   │   research   │ │   ideas      │ │   selection  │ │   strategy   │      │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│   │   video      │ │   content    │ │   what to    │ │   video      │      │
│   │   planning   │ │   ideas      │ │   upload     │ │   topics     │      │
│   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                                             │
│   Selected: 2 seeds                                                         │
│                                                                             │
│                              [Save Pillars & Continue →]                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### UX Notes
- **Progressive reveal** - User sees one section at a time, clicks to reveal more
- **Teaching moments** - Each pillar explains WHY this matters (education + setup)
- **Selectable seeds** - Evergreen and Monetization seeds are clickable to add to basket
- **Trending is different** - Trending shows categories, not clickable seeds (because trends change)
- **Seed chips are clickable** - Later in Builder, clicking a saved seed pre-fills Step 1

### Data Captured & Persisted

```typescript
interface PillarStrategy {
  nicheValidation: {
    nicheName: string;        // "YouTube Education"
    demandScore: number;      // 8
    demandLabel: string;      // "Strong"
    summary: string;          // GPT's friendly summary
    topChannels: string[];    // ["vidIQ", "Think Media"]
  };
  evergreen: {
    label: string;            // "YouTube Fundamentals"
    teachingMoment: string;   // Why this pillar matters
    seeds: string[];          // All suggested seeds (5-8)
    selectedSeeds: string[];  // Seeds user clicked to save
  };
  trending: {
    label: string;            // "Creator News & Updates"
    teachingMoment: string;   // Why this pillar matters  
    seeds: string[];          // Topic categories (4-6)
  };
  monetization: {
    label: string;            // "SuperTopics & Topic Research"
    teachingMoment: string;   // Why this pillar matters (references their product!)
    seeds: string[];          // All suggested seeds (5-8)
    selectedSeeds: string[];  // Seeds user clicked to save
  };
  createdAt: string;
  lastUpdated: string;
}
```

### What Gets Saved to Database

After Step 5, we save to the `channels` table:
- `pillar_strategy` (JSONB) - The full PillarStrategy object above
- `niche_validated` (boolean) - True once they've seen the validation
- `niche_demand_score` (integer) - 1-10 score for quick reference

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
| 0.2 | 2025-12-01 | Reorganized as 6-step onboarding flow. Added Step 2 (Motivations). Added Step 5 (AI-generated Pillars & Purpose). Added Builder Step 0 entry screen. Added Pillar Progress module specification. |
| 0.3 | 2025-12-01 | **Major refinement**: Step 5 now uses progressive reveal (single page, multiple sections). Added detailed GPT-5 mini prompt and expected response. Clarified seed phrase requirements (2 words, specific to pillar type). Added seed selection UX (click to add to basket). Clarified that Step 3 data is CRITICAL for personalized monetization pillar. Added teaching moments to each pillar reveal. |
