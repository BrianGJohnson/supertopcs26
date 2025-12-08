# 1-6 GPT-5 Mini: Super Topics Analysis Call

This document defines the GPT-5 mini API call structure for generating candidate analysis on the Super Topics page.

---

## Overview

For each of the 13 candidate phrases, we make **one GPT-5 mini call** that generates all scores, classifications, and text content.

All 13 calls run in parallel. Estimated cost: ~$0.03-0.05 total.

---

## Model Configuration

```typescript
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,                    // Creative, natural prose
  top_p: 1,
  max_completion_tokens: 2500,
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

=== PHRASE TO ANALYZE ===
"${phrase}"

=== VIDEO FORMAT OPTIONS ===
Pick a primaryBucket and subFormat from these options:

1. EDUCATIONAL: Tutorial, How-To, Explainer, Walkthrough, Crash Course, Masterclass
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
- Long-Term Views: Evergreen content that compounds over months/years
- High Click Trigger: Topic naturally drives clicks and CTR
- View Multiplier: Suited for 3-5 video series
- High Intent: Viewers ready to take action
- Polarizing & Engaging: Sparks comments and debate
- Return Viewer: Brings viewers back to channel
- Loyalty Builder: Turns casual viewers into regulars
- Masterclass Method: Exhaustive, long-form authority content
- Trust Builder: Vulnerable, honest content that builds connection
- Transformational View Boost: Journey content (struggle → result), boosts AVD
- Secret Strategy: "Hidden truth" curiosity play, drives CTR
- Mistakes & Warnings: Fear-driven "don't do this" content, drives CTR + trust
- Comparison Trigger: X vs Y decision content, drives AVD + intent
- Story Hook: Personal narrative that holds attention, boosts AVD

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
    "primaryBucket": "Educational",
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
- primaryBucket (one of 7)
- subFormat (from bucket options)
- alternateFormats (array of 2)

**Emotional Format (3)**
- primaryEmotion (one of 8)
- secondaryEmotion (one of 8)
- mindset (one of 4)

**Algorithm Targets (1)**
- algorithmTargets (array of 2-3 from 14 options)

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
