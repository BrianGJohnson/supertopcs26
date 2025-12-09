# 1-6 GPT-5 Mini: Super Topics Analysis Call

This document defines the GPT-5 mini API call structure for generating candidate analysis on the Super Topics page.

---

## Overview

For each of the 13 candidate phrases, we make **one GPT-5 mini call** that generates all scores, classifications, and text content.

All 13 calls run in parallel with **prompt caching** enabled. Estimated cost: ~$0.10 total.

---

## Model Configuration

```typescript
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,                    // Creative, natural prose
  top_p: 1,
  max_completion_tokens: 30000,      // High limit for reasoning tokens
  reasoning_effort: "medium",        // Better scoring accuracy
  response_format: { type: "json_object" },
};
```

**Reasoning effort options:**
- `minimal` — Fast, less accurate scores
- `low` — Balanced
- `medium` — Recommended: good balance of accuracy and speed
- `high` — Highest accuracy, slowest (experiment to test latency)

---

## Prompt Caching Strategy (Critical for Cost)

To reduce costs from ~$1.00 to ~$0.10 per page load, we leverage OpenAI's automatic prompt caching.

### How It Works

1. **Automatic for prompts ≥1024 tokens** — No special flag needed
2. **Cache hits on identical prefixes** — Runs 2-13 get ~90% discount on input tokens
3. **Retention** — Cache stays active 5-10 minutes (up to 1 hour)

### Implementation Rules

```
┌─────────────────────────────────────────────────┐
│ SYSTEM PROMPT (identical for all 13 requests)  │ ← Cached after Run #1
│ - Creator context                               │
│ - Scoring rubric                                │
│ - Format taxonomy (all 7 buckets)               │
│ - Algorithm targets (all 13)                    │
│ - Output JSON schema                            │
├─────────────────────────────────────────────────┤
│ USER MESSAGE                                    │
│ - "Analyze this phrase: {PHRASE}"               │ ← Only dynamic part
└─────────────────────────────────────────────────┘
```

**Key Rules:**
- **Static content FIRST** — System prompt, taxonomy, rubric (identical across all 13 calls)
- **Dynamic content LAST** — The keyword phrase at the very end of the user message
- **Do NOT put dynamic variables in the system prompt**

### Cost Breakdown

| Run | Input Tokens | Discount |
|-----|--------------|----------|
| Run 1 (Cold) | Full price | 0% |
| Runs 2-13 (Warm) | Cached prefix | 90% |

---

## Inputs (What We Send)

### From Onboarding

```typescript
interface OnboardingData {
  niche: string;
  content_pillars: string[];
  primary_goal: "views" | "adsense" | "sell_products" | "affiliate" | "authority";
  video_types: string[];
  show_first_impressions: boolean;
  show_quick_tips: boolean;
  target_audience: string;
  audience_expertise: "beginner" | "intermediate" | "advanced" | "mixed";
  creator_context_summary: string;
}
```

### From Session

```typescript
interface PhraseInput {
  phrase: string;
}
```

---

## The Complete Prompt

```
You are analyzing a YouTube video topic for a creator.

=== CREATOR CONTEXT ===
${creator_context_summary}

Primary goal: ${primary_goal}
Niche: ${niche}
Content pillars: ${content_pillars.join(", ")}
Video formats they make: ${video_types.join(", ")}
Open to First Impressions: ${show_first_impressions}
Open to Quick Tips: ${show_quick_tips}
Target audience: ${target_audience}
Audience expertise: ${audience_expertise}

=== VIDEO FORMAT OPTIONS ===
Pick a primaryBucket and subFormat from these options:

1. INFO: Tutorial, How-To, Explainer, Walkthrough, Crash Course, Masterclass
2. OPINION: Commentary, Hot Take, Rant, Reaction, My Take, Unpopular Opinion
3. REVIEW: Product Review, First Impressions, Comparison, Honest Review, Long-Term Review, Buyer's Guide
4. ENTERTAINMENT: Vlog, Lifestyle, Challenge, Behind-the-Scenes, Story, Day in the Life, Q&A
5. ANALYSIS: Deep Dive, Breakdown, Case Study, Postmortem, Research Report, Why X Happened
6. NEWS: Update, Announcement, Trending Coverage, Recap, Breaking, Weekly Roundup
7. LIST: Top 10, Ranking, Roundup, Best Of, Tier List, X Things You Need

=== EMOTION OPTIONS ===
Pick primaryEmotion and secondaryEmotion:
Curiosity, FOMO, Fear, Hope, Frustration, Validation, Excitement, Relief

=== MINDSET OPTIONS ===
Pick one: Positive, Negative, Neutral, Insightful

=== ALGORITHM TARGETS (pick 2-3) ===
Pick 2-3 targets that best match this phrase. Use the selection criteria.

- Long-Term Views
  When: Evergreen topic, question-based phrase, info-based video
  Metric: Search traffic over time

- High Click Trigger
  When: Phrase creates urgency, curiosity, or fear. Compelling words.
  Metric: CTR

- View Multiplier
  When: Lots of sub-topics cluster around this phrase (series potential)
  Metric: Session time, channel views

- High Intent
  When: High viewer intent score, clear viewer goal
  Metric: Conversions, engagement

- Polarizing & Engaging
  When: Topic sparks debate, people have opinions
  Metric: Comments, shares, CTR

- Return Viewer
  When: Personal, lifestyle, subscriber update content
  Metric: Returning viewers

- Masterclass Method
  When: Topic is deep enough for 30+ min, exhaustive coverage
  Metric: Average View Duration (AVD)

- Trust Builder
  When: Vulnerable, honest, admitting mistakes
  Metric: Subscribers, loyalty

- Transformational View Boost
  When: Journey content (struggle → result)
  Metric: AVD

- Secret Strategy
  When: "Hidden truth" framing, high curiosity, compelling title potential
  Metric: CTR

- Mistakes & Warnings
  When: "Don't do this" / "X mistakes killing your..."
  Metric: CTR + Trust

- Comparison Trigger
  When: X vs Y, review of two products
  Metric: AVD + Intent

- Story Hook
  When: Personal narrative, "The time I..."
  Metric: AVD + Loyalty

=== SCORES TO GENERATE (0-99) ===
- growthFitScore: How well this phrase fits this creator's growth potential
- clickabilityScore: How likely viewers are to click
- intentScore: How strong is viewer intent

=== TEXT SECTIONS ===
Write 3 sections. Follow "Porch Talk" style:
- 8th grade reading ease, 6th-7th grade vocabulary
- Under 15 words per sentence
- No dashes or semicolons, only periods
- Friendly and direct, like texting a smart friend
- Use "you" and "your"
- Exception: Use topic-specific terms from the phrase naturally

SECTION 1: Viewer Goal (2-3 sentences)
- What is the viewer trying to achieve?
- How strong is their intent? (reference if HIGH/MEDIUM/LOW)
- What action will they likely take?

SECTION 2: Why This Could Work (2-3 sentences)
- How does this fit the creator's style?
- What does the viewer expect?
- What formats would work best?

SECTION 3: Algorithm Angle (2-3 sentences)
- What's the strategic play? Reference which algorithm targets apply.
- Include a hook suggestion (1 opening line).
- Why does this phrase win?

=== PHRASE TO ANALYZE ===
"${phrase}"

=== RETURN JSON ===
```

---

## Expected JSON Output

```json
{
  "scores": {
    "growthFitScore": 92,
    "clickabilityScore": 78,
    "intentScore": 87
  },
  "videoFormat": {
    "primaryBucket": "Info",
    "subFormat": "Tutorial",
    "alternateFormats": ["First Impressions", "How-To"]
  },
  "emotionalFormat": {
    "primaryEmotion": "Curiosity",
    "secondaryEmotion": "Hope",
    "mindset": "Insightful"
  },
  "algorithmTargets": ["Long-Term Views", "High Click Trigger", "Secret Strategy"],
  "coreContent": {
    "viewerGoal": "Learn",
    "viewerAngle": "They feel like the algorithm is working against them.",
    "porchTalk": "Everyone thinks the algorithm is out to get them. I'm going to show you exactly how it works so you can stop guessing.",
    "hook": "The algorithm isn't broken. You are."
  },
  "textSections": {
    "viewerGoalDescription": "These viewers want to finally understand how the algorithm works. Intent is high. They're ready to take action and apply what they learn.",
    "whyThisCouldWork": "This fits your authority-building style. Viewers expect clear explanations without fluff. Works great as a tutorial or first impressions video.",
    "algorithmAngle": "This is a Long-Term Views play with Secret Strategy appeal. Open with: The algorithm isn't broken. You are. High curiosity plus strong intent makes this a winner."
  }
}
```

---

## Complete Field Reference

**Scores (3)**
- growthFitScore (0-99)
- clickabilityScore (0-99)
- intentScore (0-99)

**Video Format (3)**
- primaryBucket (one of 7: Info, Opinion, Review, Entertainment, Analysis, News, List)
- subFormat (from bucket options)
- alternateFormats (array of 2)

**Emotional Format (3)**
- primaryEmotion (one of 8)
- secondaryEmotion (one of 8)
- mindset (one of 4)

**Algorithm Targets (1)**
- algorithmTargets (array of 2-3 from 13 options)

**Core Content (4)**
- viewerGoal (enum: Learn, Validate, Solve, Vent, Be Entertained)
- viewerAngle (1 sentence)
- porchTalk (2 sentences)
- hook (1-2 sentences)

**Text Sections (3)**
- viewerGoalDescription (2-3 sentences)
- whyThisCouldWork (2-3 sentences)
- algorithmAngle (2-3 sentences)

**Total: 17 fields per phrase**

---

## UI Display Order (Top Tile)

1. **Phrase Title** (h2)
2. **Pills Row:** primaryBucket + subFormat + algorithmTargets
3. **Scores Row:** primaryEmotion | Intent intentScore | Clickability clickabilityScore
4. **— Divider —**
5. **Section 1: Viewer Goal** (heading + viewerGoalDescription)
6. **Section 2: Why This Could Work** (heading + whyThisCouldWork)
7. **Section 3: Algorithm Angle** (heading + algorithmAngle)
8. **— Divider —**
9. **Buttons:** Lock | Report | YouTube

---

## Writing Style & Readability Rules

**Readability Target:**
- Reading ease: 8th grade level (flows naturally)
- Vocabulary: 6th-7th grade (simple, everyday words)
- Exception: Topic-specific terms from the phrase are allowed

**Sentence Rules:**
- Under 15 words per sentence
- One idea per sentence
- No dashes or semicolons. Only periods.

**Tone:**
- Friendly and direct
- Like texting a smart friend
- Use "you" and "your"

**Words to USE:** grow, views, channel, video, topic, get, make, build
**Words to AVOID:** leverage, utilize, optimize, implement, synergy

---

*Last Updated: December 8, 2025*
