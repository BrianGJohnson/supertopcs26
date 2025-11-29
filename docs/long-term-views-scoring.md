# Long-Term Views (LTV) Scoring

> **Purpose**: Score phrases based on how well they match Top 10 autocomplete results. High-scoring phrases have potential for sustained, long-term views because they align with proven search demand.

---

## Why "Long-Term Views"?

Top 10 autocomplete phrases represent **what people actually search on YouTube**. 

A phrase that closely matches a Top 10 result:
- Aligns with proven, recurring search behavior
- Has staying power beyond trending moments
- Will continue to surface in autocomplete = continued discovery

**Long-Term Views (LTV)** score measures this alignment.

---

## How LTV Score is Used

### 1. Boost Popularity on Page 2 (Hidden)
LTV score is calculated but NOT displayed. Instead, it **nudges Popularity**:

| LTV Score | Popularity Boost |
|-----------|------------------|
| 0-19 | No boost |
| 20-29 | +3 to Popularity |
| 30-39 | +5 to Popularity |
| 40-49 | +8 to Popularity |
| 50+ | +10 to Popularity |

This keeps Page 2 clean (only Topic, Fit, P, C visible) while incorporating the LTV signal.

### 2. Badge on Page 3 (Visible)
When user is down to 12-16 finalist phrases:

- **Threshold**: LTV Score ≥ 50
- **Display**: "🌱 Long-Term Views" badge
- **Tooltip**: "This phrase closely matches top YouTube autocomplete results, indicating sustained search demand"

---

## Scoring Algorithm (v4 - Anchor-Based)

The algorithm uses a **priority-based matching system** with 4 tiers.

### Step 1: Extract Anchors from Top 10

From Top 10 phrases, extract:

1. **Single anchors**: Non-seed, non-filler words (3+ chars)
   - Example: "tips", "beginners", "equipment", "course", "2025"

2. **Bigram anchors**: Two-word combinations with meaningful content
   - Example: "for beginners", "with ai", "full course"

3. **Full anchors**: Everything after the seed phrase
   - Example: "Content Creation **For Beginners**" → "for beginners"
   - Example: "Content Creation **With AI Full Course**" → "with ai full course"

**Filler words excluded**: how, to, what, is, why, does, can, best, will, should, when, for, the, a, an, with, and, or, in, on, at, of, vs

---

### Priority 1: Full Top 10 Match (Score: 70-95)

The entire Top 10 phrase appears inside the target phrase.

\`\`\`
Score = 70 + (density × 20) + positionBonus + variation
\`\`\`

- **density** = Top 10 words / phrase words
- **positionBonus** = 15 (beginning), 10 (near start), 5 (middle)
- **variation** = -3 to +3 (from phrase hash)

**Example**: "Content Creation For Beginners TikTok" contains full "Content Creation For Beginners"
- Density: 4/5 = 0.8 → +16
- Position: beginning → +15
- LTV = 70 + 16 + 15 + variation ≈ **95**

---

### Priority 2: Full Anchor Match (Score: 55-69)

The non-seed portion of a Top 10 phrase appears in the target.

**Anchors extracted from Top 10**:
- "Content Creation Tips" → anchor: "tips"
- "Content Creation For Beginners" → anchor: "for beginners"
- "Content Creation With AI" → anchor: "with ai"
- "Content Creation Full Course" → anchor: "full course"

\`\`\`
Score = 55 + positionBonus + variation
\`\`\`

- **positionBonus** = 8 (first 20 chars), 4 (20-40 chars), 0 (later)
- **variation** = -3 to +3

**Example**: "Content Creation Tools For Beginners" contains anchor "for beginners"
- Position: chars 20-40 → +4
- LTV = 55 + 4 + variation ≈ **62**

---

### Priority 3: Bigram Match (Score: 40-54)

A two-word combination from Top 10 appears in the target.

**Bigrams extracted**:
- "creation for", "for beginners", "with ai", "full course", etc.

\`\`\`
Score = 40 + (frequency × 3) + variation
\`\`\`

- **frequency** = how many Top 10 phrases contain this bigram
- **variation** = -3 to +3

**Example**: "Content Creation For Small Business" contains bigram "creation for"
- Frequency: appears in 2 Top 10 phrases → +6
- LTV = 40 + 6 + variation ≈ **49**

---

### Priority 4: Single Anchor Word Match (Score: 20-39)

A single meaningful word from Top 10 appears in the target.

**Single anchors**: "tips", "ideas", "beginners", "2025", "course", "equipment", "business", etc.

\`\`\`
Score = 20 + (frequency × 4) + positionBonus + variation
\`\`\`

- **frequency** = how many Top 10 phrases contain this word
- **positionBonus** = 8 (first 3 words), 4 (words 3-5), 0 (later)
- **variation** = -3 to +3

**Example**: "Content Creation Business Model" contains "business"
- Frequency: 1 → +4
- Position: word 3 → +4
- LTV = 20 + 4 + 4 + variation ≈ **29**

---

### No Match = LTV 0

Phrases with no Top 10 alignment get **LTV = 0**.

This is fine - they can still score well on Topic, Fit, P, and C.
LTV is a **bonus signal** for phrases that align with proven search patterns.

---

## Real Results (Content Creation Session)

From actual testing with session \`1a95a83e-a87a-46f5-85d9-a0e42b2de978\`:

### Badge Eligibility by Source (LTV ≥ 50)

| Source | Total | Badge Eligible | % |
|--------|-------|----------------|---|
| Child | 131 | 97 | 74.0% |
| A-Z | 234 | 6 | 2.6% |
| Prefix | 107 | 6 | 5.6% |
| **Total** | **472** | **109** | **23.1%** |

### Score Distribution

| LTV Range | Count | Strategy |
|-----------|-------|----------|
| 90-95 | 64 | Full Top 10 Match |
| 80-89 | 11 | Full Top 10 Match |
| 60-69 | 20 | Full Anchor Match |
| 55-59 | 11 | Full Anchor Match |
| 50-54 | 3 | Bigram Match |
| 40-49 | 21 | Bigram Match |
| 20-29 | 6 | Single Anchor |
| 0 | 336 | No Match |

### By Strategy Breakdown

| Strategy | Count |
|----------|-------|
| FULL_TOP10 | 75 |
| FULL_ANCHOR | 31 |
| BIGRAM | 24 |
| SINGLE | 6 |
| NO_MATCH | 336 |

### Sample Results

**Top Scorers (Full Top 10 Match)**:
- LTV=95 "Content Creation With AI Full Course"
- LTV=95 "Content Creation For Business Owners"
- LTV=95 "Content Creation Tips For Beginners"

**Mid-High (Full Anchor Match)**:
- LTV=62 "Content Creation Tools For Beginners" ← "for beginners"
- LTV=62 "Content Creation Editing Course" ← "course"
- LTV=61 "Content Creation Video Ideas" ← "ideas"

**Mid (Bigram Match)**:
- LTV=49 "Content Creation For Small Business" ← "creation for"
- LTV=45 "Content Creation For Online Business" ← "for business"

**Low (Single Word Match)**:
- LTV=29 "Content Creation Business Model" ← "business"
- LTV=26 "Content Creation 2025 Guide" ← "2025"

---

## Variation Formula

To prevent rigid scores like 40, 50, 60, we add organic variation:

\`\`\`typescript
const hash = phrase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
const variation = (hash % 7) - 3; // Range: -3 to +3
\`\`\`

This ensures:
- Same phrase always gets same variation (deterministic)
- Scores look organic: 47, 52, 67 instead of 45, 50, 65
- Spreads results across the range naturally

---

## Implementation

### Code Location
\`/src/lib/data-intake.ts\`

### Key Functions

\`\`\`typescript
// Extract anchors from Top 10 (call once per session)
extractLTVAnchors(top10Phrases: string[], seedPhrase: string): LTVAnchors

// Calculate LTV for a single phrase
calculateLTV(phrase: string, anchors: LTVAnchors): LTVResult

// Get Popularity boost based on LTV score
getLTVBoost(ltvScore: number): number  // Returns 0, 3, 5, 8, or 10

// Check badge eligibility
shouldShowLTVBadge(ltvScore: number): boolean  // Returns true if >= 50

// Calculate all scores with LTV boost applied
calculateAllScores(phrase, seedPhrase, stats, anchors): AllScoresResult
\`\`\`

### Database Schema

Added to \`seed_analysis\` table:
\`\`\`sql
ltv_score INTEGER DEFAULT 0,
ltv_strategy TEXT,  -- 'FULL_TOP10', 'FULL_ANCHOR', 'BIGRAM', 'SINGLE', or null
ltv_match TEXT,     -- The text that matched
ltv_boost INTEGER DEFAULT 0  -- +0, +3, +5, +8, or +10
\`\`\`

Added to \`super_topics\` table (preserved when promoting):
\`\`\`sql
ltv_score INTEGER,
ltv_strategy TEXT,
ltv_match TEXT
\`\`\`

---

## Integration Points

### Page 1 (Seed) - After Phrase Generation
1. Extract Top 10 phrases from generated results
2. Call \`extractLTVAnchors(top10, seedPhrase)\`
3. Store anchors in session or calculate on-demand

### Page 2 (Refine) - During P&C Scoring
1. Calculate LTV for each phrase
2. Apply boost to Popularity: \`popularity = base + getLTVBoost(ltv)\`
3. Display only Topic, Fit, P, C (LTV hidden)

### Page 3 (Super) - Badge Display
1. Check \`shouldShowLTVBadge(phrase.ltv_score)\`
2. Display "🌱 Long-Term Views" badge with tooltip

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Score Name** | Long-Term Views (LTV) |
| **Range** | 0-100 |
| **Page 2** | Hidden, boosts Popularity (+3 to +10) |
| **Page 3** | Badge for LTV ≥ 50 |
| **Based On** | Top 10 anchor matching |
| **Strategies** | Full Top 10 → Full Anchor → Bigram → Single |
| **Cost** | FREE (calculated from Data Intake) |
| **Badge Rate** | ~23% of phrases (varies by session) |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-29 | 1.0 | Initial spec |
| 2025-11-29 | 2.0 | Renamed to "Long-Term Views" |
| 2025-11-29 | 3.0 | Implemented v4 algorithm with 4-tier priority matching |
| 2025-11-29 | 4.0 | Tested with real data, documented results, added to codebase |
