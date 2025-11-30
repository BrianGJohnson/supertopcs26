# Onboarding Flow Specification

## Overview

The onboarding flow gathers just enough information to power Audience Fit scoring while getting users into the Builder module as quickly as possible.

**Core Principle**: Fast → Simple → Actionable

Every question must directly improve Audience Fit scoring accuracy. No vanity questions, no "nice to know" data.

---

## The Goal

After onboarding, we should be able to answer:

1. **What does this channel cover?** (niche/topic)
2. **What kinds of videos do they make?** (content style)
3. **Who is their audience?** (target viewer)
4. **What are they open to making?** (flexibility)

That's it. Four things. Everything in onboarding exists to answer these four questions.

---

## Two Onboarding Paths

### Path A: "I have a YouTube channel"
- User provides channel URL
- We extract channel name, description, subscriber count
- Optional: Analyze recent videos to extract patterns
- Faster because some data is auto-populated

### Path B: "I'm researching a new channel idea"
- No existing channel to pull from
- User manually describes what they want to create
- Slightly more questions needed

---

## Recommended Flow: 4 Pages

Based on your requirement for speed while gathering enough data, here's a lean 4-page flow:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Page 1        │ ──▶ │   Page 2        │ ──▶ │   Page 3        │ ──▶ │   Page 4        │
│   Channel       │     │   Content       │     │   Audience      │     │   Flexibility   │
│   Setup         │     │   Style         │     │                 │     │   (Optional)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
     ~30 sec                 ~45 sec                 ~30 sec                 ~20 sec
```

**Total Time**: ~2 minutes for thorough completion

---

## Page 1: Channel Setup

### Purpose
Establish the channel identity and niche.

### For Existing Channels (Path A)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Let's connect your channel                                    │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ Paste your YouTube channel URL                         │    │
│   │ https://youtube.com/@yourchannel                       │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   [Connect Channel]                                             │
│                                                                 │
│   ─── or ───                                                    │
│                                                                 │
│   [I'm researching a new channel idea]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**On Connect:**
- Call YouTube Data API v3 to fetch:
  - Channel name
  - Channel description
  - Subscriber count
  - Optional: Last 10 video titles (for pattern extraction)

### For New Channel Ideas (Path B)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   What's your channel about?                                    │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ Give your channel a name                               │    │
│   │ My Tech Reviews                                        │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ What's the main topic? (1-3 words)                     │    │
│   │ Tech Reviews                                           │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `channel_name` | text | Yes | "TechFlow Reviews" |
| `channel_niche` | text | Yes | "Tech Reviews" |
| `youtube_channel_id` | text | Path A only | "UC123xyz" |
| `channel_description` | text | No | Auto-fetched or skipped |
| `subscriber_count` | number | No | 25000 |
| `is_new_channel` | boolean | Yes | false |

---

## Page 2: Content Style

### Purpose
Determine WHERE on the Information ↔ Entertainment spectrum this channel sits.

### The Spectrum Question

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   What kind of videos do you make?                              │
│                                                                 │
│   INFORMATION                              ENTERTAINMENT        │
│   ◀──────────────────────────────────────────────────────▶     │
│                                                                 │
│   [ Tutorials  ]  [ Explainers ]  [ Edutainment ]              │
│   [ Commentary ]  [ News/Updates]  [ Entertainment ]            │
│                                                                 │
│   ─────────────────────────────────────────────────────────    │
│                                                                 │
│   Select all that apply:                                        │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│   │ How-To's  │  │ Reviews   │  │ First     │  │ Tips &    │  │
│   │           │  │           │  │ Impressions│  │ Tricks    │  │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│   │ Comparisons│ │ Hot Takes │  │ Reactions │  │ Vlogs     │  │
│   │ X vs Y    │  │ Opinions  │  │           │  │           │  │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│   │ News      │  │ Deep Dives│  │ Story-    │  │ Other     │  │
│   │ Updates   │  │ Analysis  │  │ telling   │  │           │  │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Insight: First Impressions vs. Full Tutorials

If user selects "Reviews" but NOT "How-To's", show a clarifying question:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Quick question about instructional content...                 │
│                                                                 │
│   Even if you don't make full tutorials, would you consider:    │
│                                                                 │
│   ○ First Impressions                                           │
│     Quick reactions after trying something new                  │
│     (much faster to make than full tutorials)                   │
│                                                                 │
│   ○ Quick Tips                                                  │
│     60-second tips, no deep explanations                        │
│                                                                 │
│   ○ No, I really don't make instructional content               │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `content_style` | text | Yes | "edutainment" |
| `style_spectrum` | number (1-10) | Yes | 4 (lean informational) |
| `video_types` | array | Yes | ["reviews", "first-impressions", "tips"] |
| `video_types_avoid` | array | No | ["tutorials", "news"] |
| `open_to_first_impressions` | boolean | No | true |
| `open_to_quick_tips` | boolean | No | true |

---

## Page 3: Your Audience

### Purpose
Understand who watches this channel and what they expect.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Who watches your channel?                                     │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ Describe your typical viewer in 1-2 sentences         │    │
│   │ Example: "Beginners who just started their YouTube    │    │
│   │ channel and want to grow faster."                     │    │
│   │                                                       │    │
│   │                                                       │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   What's their skill level with your topic?                     │
│                                                                 │
│   ○ Beginners - Just getting started                            │
│   ○ Intermediate - Know the basics, want to level up            │
│   ○ Advanced - Experienced, looking for edge cases              │
│   ○ Mixed - All skill levels watch my content                   │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `target_audience` | text | Yes | "Small YouTubers trying to grow their channel" |
| `audience_expertise` | text | Yes | "beginner" |

---

## Page 4: Flexibility (Optional)

### Purpose
Capture adjacent topics the creator might explore.

This page is OPTIONAL - user can skip it. But having this data improves Audience Fit scoring for edge cases.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Anything else you're interested in covering?                  │
│                                                                 │
│   These are topics ADJACENT to your main niche that you         │
│   might explore in the future.                                  │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ Add topics (comma separated)                          │    │
│   │ streaming setup, content strategy, AI tools           │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   [Complete Setup]        [Skip for now]                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `open_to_exploring` | array | No | ["streaming setup", "content strategy", "AI tools"] |

---

## Video Title Analysis (Optional Enhancement)

### The Problem You Encountered

When you added raw video titles to the GPT prompt, scoring got WORSE because:
- Titles are heavily SEO-optimized (unnatural)
- Formats vary wildly (clickbait vs. descriptive)
- Too much noise for GPT to extract signal

### A Better Approach: Pattern Extraction

Instead of sending raw titles, extract PATTERNS and store them:

```typescript
// Instead of: "MY FIRST VIDEO! | Starting a YouTube Channel in 2025!!"
// Extract:    "first impressions content, personal journey style, 2025 focus"

async function extractContentPatterns(videoTitles: string[]): Promise<string> {
  // Use GPT to summarize patterns, not the titles themselves
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: "Extract content patterns from video titles. Return 3-5 short phrases describing the type of content, NOT the actual topics." },
      { role: "user", content: `Video titles:\n${videoTitles.join('\n')}\n\nWhat content PATTERNS do you see?` }
    ]
  });
  
  return response.choices[0].message.content;
}

// Store the pattern summary, not the titles
// e.g., "how-to tutorials, beginner-focused, step-by-step format, uses numbered lists"
```

### When to Use This

Only call this if:
1. User connected a real YouTube channel (Path A)
2. They have 5+ videos
3. We want to enhance scoring (not required for MVP)

**Store the pattern summary in `channel_context.content_patterns`.**

---

## Database Schema

### Channels Table (Extended)

```sql
ALTER TABLE channels
  ADD COLUMN content_style TEXT,           -- tutorial, entertainment, edutainment, news
  ADD COLUMN style_spectrum INTEGER,       -- 1-10 (1=info, 10=entertainment)
  ADD COLUMN video_types JSONB,            -- ["reviews", "tutorials", "tips"]
  ADD COLUMN video_types_avoid JSONB,      -- ["news", "reactions"]
  ADD COLUMN target_audience TEXT,         -- "Small YouTubers looking to grow"
  ADD COLUMN audience_expertise TEXT,      -- beginner, intermediate, advanced, mixed
  ADD COLUMN open_to_exploring JSONB,      -- ["streaming", "AI tools"]
  ADD COLUMN content_patterns TEXT,        -- Extracted from video analysis
  ADD COLUMN onboarding_completed_at TIMESTAMP;
```

### Alternative: Separate Onboarding Table

If you prefer to keep channels table clean:

```sql
CREATE TABLE channel_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Page 1: Channel Setup
  is_new_channel BOOLEAN DEFAULT FALSE,
  youtube_channel_url TEXT,
  
  -- Page 2: Content Style
  content_style TEXT,                      -- tutorial, entertainment, edutainment
  style_spectrum INTEGER,                  -- 1-10 scale
  video_types JSONB,                       -- what they make
  video_types_avoid JSONB,                 -- what they avoid
  open_to_first_impressions BOOLEAN,
  open_to_quick_tips BOOLEAN,
  
  -- Page 3: Audience
  target_audience TEXT,
  audience_expertise TEXT,                 -- beginner, intermediate, advanced, mixed
  
  -- Page 4: Flexibility
  open_to_exploring JSONB,
  
  -- Video Analysis (if performed)
  content_patterns TEXT,                   -- GPT-extracted patterns
  analyzed_video_count INTEGER,
  
  -- Meta
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

## Onboarding Context Object

This is what gets passed to Audience Fit scoring:

```typescript
interface OnboardingContext {
  // Channel identity
  channelName: string;
  channelNiche: string;
  isNewChannel: boolean;
  
  // Content style
  contentStyle: 'tutorial' | 'entertainment' | 'edutainment' | 'news' | 'commentary';
  styleSpectrum: number;  // 1-10
  videoTypes: string[];
  videoTypesAvoid: string[];
  
  // Audience
  targetAudience: string;
  audienceExpertise: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  
  // Flexibility
  openToExploring: string[];
  
  // Optional enhancements
  contentPatterns?: string;  // From video analysis
}
```

---

## Validation Rules

### Required Before Leaving Onboarding

| Field | Validation |
|-------|------------|
| `channel_name` | Non-empty, max 100 chars |
| `channel_niche` | Non-empty, 1-5 words |
| `content_style` | Must select at least one category |
| `video_types` | Must select at least one type |
| `target_audience` | Non-empty, 10-300 chars |
| `audience_expertise` | Must select one option |

### Optional Fields

| Field | Default if Skipped |
|-------|-------------------|
| `video_types_avoid` | `[]` |
| `open_to_exploring` | `[]` |
| `content_patterns` | `null` |
| `style_spectrum` | Inferred from content_style |

---

## Onboarding Completion Check

Before allowing access to Builder module:

```typescript
function isOnboardingComplete(channel: Channel): boolean {
  return Boolean(
    channel.niche &&
    channel.content_style &&
    channel.video_types?.length > 0 &&
    channel.target_audience &&
    channel.audience_expertise
  );
}
```

If incomplete, redirect to `/members/onboarding`.

---

## API Endpoints

### POST /api/channels/[channelId]/onboarding

**Save onboarding progress (can be called multiple times)**

```json
{
  "page": 2,
  "data": {
    "content_style": "edutainment",
    "style_spectrum": 4,
    "video_types": ["reviews", "first-impressions", "tips"]
  }
}
```

### POST /api/channels/[channelId]/onboarding/complete

**Mark onboarding as complete**

Returns error if required fields are missing.

### GET /api/channels/[channelId]/onboarding/status

**Check onboarding status**

```json
{
  "complete": false,
  "completedPages": [1, 2],
  "missingFields": ["target_audience", "audience_expertise"]
}
```

---

## UI/UX Considerations

### Progress Indicator
- Show step dots: ● ● ○ ○ (Page 2 of 4)
- Allow back navigation
- Auto-save on page change

### Skip vs. Complete
- Pages 1-3: Required, no skip
- Page 4: Skippable with "Skip for now"

### Path A Enhancement
If user connects YouTube channel, pre-fill what we can:
- Channel name (from API)
- Suggested niche (from channel description)
- Content patterns (if we run analysis)

### Mobile-First
- One question per screen on mobile
- Large tap targets for selection options
- Minimal typing required

---

## Files (Planned)

| File | Purpose |
|------|---------|
| `/src/app/members/onboarding/page.tsx` | Main onboarding flow |
| `/src/app/members/onboarding/_components/` | Individual page components |
| `/src/app/api/channels/[channelId]/onboarding/route.ts` | Save progress |
| `/src/lib/onboarding-context.ts` | Types and validation |
| `/docs/onboarding-specification.md` | This documentation |

---

## Summary: What Powers Audience Fit Scoring

```
ONBOARDING DATA                    →    AUDIENCE FIT SCORING
═══════════════════════════════════════════════════════════════

Channel niche: "Tech Reviews"      →    "Does this phrase fit tech reviews?"
Content style: "Edutainment"       →    "Does this phrase match edutainment?"
Video types: ["reviews", "tips"]   →    "Is this a review or tips phrase?"
Target audience: "Beginners"       →    "Is this beginner-appropriate?"
Audience expertise: "beginner"     →    Boost beginner-friendly phrases
Open to exploring: ["AI tools"]    →    Don't penalize AI-related phrases
Content patterns: "comparison..."  →    Slight boost for comparison phrases
```

**The Formula**:
> Audience Fit Score = f(phrase, onboarding_context)

Without onboarding data, we can't score Audience Fit. With it, we can precisely determine whether each phrase belongs on this specific channel.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 (Draft) | 2025-11-30 | Initial specification |
