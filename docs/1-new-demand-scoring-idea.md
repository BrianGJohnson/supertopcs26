# New Demand Scoring Idea

## Simplifying Demand Based on Viewer Landscape Modal Truth

**Version:** Draft 1.0  
**Last Updated:** December 5, 2025

---

## The Problem

Our current batch demand scoring produces scores that:
- Cluster too low (48% scored 10-19)
- Don't match what the Viewer Landscape Modal shows
- Feel broken and unhelpful to YouTubers

**Example:** "How To Introduce Yourself On Youtube"
- Modal shows: **100 Extreme Demand** (14 suggestions, 1/14 exact, 14/14 topic)
- Our batch scoring: Would score much lower

---

## The Truth: What the Modal Does Right

The Viewer Landscape Modal uses only **3 inputs**:

1. **Suggestion Count (0-14)** - How many autocomplete results?
2. **Exact Match Count** - How many start with the exact phrase?
3. **Topic Match Count** - How many share key words?

That's it. No complex formulas. No 6-component scoring.

---

## The Hierarchy Factor

The Modal also considers **drilling depth** (hierarchy):

```
Level 0: "YouTube video editing" (seed)
Level 1: "YouTube video editing tips" 
Level 2: "YouTube video editing tips and tricks"
```

When a user drills through multiple levels:
- Demand persists = strong signal
- Each level validates the parent

**But what if they don't drill?**

The Modal **doubles** the score for Level 0 (seed) phrases. This compensates for not having parent validation.

---

## Proposed New Formula

### For Phrases WITH Hierarchy (drilled)

```
Demand = Parent Points + Child Points (cap 100)
```

### For Phrases WITHOUT Hierarchy (standalone seeds)

Use the Modal's approach:

```
Base Score = f(suggestionCount, exactMatch%, topicMatch%)
Demand = Base Score × 2 (cap 100)
```

Where Base Score considers:
- **Suggestion Count** = Primary signal (40% weight)
- **Topic Match %** = Semantic demand (30% weight)  
- **Exact Match %** = This is tricky (see below)

---

## The Exact Match Paradox

In the Modal, **low exact match + high topic match = Sweet Spot** (opportunity).

But for DEMAND specifically:
- High topic match = people want this topic ✅
- Low exact match = no one is using these exact words ❓

**Key Insight:** Low exact match doesn't mean low demand. It means the PHRASE is unique, but the TOPIC has demand.

### Recommendation

For DEMAND scoring, we should:
- **Heavily weight suggestion count** (if YouTube returns 14, there's demand)
- **Weight topic match** (semantic demand exists)
- **Ignore or lightly weight exact match** (that's more about opportunity/competition)

---

## Example: "How To Introduce Yourself On Youtube"

| Signal | Value | What It Means |
|--------|-------|---------------|
| Suggestions | 14/14 | Maximum - YouTube thinks this is popular |
| Exact Match | 1/14 (7%) | Very low - this exact phrase is unique |
| Topic Match | 14/14 (100%) | Maximum - all suggestions are about the same topic |
| Word Count | 6 words | Long-tail but still getting 14 suggestions = impressive |

### Current Modal Score: 100 (Extreme Demand)

### My Suggested Score: 76-82

Why lower than 100?
- 6 words is very specific
- Only 1 exact match means the phrase itself isn't a primary search
- But 14 suggestions + 100% topic match = genuine demand

A score of ~78-80 feels right: **High Demand** but not **Extreme**.

---

## Proposed Scoring Table (Draft)

| Suggestions | Topic Match % | Suggested Demand Range |
|-------------|---------------|------------------------|
| 14 | 80-100% | 85-99 (Extreme) |
| 14 | 50-79% | 70-84 (High) |
| 14 | <50% | 55-69 (Moderate-High) |
| 10-13 | 80-100% | 75-89 (High) |
| 10-13 | 50-79% | 60-74 (Moderate-High) |
| 10-13 | <50% | 45-59 (Moderate) |
| 5-9 | 80-100% | 50-65 (Moderate) |
| 5-9 | 50-79% | 35-49 (Low-Moderate) |
| 5-9 | <50% | 20-34 (Low) |
| 0-4 | Any | 0-25 (Very Low) |

**Note:** Exact match could adjust within the range (low exact = slight penalty, high exact = slight boost).

---

## What About Word Count?

Current thinking: **Don't factor word count into demand.**

Why?
- A 6-word phrase with 14 suggestions is MORE impressive than a 2-word phrase with 14 suggestions
- The suggestion count already accounts for difficulty
- Word count might matter for Opportunity (easier to rank for long-tail) but not Demand

---

## Questions to Resolve

1. **Should Level 0 (seed) phrases be doubled?**
   - Modal does this
   - Makes sense: no parent validation, so trust the signals more

2. **How much should exact match matter for demand?**
   - Argument FOR: Exact match = people actually search this phrase
   - Argument AGAINST: Topic match proves demand exists, exact match is about phrasing

3. **Should we cap at 99 or 100?**
   - 99 = psychologically "not quite perfect"
   - 100 = clear maximum

4. **Is "Extreme Demand" at 14 suggestions + 100% topic match always correct?**
   - Current Modal: Yes
   - Proposed: Maybe lower to 85-90 unless exact match is also high

---

## My Feedback

### What I Like About This Approach

1. **Simple** - Only 3 inputs (suggestions, exact, topic)
2. **Matches Modal** - Consistency between batch and interactive scoring
3. **Understandable** - YouTubers can see the logic

### What I'd Adjust

1. **Tone down "Extreme Demand" for low exact match**
   - 14 suggestions + 1 exact match = High Demand (not Extreme)
   - 14 suggestions + 10+ exact match = Extreme Demand

2. **Make suggestion count the dominant signal**
   - If YouTube returns 14 results, there's demand. Period.
   - Topic/exact match refine the score, but don't override it.

3. **Consider the "doubling" logic for standalone seeds**
   - Without hierarchy, we need to compensate
   - Doubling may be too aggressive; maybe 1.5x or a fixed bonus

---

## Next Steps

1. Define the exact formula
2. Test against known phrases
3. Compare with Modal outputs
4. Adjust weights until distribution feels right
5. Update batch scoring to use new formula

---

## Reference: Viewer Landscape Modal Scoring

From `viewer-landscape.ts`:

```typescript
// Base demand score from suggestion count (0-40 points)
const demandScore = (total / 14) * 40;

// Topic relevance bonus (0-30 points)
const topicBonus = (topicPct / 100) * 30;

// Competition score based on exact match (-10 to +30 points)
// Low exact = bonus (opportunity), High exact = penalty
```

This is a 0-100 scale where:
- 14 suggestions = 40 base points
- 100% topic match = +30 points
- Low exact match = +30 bonus (Sweet Spot)

**Total potential:** 40 + 30 + 30 = 100

---

*This document captures the idea for simplifying demand scoring based on the Viewer Landscape Modal's approach.*
