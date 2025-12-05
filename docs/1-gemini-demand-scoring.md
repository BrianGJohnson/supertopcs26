# Gemini Demand Scoring

## A Three-Layer Approach Using Autocomplete & Session Size

**Version:** 2.0  
**Last Updated:** December 5, 2025  
**Scope:** Builder Module (Session-Based Batch Scoring) ONLY

---

## ⚠️ IMPORTANT: Two Separate Scoring Systems

SuperTopics has **two distinct demand scoring approaches** for two different use cases:

| System | Module | Approach | Status |
|--------|--------|----------|--------|
| **Hierarchical Drilling** | Viewer Landscape Modal | User drills Layer 1 → Layer 2 → Layer 3 | ✅ KEEP AS-IS |
| **Session-Based Batch** | Builder Module | Score 300-600 phrases from expansions | 🔧 THIS DOCUMENT |

### Viewer Landscape Modal (DO NOT MODIFY)

The Viewer Landscape Modal uses a **natural drilling approach**:

```
Layer 1: "YouTube video editing" (seed)
    ↓ user drills deeper
Layer 2: "YouTube video editing tips"
    ↓ user drills deeper  
Layer 3: "YouTube video editing tips and tricks"
```

**How it works:**
- User manually explores phrases one at a time
- Each drill measures if demand persists at deeper levels
- 3+ layers with sustained suggestions = Extreme Demand signal
- This is intuitive and mirrors how real users search

**The logic and algorithm for the Viewer Landscape Modal will NOT be changed.** It works well for interactive exploration.

### Builder Module (THIS DOCUMENT)

The Builder Module generates **hundreds of phrases at once** via:
- Seed → Top 15 autocomplete results
- A-Z suffix expansion (seed + a, seed + b, etc.)
- Prefix expansion (how to + seed, best + seed, etc.)

**The challenge:** How do we score 400+ phrases for demand when we can't drill each one individually?

**The solution:** The Gemini Three-Layer Approach described below.

---

## Executive Summary

This document presents a refined demand scoring methodology for the **Builder Module** developed through collaboration with Google Gemini. The approach recognizes a fundamental insight:

> **"If YouTube's algorithm is confident enough to suggest a long-tail phrase, it means thousands of people have walked that path before. That is a solid proxy for demand."**

We are essentially **reverse-engineering search volume by looking at search probability**. When YouTube autocomplete returns suggestions, it's revealing real search behavior from millions of users.

---

## The Three-Layer Framework

Think of the score as a bucket you're filling up to 99 points:

| Layer | Points | What It Measures |
|-------|--------|------------------|
| 1. Ecosystem Score | 0-30 | How fertile is the overall topic? |
| 2. Autocomplete Suggestions | 0-40 | How many suggestions does this phrase get? |
| 3. Relevancy Score | 0-29 | Exact Match + Topic Match quality |
| **Total Max** | **99** | Final demand score |

### CONFIRMED Terminology

| Term | Definition |
|------|------------|
| **Ecosystem Score** | Points from session size (how big is this topic?) |
| **Autocomplete Suggestions** | Points from suggestion count (how many suggestions returned?) |
| **Exact Match** | Suggestions that START with the phrase |
| **Topic Match** | Suggestions that CONTAIN key words from the phrase |
| **Relevancy Score** | Combined quality signal from Exact Match + Topic Match patterns |

---

## CONFIRMED: Seed Score Table

The **seed phrase** receives its demand score **directly** from the session size. This is the ceiling for all phrases in the session.

```
┌─────────────────────────────────────────────────────────────┐
│                    SEED SCORE TABLE                         │
│                    (CONFIRMED VALUES)                       │
├─────────────────┬─────────────┬─────────────────────────────┤
│ Session Size    │ Seed Score  │ Example                     │
├─────────────────┼─────────────┼─────────────────────────────┤
│ 600+ phrases    │ 97          │ Massive ecosystem           │
│ 550-599         │ 96          │ "Content Creation" (582)    │
│ 500-549         │ 95          │ Very large ecosystem        │
│ 450-499         │ 94          │ Strong ecosystem            │
│ 400-449         │ 93          │ Good ecosystem              │
│ 350-399         │ 91          │ "YouTube Algorithm" (~350)  │
│ 300-349         │ 89          │ Medium ecosystem            │
│ 250-299         │ 86          │ Low-medium ecosystem        │
│ 200-249         │ 82          │ Low ecosystem               │
│ 150-199         │ 77          │ Small ecosystem             │
│ 100-149         │ 70          │ "Legacy Planning" (~100-150)│
│ <100            │ 60          │ Minimal ecosystem           │
└─────────────────┴─────────────┴─────────────────────────────┘
```

**Key Insight:** The seed score establishes the ceiling. A phrase can only score as high as its ecosystem allows.

---

## Layer 1: The Ecosystem Score (0-30 points)

### Philosophy

Before analyzing any individual phrase, we ask: **How fertile is the main topic?**

This is based on **Session Size**—the total number of phrases generated when we fully expand a seed keyword through autocomplete.

### Why Session Size Matters

| Seed Phrase | Session Size | What It Means |
|-------------|--------------|---------------|
| "Content Creation" | 582 phrases | Massive ecosystem—high demand ceiling |
| "YouTube Tips" | 450 phrases | Strong ecosystem—good demand potential |
| "Underwater Basket Weaving" | 167 phrases | Niche ecosystem—limited demand ceiling |

### Ecosystem Points Table

| Session Size | Points | Designation |
|--------------|--------|-------------|
| 600+ phrases | 30 | Maximum ecosystem |
| 500-599 | 27 | Very high ecosystem |
| 400-499 | 24 | High ecosystem |
| 300-399 | 20 | Medium ecosystem |
| 200-299 | 15 | Low-medium ecosystem |
| 100-199 | 10 | Low ecosystem |
| <100 phrases | 5 | Very low ecosystem |

---

## Layer 2: Autocomplete Suggestions Score (0-40 points)

### Philosophy

Now we look at the specific phrase. When you type it into YouTube search, **how many friends show up?**

This is the direct demand signal—if YouTube returns many suggestions, people are actively searching this topic.

### Why Phrase Length Matters

| Phrase Length | Expected Suggestions | If Gets 10+ Suggestions |
|---------------|---------------------|------------------------|
| 2 words | 14 (normal) | Expected |
| 4 words | 8-12 (normal) | Impressive |
| 6+ words | 2-5 (normal) | **Exceptional signal** |

### CONFIRMED: Autocomplete Suggestions Scoring Table

```
┌─────────────────────────────────────────────────────────────┐
│              AUTOCOMPLETE SUGGESTIONS SCORE                 │
│                   (CONFIRMED VALUES)                        │
├─────────────────────────┬──────────────┬────────────────────┤
│ Suggestions Returned    │ Points       │ Signal Strength    │
├─────────────────────────┼──────────────┼────────────────────┤
│ 14                      │ 40           │ Maximum            │
│ 13                      │ 38           │ Very high          │
│ 12                      │ 36           │ Very high          │
│ 11                      │ 34           │ High               │
│ 10                      │ 32           │ High               │
│ 9                       │ 29           │ Good               │
│ 8                       │ 26           │ Good               │
│ 7                       │ 23           │ Moderate           │
│ 6                       │ 20           │ Moderate           │
│ 5                       │ 17           │ Low-moderate       │
│ 4                       │ 14           │ Low-moderate       │
│ 3                       │ 10           │ Low                │
│ 2                       │ 6            │ Low                │
│ 1                       │ 3            │ Minimal            │
│ 0                       │ 0            │ Dead end           │
└─────────────────────────┴──────────────┴────────────────────┘
```

---

## Layer 3: Relevancy Score (0-29 points)

### Philosophy

This layer measures **quality** rather than just quantity. It evaluates the patterns of how suggestions relate to the phrase.

### The Two Match Types

| Match Type | What It Means | Example |
|------------|---------------|---------|
| **Exact Match** | Suggestion STARTS with your phrase | "content creation tips" → "content creation tips for beginners" |
| **Topic Match** | Suggestion CONTAINS your keywords | "content creation tips" → "youtube content tips and tricks" |

### CONFIRMED: Relevancy Scoring Logic

```
┌─────────────────────────────────────────────────────────────┐
│                  RELEVANCY SCORE                            │
│                (CONFIRMED VALUES)                           │
├──────────────────────────────┬──────────┬───────────────────┤
│ Pattern                      │ Points   │ Interpretation    │
├──────────────────────────────┼──────────┼───────────────────┤
│ Mostly Exact Match (70%+)    │ 29       │ This IS how       │
│                              │          │ people search     │
├──────────────────────────────┼──────────┼───────────────────┤
│ Mixed (40-69% exact)         │ 20       │ Strong related    │
│                              │          │ demand            │
├──────────────────────────────┼──────────┼───────────────────┤
│ Mostly Topic Match (70%+)    │ 12       │ Semantic demand,  │
│                              │          │ different phrasing│
├──────────────────────────────┼──────────┼───────────────────┤
│ Low Match (<40%)             │ 5        │ Weak connection   │
└──────────────────────────────┴──────────┴───────────────────┘
```

---

## The Inheritance System

### Top 15 Phrases as Anchors

When we search a seed and get autocomplete results, those **Top 15 phrases** represent YouTube's strongest signals of demand. They become **anchors** for scoring all other phrases.

### CONFIRMED: Inheritance Bonus Table

```
┌─────────────────────────────────────────────────────────────┐
│               INHERITANCE BONUS                             │
│              (CONFIRMED VALUES)                             │
├──────────────────┬──────────────┬───────────────────────────┤
│ Match Strength   │ Bonus Points │ Cap Relative to Parent    │
├──────────────────┼──────────────┼───────────────────────────┤
│ Strong (3+ words)│ +10          │ Parent - 2 (very close)   │
├──────────────────┼──────────────┼───────────────────────────┤
│ Moderate (2 words)│ +6          │ Parent - 4                │
├──────────────────┼──────────────┼───────────────────────────┤
│ Weak (1 word)    │ +3           │ Parent - 7                │
├──────────────────┼──────────────┼───────────────────────────┤
│ No match         │ 0            │ Seed - 15                 │
└──────────────────┴──────────────┴───────────────────────────┘
```

**Example:**
- Top 15 Parent: "content creation tips" (scored 80)
- A-Z Child: "content creation tips for beginners" (3/3 words match = Strong)
- Child gets: Ecosystem (27) + Autocomplete Suggestions (32) + Inheritance (+10) = 69
- Cap: 80 - 2 = 78 ✓ (69 is under cap)
- Final: 69

---

## The Complete Formula

### Scoring by Phrase Type

#### SEED Phrase
```
Seed Score = Direct lookup from SEED_SCORE_TABLE based on session size

Example: "Content Creation" (582 phrases) → 96
```

#### TOP 15 Phrases
```
Score = Ecosystem + Autocomplete Suggestions + Relevancy Score
Cap = Seed Score - 2

Example:
  Ecosystem: 27 (582 phrases)
  Autocomplete Suggestions: 32 (10 suggestions)
  Relevancy: 20 (mixed matches)
  Raw: 79
  Cap: 96 - 2 = 94
  Final: 79 ✓
```

#### A-Z and Prefix Expansion Phrases
```
Score = Ecosystem + Autocomplete Suggestions + Inheritance Bonus
Cap = Parent Score - offset (based on match strength)

Example:
  Ecosystem: 27
  Autocomplete Suggestions: 26 (8 suggestions)
  Inheritance: +10 (strong match to Top 15)
  Raw: 63
  Cap: 79 - 2 = 77
  Final: 63 ✓
```

---

## Example Calculations

### Example 1: Content Creation Session (582 phrases)

```
Session: "Content Creation"
Size: 582 phrases

SEED SCORE:
└── Direct lookup: 550-599 range → 96

TOP 15 PHRASE: "content creation for beginners"
├── Ecosystem: 27 (500-599 range)
├── Autocomplete Suggestions: 32 (10 suggestions)
├── Relevancy: 20 (mixed exact/topic)
├── Raw: 79
├── Cap: 96 - 2 = 94
└── Final: 79 ⚡ High Demand

EXPANSION PHRASE: "content creation apps for iphone"
├── Ecosystem: 27
├── Autocomplete Suggestions: 26 (8 suggestions)
├── Inheritance: +10 (strong match: "content creation apps")
├── Raw: 63
├── Cap: Parent(75) - 2 = 73
└── Final: 63 💡 Moderate Demand
```

### Example 2: YouTube Algorithm Session (~350 phrases)

```
Session: "YouTube Algorithm"
Size: 350 phrases

SEED SCORE:
└── Direct lookup: 350-399 range → 91

TOP 15 PHRASE: "youtube algorithm explained"
├── Ecosystem: 20 (300-399 range)
├── Autocomplete Suggestions: 36 (12 suggestions)
├── Relevancy: 29 (mostly exact)
├── Raw: 85
├── Cap: 91 - 2 = 89
└── Final: 85 🔥 Extreme Demand

EXPANSION PHRASE: "youtube algorithm tips 2024"
├── Ecosystem: 20
├── Autocomplete Suggestions: 20 (6 suggestions)
├── Inheritance: +6 (moderate match)
├── Raw: 46
├── Cap: Parent(75) - 4 = 71
└── Final: 46 💡 Moderate Demand
```

### Example 3: Legacy Planning Session (~130 phrases)

```
Session: "Legacy Planning"
Size: 130 phrases

SEED SCORE:
└── Direct lookup: 100-149 range → 70

TOP 15 PHRASE: "legacy planning for families"
├── Ecosystem: 10 (100-199 range)
├── Autocomplete Suggestions: 14 (4 suggestions)
├── Relevancy: 12 (topic matches)
├── Raw: 36
├── Cap: 70 - 2 = 68
└── Final: 36 ❄️ Low Demand

Note: Even a "good" phrase in a weak ecosystem can't break the ceiling.
```

---

## Demand Score Distribution Goals

With this three-layer approach, we aim for a natural bell curve:

| Score Range | Target % | Designation |
|-------------|----------|-------------|
| 85-99 | ~5% | 🔥 Extreme Demand |
| 65-84 | ~25% | ⚡ High Demand |
| 40-64 | ~45% | 💡 Moderate Demand |
| 20-39 | ~20% | ❄️ Low Demand |
| 0-19 | ~5% | ⛔ Very Low Demand |

---

## Implementation Status

### Phase 1: Foundation ✅ COMPLETE

| Task | Status |
|------|--------|
| Create `getEcosystemScore()` | ✅ Done |
| Create `getAutocompleteSuggestionsScore()` | ✅ Done |
| Create `getRelevancyScore()` | ✅ Done |
| Create `calculateSeedDemand()` with direct table | ✅ Done |

### Phase 2: Top 15 Anchor System ✅ COMPLETE

| Task | Status |
|------|--------|
| Word-overlap matching function | ✅ Done |
| Inheritance bonus calculation | ✅ Done (+10/+6/+3/0) |
| Cap enforcement logic | ✅ Done (-2/-4/-7/-15) |

### Phase 3: Integration ✅ COMPLETE

| Task | Status |
|------|--------|
| New Gemini API endpoint | ✅ `score-demand-gemini/route.ts` |
| Store Gemini scores in database | ✅ Uses `extra.gemini_v1` |

### Phase 4: Testing & Tuning 🔄 IN PROGRESS

| Task | Status |
|------|--------|
| Run on Content Creation session | ✅ Done |
| Validate seed score (582 → 96) | 🔄 Pending retest |
| Analyze distribution | 🔄 Pending retest |

---

## Technical Implementation

### File Structure

```
src/lib/demand-scoring.ts
├── [Original modal functions - UNTOUCHED]
│   └── calculateDemandScore(), getSuggestionPoints(), etc.
│
└── [NEW Gemini functions - ADDED]
    ├── getEcosystemScore()
    ├── getAutocompleteSuggestionsScore()  ← Renamed from getDensityScore
    ├── getRelevancyScore()
    ├── calculateSeedDemand()              ← Now uses direct table
    ├── calculateTop15Demand()
    ├── calculateExpansionDemand()
    ├── findBestTop15Match()
    ├── createGeminiContext()
    ├── scoreWithGemini()
    └── logGeminiBreakdown()

src/app/api/sessions/[sessionId]/
├── score-demand/route.ts           # Original endpoint - UNTOUCHED
└── score-demand-gemini/route.ts    # NEW Gemini endpoint
```

### Constants (Confirmed Values)

```typescript
// Seed Score Table (direct mapping)
SEED_SCORE_TABLE = [
  { min: 600, max: Infinity, score: 97 },
  { min: 550, max: 599, score: 96 },  // Content Creation (582) = 96
  { min: 500, max: 549, score: 95 },
  { min: 450, max: 499, score: 94 },
  { min: 400, max: 449, score: 93 },
  { min: 350, max: 399, score: 91 },  // YouTube Algorithm (~350) = 91
  { min: 300, max: 349, score: 89 },
  { min: 250, max: 299, score: 86 },
  { min: 200, max: 249, score: 82 },
  { min: 150, max: 199, score: 77 },
  { min: 100, max: 149, score: 70 },  // Legacy Planning (~130) = 70
  { min: 0, max: 99, score: 60 },
];

// Inheritance Bonuses (stronger)
INHERITANCE_BONUS = {
  strong: 10,   // 3+ words overlap
  moderate: 6,  // 2 words overlap
  weak: 3,      // 1 word overlap
  none: 0,
};

// Cap Offsets (closer to parent)
CAP_OFFSETS = {
  strong: 2,    // Parent - 2
  moderate: 4,  // Parent - 4
  weak: 7,      // Parent - 7
  none: 15,     // Seed - 15
};
```

---

## Why This Approach Works

### 1. Session Size Sets the Ceiling

By mapping session size directly to seed score, we ensure:
- Large topics (582 phrases) → seed at 96
- Medium topics (350 phrases) → seed at 91
- Small topics (130 phrases) → seed at 70

**Niche topics can't artificially inflate.** A phrase can only score as high as its ecosystem allows.

### 2. Autocomplete Suggestions Provide the Core Signal

YouTube autocomplete is the most reliable demand signal available. If YouTube returns suggestions, people are searching.

### 3. Relevancy Validates Through Match Patterns

Exact Match = users search this way
Topic Match = semantic demand exists

The combination tells us how strong the phrase is.

### 4. Inheritance Keeps Hierarchy Clean

Expansion phrases inherit from Top 15 anchors with:
- Strong match (+10 bonus, cap Parent - 2)
- Moderate match (+6 bonus, cap Parent - 4)  
- Weak match (+3 bonus, cap Parent - 7)
- No match (cap Seed - 15)

**Random phrases can't score artificially high.** They must connect to proven demand.

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [1-demand-scoring.md](/docs/1-demand-scoring.md) | Original demand scoring |
| [1-autocomplete-scoring-algorithm.md](/docs/1-autocomplete-scoring-algorithm.md) | Full technical framework |

---

*SuperTopics: Understanding what viewers want to watch through YouTube's own signals.*
