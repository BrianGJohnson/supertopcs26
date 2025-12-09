# Opportunity Scoring (Competition Analysis)

> **Terminology Note:** The database column is `opportunity` (higher = better). 
> This document analyzes YouTube's competitive landscape to determine opportunity.
> Low competition on YouTube = High opportunity score.

## Philosophy: What We're Actually Measuring

### The Core Insight

Opportunity scoring answers: **"If I create a video on this topic, how easy will it be to get discovered?"**

This is NOT just about search rankings. A video can be discovered through:
- **Search** (20-40% of views) - Traditional SEO competition
- **Browse/Suggested** (60-80%) - Algorithm recommendation

But here's the key: **Autocomplete data reveals opportunity signals** beyond just SEO.

---

## The Autocomplete Opportunity Signal

### Key Observation: Result Count Tells a Story

When you enter a phrase into YouTube autocomplete:

**Low Opportunity Example:** "how to edit videos"
- Returns: 9+ suggestions
- All are variations/expansions
- Indicates: MANY people searching, MANY videos competing

**High Opportunity Example:** "what does the youtube algorithm favor"
- Returns: 1 suggestion (exact match only)
- No related phrases appear
- Indicates: Specific niche, fewer competitors = HIGH OPPORTUNITY

**Medium Opportunity Example:** "how to introduce yourself on youtube"
- Returns: 9+ suggestions, but they're "topic matches"
- "how to introduce yourself on youtube channel"
- "how to introduce myself on youtube"
- "how to introduce yourself in youtube video"
- Same topic, different words = viewers want THIS

When autocomplete returns variations that are semantically identical:

```
"how to introduce yourself on youtube" → exact match
"how to introduce yourself on youtube channel" → topic match
"how to introduce myself on youtube" → topic match (myself vs yourself)
"how to introduce yourself in youtube video" → topic match
```

**Interpretation:**
- High topic match count = people search this many ways
- This means: Good demand, but ALSO more competition
- One video could rank for ALL these variations

### Competition Signal Matrix

| Autocomplete Result | Demand Signal | Competition Signal |
|---------------------|---------------|-------------------|
| Many exact variations | High | High |
| Few exact, many topic matches | Medium-High | Medium |
| One exact, no variations | Low | Low |
| No results | Very Low | None |

---

## The Phrase Length Factor

### Short Phrases (2-3 words)
- **Seed phrase:** "YouTube algorithm"
- Autocomplete: Returns 9 highly varied results
- Competition: EXTREME
- Most results share seed words exactly

### Medium Phrases (4-5 words)  
- **Phrase:** "youtube algorithm for beginners"
- Autocomplete: May return 5-7 results
- Competition: HIGH but more focused
- Topic matches begin to dominate

### Long Phrases (6+ words)
- **Phrase:** "what does the youtube algorithm favor"
- Autocomplete: 0-2 results
- Competition: LOW
- Very specific intent, fewer competitors

**Key Insight:** As phrase length increases, autocomplete results decrease, indicating:
1. More specific search intent
2. Fewer people searching exact phrase
3. Fewer videos targeting exact phrase
4. BUT: Could still match broader topics

---

## Competition Scoring Algorithm (Future)

### Phase 1: Autocomplete Response Analysis

For each phrase, we could query autocomplete and analyze:

```typescript
interface AutocompleteCompetitionData {
  phrase: string;
  resultCount: number;           // 0-10 suggestions returned
  exactMatchExists: boolean;     // Did our phrase appear?
  topicMatchCount: number;       // Semantically similar results
  phraseExpansions: number;      // Results that start with our phrase
  differentIntents: number;      // Completely different topics
}
```

### Phase 2: Competition Score Calculation

```typescript
function calculateCompetitionScore(data: AutocompleteCompetitionData): number {
  let score = 0;
  
  // More results = more competition
  score += data.resultCount * 10;
  
  // Exact match existence (people search this exact phrase)
  if (data.exactMatchExists) score += 15;
  
  // Topic matches indicate saturated topic
  score += data.topicMatchCount * 8;
  
  // Expansions mean room to specialize
  score -= data.phraseExpansions * 3;
  
  // Different intents mean less direct competition
  score -= data.differentIntents * 5;
  
  return Math.min(100, Math.max(0, score));
}
```

### Phase 3: Cross-Reference with Demand

**The Sweet Spot Formula:**

```
opportunity = demand × (1 - competition/100)
```

| Demand | Competition | Opportunity |
|--------|-------------|-------------|
| 80 | 90 | 8 (bad) |
| 80 | 40 | 48 (good) |
| 50 | 20 | 40 (good) |
| 30 | 10 | 27 (okay) |

---

## Anchor Rarity as Competition Signal

### Current Data We Have

From session intake, we already track:
- Bigram frequencies across all phrases
- Single word frequencies
- Anchor word patterns

### Rare Anchors = Lower Competition

If a phrase contains an anchor that appears **rarely** in the session:
- Fewer phrases targeting similar topic
- Less content saturation
- Lower competition

**Example:**
- "anomalies" appears in 2 phrases → rare anchor → low competition
- "tips" appears in 45 phrases → common anchor → high competition

### Implementation

```typescript
function getAnchorRarityBonus(phrase: string, wordFreq: Map<string, number>): number {
  const words = phrase.split(' ').filter(w => !isSeedWord(w) && !isStopWord(w));
  
  let raritySum = 0;
  for (const word of words) {
    const freq = wordFreq.get(word) || 0;
    const percentile = getPercentile(freq, wordFreq);
    
    // Lower percentile = rarer = bonus
    raritySum += (100 - percentile) * 0.2;
  }
  
  return raritySum / words.length;
}
```

---

## Phrase Specificity as Competition Signal

### The Descriptiveness Factor

Topic Strength already measures how specific/descriptive a phrase is. This correlates with competition:

| Topic Strength | Typical Competition |
|----------------|---------------------|
| 90+ (very specific) | Low |
| 70-89 (specific) | Medium-Low |
| 50-69 (moderate) | Medium |
| 30-49 (generic) | High |
| <30 (vague) | Very High |

### Integrating Topic Strength

```
adjustedCompetition = rawCompetition × (1 - topicStrength/200)
```

A highly specific phrase gets competition reduced because fewer creators target it.

---

## The Ranking Cascade Factor

### Key Insight

When you rank for a long phrase, you often rank for shorter variations:

```
Rank for: "youtube algorithm changes 2025 explained"
Also rank for:
  - "youtube algorithm changes 2025"
  - "youtube algorithm explained"
  - "youtube algorithm 2025"
```

### Competition Implication

If a phrase is a **superset** of a high-competition phrase:
- You're competing with BOTH audiences
- Competition should factor in parent phrase competition
- But: You have specificity advantage

```typescript
function getCascadeCompetition(phrase: string, parentCompetition: Map<string, number>): number {
  let maxParentCompetition = 0;
  
  // Check all shorter subphrases
  for (const [parent, competition] of parentCompetition) {
    if (phrase.startsWith(parent) && phrase !== parent) {
      maxParentCompetition = Math.max(maxParentCompetition, competition * 0.5);
    }
  }
  
  return maxParentCompetition;
}
```

---

## Display on Page 3 (Future)

Competition score would appear in a **COMP** column:

| Score Range | Label | Color | Meaning |
|-------------|-------|-------|---------|
| 80-100 | Very High | Red | Saturated topic, hard to break through |
| 60-79 | High | Orange | Established topic, need strong angle |
| 40-59 | Medium | Yellow | Balanced opportunity |
| 20-39 | Low | Light Green | Underserved topic |
| 0-19 | Very Low | Green | Blue ocean opportunity |

---

## Opportunity Score (Combining Demand + Competition)

### The Formula

```
opportunity = (demand × 0.6) + ((100 - competition) × 0.4)
```

Weight demand slightly higher because:
- Low competition + no demand = worthless
- High demand + high competition = still valuable if you can compete

### Alternative: Multiplicative

```
opportunity = demand × (100 - competition) / 100
```

This creates sharper differentiation:
- 80 demand × 20% (100-80 comp) = 16 (bad)
- 60 demand × 70% (100-30 comp) = 42 (good)

---

## Implementation Phases

### Phase 1: Now
- Use anchor rarity from existing data
- Inverse of word frequency = lower competition
- Display as part of combined score

### Phase 2: Next Sprint
- Query autocomplete for each phrase (or sample)
- Count result variations
- Analyze topic match patterns

### Phase 3: Future
- Cache autocomplete results
- Build competition trend data
- Cross-reference with actual video performance

---

## API Considerations

### Rate Limits

YouTube autocomplete doesn't have documented limits, but:
- We already query for ~100+ phrases per session (A-Z, prefixes, children)
- Adding competition scoring for ALL phrases would be excessive
- **Responsible limit: Score top 50 phrases by demand**

### Why 50 Phrases Max

1. **User focus**: By Step 4 (Refine), users have narrowed to ~50-100 viable phrases anyway
2. **API load**: 50 requests with 250ms delay = ~12-14 seconds total
3. **Diminishing returns**: Low-demand phrases don't need competition analysis
4. **Triggering**: Only score when user reaches Refine page, not during intake

### Request Timing

```typescript
const COMPETITION_SCORE_DELAY_MS = 250; // 250ms between requests (responsible pacing)
const MAX_PHRASES_TO_SCORE = 50;        // Only score top 50 by demand

// Total time: 50 phrases × 250ms = 12.5 seconds
// This runs in background while user reviews phrases
```

### When to Score Competition

| Phase | Action | Competition Scored? |
|-------|--------|---------------------|
| Seed validation | ViewerLandscape modal | ✅ Yes (1 phrase) |
| Intake (Step 2) | Generate 300+ phrases | ❌ No |
| Expand (Step 3) | AI enrichment | ❌ No |
| Refine (Step 4) | User filtering | ✅ Yes (top 50 by demand) |

### Caching Strategy

```typescript
// Cache autocomplete results by phrase
const competitionCache = new Map<string, AutocompleteCompetitionData>();

// Invalidate after 24 hours (search patterns change)
const CACHE_TTL = 24 * 60 * 60 * 1000;
```

---

## Using Competition Data to Understand Demand

### The Key Insight

When you query autocomplete for a **5-7 word phrase** and analyze the results, you learn about BOTH competition AND demand:

| Phrase Length | Results | Exact Match | Topic Match | What It Means |
|---------------|---------|-------------|-------------|---------------|
| 5-7 words | 8+ | 1-2 | 6-8 | 🔥 **Strong demand** - people search this many ways |
| 5-7 words | 3-5 | 1 | 2-4 | ✅ **Moderate demand** - focused intent |
| 5-7 words | 0-2 | 0-1 | 0-1 | ⚠️ **Low demand** OR very niche |

### Why This Matters

The seed phrase gets a ViewerLandscape modal showing "Moderate Demand" or "Strong Demand". But the 300 generated phrases only get Popularity scores (based on position weighting during intake).

**Competition scoring adds a second dimension:**
- Not just "did this phrase appear in autocomplete?"
- But "when I search FOR this phrase, how active is the landscape?"

### Demand Signal from Competition Query

```typescript
interface CompetitionDemandSignal {
  phrase: string;
  suggestionCount: number;    // 0-14 results
  exactMatchCount: number;    // How many start with exact phrase
  topicMatchCount: number;    // Semantically similar results
  
  // Derived signals
  demandLevel: 'strong' | 'moderate' | 'low' | 'very-low';
  competitionLevel: 'high' | 'medium' | 'low';
}

function deriveDemandLevel(suggestionCount: number, topicMatchCount: number): string {
  if (suggestionCount >= 8 && topicMatchCount >= 5) return 'strong';
  if (suggestionCount >= 4 && topicMatchCount >= 2) return 'moderate';
  if (suggestionCount >= 1) return 'low';
  return 'very-low';
}
```

### The Competition-Demand Matrix

| Scenario | Demand | Competition | Recommendation |
|----------|--------|-------------|----------------|
| 8+ results, mostly topic matches | High | Medium | ✅ Good opportunity - demand without exact phrase saturation |
| 8+ results, mostly exact matches | High | High | ⚠️ Crowded - need unique angle |
| 3-5 results, mixed | Moderate | Medium | ✅ Balanced opportunity |
| 1-2 results | Low | Low | 🤔 Niche - verify there's an audience |
| 0 results | Very Low | None | ❌ No one searching this |

---

## Reconciling Seed Analysis vs Phrase Scoring

### The Problem

The **seed phrase** gets full ViewerLandscape analysis (modal shows demand level, exact match, topic match, etc.). But the **generated phrases** only get:
- Popularity score (from position weighting)
- Topic Strength (from word analysis)
- Audience Fit (from viewer intent patterns)

When we add Competition scoring to phrases, we're essentially running a mini-ViewerLandscape for each one. This creates potential confusion:
- Seed says "Moderate Demand"
- Child phrase says "High Popularity" 

### The Solution: Unified Terminology

| Seed Modal Term | Phrase Column Term | Same Data? |
|-----------------|-------------------|------------|
| Demand Level | Popularity | Similar - both measure search volume signals |
| Exact Match % | Competition | Related - low exact match = low competition |
| Topic Match % | (new) Topic Saturation | Same concept at phrase level |

### What Competition Score Should Include

For each phrase, one autocomplete query returns:
- `suggestionCount`: How many results (0-14)
- `exactMatchCount`: How many start with exact phrase
- `topicMatchCount`: How many are semantically similar

**Competition Score Formula (0-100):**
```typescript
function calculateCompetitionScore(
  exactMatchCount: number,
  topicMatchCount: number,
  suggestionCount: number
): number {
  if (suggestionCount === 0) return 0; // No results = no competition
  
  const exactRatio = exactMatchCount / suggestionCount;
  const topicRatio = topicMatchCount / suggestionCount;
  
  // High exact match = high competition (people search this exact phrase a lot)
  // High topic match = moderate competition (topic is popular but phrase is unique)
  const score = (exactRatio * 60) + (topicRatio * 30) + (suggestionCount / 14 * 10);
  
  return Math.round(Math.min(100, score));
}
```

### Display Alignment

To reduce confusion, phrase columns should mirror seed modal language:

| Column | What It Shows |
|--------|---------------|
| POP | Demand signal (rename from "Popularity"?) |
| COMP | Competition (inverse of opportunity) |
| TS | Topic specificity |
| AF | Audience alignment |

---

## Summary

Competition scoring will leverage:

1. **Autocomplete result count** - More results = more competition
2. **Topic match analysis** - Semantic variations indicate saturation
3. **Phrase length** - Longer = more specific = less competition
4. **Anchor rarity** - Rare words = less crowded space
5. **Topic strength correlation** - Specific phrases face less competition
6. **Cascade effects** - Parent phrase competition bleeds through

**The goal:** Help creators find the sweet spot where demand is high enough to matter but competition is low enough to win.
