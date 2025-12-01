# Onboarding Flow Specification v2

## Overview

The onboarding flow gathers strategic information to power Audience Fit scoring while educating creators about the importance of FOCUS on YouTube.

**Core Principle**: Focus → Flexibility → Fit

SuperTopics is built for creators who understand that success on YouTube comes from serving ONE core audience exceptionally well. The onboarding flow helps them define that focus while opening their eyes to content format flexibility.

---

## The Philosophy

### Why Focus Matters

> "If you're not in a niche, it's going to be really hard for you on YouTube, and it's going to be hard to get great scores with this tool because this tool is really about FOCUS - focusing on one core audience."

SuperTopics is **Built for the Viewer**. That means:
- Every topic suggestion serves a specific audience
- Audience Fit scoring rewards focus, not breadth
- Vague targeting = weak scores
- Precise targeting = powerful recommendations

### The Opportunity We're Unlocking

Many creators think narrowly about content formats:
- "I don't do tutorials" = They miss opportunities
- "That's not my style" = They limit their reach

**Our job**: Help them see that a single TOPIC can become many VIDEO TYPES:
- "iPhone 17 camera" could be:
  - Full tutorial (20 min)
  - First impressions (8 min) ← Lower barrier!
  - Quick tips (2 min)
  - Comparison video
  - Reaction to Apple event

The more formats they're open to, the more opportunities we can surface.

---

## The Goal

After onboarding, we generate a **Creator Context Summary** (3-5 sentences) that captures:

1. **Core Niche** - The main topic area (YouTube Education)
2. **Content Pillars** - 2-4 sub-topics they explore (Algorithm, Content Creation, AI Tools)
3. **Content Formats** - What types of videos they make AND are open to
4. **Target Audience** - Specific viewer description with expertise level
5. **Flexibility Signals** - What adjacent topics they might explore

This summary powers ALL Audience Fit scoring.

---

## Three Pages

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Page 1        │ ──▶ │   Page 2        │ ──▶ │   Page 3        │
│   Your Niche    │     │   Content       │     │   Your          │
│   & Pillars     │     │   Flexibility   │     │   Audience      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     ~60 sec                 ~60 sec                 ~45 sec
```

**Total Time**: ~3 minutes for thoughtful completion

---

## Page 1: Your Niche & Content Pillars

### Purpose
Establish their core niche AND the 2-4 pillars/sub-topics they cover within it.

### The Problem with Single-Word Niches

If a creator says "YouTube Education" alone:
- Too broad for precise scoring
- Misses their unique angle
- GPT can't distinguish them from thousands of others

### The Solution: Niche + Pillars

```
Core Niche: YouTube Education
   │
   ├── Pillar 1: Algorithm & Discovery
   ├── Pillar 2: Content Creation Tips  
   ├── Pillar 3: AI Tools for Creators
   └── Pillar 4: Channel Growth Strategy
```

Now GPT understands: "This creator helps YouTubers grow, with special focus on algorithm, content, AI, and strategy."

### UI Flow

**Step 1: Core Niche Input**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🎯 What's Your Channel's Core Focus?                          │
│                                                                 │
│   Be specific but not too narrow. 1-3 words that describe      │
│   the MAIN topic your channel revolves around.                  │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ YouTube Education                                      │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   Examples: "Tech Reviews", "Poodle Grooming", "Budget Travel", │
│   "Japanese Cooking", "Minecraft Builds", "Personal Finance"    │
│                                                                 │
│   [Continue to Pillars →]                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Step 2: AI-Suggested Pillars**

After they enter their niche, we call GPT-4o-mini to suggest popular sub-topics:

```typescript
// API call to generate pillar suggestions
const prompt = `
A YouTube creator's core niche is: "${userNiche}"

Suggest 6-8 popular content pillars (sub-topics) that successful 
creators in this niche typically cover. These should be specific 
enough to be useful but broad enough to generate many video ideas.

Format: Return as JSON array of objects with "pillar" and "description" fields.
`;
```

**UI After AI Suggestions:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📊 Content Pillars                                            │
│                                                                 │
│   Select 2-4 pillars that describe the topics you cover         │
│   within your niche. This helps us find the RIGHT topics        │
│   for YOUR channel.                                             │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ ✓  Algorithm & Discovery                                 │  │
│   │    How YouTube recommends videos, getting discovered     │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ ✓  Content Creation Tips                                 │  │
│   │    Filming, editing, thumbnails, titles                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ ✓  AI Tools for Creators                                 │  │
│   │    Using AI to create content faster                     │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │    Monetization Strategies                               │  │
│   │    Making money from your channel                        │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │    YouTube Shorts Strategy                               │  │
│   │    Short-form content tactics                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │    Channel Branding                                      │  │
│   │    Visual identity, positioning, niche selection         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ + Add your own pillar...                                 │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Matters for Scoring

**Without pillars:**
- Phrase: "best content creation tips Tokyo"
- GPT thinks: "Is this about YouTube? Travel? Both? Unclear..."
- Result: Mediocre Audience Fit score

**With pillars:**
- User has "Content Creation Tips" pillar selected
- Phrase: "best content creation tips Tokyo"
- GPT thinks: "They cover content creation, but they're not location-specific. Low fit."
- Result: Accurate low score (unless they specified Tokyo focus)

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `niche` | text | Yes | "YouTube Education" |
| `content_pillars` | array | Yes (2-4) | ["algorithm", "content-creation", "ai-tools"] |
| `pillar_descriptions` | jsonb | Yes | {pillar: description} pairs |
| `custom_pillars` | array | No | User-added pillars |

---

## Page 2: Content Flexibility

### Purpose
Understand what video FORMATS they make AND open their mind to formats they might not have considered.

### The Key Insight

> "The more you're open to different types of videos around topics, the more likely we can help you grow your channel faster."

Many creators self-limit:
- "I don't do tutorials" → They miss searchable traffic
- "I only do long-form" → They miss Shorts opportunities
- "I don't do reactions" → They miss trending moments

**Our job is NOT to force them into formats they hate.**
**Our job IS to help them see lower-barrier alternatives.**

### The First Impressions Opportunity

This is HUGE and needs special attention:

**Full Tutorial** (high barrier):
- Research, scripting, B-roll, demonstrations
- 2-4 hours of work
- Creator thinks: "That's too much work for me"

**First Impressions** (low barrier):
- Get the thing, try it, share thoughts
- 1 hour of work
- Creator thinks: "I could actually do that!"

Both target the SAME KEYWORD PHRASES. One is 4x easier.

### UI Flow

**Step 1: Primary Content Types**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   🎬 What Types of Videos Do You Make?                          │
│                                                                 │
│   Select all that you currently create:                         │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│   │ ✓ How-To  │  │ ✓ Reviews │  │   Tips &  │  │ ✓ Explain-│  │
│   │ Tutorials │  │           │  │   Tricks  │  │   ers     │  │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│   │ Compari-  │  │   Hot     │  │ Reactions │  │   Vlogs   │  │
│   │ sons X v Y│  │   Takes   │  │           │  │           │  │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│   │ Deep Dive │  │ Story-    │  │   News/   │  │   Lists/  │  │
│   │ Analysis  │  │ telling   │  │   Updates │  │   Rankings│  │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘  │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Step 2: The Flexibility Question (Conditional)**

If they did NOT select tutorials but DID select reviews or any product-adjacent type:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   💡 Quick Question About Content Flexibility                   │
│                                                                 │
│   We noticed you didn't select tutorials. That's totally fine!  │
│   But here's something to consider...                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ Many high-value keyword phrases look like tutorial      │  │
│   │ topics, but you don't have to make full tutorials       │  │
│   │ to target them!                                         │  │
│   │                                                         │  │
│   │ Example: "iPhone 17 camera settings"                    │  │
│   │                                                         │  │
│   │ Instead of a 20-minute tutorial, you could make:        │  │
│   │ • First Impressions (8 min) - "I tried it, here's what  │  │
│   │   I found"                                              │  │
│   │ • Quick Tips (3 min) - "3 settings to change right now" │  │
│   │ • Reaction + Opinion (5 min) - Your take on the feature │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Would you be open to these lower-effort formats?              │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ ✓  First Impressions                                     │  │
│   │    "I tried this for a day, here's what I think"        │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ ✓  Quick Tips (60-180 seconds)                          │  │
│   │    Short, focused tips without deep explanations        │  │
│   └─────────────────────────────────────────────────────────┘  │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │    No, I really prefer to avoid instructional content   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Changes Scoring

**Without flexibility data:**
- Phrase: "how to edit YouTube videos"
- User hasn't selected tutorials
- System thinks: "They don't do tutorials, skip this phrase"
- Result: Missed opportunity

**With flexibility data:**
- Phrase: "how to edit YouTube videos"
- User selected "First Impressions" and "Quick Tips"
- System thinks: "They could do '5 Quick Editing Tips' or 'My Editing Workflow (First Impressions)'"
- Result: Phrase gets surfaced with format suggestions

### The GPT Advantage

GPT already handles some of this naturally:
- "Best content creation tips Tokyo Japan" → Low fit for US-based creator
- GPT understands geographic relevance without explicit rules

But GPT needs OUR DATA to understand:
- Does this creator do tutorials or just impressions?
- Are they open to quick-tips format?
- What formats do they actively avoid?

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `video_types` | array | Yes (1+) | ["reviews", "explainers", "hot-takes"] |
| `video_types_avoid` | array | No | ["vlogs", "reactions"] |
| `open_to_first_impressions` | boolean | No | true |
| `open_to_quick_tips` | boolean | No | true |
| `format_flexibility` | text | No | "high" / "medium" / "low" |

---

## Page 3: Your Audience

### Purpose
Create a SPECIFIC, DETAILED description of their target viewer that powers precise Audience Fit scoring.

### The Critical Importance of Specificity

> "The more general the audience description, the less powerful the scores will be."

**Vague (weak scoring):**
- "People interested in YouTube"
- "Tech enthusiasts"
- "Anyone who wants to learn"

**Specific (powerful scoring):**
- "Small YouTubers with under 1,000 subscribers who are struggling to get views and want to understand the algorithm"
- "iPhone users who want to get better photos without learning professional photography"
- "Busy professionals who want to learn Japanese cooking in under 30 minutes"

### UI Flow

**Step 1: Guided Audience Builder**

Instead of a blank textarea, we GUIDE them to specificity:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   👥 Who Is Your Ideal Viewer?                                  │
│                                                                 │
│   The more specific you are, the better we can match topics     │
│   to YOUR audience. Vague = weak scores. Specific = powerful.   │
│                                                                 │
│   ─────────────────────────────────────────────────────────    │
│                                                                 │
│   My viewers are...                                             │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ Who are they?                                          │    │
│   │ Small YouTubers with under 1,000 subscribers           │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ What's their main struggle or goal?                    │    │
│   │ Struggling to get views and grow their channel         │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │ What do they want to learn or achieve?                 │    │
│   │ Understand how the algorithm works and get discovered  │    │
│   └───────────────────────────────────────────────────────┘    │
│                                                                 │
│   📝 Preview of your audience description:                      │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ "Small YouTubers with under 1,000 subscribers who are  │  │
│   │ struggling to get views and grow their channel. They   │  │
│   │ want to understand how the algorithm works and get     │  │
│   │ discovered."                                           │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   [Continue →]                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Step 2: Expertise Level**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📊 What's Their Expertise Level?                              │
│                                                                 │
│   This helps us suggest topics at the right depth.              │
│                                                                 │
│   ○ Beginners                                                   │
│     Just getting started, need foundational content             │
│                                                                 │
│   ○ Intermediate                                                │
│     Know the basics, want to level up                           │
│                                                                 │
│   ○ Advanced                                                    │
│     Experienced, looking for edge cases and pro tips            │
│                                                                 │
│   ○ Mixed                                                       │
│     All skill levels watch my content                           │
│                                                                 │
│   [Complete Setup →]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Captured

| Field | Type | Required | Example |
|-------|------|----------|---------|
| `audience_who` | text | Yes | "Small YouTubers with under 1,000 subscribers" |
| `audience_struggle` | text | Yes | "Struggling to get views and grow their channel" |
| `audience_goal` | text | Yes | "Understand how the algorithm works" |
| `target_audience` | text | Generated | Combined sentence |
| `audience_expertise` | text | Yes | "beginner" |

---

## The Creator Context Summary

### What It Is

After completing onboarding, we generate a 3-5 sentence summary that captures EVERYTHING GPT needs to score Audience Fit accurately.

### How It's Generated

```typescript
async function generateCreatorContext(onboardingData: OnboardingData): Promise<string> {
  const prompt = `
Based on this creator's onboarding data, write a 3-5 sentence summary that captures:
1. Their core niche and content pillars
2. The types of videos they make
3. Their target audience and expertise level
4. Any content format flexibility

Data:
- Niche: ${onboardingData.niche}
- Pillars: ${onboardingData.content_pillars.join(', ')}
- Video types: ${onboardingData.video_types.join(', ')}
- Open to first impressions: ${onboardingData.open_to_first_impressions}
- Open to quick tips: ${onboardingData.open_to_quick_tips}
- Target audience: ${onboardingData.target_audience}
- Expertise level: ${onboardingData.audience_expertise}

Write a natural, concise summary that could be used as context for AI scoring.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
  });

  return response.choices[0].message.content;
}
```

### Example Output

**Input:**
- Niche: "YouTube Education"
- Pillars: ["Algorithm & Discovery", "Content Creation", "AI Tools"]
- Video types: ["explainers", "tips", "reviews"]
- Open to first impressions: true
- Open to quick tips: true
- Target audience: "Small YouTubers with under 1,000 subscribers who are struggling to get views"
- Expertise: "beginner"

**Generated Summary:**
> "This creator runs a YouTube Education channel focused on helping small creators understand the algorithm, improve their content, and leverage AI tools. They primarily make explainer videos, tips content, and reviews, and are open to first impressions and quick tips formats for faster content creation. Their target audience is beginner YouTubers with under 1,000 subscribers who are struggling to get views and want to grow their channel."

### How It's Used in Scoring

```typescript
// In Audience Fit scoring prompt
const scoringPrompt = `
CREATOR CONTEXT:
${creatorContextSummary}

PHRASE TO SCORE: "${phrase}"

Score how well this phrase fits this specific creator's channel (0-100).
Consider:
- Does it match their niche and pillars?
- Could they make a video in their preferred formats?
- Would their target audience search for this?
- Is it appropriate for their audience's expertise level?
`;
```

---

## Database Schema Updates

```sql
ALTER TABLE channels ADD COLUMN IF NOT EXISTS
  -- Page 1: Niche & Pillars
  niche TEXT,
  content_pillars JSONB,                    -- ["algorithm", "content-creation", "ai-tools"]
  pillar_descriptions JSONB,                -- {"algorithm": "How YouTube recommends videos"}
  
  -- Page 2: Content Flexibility
  video_types JSONB,                        -- ["reviews", "explainers", "tips"]
  video_types_avoid JSONB,                  -- ["vlogs", "reactions"]
  open_to_first_impressions BOOLEAN DEFAULT FALSE,
  open_to_quick_tips BOOLEAN DEFAULT FALSE,
  format_flexibility TEXT,                  -- "high", "medium", "low"
  
  -- Page 3: Audience
  audience_who TEXT,                        -- "Small YouTubers under 1K subs"
  audience_struggle TEXT,                   -- "Struggling to get views"
  audience_goal TEXT,                       -- "Understand the algorithm"
  target_audience TEXT,                     -- Combined sentence
  audience_expertise TEXT,                  -- "beginner", "intermediate", "advanced", "mixed"
  
  -- Generated Context
  creator_context_summary TEXT,             -- GPT-generated 3-5 sentence summary
  
  -- Meta
  onboarding_completed_at TIMESTAMP;
```

---

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /api/onboarding/pillars/suggest` | GPT suggests pillars for niche |
| `POST /api/onboarding/save` | Save progress (any page) |
| `POST /api/onboarding/complete` | Generate context summary & mark done |
| `GET /api/onboarding/status` | Check completion status |

---

## File Structure

```
/src/app/members/onboarding/
├── page.tsx                          ← Orchestrator (routes to current step)
├── _components/
│   ├── OnboardingLayout.tsx          ← Progress dots, back/next navigation
│   ├── Step1Niche.tsx                ← Niche input + pillar selection
│   ├── Step2Flexibility.tsx          ← Video types + flexibility questions
│   ├── Step3Audience.tsx             ← Guided audience builder + expertise
│   ├── PillarSelector.tsx            ← Reusable pillar checkbox grid
│   ├── VideoTypeGrid.tsx             ← Reusable video type selector
│   └── AudiencePreview.tsx           ← Real-time audience description preview

/src/app/api/onboarding/
├── pillars/
│   └── suggest/route.ts              ← GPT pillar suggestions
├── save/route.ts                     ← Save progress
└── complete/route.ts                 ← Generate summary & complete
```

---

## Summary: The Onboarding Promise

After completing onboarding, we can confidently score ANY phrase for Audience Fit because we know:

| We Know | How It Helps |
|---------|--------------|
| Their niche + pillars | Is this topic relevant to their channel? |
| Video formats they make | Could they actually create this video? |
| Format flexibility | Would a first impressions work? Quick tips? |
| Specific audience description | Would their viewers search for this? |
| Audience expertise level | Is this too basic? Too advanced? |

**The Result**: Creators get scores that actually reflect whether a topic fits THEIR channel, not just whether it's a good topic in general.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-11-30 | Initial specification |
| 0.2 | 2025-11-30 | Added pillars, flexibility questions, guided audience builder, creator context summary. Reduced to 3 pages. Emphasized focus philosophy. |
