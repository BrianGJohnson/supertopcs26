# Demand Scoring

## Measuring Viewer Interest Through Autocomplete

**Version:** 2.1  
**Last Updated:** January 2025

---

## Overview

This document describes how SuperTopics scores **Viewer Demand** using YouTube's autocomplete API (via Apify). Demand answers one question:

> **"How many viewers are searching for this topic?"**

**Score Range:** 0-99 (numeric, displayed in DEM column)

---

## Pricing & Cost

| Metric | Value |
|--------|-------|
| **API Cost** | ~$0.013 (1.3 cents) per 75 phrases |
| **Batching** | 6 phrases per API call |
| **API Calls** | ~13 per full scoring run |
| **Duration** | 30-45 seconds |

### Cost Calculation

```
75 phrases ÷ 6 per batch = 13 API calls
13 calls × $0.001 = $0.013 (~1.3 cents)
```

**Pricing Note:** When setting user pricing, consider adding margin. At 1.3¢ cost, a 5¢ charge would provide ~3.7¢ margin (280% markup).

---

## Database Schema

All demand scores are stored in the `seed_analysis` table:

| Column | Type | Description |
|--------|------|-------------|
| `demand` | integer | Final demand score (0-99) |
| `demand_base` | integer | Raw score before size multiplier |
| `extra.demand_v2` | jsonb | Full scoring breakdown |

**Note:** The `popularity` and `popularity_base` columns are legacy and no longer used for DEM column display.

### Extra Field Structure

```json
{
  "demand_v2": {
    "suggestionCount": 12,
    "exactMatchCount": 8,
    "topicMatchCount": 10,
    "suggestionPoints": 34,
    "exactMatchPoints": 17,
    "topicMatchPoints": 26,
    "sizeMultiplier": 1.02,
    "rawScore": 78,
    "scoredAt": "2025-01-XX..."
  }
}
```

---

## Implementation Files

| File | Purpose |
|------|---------|
| `/src/lib/demand-scoring.ts` | Core scoring library |
| `/src/app/api/sessions/[sessionId]/score-demand/route.ts` | API endpoint |
| `/docs/apify-costs.md` | Cost documentation |

---

## Core Principle: Autocomplete as Demand Signal

YouTube's autocomplete returns up to 14 suggestions for any search phrase. These suggestions are:

- **Real-time:** Updated constantly based on actual searches
- **Intent-based:** Represents what people are actively looking for
- **Ranked:** Ordered by relevance/popularity

**Key Insight:** More suggestions + higher match quality = stronger demand signal.

---

## The Demand Formula (v2.0)

The current implementation uses **three signals** weighted to produce scores 0-99:

```
Raw Score = Suggestion Points + Topic Match Points + Exact Match Points
Final Score = min(99, Raw Score × Session Size Multiplier)
```

### Signal Weights

| Signal | Max Points | What It Measures |
|--------|------------|------------------|
| Suggestions (0-14) | 40 | How many autocomplete suggestions returned |
| Topic Match (0-14) | 30 | How many suggestions contain the phrase's key words |
| Exact Match (0-14) | 30 | How many suggestions start with the exact phrase |
| **Total Max** | **100** | Before session multiplier |

**Cap:** Final score capped at **99** (no phrase should hit exactly 100)

---

## Suggestion Count → Points Curve

YouTube returns 0-14 suggestions. We map this to 0-40 points:

| Suggestions | Points |
|-------------|--------|
| 14 | 40 |
| 13 | 37 |
| 12 | 34 |
| 11 | 31 |
| 10 | 29 |
| 9 | 26 |
| 8 | 23 |
| 7 | 20 |
| 6 | 17 |
| 5 | 14 |
| 4 | 11 |
| 3 | 9 |
| 2 | 6 |
| 1 | 3 |
| 0 | 0 |

---

## Topic Match → Points Curve

Topic match = all significant words (3+ chars) appear in suggestion. Max 30 points:

| Topic Matches | Points |
|---------------|--------|
| 14 | 30 |
| 13 | 28 |
| 12 | 26 |
| 11 | 24 |
| 10 | 21 |
| 9 | 19 |
| 8 | 17 |
| 7 | 15 |
| 6 | 13 |
| 5 | 11 |
| 4 | 9 |
| 3 | 6 |
| 2 | 4 |
| 1 | 2 |
| 0 | 0 |

---

## Exact Match → Points Curve

Exact match = suggestion starts with the phrase. Max 30 points:

| Exact Matches | Points |
|---------------|--------|
| 14 | 30 |
| 13 | 28 |
| 12 | 26 |
| 11 | 24 |
| 10 | 21 |
| 9 | 19 |
| 8 | 17 |
| 7 | 15 |
| 6 | 13 |
| 5 | 11 |
| 4 | 9 |
| 3 | 6 |
| 2 | 4 |
| 1 | 2 |
| 0 | 0 |

---

## Demand Designations

| Score Range | Designation | Icon | Meaning |
|-------------|-------------|------|---------|
| 85-99 | Extreme Demand | 🔥 | Exceptional - top tier viewer interest |
| 65-84 | High Demand | ⚡ | Strong - worth prioritizing |
| 40-64 | Moderate Demand | 💡 | Decent - evaluate with opportunity score |
| 0-39 | Low Demand | ❄️ | Sparse - may lack audience |

---

## Match Types Explained

### Exact Match

An **exact match** means the phrase is a prefix of the suggestion:

```
Phrase: "content creation"
Suggestion: "content creation for beginners" ✅ Exact (starts with phrase)
Suggestion: "best content creation tips" ❌ Not exact (doesn't start with phrase)
```

### Topic Match

A **topic match** means all significant words (3+ chars) appear in the suggestion:

```
Phrase: "content creation tips"
Suggestion: "tips for content creation beginners" ✅ Topic (all words present)
Suggestion: "content marketing strategies" ❌ Not topic (missing "creation", "tips")
```

### Why Both Signals?

- **Exact match** = YouTube thinks your phrase IS the search intent
- **Topic match** = YouTube thinks your phrase is RELATED to search intent
- Both contribute to the final score with equal max weights (30 points each)

---

## Session Size Multiplier

Larger sessions get a slight boost (harder to maintain quality across more phrases):

| Session Size | Multiplier |
|--------------|------------|
| 550+ phrases | 1.06x |
| 450-549 | 1.04x |
| 350-449 | 1.02x |
| 275-349 | 1.00x (baseline) |
| 200-274 | 0.98x |
| <200 phrases | 0.95x |

---

## Scoring Examples

### High Demand Example

```
Phrase: "How to start a YouTube channel"
Suggestions: 14 → 40 points
Topic Matches: 12 → 26 points
Exact Matches: 10 → 21 points
Raw Score: 87
Session Size: 400 phrases → 1.02x multiplier
Final Score: min(99, 87 × 1.02) = 89 🔥
```

### Moderate Demand Example

```
Phrase: "YouTube thumbnail design tips"
Suggestions: 8 → 23 points
Topic Matches: 6 → 13 points
Exact Matches: 5 → 11 points
Raw Score: 47
Session Size: 300 phrases → 1.00x multiplier
Final Score: 47 💡
```

---

## Implementation Reference

### API Endpoint

```
POST /api/sessions/[sessionId]/score-demand
```

Scores up to 75 phrases using Apify actor for YouTube autocomplete.

### Data Flow

1. API receives sessionId
2. Fetches up to 75 unscored phrases from database
3. Batches phrases (6 per API call) to Apify
4. For each phrase, collects suggestions and analyzes matches
5. Calculates scores using the formula
6. Writes to `demand` and `demand_base` columns

### Key Files

| File | Purpose |
|------|---------|
| `/src/lib/demand-scoring.ts` | Core scoring library with point mappings |
| `/src/app/api/sessions/[sessionId]/score-demand/route.ts` | API endpoint |
| `/src/server/db/schema.ts` | Database schema with `demand` column |

---

## Demand vs. Opportunity

**Demand** tells you: *"Do viewers want this?"*
**Opportunity** tells you: *"Can you rank for it?"*

High demand alone isn't enough. See [Opportunity Scoring](/docs/1-opportunity-scoring.md) for ranking potential analysis.

---

## Key Takeaways

1. **Three signals** combine: suggestions, topic matches, exact matches
2. **Granular point curves** prevent clustering at extremes
3. **Cap at 99** ensures no phrase hits exactly 100
4. **Session size multiplier** provides context-aware adjustment
5. **Demand ≠ Opportunity** - both scores matter

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [Autocomplete Scoring Algorithm](/docs/1-autocomplete-scoring-algorithm.md) | Full technical implementation |
| [Opportunity Scoring](/docs/1-opportunity-scoring.md) | Ranking and long-term views potential |
| [Sweet Spot Discovery](/docs/1-sweet-spot-discovery-whitepaper.md) | The low-competition, high-demand pattern |

---

*SuperTopics: Understanding what viewers want to watch.*
