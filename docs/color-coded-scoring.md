# Color-Coded Scoring System

## Overview

Score colors in SuperTopics are **percentile-based within each session**, not fixed thresholds. This ensures that the "best" phrases in any session are visually distinct, regardless of absolute score values.

**Key Principle**: A session where the top score is 89 should have the same visual distribution as a session where the top score is 97. Color represents **relative rank within the session**, not absolute quality.

---

## The Green Family Philosophy

Users scan for green to find the best phrases. When Topic Strength, Audience Fit, and Popularity all show green in the same row, that's a winner.

**Total Green Family: 35% of session phrases**

This means roughly 1 in 3 phrases appears "good" - enough options to feel successful, but selective enough to force meaningful choices.

---

## Percentile Distribution

| Percentile | Color | Hex | Label | % of Session |
|------------|-------|-----|-------|--------------|
| **Top 10%** | Dark Green | `#4DD68A` | Elite | 10% |
| **10-25%** | Lime | `#A3E635` | Strong | 15% |
| **25-35%** | Yellow-Green | `#CDDC39` | Good | 10% |
| **35-65%** | Orange | `#FB923C` | Moderate | 30% |
| **Bottom 35%** | Red | `#F87171` | Weak | 35% |

### Visual Breakdown (300 phrase session)

```
Dark Green   ████████████████████████████████  ~30 phrases (10%)
Lime         ████████████████████████████████████████████████  ~45 phrases (15%)
Yellow-Green ████████████████████████████████  ~30 phrases (10%)
─────────────────────────────────────────────────────────────────
GREEN FAMILY TOTAL: ~105 phrases (35%)
─────────────────────────────────────────────────────────────────
Orange       ██████████████████████████████████████████████████████████████████████████████████████████  ~90 phrases (30%)
Red          ██████████████████████████████████████████████████████████████████████████████████████████████████████████  ~105 phrases (35%)
```

---

## Color Spectrum

The colors flow from best to worst with clear visual distinction:

```
#4DD68A → #A3E635 → #CDDC39 → #FB923C → #F87171
  Dark     Lime    Yellow-    Orange     Red
  Green            Green
```

### Color Samples

- **Dark Green** `#4DD68A` - Rich, confident green. "This is excellent."
- **Lime** `#A3E635` - Bright yellow-green. "This is good."
- **Yellow-Green** `#CDDC39` - Greenish yellow. "This might work."
- **Orange** `#FB923C` - Warm orange. "Probably skip."
- **Red** `#F87171` - Soft red. "Avoid / delete candidate."

---

## How Percentiles Are Calculated

**Critical**: Percentiles are calculated from **ALL phrases in the session**, not just the currently visible ones. This ensures consistent color-coding even when:
- User has hidden/rejected phrases
- Filters are applied (score thresholds, etc.)
- Pagination is in effect

### Why This Matters

If a session starts with 300 phrases and the user rejects 75% of them:
- ❌ **Wrong**: Calculate percentiles from 75 remaining phrases → colors shift dramatically
- ✅ **Correct**: Calculate percentiles from original 300 phrases → colors stay consistent

A phrase that was "green" (top 35%) when you had 300 phrases should still be "green" after you've filtered down to your best 75.

### Data Flow

```
ALL phrases (from database)
    ↓
scoreData = collect all scores (topic[], fit[], pop[], etc.)
    ↓
RefineTable receives:
  - phrases: visible/filtered phrases to display
  - allScores: ALL session scores for percentile calculation
    ↓
Percentile thresholds calculated from allScores
    ↓
Each visible phrase colored based on its rank in the FULL distribution
```

### Example

Session with 200 phrases, Topic Strength scores:
- Top 20 scores (ranks 1-20) → Dark Green (top 10%)
- Next 30 scores (ranks 21-50) → Lime (10-25%)
- Next 20 scores (ranks 51-70) → Yellow-Green (25-35%)
- Next 60 scores (ranks 71-130) → Orange (35-65%)
- Bottom 70 scores (ranks 131-200) → Red (bottom 35%)

---

## Inverted Scores (Competition)

For Competition where **lower is better**:

| Percentile | Color | Meaning |
|------------|-------|---------|
| **Bottom 10%** (lowest scores) | Dark Green | Least competition = best |
| **10-25%** | Lime | Low competition |
| **25-35%** | Yellow-Green | Moderate-low |
| **35-65%** | Orange | Moderate-high |
| **Top 35%** (highest scores) | Red | High competition = worst |

---

## Why Percentile-Based?

### The Problem with Fixed Thresholds

Old approach: "Score ≥ 80 = Dark Green"

This fails because:
- Session A: Top score is 97 → many dark greens
- Session B: Top score is 78 → zero dark greens (discouraging!)

### The Percentile Solution

New approach: "Top 10% of session = Dark Green"

This works because:
- Session A: Top 10% of 97-down → dark green
- Session B: Top 10% of 78-down → dark green
- Users always see the same visual distribution

---

## Application to Columns

| Column | Type | Percentile Logic |
|--------|------|------------------|
| Topic (TS) | Standard | Higher score = better = green |
| Fit (AF) | Standard | Higher score = better = green |
| Pop | Standard | Higher score = better = green |
| Comp | **Inverted** | Lower score = better = green |
| Spread | Standard | Higher spread = better = green |

---

## The "Double Green" Signal

When scanning rows, users look for alignment:

| Topic | Fit | Pop | Signal |
|-------|-----|-----|--------|
| 🟢 Dark | 🟢 Dark | 🟢 Dark | ⭐ PERFECT - top phrase |
| 🟢 Dark | 🟢 Lime | 🟢 Dark | ✅ Excellent |
| 🟢 Lime | 🟢 Lime | 🟢 Lime | ✅ Very good |
| 🟢 Dark | 🟠 Orange | 🟢 Dark | ⚠️ Strong but fit issue |
| 🟡 Y-Green | 🟡 Y-Green | 🟡 Y-Green | 👀 Worth considering |
| 🟠 Orange | 🟠 Orange | 🟠 Orange | ❌ Probably skip |
| 🔴 Red | 🔴 Red | 🔴 Red | ❌ Delete candidate |

---

## Implementation

### Function Signature

```typescript
function getScoreColorByPercentile(
  score: number | null,
  allScores: number[],
  inverted: boolean = false
): string
```

### Percentile Thresholds

```typescript
const PERCENTILE_THRESHOLDS = {
  darkGreen: 10,    // Top 10%
  lime: 25,         // 10-25%
  yellowGreen: 35,  // 25-35%
  orange: 65,       // 35-65%
  red: 100,         // Bottom 35%
};

const SCORE_COLORS = {
  darkGreen: "#4DD68A",
  lime: "#A3E635",
  yellowGreen: "#CDDC39",
  orange: "#FB923C",
  red: "#F87171",
  null: "rgba(255,255,255,0.3)",
};
```

---

## Files

| File | Purpose |
|------|---------|
| `/src/app/members/build/refine/_components/RefineTable.tsx` | Score color display |
| `/docs/color-coded-scoring.md` | This documentation |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-02 | Initial documentation - percentile-based system |
