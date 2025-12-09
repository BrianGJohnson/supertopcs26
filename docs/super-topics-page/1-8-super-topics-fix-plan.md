# 1-8 Super Topics: Fix Plan & Architecture Decision

> **Status:** APPROVED  
> **Date:** December 9, 2025  
> **Purpose:** Final plan for fixing Page 4 implementation

---

## ✅ APPROVED APPROACH: "Score All, Enrich Top 4"

### Overview

A 2-step GPT call strategy that:
1. Gets **numeric scores** for ALL 13 phrases (cheap, fast)
2. Gets **rich text enrichment** for TOP 4 only (deep, valuable)
3. Allows **on-demand enrichment** for swapped contenders

**Target Cost:** $0.05-0.08 per session (down from $0.21)

---

## The Two GPT Calls

### Step 1: Scoring Call (All 13 Phrases)

**Purpose:** Get enough data to calculate Growth Fit and rank all 13

**Send:** All 13 phrases + creator context (batch)

**Get Back (per phrase):**
```typescript
{
  clickabilityScore: number;    // 0-99
  intentScore: number;          // 0-99
  primaryBucket: string;        // Info, Opinion, Review, etc.
  subFormat: string;            // Tutorial, First Impressions, etc.
  primaryEmotion: string;       // Curiosity, Fear, Hope, etc.
  secondaryEmotion: string;
  mindset: string;              // Positive, Negative, Neutral, Insightful
  algorithmTargets: string[];   // 2-3 tags
}
```

**Model Config:**
```typescript
{
  model: "o4-mini",
  reasoning_effort: "low",          // Fast, cheap
  max_completion_tokens: 3000,      // Reduced from 30,000!
  response_format: { type: "json_object" }
}
```

**Est. Cost:** ~$0.02-0.03

---

### Step 2: Enrichment Call (Top 4 Only)

**Purpose:** Get rich text content for the phrases that matter

**Send:** Top 4 phrases (after ranking)

**Get Back (per phrase):**
```typescript
{
  porchTalk: string;                   // 2 sentences - the pitch
  hook: string;                        // 1-2 sentences - opening line
  viewerGoal: string;                  // Learn, Validate, Solve, Vent, Be Entertained
  viewerGoalDescription: string;       // 2-3 sentences
  whyThisCouldWork: string;            // 2-3 sentences
  algorithmAngleDescription: string;   // 2-3 sentences
  alternateFormats: string[];          // 2 backup formats
}
```

**Model Config:**
```typescript
{
  model: "o4-mini",
  reasoning_effort: "medium",       // Better quality for important content
  max_completion_tokens: 4000,
  response_format: { type: "json_object" }
}
```

**Est. Cost:** ~$0.03-0.04

---

## Growth Fit Score Formula

**We calculate on our server, not GPT:**

```
Growth Fit = (Demand × 0.25)           // From Page 3
           + (Opportunity × 0.25)       // From Page 3
           + (Audience Fit × 0.20)      // From Page 3
           + (Clickability × 0.15)      // From GPT Step 1
           + (Intent × 0.15)            // From GPT Step 1
```

**Tier Assignment (by Growth Fit rank):**
- Rank #1 → Tier: `winner`
- Rank #2-4 → Tier: `runner-up`
- Rank #5-13 → Tier: `contender`

---

## Data Flow (Corrected)

```
┌─────────────────────────────────────────────────────────────┐
│ PAGE 3: REFINE                                              │
│ User stars 13 phrases → clicks "Proceed"                    │
│ Each phrase already has: Demand, Opportunity, Audience Fit  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GPT STEP 1: SCORING (All 13)                                │
│ - Send all 13 phrases in ONE batch call                     │
│ - Get back: clickability, intent, emotion, format, mindset  │
│ - Cost: ~$0.02-0.03                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ SERVER: CALCULATE & RANK                                    │
│ 1. Calculate Growth Fit Score for all 13                    │
│ 2. Sort by Growth Fit (descending)                          │
│ 3. Assign tiers: winner / runner-up / contender             │
│ 4. Save to database with rank_order and tier                │
│ 5. is_winner = FALSE for all                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ GPT STEP 2: ENRICHMENT (Top 4 Only)                         │
│ - Send phrases ranked #1-4                                  │
│ - Get back: porchTalk, hook, viewerGoalDescription, etc.    │
│ - Save enrichment to database                               │
│ - Cost: ~$0.03-0.04                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ PAGE 4: SUPER TOPICS (Display)                              │
│ - Position 1: Shows top ranked phrase (has full data)       │
│ - Positions 2-4: Runner-ups (have full data)                │
│ - Positions 5-13: Contenders (scores only, no enrichment)   │
└─────────────────────────────────────────────────────────────┘
```

---

## UI Handling: Contender Shows Limited Data

When a **Contender is swapped to Position 1** (top tile), they won't have:
- `porchTalk`
- `viewerGoalDescription`, `whyThisCouldWork`, `algorithmAngleDescription`
- `hook`

### UI Solution: "Partial View" State

**Top Tile shows for Contender:**
- ✅ Phrase title
- ✅ Scores (Demand, Opportunity, Growth Fit, Intent, Clickability)
- ✅ Format tags (Bucket, SubFormat)
- ✅ Emotion tags (Primary, Secondary)
- ✅ Algorithm Targets
- ✅ Mindset
- ❌ Why This Topic section → Show: "Unlock Full Report"
- ❌ Viewer Goal section → Hidden
- ❌ Algorithm Angle section → Hidden
- ❌ Hook section → Hidden

**Add "Unlock Full Report" Button:**
```
┌──────────────────────────────────────────────┐
│ 🔓 Unlock Full Report                        │
│                                              │
│ Get the complete analysis for this phrase:  │
│ • Why This Topic                             │
│ • Viewer Goal Analysis                       │
│ • Algorithm Angle                            │
│ • Opening Hook                               │
│                                              │
│ [ Generate Report (~$0.01) ]                 │
└──────────────────────────────────────────────┘
```

**On-Demand Enrichment API:**
- User clicks "Generate Report"
- Single GPT call for that one phrase
- Save enrichment to database
- Refresh UI to show full content

---

## Swap Logic (Clarified)

**What happens on swap:**
1. User clicks "Swap to Top" on any card
2. That card moves to Position 1 (display slot)
3. Previous Position 1 card moves to the clicked position
4. **Tier badges follow the card** (a Contender stays Contender even in Position 1)
5. Position is display logic; Tier is scoring truth

**Database stays unchanged on swap** - just reorder locally.

---

## Lock Logic (Clarified)

**Only on "Lock This Video":**
1. Set `is_winner = TRUE` for the phrase in Position 1
2. Set `is_winner = FALSE` for all other phrases in session
3. Unlock Title Lab (Page 5)
4. That phrase is now THE video they will make

---

## Implementation Steps

### Step 1: Clean Database
- [ ] Delete all duplicate super_topics rows
- [ ] Reset `is_winner = FALSE` for all existing rows
- [ ] Verify only 13 rows per session

### Step 2: Fix Cost Issues First
- [ ] Change `max_completion_tokens` from 30000 → 3000
- [ ] Change `reasoning_effort` from "medium" → "low" for Step 1
- [ ] Run a test to verify cost reduction

### Step 3: Implement 2-Step GPT Flow
- [ ] Create `scoreAllPhrases()` function (Step 1: batch scoring)
- [ ] Create `enrichTopPhrases()` function (Step 2: top 4 enrichment)
- [ ] Implement Growth Fit calculation on server
- [ ] Add upsert logic to prevent duplicates

### Step 4: Update Generate API
- [ ] Check if super_topics exist for session before generating
- [ ] If exist: skip generation, return existing data
- [ ] Remove `is_winner` from generation (only set on Lock)
- [ ] Implement tier assignment based on rank

### Step 5: UI Updates
- [ ] Add "has enrichment" check before displaying text sections
- [ ] Create "Unlock Full Report" component for contenders
- [ ] Handle partial data state in top tile
- [ ] Create on-demand enrichment API endpoint

### Step 6: Fix Swap Persistence
- [ ] On lock: save `is_winner = TRUE` to database
- [ ] Ensure only ONE winner per session ever

### Step 7: Test End-to-End
- [ ] Generate → verify 13 unique rows
- [ ] Display → verify tiers match scores
- [ ] Swap → verify tier follows card
- [ ] Lock → verify only one winner
- [ ] Cost → verify under $0.08 per session

---

## Files to Modify

| File | Changes |
|------|---------|
| `api/super-topics/generate/route.ts` | 2-step GPT calls, upsert logic, Growth Fit calc |
| `api/super-topics/enrich/route.ts` | NEW: On-demand enrichment for single phrase |
| `SuperPageContent.tsx` | Partial data handling, unlock report button |
| `lib/growth-fit.ts` | NEW: Growth Fit Score calculation formula |

---

## Cost Summary

| Component | Cost |
|-----------|------|
| Step 1: Score all 13 | ~$0.02-0.03 |
| Step 2: Enrich top 4 | ~$0.03-0.04 |
| On-demand (if any) | ~$0.01 each |
| **Total (typical)** | **~$0.05-0.07** |

**Savings:** ~$0.14-0.16 per session (70% reduction)

---

*Last Updated: December 9, 2025*
