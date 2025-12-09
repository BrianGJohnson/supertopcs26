# Opportunity Scoring Algorithm

> How SuperTopics calculates opportunity scores for the Builder Module

## Overview

Opportunity scoring identifies which phrases are worth pursuing based on **data we already have** from the session. Unlike demand scoring (which measures search interest), opportunity scoring evaluates the **competitive landscape** and **ranking potential**.

---

## Data Points Available

### Per-Phrase Data (from autocomplete)

| Data Point | Description | Example |
|------------|-------------|---------|
| **Word count** | Number of words in phrase | "YouTube Video Editing Tips" = 4 words |
| **Suggestion count** | Total autocomplete suggestions (0-14) | 9 suggestions |
| **Exact match count** | Suggestions starting with this phrase | 4 of 9 start with phrase |
| **Topic match count** | Suggestions sharing 2+ key words | 9 of 9 share key words |
| **Source type** | How phrase was discovered | seed, top10, child, az, prefix |

### Derived Ratios

| Ratio | Formula | What It Signals |
|-------|---------|-----------------|
| **Exact match %** | exact / suggestions | High = more competition |
| **Topic match %** | topic / suggestions | High = strong semantic demand |

---

## Scoring Components

### 1. Demand Base (0-30 points)

Foundation based on autocomplete suggestion count.

| Suggestions | Points | Interpretation |
|-------------|--------|----------------|
| 12+ | 30 | Maximum demand signal |
| 10-11 | 25 | Very high demand |
| 7-9 | 18 | High demand |
| 5-6 | 12 | Moderate demand |
| 3-4 | 5 | Low demand |
| 0-2 | 0 | Minimal demand |

---

### 2. Low Comp Signal (0-25 points)

**The key insight:** High topic match + Low exact match = Opportunity

- **High topic match** = Many phrases about this TOPIC exist
- **Low exact match** = Few phrases start with these EXACT words
- **= Competition gap** = Opportunity signal worth exploring

| Exact Match | Topic Match | Points | Signal Strength |
|-------------|-------------|--------|-----------------|
| ≤20% | ≥80% | 25 | Strong low comp signal |
| ≤30% | ≥60% | 20 | Good low comp signal |
| ≤40% | ≥50% | 12 | Moderate signal |
| ≤50% | ≥40% | 5 | Slight signal |

**Example:**
- Phrase: "How To Introduce Yourself On YouTube"
- Exact: 1 of 11 (9%)
- Topic: 11 of 11 (100%)
- **Result:** 25 points (Strong Low Comp Signal 🎯)

---

### 3. Depth/Level Boost (0-40 points)

How the phrase was discovered in the session hierarchy.

| Level | Description | Points | Rationale |
|-------|-------------|--------|-----------|
| 4+ | 4+ levels deep | 35 | Very specific niche |
| 3 | Grandchild phrase | 30 | Great specificity |
| 2 | Child phrase | 22 | Good specificity |
| 1 | Direct from seed | 12 | First expansion |
| 0 | Seed phrase | 0 | Starting point |

**Bonus:** +3 points if parent had 10+ suggestions (sustained demand)

---

### 4. Source Type Boost (Builder Module)

| Source | Description | Boost | Rationale |
|--------|-------------|-------|-----------|
| child | From top 10 phrase | +10 | Descended from proven demand |
| prefix | Question variation | +5 | "How to" patterns are evergreen |
| az | A-Z expansion | +3 | Systematic discovery |
| top10 | Top 10 autocomplete | 0 | Already scored by demand |
| seed | User's seed phrase | 0 | Starting point |

---

### 5. Related Phrases Bonus (0-25 points)

Checks for phrase relationships within the session.

| Pattern | Points | Example |
|---------|--------|---------|
| Shorter variant exists with high demand | +15 | "YouTube Video Editing" scores 93 |
| Longer variants exist (3+) | +10 | This phrase spawns many children |
| Parent + children both strong | +5 | Strong family tree |

---

### 6. Anchor Boost (0-20 points)

Phrases containing "hot anchors" get boosted.

**Hot Anchors:** Words that appear frequently in high-demand phrases.

| Anchor Frequency | Points |
|------------------|--------|
| Top 5 anchor in session | +15 |
| Top 10 anchor | +10 |
| Top 20 anchor | +5 |

**Common hot anchors:** AI, tips, beginners, tutorial, 2025, free

---

### 7. Long-Term Views (0-15 points)

Evergreen topic indicators.

**Triggers:**
- Starts with: how, what, why, when, where, learn, best
- Contains: tutorial, guide, beginner, tips, step by step

| Word Count + Pattern | Points |
|---------------------|--------|
| 6+ words + evergreen | 14 |
| 5 words + evergreen | 13 |
| 4 words + evergreen | 12 |

---

## Total Score Calculation

```
Opportunity = Demand Base (30)
            + Low Comp Signal (25)
            + Depth Boost (40)
            + Source Boost (10)
            + Related Phrases (25)
            + Anchor Boost (20)
            + Long-Term (15)
            ─────────────────────
            Maximum: 100 (capped)
```

---

## Score Interpretation

| Score | Label | Meaning |
|-------|-------|---------|
| 70-100 | Excellent | Strong opportunity, prioritize |
| 50-69 | Strong | Good opportunity, worth pursuing |
| 35-49 | Good | Moderate opportunity, consider |
| 20-34 | Moderate | Limited opportunity |
| 0-19 | Low | Weak signals |

---

## Badges

| Badge | Trigger | Meaning |
|-------|---------|---------|
| 🎯 **Low Comp** | Exact ≤30% + Topic ≥60% | Low competition signal detected |
| 📈 **Long-Term** | Evergreen pattern + 8+ suggestions | Sustainable search interest |
| 🔍 **Deep Topic** | Level 3+ depth | Highly specific niche |
| ⭐ **Top Position** | Position ≤2 in parent | YouTube ranks this highly |

---

## Implementation Notes

### For Builder Module

1. **All phrases scored** - Including hidden ones (for related phrase analysis)
2. **No API calls** - Uses data already collected during intake
3. **Session context matters** - Hot anchors vary by session
4. **Child phrases get natural boost** - Descended from proven demand

### Key Insight

A phrase doesn't need to rank for its exact terms. If "YouTube Video Editing Tips" ranks well, videos about "YouTube Video Editing Tips And Tricks" will also get recommended through:
- Browse (YouTube recommends based on viewing history)
- Search (semantic matching, not just exact)
- Suggested videos (related content)

This is why **Low Comp Signal** is so valuable - it identifies phrases where the TOPIC has demand but the EXACT phrase has room.

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [Demand Scoring](/docs/1-gemini-demand-scoring.md) | How demand scores are calculated |
| [Autocomplete Algorithm](/docs/1-autocomplete-scoring-algorithm.md) | Raw autocomplete data processing |
| [Builder Module](/docs/application-flow.md) | Full application flow |
