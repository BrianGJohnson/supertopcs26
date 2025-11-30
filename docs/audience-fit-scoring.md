# Audience Fit Scoring System

## Overview

Audience Fit is the **second scoring round** in the Refine phase (Page 2). It evaluates how well each keyword phrase aligns with the creator's existing audience, content style, and channel goals.

**Purpose**: Help users identify phrases that don't match their audience's expectations, even if the topic is strong.

**Key Insight**: A phrase can have excellent Topic Strength (highly specific and engaging) but poor Audience Fit (wrong for this particular channel). This scoring round helps filter out "off-brand" content ideas.

**Trigger**: Only available after Topic Strength scoring is complete. Accessed via "Run Analysis" dropdown → "2. A. Fit"

---

## The Core Question

> "If someone who watched my last 5 videos saw this title in their feed, would they click?"

This is NOT about:
- Whether the phrase is "good" in general
- Whether it has high search volume
- Whether it's well-formed grammatically

This IS about:
- Does it match what my audience expects from me?
- Is it within my niche/wheelhouse?
- Would my existing subscribers find this relevant?

---

## Two Types of Fit: Content Style + Audience Expectations

### Content Style Fit
**What kinds of videos does the creator actually make?**

| Content Style | Best-Fit Phrases | Poor-Fit Phrases |
|---------------|------------------|------------------|
| **Tutorial/How-To** | "how to...", "step by step", "tutorial for beginners" | "why I hate...", "reaction to..." |
| **Entertainment/Commentary** | "is X dead?", "why X sucks", "my thoughts on..." | "complete guide to...", "X explained" |
| **News/Updates** | "X update 2025", "new X announced", "what's new in..." | "beginner's guide to..." |
| **Reviews/First Impressions** | "X review", "is X worth it", "first impressions X" | "how to fix X" |
| **Edutainment/Infotainment** | Blend of both - flexible | Very dry/technical content |

### Audience Expectations
**What is the existing audience tuning in for?**

A gaming channel audience expects gaming content. Even if "how to make sourdough bread" is a fantastic keyword with great Topic Strength, it scores 0 for Audience Fit on a gaming channel.

---

## The Spectrum: Information ↔ Entertainment

```
PURE INFORMATION                                          PURE ENTERTAINMENT
      |                                                            |
   Tutorials    →   Explainers   →   Edutainment   →   Commentary   →   Reactions
   How-To's          Reviews          Infotainment      Opinions        Entertainment
   Guides            Comparisons      Story-driven      Hot Takes       Vlogs
```

### Where Does the Creator Sit?

Most successful YouTube creators occupy a position on this spectrum. Understanding where a creator sits determines how to score phrases:

- **Left-leaning (Information)**: Score "how to" and "tutorial" phrases higher
- **Right-leaning (Entertainment)**: Score emotional/opinion phrases higher
- **Center (Edutainment)**: Flexible - both can work

---

## First Impressions vs. Deep Tutorials

**Key Insight**: Creators who "don't do tutorials" might still benefit from **First Impressions** videos.

| Video Type | Effort Required | Phrase Pattern |
|------------|-----------------|----------------|
| Full Tutorial | High (days/weeks) | "complete guide", "step by step", "how to X from scratch" |
| First Impressions | Low (hours) | "first impressions", "first look", "hands on with", "trying X" |
| Quick Tips | Low | "X tips", "quick tips", "X in 60 seconds" |
| Comparison | Medium | "X vs Y", "which is better", "X or Y" |

During onboarding, we should distinguish between "I don't make tutorials" vs "I don't make ANY instructional content." First Impressions can tap into high-intent keywords without the heavy lift.

---

## Bell Curve Distribution Target

Like Topic Strength, Audience Fit should produce a usable distribution:

| Score Range | Target % | Description |
|-------------|----------|-------------|
| 90-99 | 3-5% | Perfect fit - exactly what the audience wants |
| 80-89 | 10-15% | Strong fit - clearly aligned with channel |
| 60-79 | 20-25% | Good fit - reasonable match |
| 40-59 | 30-35% | Average fit - could work but not ideal |
| 20-39 | 15-20% | Poor fit - outside typical content |
| 0-19 | 10-15% | No fit - completely off-niche |

**Key Goal**: Help users identify the 25-40% of phrases that are "off-brand" for their channel.

---

## GPT-5 Mini API Configuration (LOCKED)

Same configuration as Topic Strength scoring:

```typescript
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 1500,
  reasoning_effort: "minimal",
  response_format: { type: "json_object" }
};
```

---

## Batching Configuration (LOCKED)

```typescript
const BATCH_CONFIG = {
  minBatchSize: 25,
  maxBatchSize: 40,
  defaultBatchSize: 40,
  interBatchDelayMs: 150
};
```

---

## System Prompt (Draft)

```text
You are scoring how well each keyword phrase fits a specific YouTube creator's channel and audience.
Return a JSON object with a "scores" key containing exactly N integers from 0-99.

═══════════════════════════════════════════════════════════════════════════════
WHAT YOU'RE MEASURING
═══════════════════════════════════════════════════════════════════════════════
NOT general quality - that's already been scored.
NOT search volume or popularity.

ONLY: "Would THIS creator's existing audience click on THIS topic?"

Consider:
• Does this fit what the channel typically covers?
• Would existing subscribers expect this content?
• Does it match the creator's style (tutorial vs entertainment vs commentary)?
• Is this within the niche or a reasonable adjacent topic?

═══════════════════════════════════════════════════════════════════════════════
CREATOR CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Use ONLY the provided context. Do not assume or imagine additional information.

You will receive:
• Channel niche/topic
• Content style (tutorial, entertainment, edutainment, etc.)
• Target audience description
• Types of videos they typically make
• Topics they're open to exploring
• Recent video examples (if available)

═══════════════════════════════════════════════════════════════════════════════
SCORING GUIDELINES
═══════════════════════════════════════════════════════════════════════════════

PERFECT FIT (90-99): Exactly what the audience expects
• Phrase directly matches the channel's core niche
• Content style aligns perfectly (tutorial phrase for tutorial channel)
• Topic appears in or strongly relates to recent videos

STRONG FIT (80-89): Clearly aligned
• Within the niche with clear relevance
• Style is appropriate for the channel
• Audience would recognize this as "their creator's content"

GOOD FIT (60-79): Reasonable match
• Related to the niche but not core
• Adjacent topic the audience might accept
• Style mostly matches

AVERAGE FIT (40-59): Could work but stretching
• Tangentially related to niche
• Different content style than typical
• Might interest some but not all of audience

POOR FIT (20-39): Outside typical content
• Different niche entirely
• Wrong content style (tutorial phrase for entertainment channel)
• Audience would be confused

NO FIT (0-19): Completely off-brand
• Totally unrelated to channel
• Would alienate existing audience
• Makes no sense for this creator

═══════════════════════════════════════════════════════════════════════════════
CONTENT STYLE MATCHING
═══════════════════════════════════════════════════════════════════════════════

If creator style is TUTORIAL/HOW-TO:
• Boost: "how to", "guide", "tutorial", "step by step", "learn", "for beginners"
• Penalize: "reaction", "my thoughts on", "is X dead", pure opinion phrases

If creator style is ENTERTAINMENT/COMMENTARY:
• Boost: "is X dead", "why X sucks", "my experience with", "the truth about"
• Penalize: "complete guide", "tutorial", "step by step", dry instructional

If creator style is EDUTAINMENT:
• Flexible - both informational and entertaining phrases can score well
• Slight boost for phrases with personality/angle

If creator style is NEWS/UPDATES:
• Boost: "update", "2025", "new", "announced", "changes to"
• Penalize: Evergreen tutorial content

═══════════════════════════════════════════════════════════════════════════════
NICHE ADJACENCY
═══════════════════════════════════════════════════════════════════════════════

Some topics are "adjacent" to a niche and can work:
• Tech review channel → Software tutorials (adjacent, might work)
• Gaming channel → Streaming setup guides (adjacent, audience overlap)
• Cooking channel → Kitchen organization (adjacent, same audience)

But distance matters:
• Tech review channel → Cooking recipes (not adjacent, wrong audience)
• Gaming channel → Financial advice (not adjacent, different audience entirely)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════════════════════
Return: {"scores": [75, 42, 88, 15, 63, ...]}

Example output for 5 phrases: {"scores": [85, 32, 91, 48, 67]}
```

---

## User Prompt Format (Draft)

```typescript
const userPrompt = `CREATOR CONTEXT:
═══════════════════════════════════════════════════════════════════════════════
Channel niche: ${channelNiche}
Content style: ${contentStyle}
Target audience: ${targetAudience}
Video types: ${videoTypes}
Open to exploring: ${openToExploring}
Seed topic for this session: "${seedPhrase}"
${recentVideoTitles ? `Recent videos: ${recentVideoTitles}` : ''}
═══════════════════════════════════════════════════════════════════════════════

TASK:
Score each phrase for AUDIENCE FIT only.
NOT quality (already scored). NOT popularity.
Just: "Would this creator's audience click on this?"

═══════════════════════════════════════════════════════════════════════════════
PHRASES TO SCORE (${batch.length} total):
${batch.map((phrase, i) => `${i + 1}) ${phrase}`).join('\n\n')}
═══════════════════════════════════════════════════════════════════════════════

Return ONLY: {"scores": [N integers from 0-99]}`;
```

---

## Required Context Data

To score Audience Fit, we need to gather context during onboarding. Here's what powers the scoring:

| Context Field | Source | Required? | Purpose |
|---------------|--------|-----------|---------|
| `channelNiche` | Onboarding | Yes | Core topic area |
| `contentStyle` | Onboarding | Yes | Tutorial / Entertainment / Edutainment / News |
| `targetAudience` | Onboarding | Yes | Who watches this channel |
| `videoTypes` | Onboarding | Yes | What kinds of videos they make |
| `openToExploring` | Onboarding | No | Adjacent topics they'd consider |
| `seedPhrase` | Session | Auto | Session's root topic |
| `recentVideoTitles` | YouTube API | No | Last 5-10 video titles |

### Data Quality Insight

From your experience: **Simple profiles outperform video title scraping.**

When you tried pulling video titles via RSS and adding them to the prompt, scoring got *worse*. The hypothesis:
- Video titles have SEO optimization that doesn't reflect natural topic patterns
- Titles are highly variable in format/style
- Too much noise, not enough signal

**Better approach**: Extract PATTERNS from recent videos during onboarding and store as a slim description, not raw titles.

---

## Database Schema Extension

### Seed Analysis Table - Audience Fit Field

```sql
ALTER TABLE seed_analysis ADD COLUMN audience_fit INTEGER;
```

### Channel Context Table (New or Extended)

```sql
-- Option A: Add to channels table
ALTER TABLE channels 
  ADD COLUMN content_style TEXT,        -- tutorial, entertainment, edutainment, news
  ADD COLUMN video_types JSONB,         -- ["how-to", "reviews", "first impressions"]
  ADD COLUMN open_to_exploring JSONB;   -- ["adjacent topic 1", "adjacent topic 2"]

-- Option B: Separate channel_context table
CREATE TABLE channel_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  
  -- Core positioning
  content_style TEXT,                    -- tutorial, entertainment, edutainment, news
  style_spectrum INTEGER,                -- 1-10 scale: 1=pure info, 10=pure entertainment
  
  -- What they make
  video_types JSONB,                     -- ["tutorials", "reviews", "commentary"]
  video_types_avoid JSONB,               -- ["news", "reactions"]
  
  -- Audience
  target_audience TEXT,
  audience_expertise TEXT,               -- beginner, intermediate, advanced, mixed
  
  -- Flexibility
  open_to_exploring JSONB,               -- adjacent topics
  
  -- Extracted patterns (from video analysis, if used)
  content_patterns TEXT,                 -- slim description of typical content
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoint

### POST /api/sessions/[sessionId]/score-audience-fit

**Request Body**:
```json
{
  "channelId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "totalScored": 254,
  "batchCount": 7,
  "duration": 45000,
  "distribution": {
    "90-99": 12,
    "80-89": 35,
    "60-79": 58,
    "40-59": 89,
    "20-39": 42,
    "0-19": 18
  }
}
```

---

## Anchor Word Boost (Optional Enhancement)

From your previous implementation, anchor words extracted from video titles can provide a boost:

| Anchor Matches | Boost |
|----------------|-------|
| 0 matches | +0 |
| 1 match | +1 to +3 |
| 2 matches | +4 to +7 |
| 3+ matches | +8 to +10 |

This rewards phrases containing words the creator frequently uses in their video titles, without requiring the full titles in the prompt.

---

## UI Integration

### Trigger
- "Run Analysis" dropdown → "2. A. Fit"
- Only enabled after Topic Strength is complete

### Loading State
- Show progress: "Scoring audience fit: batch 3 of 7..."

### Completion
- Refresh table with audience fit scores
- Show distribution summary toast
- Enable sorting by A. Fit column

### Column Display
- Header: "A. Fit" or "Aud."
- Same 0-100 display as Topic Strength

---

## Files (Planned)

| File | Purpose |
|------|---------|
| `/src/lib/audience-fit-scoring.ts` | GPT integration, prompt building |
| `/src/app/api/sessions/[sessionId]/score-audience-fit/route.ts` | API endpoint |
| `/src/app/members/build/refine/_components/ActionToolbar.tsx` | UI trigger |
| `/docs/audience-fit-scoring.md` | This documentation |

---

## Relationship to Topic Strength

| Aspect | Topic Strength | Audience Fit |
|--------|----------------|--------------|
| What it measures | Phrase quality & specificity | Channel alignment |
| Universal or channel-specific? | Universal (same phrase scores same across channels) | Channel-specific (same phrase scores differently per channel) |
| Requires onboarding data? | No | Yes |
| Trigger order | First | Second |
| Deletion guidance | "Is this a good keyword?" | "Is this right for MY channel?" |

### Example: Same Phrase, Different Scores

**Phrase**: "how to make sourdough bread"

| Channel Type | Topic Strength | Audience Fit |
|--------------|----------------|--------------|
| Cooking Channel | 82 | 95 |
| Tech Review Channel | 82 | 8 |
| Lifestyle Vlog | 82 | 45 |

The phrase's inherent quality doesn't change. Its fit for a specific audience does.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 (Draft) | 2025-11-30 | Initial documentation |
