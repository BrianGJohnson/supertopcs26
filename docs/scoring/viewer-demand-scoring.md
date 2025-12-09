# Viewer Demand Scoring

## Philosophy: What We're Actually Measuring

### The Core Insight

We're building a tool that helps creators find topics that **connect with human viewers**. While we only have access to **search data** (YouTube autocomplete), we're using it as a proxy for **viewer interest** - not just SEO rankings.

**Key Distinction:**
- This is NOT a "how hard is it to rank" tool
- This is a "what do viewers want to watch" tool
- Search is just 20-40% of discovery; browse/suggested are the rest
- But search signals reveal what's on viewers' minds

### The User Journey on Page 3 (Refine)

When users land on Page 3, phrases are organized by **source type**:

1. **Seed** (top) - The original 2-word phrase they entered
2. **Top 10** - First 9 autocomplete results for the seed
3. **Child** - Recursive autocomplete from Top 10 phrases
4. **A-Z** - Alphabet completion patterns
5. **Prefix** - Alternative starting patterns

This ordering itself tells a demand story - phrases that appear earlier in autocomplete have more search volume.

---

## Demand Scoring: The Algorithm

### Layer 1: Source Position Bonus

The source type provides a baseline demand signal:

| Source | Baseline | Rationale |
|--------|----------|-----------|
| seed | 50 | High volume by definition (user chose it) |
| top10 | 40-50 | YouTube's top suggestions = high volume |
| child | 20-30 | Derived phrases, still strong signal |
| az | 15-25 | Pattern completions, moderate signal |
| prefix | 10-20 | Alternative patterns, lower signal |

### Layer 2: Top 9 Position Weights

Within Top 10 results, **position matters**. Position 1 has the highest search volume.

```typescript
const POSITION_WEIGHTS = [
  1.00,  // Position 1 - highest volume
  0.60,  // Position 2
  0.50,  // Position 3
  0.40,  // Position 4
  0.35,  // Position 5
  0.32,  // Position 6
  0.28,  // Position 7
  0.25,  // Position 8
  0.22,  // Position 9
];
```

**Example:** "YouTube algorithm" seed returns:
1. "youtube algorithm 2025" → weight 1.00
2. "youtube algorithm explained" → weight 0.60
3. "youtube algorithm anomalies" → weight 0.50

### Layer 3: Anchor Frequency Bonus

When an anchor word/bigram appears **multiple times** in Top 9, it indicates stronger demand.

**Example:** If Top 9 contains:
- "youtube algorithm 2025"
- "youtube algorithm 2025 explained"
- "youtube algorithm 2025 changes"

The anchor "2025" appears 3 times → strong demand signal for that anchor.

**Calculation:**
```
anchorBonus = (frequency - 1) × 0.15 × positionWeight
```

If "2025" appears in positions 1, 3, and 5:
- Base: positions 1+3+5 = 1.00 + 0.50 + 0.35 = 1.85
- Frequency bonus: (3-1) × 0.15 = 0.30 additional multiplier

### Layer 4: Phrase Matching to Top 9

Every phrase in the session gets scored based on how it relates to Top 9 phrases:

| Match Type | Score Multiplier | Example |
|------------|------------------|---------|
| Exact match | 1.0 × position weight | Phrase IS a Top 9 result |
| Starts with Top 9 | 0.7 × position weight | "youtube algorithm 2025 for gaming" starts with #1 |
| Contains Top 9 | 0.5 × position weight | Phrase includes a Top 9 phrase |
| Anchor match | 0.3 × anchor bonus | Phrase contains high-frequency anchor |

### Layer 5: Session-Wide Bigram Frequency

Beyond Top 9, we analyze **all ~400 phrases** in the session:

1. Extract all bigrams from all phrases
2. **Filter out seed words** (they'd dominate unfairly)
3. Count frequency of each bigram
4. Calculate percentile ranking (0-100)
5. Phrases containing high-percentile bigrams get bonus

**Example:**
- Bigram "video tips" appears in 45 phrases (95th percentile)
- Any phrase containing "video tips" gets a +15 bonus

### Layer 6: Session-Wide Single Word Frequency

Same logic for single words (excluding seed and common words):

1. Count all anchor words across session
2. Filter out seed words and stop words
3. Calculate percentile ranking
4. High-frequency words indicate demand patterns

---

## Scoring Formula (Combined)

```
demandScore = 
  sourceBaseline +
  (top9MatchScore × top9Weight) +
  (anchorFrequencyBonus) +
  (bigramPercentileBonus × 0.15) +
  (wordPercentileBonus × 0.10)

// Normalize to 0-100 scale
finalScore = normalize(demandScore, 0, maxPossible) × 100
```

---

## Special Considerations

### The Seed Phrase Paradox

The seed is both:
- **Maximum demand** (user chose it, autocomplete confirms volume)
- **Maximum competition** (everyone's targeting it)

We score seed HIGH on demand because viewers ARE searching for it. Competition scoring will account for the difficulty.

### Cascading Rank Potential

A powerful insight: If you rank for "youtube algorithm 2025 explained", you might ALSO rank for:
- "youtube algorithm 2025"
- "youtube algorithm explained"

This "ranking cascade" should boost demand score because one video can capture multiple search queries.

**Implementation idea:**
```
If phrase contains multiple high-demand anchors:
  cascadeBonus = overlap_count × 0.2
```

### Short vs Long Phrases

Short phrases (2-3 words) = higher raw volume, but:
- More competition
- Less specific intent

Long phrases (5+ words) = lower raw volume, but:
- More specific intent
- Better viewer match

**We don't penalize length in demand** - that's for competition scoring.

---

## What Demand Scoring Does NOT Measure

- ❌ How hard it is to rank (that's competition)
- ❌ How descriptive the phrase is (that's Topic Strength)
- ❌ Channel-audience fit (that's Audience Fit)
- ❌ Video quality required
- ❌ Click-through potential

---

## Display on Page 3

The demand score appears in the **POP/DEM** column:

| Score Range | Label | Color |
|-------------|-------|-------|
| 80-100 | Very High | Green |
| 60-79 | High | Light Green |
| 40-59 | Medium | Yellow |
| 20-39 | Low | Orange |
| 0-19 | Very Low | Red |

---

## Future Enhancements

### Trend Detection
If a phrase includes current year (2025) or trending terms, apply bonus.

### Seasonal Patterns
Integrate with historical data to detect seasonal demand spikes.

### Related Phrase Clustering
Group phrases by semantic similarity and boost clusters with multiple high-demand phrases.
