# Popularity Algorithm v2
## Complete Implementation - December 2025

---

## CORE CONCEPT

**Question we're answering:** "Could this phrase be popular with YOUR viewers?"

**What we score:** Every phrase in the session gets a popularity score 0-99.

**Key insight:** We use session-wide frequency patterns to identify what viewers are searching for in THIS niche.

---

## THE HIERARCHY (Most Important!)

The **SEED phrase** represents the highest search volume. Everything else derives from it.
No phrase should score higher than the seed. The seed is the CEILING.

```
SEED (highest search volume) ──────────────────► CEILING (91-97)
  │
  ├── TOP_10 (proven autocomplete demand) ─────► Below seed (seed - 1 to seed - 6)
  │     │
  │     ├── T10_CHILD (extends Top 10) ────────► Below parent TOP_10
  │     │
  │     └── T10_RELATED (contains Top 10) ─────► Below T10_CHILD
  │
  └── NO_TAG (no Top 10 relationship) ─────────► Lowest tier (50-75 range)
```

---

## STEP 0: SEED SCORE (The Ceiling)

The seed phrase score is determined by **session size** (total phrases generated).
A larger session indicates stronger demand for the seed topic.

| Session Size | Phrase Count | Seed Score |
|--------------|--------------|------------|
| Small | ≤125 | 91-92 |
| Medium | 126-250 | 93-94 |
| Large | 251-400 | 95-96 |
| Very Large | 400+ | 97 |

**The seed score becomes the CEILING.** No other phrase can score higher.

### Seed Score Formula

```javascript
function getSeedScore(totalPhrases) {
  if (totalPhrases <= 125) return 91 + (totalPhrases / 125);        // 91-92
  if (totalPhrases <= 250) return 93 + ((totalPhrases - 125) / 250); // 93-94
  if (totalPhrases <= 400) return 95 + ((totalPhrases - 250) / 300); // 95-96
  return 97; // Cap at 97
}
```

---

## STEP 1: TAG DETERMINATION

Every phrase gets ONE tag based on its relationship to the **Top 9 autocomplete results**.

### The Top 9 Phrases (example)
These come from YouTube autocomplete when user enters their seed:
1. youtube algorithm 2025
2. youtube algorithm explained
3. youtube algorithm sucks
4. youtube algorithm change
5. youtube algorithm anomalies
6. youtube algorithm 2025 explained
7. youtube algorithm broken
8. youtube algorithm is trash
9. youtube algorithm tips

### Tag Rules (checked in order)

| Tag | Rule | Example |
|-----|------|---------|
| **TOP_10** | Phrase IS one of the Top 9 | "YouTube Algorithm 2025" |
| **T10_CHILD** | Phrase STARTS WITH a Top 9 phrase | "YouTube Algorithm 2025 For Shorts" |
| **T10_RELATED** | Phrase CONTAINS a Top 9 phrase | "How To Beat YouTube Algorithm 2025" |
| **NO_TAG** | None of the above | "YouTube Algorithm Gaming" |

### Key Points:
- We do NOT check for the seed phrase - everything contains it, so it's useless for differentiation
- We check for FULL Top 9 phrases as substrings
- TAG is determined by RELATIONSHIP to Top 9, not by generation source
- **SEED itself is tagged as SEED, not NO_TAG** - it gets special treatment

---

## STEP 2: SCORE CALCULATION BY TAG

### SEED (Special Case)
The seed phrase scores based on session size (see Step 0). This is the CEILING.

### TOP_10 Phrases

**Base Score:** Position 1 starts at 87, decays by 1 per position.

| Position | Base Score |
|----------|------------|
| #1 | 87 |
| #2 | 86 |
| #3 | 85 |
| #4 | 84 |
| #5 | 83 |
| #6 | 82 |
| #7 | 81 |
| #8 | 80 |
| #9 | 79 |

**Anchor Bonus (THE ONLY BOOST FOR TOP_10):** If an anchor word appears multiple times across the Top 9 phrases:

| Anchor Appearances | Bonus |
|--------------------|-------|
| 2 times | +3 |
| 3+ times | +5 (max) |

**Example:** "2025" appears in position #1 and #6 → both get +3 bonus.

**No other bonuses apply to TOP_10.** No starter boost, no demand anchor boost, no length adjustment. They're already proven by autocomplete.

**Caps:** TOP_10 phrases are capped at (Seed Score - 2). If seed is 94, max TOP_10 score is 92.

| Position | Base | With +3 | With +5 | Cap (seed=94) |
|----------|------|---------|---------|---------------|
| #1 | 87 | 90 | 92 | 92 |
| #2 | 86 | 89 | 91 | 91 |
| #3 | 85 | 88 | 90 | 90 |
| #4 | 84 | 87 | 89 | 89 |
| #5 | 83 | 86 | 88 | 88 |
| #6 | 82 | 85 | 87 | 87 |
| #7 | 81 | 84 | 86 | 86 |
| #8 | 80 | 83 | 85 | 85 |
| #9 | 79 | 82 | 84 | 84 |

### T10_CHILD Phrases

**Logic:** Phrase STARTS WITH a Top 10 phrase (extends it).

**Base Score:** 70 + position-based boost (same as T10_RELATED)

| Extends TOP_10 Position | Base + Boost |
|-------------------------|--------------|
| #1 | 70 + 12 = 82 |
| #2 | 70 + 11 = 81 |
| #3 | 70 + 10 = 80 |
| #4 | 70 + 9 = 79 |
| #5 | 70 + 8 = 78 |
| #6 | 70 + 7 = 77 |
| #7 | 70 + 6 = 76 |
| #8 | 70 + 5 = 75 |
| #9 | 70 + 4 = 74 |

**Cap:** Parent TOP_10 score - 1. Child of #1 (87) is capped at 86.

**Bonuses:** Receives all bonuses (starter, anchor, length, NL) but capped at parent - 1.

### T10_RELATED Phrases

**Logic:** Check if the phrase CONTAINS any Top 10 phrase as an exact substring.

**Examples:**
- "how to beat youtube algorithm 2025" contains "youtube algorithm 2025" → MATCH
- "youtube algorithm 2025 for beginners" contains "youtube algorithm 2025" → MATCH
- "youtube algorithm tips and tricks" does NOT contain any Top 10 phrase → NO MATCH

**Boost by Position:** Based on which Top 10 phrase is contained:

| Contains TOP_10 Position | Boost |
|--------------------------|-------|
| #1 | +12 |
| #2 | +11 |
| #3 | +10 |
| #4 | +9 |
| #5 | +8 |
| #6 | +7 |
| #7 | +6 |
| #8 | +5 |
| #9 | +4 |

**If phrase contains multiple Top 10 phrases:** Use the BEST (highest position) match.

**Who gets this boost:** Any phrase that contains a Top 10 phrase - typically child phrases, but also A-to-Z and prefix phrases if they happen to match.

### NO_TAG Phrases

**Logic:** No relationship to any Top 10 phrase.

**Base Score:** 55

**Cap:** 79 (just below lowest TOP_10)

**Bonuses:** Receives all bonuses (starter, anchor, length, NL) but capped at 79.

**Example:** "YouTube Algorithm Gaming" has no Top 10 match.
- Base: 55
- Starter "youtube" (10.6%): +10
- Anchor "gaming": +0 (not frequent)
- Length: +4
- NL: +0
- Total: 69 (under cap of 79)

---

## STEP 3: BONUSES AND ADJUSTMENTS

**Important:** Bonuses only apply to T10_CHILD, T10_RELATED, and NO_TAG phrases.
SEED and TOP_10 phrases do NOT receive bonuses - they're already proven by autocomplete.

### Score Caps by TAG

After all bonuses are applied, scores are capped:

| TAG | Maximum Score |
|-----|---------------|
| SEED | Based on session size (91-97) |
| TOP_10 | Seed score - 1 |
| T10_CHILD | Parent TOP_10 score - 1 |
| T10_RELATED | Best matching TOP_10 score - 2 |
| NO_TAG | 79 (hard cap) |

### 3a. Starter Boost (0 to +12)

Boosts phrases that START with popular search patterns from the session.

**How it works:**
1. Look at the BEGINNING of every phrase in the session
2. Extract the first word (e.g., "how", "what", "can")
3. Count occurrences of each first word across all phrases
4. **EXCLUDE starters that begin with the seed** - "youtube" is not counted
5. Calculate as PERCENTAGE of total session phrases
6. Apply ONE boost based on percentage (no stacking)

**Boost by Percentage of Session:**

| % of Session | Boost |
|--------------|-------|
| 15%+ | +12 |
| 10-14% | +10 |
| 7-9% | +8 |
| 4-6% | +5 |
| 2-3% | +3 |
| <2% | +0 |

**Example for "YouTube Algorithm" session (225 phrases):**

First-word starters found:
- "how" (38x) = 17% → +12
- "what" (15x) = 7% → +8
- "can" (5x) = 2% → +3

**Example phrase:** "How To Beat YouTube Algorithm"
- Starts with "how" (17% of session) → +12

**No double-counting.** We use the first word frequency to measure demand, then apply ONE boost.

### 3b. Demand Anchor Boost (0 to +12)

Boosts phrases containing high-frequency MEANINGFUL words from the session.

**How it works:**
1. Split every phrase into single words
2. Count occurrences of each word across all phrases
3. **EXCLUDE the seed phrase** - don't count "youtube algorithm" as a phrase match
4. **EXCLUDE each seed word** - don't count "youtube" or "algorithm" individually
5. **EXCLUDE filler words** - how, to, what, is, the, a, for, and, etc.
6. **EXCLUDE short words** - less than 3 characters
7. Rank remaining words by frequency
8. Apply boost based on occurrence count

**Absolute thresholds** based on occurrence count:

| Occurrences | Boost | Signal |
|-------------|-------|--------|
| 20+ | +12 | High demand |
| 15-19 | +10 | Strong demand |
| 10-14 | +7 | Good demand |
| 6-9 | +4 | Moderate demand |
| 3-5 | +2 | Weak signal |
| 1-2 | +0 | Too rare |

**Example for "YouTube Algorithm" session:**

Excluded words: "youtube", "algorithm" (seed words)

Popular anchors found:
- "2025" (34x) → +12 boost
- "shorts" (15x) → +10 boost
- "monetization" (15x) → +10 boost  
- "explained" (10x) → +7 boost

If a phrase contains "shorts" → it gets +10 boost.

**Takes the BEST anchor boost** (doesn't stack multiple anchors).

### 3c. Word Count Adjustment (-4 to +5)

Adjusts score based on phrase word count. Sweet spot is 3-4 words.

| Words | Adjustment | Rationale |
|-------|------------|-----------|
| 1-2 | 0 | No adjustment |
| 3 | +5 | Sweet spot - specific but concise |
| 4 | +4 | Still great |
| 5 | +2 | Good specificity |
| 6 | 0 | Neutral |
| 7 | -2 | Getting long |
| 8 | -3 | Too wordy |
| 9+ | -4 | Too verbose |

### 3d. Natural Language Quality (-12 to +10)

**Penalties:**
- Foreign language detected: -12
- YouTuber/channel names: -8
- Low quality patterns (meme, cringe, etc.): -5

**Bonuses:**
- High quality words (guide, tutorial, explained, tips, etc.): +3 to +10

### 3e. Micro Variation (±2)

Deterministic hash-based variation for natural-looking scores.

---

## STEP 4: FINAL FORMULA

```
// Step 1: Calculate seed score (the ceiling)
seedScore = getSeedScore(totalPhrases)  // 91-97

// Step 2: Calculate base score from TAG
if TAG == SEED:
    baseScore = seedScore
else if TAG == TOP_10:
    baseScore = seedScore - positionDecay[position]  // -1 to -6
else if TAG == T10_CHILD:
    baseScore = parentTop10Score - 3
else if TAG == T10_RELATED:
    baseScore = bestMatchingTop10Score - 8
else: // NO_TAG
    baseScore = 55

// Step 3: Apply bonuses (only for T10_CHILD, T10_RELATED, NO_TAG)
if TAG not in [SEED, TOP_10]:
    score = baseScore
          + starterBoost        // 0 to +25
          + demandAnchorBoost   // 0 to +12
          + wordCountAdjustment // -4 to +5
          + nlAdjustment        // -12 to +10
          + variation           // ±2
else:
    score = baseScore + variation  // TOP_10 only gets variation

// Step 4: Apply ceiling caps
if TAG == TOP_10:     cap = seedScore - 1
if TAG == T10_CHILD:  cap = parentTop10Score - 1
if TAG == T10_RELATED: cap = bestMatchingTop10Score - 2
if TAG == NO_TAG:     cap = 79

score = min(score, cap)
score = clamp(score, 0, 99)
```

---

## EXAMPLE SCORING

**Phrase:** "How To Beat YouTube Algorithm Shorts"

1. **Tag:** T10_RELATED (contains "youtube algorithm") → base 70
2. **Two-word starter:** "how to" (22x) → +15
3. **Single-word starter:** "how" (38x) → +10
4. **Demand anchor:** "shorts" (15x) → +10
5. **Length:** 6 words → +4
6. **NL quality:** "beat" is action word → +3
7. **Variation:** +1

**Total:** 70 + 15 + 10 + 10 + 4 + 3 + 1 = **99** (clamped)

---

## DATA REQUIREMENTS

The algorithm requires `IntakeStats` from Data Intake, which includes:

- `wordFrequency`: Record<string, number> - all words and their counts
- `top9Demand.phrases`: The Top 9 autocomplete results
- `top9Demand.twoWordStarters`: Two-word opener frequencies
- `top9Demand.oneWordStarters`: Single-word opener frequencies
- `seedPhrase`: The original seed (for exclusion)

**Important:** Must re-run Data Intake to populate these fields for existing sessions.

---

## IMPLEMENTATION FILES

- **Main function:** `calculateFullDemandScore()` in `src/lib/data-intake.ts`
- **Helper functions:**
  - `getStarterBoost()` - stacking two-word + single-word boost
  - `getDemandAnchorBoost()` - high-frequency word boost
  - `getLengthAdjustment()` - word count curve
  - `getNaturalLanguageAdjustment()` - quality patterns
- **Types:** `IntakeStats` in `src/types/database.ts`

---

## WHAT WE'RE NOT DOING

1. ❌ Boosting for containing the SEED - useless, everything has it
2. ❌ GPT/API calls - this is 100% local calculation
3. ❌ Using "source" for scoring - we use TAG which is relationship-based
4. ❌ Complex percentile calculations - using absolute thresholds for clarity

---

## STATUS: COMPLETE ✅

- [x] Tag determination (TOP_10, T10_CHILD, T10_RELATED, NO_TAG)
- [x] Base scores from tag (position-weighted for TOP_10)
- [x] Starter boost - STACKING two-word + single-word
- [x] Demand Anchor boost - absolute thresholds
- [x] Length adjustment
- [x] Natural language quality adjustment
- [x] Micro variation
- [x] seedPhrase stored in IntakeStats
