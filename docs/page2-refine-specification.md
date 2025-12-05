# Page 2: Refine - Specification Document

> **Purpose**: This document captures the design, scoring systems, data flow, and UX decisions for the Refine page (Page 2 of the Build flow).

---

## Overview

The Refine page displays all keyword phrases generated in a session (typically 350-400 phrases) in a sortable, filterable table. Users progressively score and filter phrases through multiple rounds, ultimately narrowing down to 50-150 top phrases before moving to title generation.

---

## Progressive Scoring Flow

The key insight: **Users don't score everything at once.** They progressively reduce the phrase count through multiple scoring rounds. Each round has a token cost displayed before running.

### Token Cost Model
- Costs calculated in **increments of 50 phrases**
- Displayed in "Run Analysis" button before user commits
- Example: 200 phrases = 4 units, 400 phrases = 8 units
- Button shows: "Run Analysis: Topic Strength (X tokens)"

```
START: ~350-400 phrases (no scores yet)
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ROUND 1: Topic Strength (AI) - CHEAPEST                     │
│ Cost: ~25% of Volume cost per phrase                        │
│ Score all phrases for specificity                           │
│ AUTO-DELETE: Bottom 20-30% (scores < 30) removed            │
│ User manually deletes more → target ~50% total reduction    │
│ Button: "Run Analysis: Topic Strength (X tokens)"           │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
     ~175-250 phrases remaining
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ROUND 2: P&C + LTV (Pattern-based) - FREE                   │
│ Cost: $0 - Calculated from Data Intake                      │
│ Popularity + Competition from phrase patterns               │
│ LTV (Long-Term Views) calculated but NOT displayed          │
│ LTV boosts Popularity score behind the scenes               │
│ Runs automatically after Topic Strength                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
     ~100-175 phrases remaining
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ ROUND 3: Audience Fit (AI)                                  │
│ Score for creator/audience match                            │
│ Now only scoring ~100-175 phrases (cost savings)            │
│ User refines based on Fit + Topic combination               │
│ Button: "Run Analysis: Audience Fit (X tokens)"             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
     ~75-100 phrases remaining
         │
         ▼
      PAGE 3: Super (Topic Selection)
```

### Why This Order?

1. **Topic Strength FIRST (Cheapest AI)**: 
   - Only ~25% cost of Fit per phrase
   - Eliminates garbage early
   - Auto-delete bottom 20-30% saves tokens on subsequent round

2. **P&C + LTV SECOND (FREE!)**: 
   - All calculated from Data Intake - no API cost
   - Popularity = common phrase structure
   - Competition = how unique/rare
   - LTV = Top 10 matching (hidden, boosts Popularity)
   - User sorts by Spread (P - C)

3. **Fit THIRD**: 
   - More personalized scoring
   - Now only scoring ~100-175 phrases (significant cost savings)
   - Topic + P&C already filtered out weak phrases

### Auto-Delete Strategy (Beta)

For beta launch, system **auto-deletes bottom 20-30%** after Round 1:

| Topic Score | Action |
|-------------|--------|
| 0-29 | **Auto-deleted** (garbage phrases) |
| 30-49 | Kept but flagged (yellow highlight?) |
| 50+ | Kept normally |

**Rationale**:
- Reduces cognitive load - users don't see obvious garbage
- Saves tokens on subsequent rounds
- Users still have full control to delete more manually
- ~20-30% auto-delete is conservative, won't remove borderline phrases

**Future Enhancement**: Add toggle in Settings:
- "Auto-delete low scores" (default: ON)
- "Show all phrases, I'll delete manually"

---

## Data Flow

```
Page 1 (Seed)                    Page 2 (Refine)
─────────────────────────────────────────────────────────────
Phrase Generation                Display & Selection
     │                                  │
     ▼                                  ▼
┌─────────────┐                 ┌─────────────────┐
│ Generate    │                 │ Load phrases    │
│ phrases via │                 │ from database   │
│ YouTube API │                 │                 │
└──────┬──────┘                 └────────┬────────┘
       │                                 │
       ▼                                 ▼
┌─────────────┐                 ┌─────────────────┐
│ Save to DB  │                 │ Display in      │
│ with source │                 │ sortable table  │
│ tags        │                 │                 │
└──────┬──────┘                 └────────┬────────┘
       │                                 │
       ▼                                 ▼
┌─────────────┐                 ┌─────────────────┐
│ RUN DATA    │ ◄── Happens     │ Progressive     │
│ INTAKE      │     on Page 1   │ Scoring Rounds  │
│ (anchors,   │     after       │ (see above)     │
│ modifiers)  │     generation  │                 │
└─────────────┘                 └─────────────────┘
```

### Why Data Intake Runs on Page 1
1. User is already waiting during phrase generation
2. Spreads computational load across pages
3. Data is pre-computed and ready when user arrives at Page 2
4. Better perceived performance

---

## Data Intake Process

**What it does**: Analyzes all phrases in a session to extract patterns.

### Inputs
- All phrases in the session (excluding the seed phrase itself)

### Outputs
1. **Anchors**: Two-word combinations that appear frequently
   - Example: "how to", "what is", "best way", "step by step"
   - Stored with frequency count
   
2. **Modifiers**: Single words or patterns that modify meaning
   - Example: "2025", "beginner", "advanced", "free", "fast"
   - Stored with frequency count

3. **Pattern Scores**: Used to calculate Trend score for each phrase

### Storage
```sql
-- Session-level pattern data
CREATE TABLE session_patterns (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  pattern_type TEXT, -- 'anchor' or 'modifier'
  pattern TEXT,
  frequency INTEGER,
  created_at TIMESTAMPTZ
);
```

---

## Scoring System

### Score 1: Topic Strength (Column: "Topic") — Round 1

**What it measures**: Raw quality and specificity of the phrase.

**Factors**:
- Specificity: How detailed/specific is the phrase?
- Descriptiveness: Does it clearly describe a topic?
- English optimization: Grammatically correct, natural flow
- Length optimization: Not too short, not too long

**Score range**: 0-100 (higher = better)

**Generation**: OpenAI GPT-4o-mini API call

**Cost**: Cheapest AI scoring (~25% of Volume cost per phrase)

**When scored**: Round 1 - all ~350-400 phrases

**Purpose**: Identifies phrases with strong topic potential. Garbage phrases like "youtube algorithm sucks" get low scores and are auto-deleted.

---

### Hidden Score: Long-Term Views (LTV) — Calculated with P&C (FREE)

**What it measures**: How closely a phrase matches Top 10 autocomplete results.

**NOT DISPLAYED** on Page 2. Instead, LTV boosts Popularity:

| LTV Score | Popularity Boost |
|-----------|------------------|
| 0-19 | No boost |
| 20-29 | +3 to Popularity |
| 30-39 | +5 to Popularity |
| 40-49 | +8 to Popularity |
| 50+ | +10 to Popularity |

**Why hidden?**: Page 2 needs to be simple. Users understand Topic, Fit, P, C. Adding another score creates confusion and overlap with Popularity.

**Page 3 usage**: Phrases with LTV ≥ 50 get a "🌱 Long-Term Views" badge.

**See also**: `/docs/long-term-views-scoring.md` for detailed methodology

---

### Score 3: Audience Fit (Column: "Fit") — Round 3

**What it measures**: Match between phrase and creator's channel focus.

**Factors**:
- Creator's stated niche/topic area
- Types of videos they want to make
- Their target audience demographics
- Historical performance (if available)

**Score range**: 0-100 (higher = better match)

**Generation**: OpenAI GPT-4o-mini with channel context

**When scored**: Round 3 - after P&C filtering (~100-175 phrases)

**Purpose**: Now scoring fewer phrases = cost savings. Topic + P&C already filtered weak phrases.

---

### Score 4: Popularity (Column: "P" in P&C) — Round 2 (FREE)

**What it measures**: How commonly viewers structure phrases this way.

**Important clarification**: This is NOT search volume. This is NOT "trending topics." This measures **how viewers typically put phrases together** when searching on YouTube. It's pattern popularity based on the Data Intake analysis.

**Factors**:
- Frequency of anchors used in the phrase (e.g., "how to", "what is")
- Frequency of modifiers used in the phrase
- Pattern matching against common YouTube search structures
- **LTV boost applied** (hidden +3 to +10 based on Top 10 matching)

**Score range**: 0-100 (higher = more common phrase structure)

**Generation**: Calculated from Data Intake results (FREE - no API)

**When scored**: Round 2 - runs automatically after Topic Strength (no token cost)

---

### Score 5: Competition (Column: "C" in P&C) — Round 2 (FREE)

**What it measures**: How unique/rare is this specific phrase?

**Factors**:
- Inverse of pattern frequency
- Uniqueness of word combinations
- Presence of rare modifiers or specific terms

**Score range**: 0-100 (lower = less saturated = better opportunity)

**Generation**: Calculated from Data Intake results (FREE - no API)

**When scored**: Round 2 - alongside Popularity (no token cost)

**Note**: Lower numbers are BETTER (less competition, more opportunity)

---

### Derived Metric: Spread

**Formula**: `Popularity - Competition`

**What it indicates**: Quick way to identify golden phrases
- High spread = Popular phrase structure + Unique/rare phrase = Great opportunity
- Low spread = Either unpopular structure or oversaturated phrase

**Display**: 
- Shown in **hover state** on P&C column
- Users can sort by Spread
- Helps users who are overwhelmed: "Just line up the green"

**Example from screenshot**:
- "youtube algorithm 2025 creator insider": P=71, C=38, Spread=33 ✅ Great
- "youtube algorithm sucks": P=72, C=60, Spread=12 ❌ Not as good

---

### Future Score: Opportunity (Page 3)

**Reserved for Page 3 (Super)**: Composite score combining all data points:
- Topic Strength
- Long-Term Views (LTV) - hidden on Page 2, surfaced on Page 3
- Audience Fit
- Popularity (already boosted by LTV)
- Competition (inverted)
- Spread

**Purpose**: Final "winner" identification for topic selection. This name is reserved and should NOT be used elsewhere.

---

## Table Columns

### Proposed Design

| # | Column | Width | Sortable | Notes |
|---|--------|-------|----------|-------|
| 1 | Checkbox | 32px | No | Bulk selection |
| 2 | Phrase | flex | Yes | Main content |
| 3 | Star | 40px | Yes | Favorite/shortlist |
| 4 | X | 40px | Yes | Reject/hide |
| 5 | Source | 72px | Yes | Seed/Top10/Child/A-Z/Prefix |
| 6 | Topic | 56px | Yes | 0-100, green gradient |
| 7 | Fit | 56px | Yes | 0-100, green gradient |
| 8 | P&C | 60px | Yes | Split column, hover shows Spread |

**P&C Column Behavior**:
- Displays as two numbers: "71 | 38"
- Clicking header sorts by Spread (P minus C)
- Hover tooltip shows: "Spread: 33"
- Color coding: P uses standard gradient, C uses inverted gradient

---

## Source Tags (formerly "Tag")

Visual hierarchy using color coding:

| Source | Color | Hex | Description |
|--------|-------|-----|-------------|
| Seed | Red | `#EF4444` | The original seed phrase |
| Top 10 | Amber | `#F59E0B` | Direct autocomplete results |
| Child | Green | `#22C55E` | Expanded from Top 10 phrases |
| A-Z | Blue | `#3B82F6` | Alphabet suffix expansion |
| Prefix | Purple | `#A855F7` | Prefix pattern expansion |

---

## Color Coding for Scores

### Standard Scores (Topic, Fit, Trend)
Higher = Better = More Green

```
0-20:   Red      #EF4444
21-40:  Orange   #F97316
41-60:  Yellow   #EAB308
61-80:  Lime     #84CC16
81-100: Green    #22C55E
```

### Inverted Scores (Rarity)
Lower = Better = More Green

```
0-20:   Green    #22C55E  (rare = good)
21-40:  Lime     #84CC16
41-60:  Yellow   #EAB308
61-80:  Orange   #F97316
81-100: Red      #EF4444  (common = bad)
```

---

## Naming Decisions (Finalized)

### Popularity ✅ KEEPING
- Measures how commonly viewers structure phrases this way
- NOT search volume, NOT trending topics
- Users will learn through P&C pairing and tooltips

### Competition ✅ KEEPING
- Measures how unique/rare a phrase is
- Lower = better opportunity
- Users intuitively understand "low competition = good"

### Opportunity — RESERVED
- Reserved for Page 3 (Super) composite score
- Will combine all data points for final "winner" identification

---

## Auto-Pick Algorithm

Uses weighted scoring to auto-select top phrases. Weights adjust based on which scores are available:

### After Round 1 (Topic only)
```typescript
score = topic * 1.0
```

### After Round 2 (Topic + Demand/Opportunity)
```typescript
// Note: Demand already includes LTV boost
score = (topic * 0.4) + (demand * 0.3) + ((100 - opportunity) * 0.3)
```

### After Round 3 (Topic + Demand/Opportunity + Fit)
```typescript
score = (topic * 0.25) + (fit * 0.35) + (spread * 0.40)
// where spread = demand - opportunity
// demand already boosted by LTV
```

---

## Server-Side Considerations

### Performance
- Data Intake runs on Page 1 (background job after generation)
- AI scoring can be batched (process 50 phrases per API call)
- Results cached in database

### Rate Limiting
- YouTube autocomplete: 1.2-2s delays between calls (already implemented)
- OpenAI: Batch requests to minimize calls

### Background Jobs
- Use database queue or simple setTimeout for background processing
- Never leave long-running processes unattended
- Implement job timeout and cleanup

---

## Open Questions

1. **Mobile layout**: How to handle columns on small screens?
2. **Batch scoring**: How many phrases per AI API call?

---

## Implementation Priority

### Phase 1: Core Table (Page 2 Foundation)
- [ ] Display phrases with source tags
- [ ] Sortable columns
- [ ] Color-coded scores (placeholder values)
- [ ] Selection (star, reject, checkbox)
- [ ] Bulk actions (delete selected, etc.)

### Phase 2: Data Intake (Run on Page 1)
- [ ] Extract anchors/modifiers after phrase generation
- [ ] Store pattern frequencies in database
- [ ] Prepare P&C score calculations

### Phase 3: Round 1 - Topic Strength
- [ ] "Run Analysis" button with token cost display
- [ ] Topic Strength batch scoring via OpenAI
- [ ] Progress indicator during scoring
- [ ] Auto-delete bottom 20-30% (scores < 30)

### Phase 4: Round 2 - P&C + LTV Scores
- [ ] Calculate P&C from Data Intake patterns
- [ ] Calculate LTV from Top 10 phrase matching
- [ ] Apply LTV boost to Popularity
- [ ] Show P&C column with split display
- [ ] Hover state showing Spread
- [ ] Sort by Spread functionality
- [ ] Runs automatically (no token cost)

### Phase 5: Round 3 - Audience Fit
- [ ] Audience Fit scoring (requires channel context)
- [ ] Combined Topic + P&C + Fit filtering

### Phase 6: Page 3 - LTV Badge
- [ ] Display "🌱 Long-Term Views" badge for LTV ≥ 50
- [ ] Tooltip explaining the badge

---

## Build Flow Pages Reference

| Page | Name | Purpose |
|------|------|---------|
| 1 | Seed | Phrase generation from YouTube autocomplete |
| 2 | Refine | Progressive scoring & filtering (this doc) |
| 3 | Super | Topic selection, Opportunity Score, winner picking |
| 4 | Title | Title generation for selected topics |
| 5 | Package | Thumbnail creation |
| 6 | Upload | Video details for YouTube upload |

---

## Revision History

| Date | Version | Changes |
|------|---------|--------|
| 2025-11-29 | 1.0 | Initial specification |
| 2025-11-29 | 1.1 | Updated scoring order: Topic → Volume → Fit → P&C |
| 2025-11-29 | 1.2 | Added auto-delete strategy, token cost model, page reference |
| 2025-11-29 | 1.3 | Explored Volume alternatives - settled on LTV (Long-Term Views) |
| 2025-11-29 | 1.4 | **Simplified to 3 rounds**: Topic → P&C (with hidden LTV boost) → Fit. LTV boosts Popularity behind scenes, badge on Page 3 |
