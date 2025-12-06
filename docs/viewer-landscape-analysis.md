# Viewer Landscape Modal: Algorithm & Logic

> **Source of Truth:** `/src/lib/viewer-landscape.ts`  
> **Last Updated:** December 6, 2025

## Overview

The Viewer Landscape Modal analyzes YouTube autocomplete data to provide creators with two key scores:

| Score | Question It Answers | Range |
|-------|---------------------|-------|
| **Demand Score** | How many people are searching for this? | 0-100 |
| **Opportunity Score** | Is this a good phrase to target? | 0-100 |

When both scores meet threshold criteria, the phrase is designated a **SuperTopic**.

---

## SuperTopic Criteria

```
SuperTopic = Demand ≥ 50 AND Opportunity ≥ 90
```

A SuperTopic represents the ideal combination: sufficient viewer interest with excellent ranking potential.

---

## Demand Score (0-100)

**Purpose:** Measure how many people are actively searching for this topic.

### Formula Components

| Component | Points | How It's Calculated |
|-----------|--------|---------------------|
| **Suggestion Base** | 0-50 | `(suggestionCount / 14) × 50` |
| **Word Count Multiplier** | ×0.7 to ×1.1 | Applied to suggestion base |
| **Topic Match Bonus** | 0-15 | `topicMatchPercent × 15` |
| **Exact Match Bonus** | 0-15 | `exactMatchCount × 2` (capped at 15) |
| **Intent Anchor Bonus** | 0-10 | Sum of detected intent boosts |

### Word Count Multiplier

The sweet spot is 5-6 words. Shorter phrases are more competitive; longer phrases may have less volume.

| Words | Multiplier |
|-------|------------|
| 1 | 0.70 |
| 2 | 0.80 |
| 3 | 0.90 |
| 4 | 1.00 |
| **5-6** | **1.10** (sweet spot) |
| 7 | 1.00 |
| 8 | 0.95 |
| 9+ | 0.90 |

### Demand Labels (Recalibrated)

**Note:** Thresholds have been recalibrated based on real-world performance data to be more conservative and accurate.

| Score | Label |
|-------|-------|
| 95+ | Extreme Demand |
| 85-94 | Very High Demand |
| 77-84 | High Demand |
| 67-76 | Strong Demand |
| 57-66 | Good Demand |
| 47-56 | Moderate Demand |
| 37-46 | Some Interest |
| 0-36 | Limited Interest |

*Example: A 6-word phrase with 10-13 suggestions scores ~76 = "Strong Demand" (10K views first month, steady 1K/month thereafter).*

### Template-Based Message System

**NEW (December 2025):** Messages are now dynamically composed by combining template sentences based on multiple data points. This ensures the message accurately reflects BOTH demand AND opportunity scores.

**Messaging Philosophy:**
- **Data-focused, not directive**: Say "worth considering" instead of "highly recommended"
- **Browse and Search**: Always mention both when referencing YouTube's discovery systems
- **Signal-based language**: Say "low competition signal" not "low competition"
- **Long-term focus**: Emphasize "long-term view potential" without always specifying source

**Message Components:**

| Component | Condition | Example Sentence |
|-----------|-----------|------------------|
| **Demand Assessment** | Based on demandScore (0-100) | "Strong viewer interest in this topic." |
| **Opportunity Assessment** | Based on opportunityScore (0-100) | "Excellent opportunity to rank for this phrase." |
| **Word Count Insight** | 5-6 words (sweet spot), 2 words (broad), 7+ words (specific) | "This 5-word phrase hits the sweet spot for discoverability." |
| **Suggestion Count** | 12+ (strong), 10-11 (solid), 8-9 (good), 5-7 (moderate), <5 (limited) | "12 autocomplete suggestions is a strong signal of viewer interest." |
| **Long-Term Potential** | If evergreen intent detected + demand ≥47 | "This topic has long-term view potential from ongoing searches." |
| **Action Recommendation** | SuperTopic level | "Strong topic worth considering for browse and search." |
| **Action Recommendation** | High opportunity | "Good potential for browse and search—verify competition on YouTube." |
| **Action Recommendation** | Low competition signal | "Low competition signal—strong potential for discoverability." |

**Example Full Message:**

> "Strong viewer interest in this topic. Great opportunity with good ranking potential. This 5-word phrase hits the sweet spot for discoverability. 10 autocomplete suggestions indicates solid viewer interest. This topic has long-term view potential from ongoing searches. Good potential for browse and search—verify competition on YouTube."

---

## Opportunity Score (0-100)

**Purpose:** Measure how good this phrase is to target (ranking potential).

### Formula Components

| Component | Points | How It's Calculated |
|-----------|--------|---------------------|
| **Low Competition Signal** | 0-35 | Based on exact match % (lower = better) |
| **Long-Tail Bonus** | 0-22 | Based on word count |
| **Evergreen Intent** | 0-25 | Sum of intent category bonuses |
| **Demand Validation** | 0-15 | Based on suggestion count |

### Low Competition Signal

Lower exact match percentage = less competition = higher opportunity.

| Exact Match % | Points |
|---------------|--------|
| 0% | 35 |
| 1-15% | 30 |
| 16-30% | 22 |
| 31-50% | 15 |
| 51-70% | 8 |
| 71%+ | 3 |

### Long-Tail Bonus

Longer phrases have less competition and are easier to rank for.

| Words | Bonus |
|-------|-------|
| 1-2 | 0 |
| 3 | 5 |
| 4 | 12 |
| **5** | **20** (sweet spot) |
| **6** | **22** (sweet spot) |
| 7 | 18 |
| 8 | 15 |
| 9+ | 12 |

### Evergreen Intent Bonus

Phrases with learning, problem-solving, or action intent have long-term value.

| Intent Category | Bonus |
|-----------------|-------|
| Learning | +14 |
| Problem | +12 |
| Action | +10 |
| Discovery | +8 |
| Specific | +6 |
| Buyer | +5 |

*Capped at 25 points total*

### Demand Validation

Opportunity only matters if there's actual demand.

| Suggestions | Points |
|-------------|--------|
| 12+ | 15 |
| 10-11 | 13 |
| 8-9 | 11 |
| 6-7 | 8 |
| 4-5 | 5 |
| 0-3 | 2 |

### Opportunity Labels

| Score | Label |
|-------|-------|
| 90+ (with Demand ≥50) | SuperTopic |
| 85+ | Excellent Opportunity |
| 75-84 | Great Opportunity |
| 65-74 | Good Opportunity |
| 55-64 | Decent Opportunity |
| 45-54 | Moderate Opportunity |
| 35-44 | Limited Opportunity |
| 0-34 | Weak Opportunity |

---

## Intent Anchor Library

The algorithm detects intent-signaling words in the seed phrase. Each category provides a boost to scoring.

### Categories & Example Anchors

| Category | Boost | Example Anchors |
|----------|-------|-----------------|
| **Learning** | +8 | how to, tutorial, guide, explained, beginner, tips, step by step |
| **Problem** | +7 | fix, not working, issue, error, broken, troubleshoot, help |
| **Buyer** | +6 | best, review, vs, comparison, worth it, alternative |
| **Action** | +6 | start, create, build, setup, grow, improve, optimize |
| **Specific** | +5 | for youtube, for beginners, at home, free, easy |
| **Discovery** | +4 | what is, meaning, difference between, why, explain |
| **Current** | +3 | 2024, 2025, new, latest, update |

*Only one anchor per category is counted.*

---

## Exact Match vs Topic Match

### Exact Match
Suggestions that **start with** the exact seed phrase.

```
Seed: "video topics"
✓ Exact: "video topics for youtube"
✗ Not Exact: "japan video topics"
```

### Topic Match
Suggestions that **share key words** with the seed (semantic relevance).

- Requires 2+ matching key words (excluding stop words)
- Or 1+ match if seed has only 1-2 key words

---

## Vibe Detection

Each suggestion is analyzed for viewer emotional state/intent.

| Vibe | Icon | Signal Words |
|------|------|--------------|
| Learning | ✏️ | explained, tutorial, how to, guide, basics |
| Frustrated | 😤 | sucks, broken, trash, hate, worst |
| Problem-Solving | 🔧 | fix, not working, issue, error, help |
| Current | ⏰ | 2024, 2025, new, latest, update |
| Curious | 🤔 | why, what is, how does, meaning |
| Action-Ready | 🎯 | tips, tricks, start, create, grow |
| Comparing | ⚖️ | vs, versus, compare, better than, which |
| Brand | 🏢 | law firm, insurance, company, services |

### Position Weighting

Higher-ranked suggestions carry more weight in vibe distribution:

| Position | Weight |
|----------|--------|
| #1 | 1.00 |
| #2 | 0.50 |
| #3 | 0.25 |
| #4 | 0.15 |
| #5 | 0.10 |
| #6-9 | 0.03-0.08 |
| #10+ | 0.03 |

---

## Traffic Light Signal (Legacy)

The modal also displays a simplified Go/Caution/Stop signal derived from the dual scores:

| Condition | Signal | Message |
|-----------|--------|---------|
| SuperTopic (D≥50, O≥90) | 🟢 Go | SuperTopic detected! Strong demand with excellent opportunity. |
| Average score ≥65 | 🟢 Go | Good signal. Solid viewer interest with opportunity to rank. |
| Average score ≥45 | 🟡 Caution | Moderate signal. Some interest detected but verify on YouTube. |
| Average score ≥30 | 🟡 Caution | Limited signal. Consider refining or drilling deeper. |
| Average score <30 | 🔴 Stop | Weak signal. Very limited demand or opportunity. |

*Average score = (Demand + Opportunity) / 2*

---

## Special Patterns

### Opportunity Pattern Detection

A phrase is flagged as an "Opportunity" when:
- Weighted score ≥18 (exactMatch×3 + topicOnly×1)
- Exact match % between 1-49%
- Suggestion count ≥8

This indicates: **demand exists, but you can still rank**.

### Low Competition Signal

Flagged when either condition is met:
1. **Ideal Opportunity**: Exact match % < 10% AND Suggestion count ≥ 8
2. **Good Opportunity**: Weighted score ≥ 12 AND Exact match % < 40% AND Suggestion count ≥ 8

*Condition 1 covers the best-case scenario: high demand (8+ suggestions) with minimal direct competition (< 10% exact match).*

---

## Top Badge (Always Shown)

The modal **always** displays a badge at the top indicating the phrase's status:

| Badge | Icon | Trigger Condition | Color |
|-------|------|------------------|-------|
| **SuperTopic** | 🏆 (Logo) | Demand ≥ 50 AND Opportunity ≥ 90 | Gold |
| **Extreme Demand** | 🔥 | Demand ≥ 95 | Red |
| **Very High Demand** | ⚡ | Demand 85-94 | Green |
| **High Demand** | 📊 | Demand 77-84 | Green |
| **Strong Demand** | 💪 | Demand 67-76 | Blue |
| **Good Opportunity** | ✓ | Demand 57-66 | Blue |
| **Moderate Interest** | 💡 | Demand 47-56 | Orange |
| **Some Interest** | 🔍 | Demand 37-46 | Orange |
| **Limited Interest** | ❄️ | Demand 0-36 | Gray |

## Pattern Badges (Opportunity Mode)

In Opportunity Mode (3+ words), additional pattern badges appear below the score cards:

| Badge | Icon | Trigger Condition | Meaning |
|-------|------|------------------|---------|
| **Suggestion Count** | 📊 | Always shown | Number of autocomplete suggestions found |
| **Viewer Intent** | 🎯 | Any intent detected | Phrase contains learning, problem, action, or buyer intent signals |
| **Long-Term Views** | ♾️ | Evergreen intent detected | Learning or problem-solving content with compounding value |
| **Low Comp Signal** | 📈 | See Low Competition Signal section | Good demand with low competition - ideal for ranking |

*Pattern badges appear below the score cards against dark background for better contrast.*

---

## Display Modes

| Word Count | Mode | What Shows |
|------------|------|------------|
| 2 words | Discovery | Simple signal, match stats, vibes |
| 3+ words | Opportunity | Compact score cards + pattern badges |

### Simple vs Detailed Toggle

Users can toggle between **Simple** and **Detailed** views using the icon in the upper right:

- **Simple View**: Score cards + pattern badges only
- **Detailed View**: Adds Match Analysis card + Popular Topics grid + Anchor Words

*Match Analysis (Topic Match %, Exact Match %) only appears in Detailed mode to reduce clutter.*

---

## API Response Structure

The `/api/seed-signal` endpoint returns:

```typescript
{
  seed: string;
  
  // Primary Scores
  demandScore: number;           // 0-100
  demandLabel: string;           // "Strong Demand", etc.
  opportunityScore: number;      // 0-100
  opportunityLabel: string;      // "Excellent Opportunity", etc.
  isSuperTopic: boolean;         // Demand ≥ 50 AND Opportunity ≥ 90
  
  // Intent Analysis
  intentMatches: IntentMatch[];
  hasEvergreenIntent: boolean;
  
  // Match Statistics
  suggestionCount: number;
  exactMatchCount: number;
  exactMatchPercent: number;
  topicMatchCount: number;
  topicMatchPercent: number;
  
  // Vibe Analysis
  vibeDistribution: VibeDistribution;
  dominantVibe: VibeCategory;
  dominantVibePercent: number;
  
  // Display Data
  signal: 'go' | 'caution' | 'stop';
  signalMessage: string;
  insight: string;
  rankedSuggestions: RankedSuggestion[];
}
```

---

## File References

| File | Purpose |
|------|---------|
| `/src/lib/viewer-landscape.ts` | Core algorithm (source of truth) |
| `/src/components/ui/ViewerLandscapeModal.tsx` | Modal UI component |
| `/src/app/api/seed-signal/route.ts` | API endpoint |

---

## Example Calculations

### Example: "how to grow on youtube" (5 words)

**Input:**
- Suggestions: 12
- Exact matches: 2 (17%)
- Topic matches: 10 (83%)
- Intent detected: Learning (+8)

**Demand Score:**
- Suggestion base: (12/14) × 50 = 43
- Word count multiplier: 43 × 1.1 = 47
- Topic match bonus: 0.83 × 15 = 12
- Exact match bonus: 2 × 2 = 4
- Intent bonus: 8
- **Total: 71 (High Demand)**

**Opportunity Score:**
- Low comp signal (17%): 30
- Long-tail bonus (5 words): 20
- Evergreen intent (learning): 14
- Demand validation (12 suggestions): 15
- **Total: 79 (Great Opportunity)**

**Result:** Not quite a SuperTopic (needs O≥90), but excellent phrase to target.

---

*This document reflects the algorithm as implemented in `/src/lib/viewer-landscape.ts`.*
