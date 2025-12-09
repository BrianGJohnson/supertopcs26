# Data Intake Specification

> **Purpose**: Extract patterns from generated phrases to enable FREE Popularity & Competition scoring without external APIs.

---

## Overview

Data Intake is a **pattern extraction process** that runs automatically after Page 1 (Seed) phrase generation completes. It analyzes all generated phrases (~300-500) to discover what words, combinations, and structures appear frequently or rarely.

This data powers the P&C (Popularity & Competition) scoring in Page 2 (Refine) at **zero API cost**.

---

## When Data Intake Runs

| Trigger | Timing | Duration |
|---------|--------|----------|
| User clicks "Proceed to Refine" | After all expansions complete | ~200-500ms |

**Note**: Data Intake is a one-time process per session. Results are cached in `sessions.intake_stats`.

---

## What Gets Extracted

### 1. Word Frequency Map
Every word from every phrase, with occurrence count.

```javascript
{
  "content": 187,
  "creation": 185,
  "how": 45,
  "to": 68,
  "for": 52,
  "beginners": 35,
  ...
}
```

### 2. Two-Word Combos (Bigrams)
Adjacent word pairs with occurrence count.

```javascript
{
  "content creation": 185,
  "for beginners": 35,
  "how to": 45,
  "with ai": 22,
  "make money": 18,
  ...
}
```

### 3. Three-Word Combos (Trigrams)
Three adjacent words with occurrence count.

```javascript
{
  "content creation tips": 12,
  "how to start": 15,
  "for beginners 2024": 8,
  ...
}
```

### 4. Seed+1 Words
The word that immediately follows the seed phrase.

```javascript
// Seed: "Content Creation"
{
  "tips": 28,
  "ideas": 22,
  "tools": 18,
  "for": 45,
  "with": 22,
  "psychology": 1,
  "burnout": 1,
  ...
}
```

### 5. Seed+2 Words
The second word after the seed phrase.

```javascript
// Seed: "Content Creation"
{
  "beginners": 35,
  "youtube": 15,
  "ai": 18,
  "income": 8,
  ...
}
```

### 6. Prefix Patterns
Words/phrases that appear BEFORE the seed.

```javascript
{
  "how": 45,
  "how to": 38,
  "best": 25,
  "why": 18,
  "what is": 12,
  ...
}
```

### 7. Suffix Patterns
Words/phrases that appear AFTER the seed (end of phrase).

```javascript
{
  "2024": 8,
  "for beginners": 35,
  "with ai": 22,
  "on youtube": 15,
  ...
}
```

---

## Data Intake Algorithm

```typescript
interface IntakeStats {
  // Raw frequency maps
  wordFrequency: Record<string, number>;
  bigramFrequency: Record<string, number>;
  trigramFrequency: Record<string, number>;
  
  // Seed-relative patterns
  seedPlus1: Record<string, number>;
  seedPlus2: Record<string, number>;
  prefixes: Record<string, number>;
  suffixes: Record<string, number>;
  
  // Precomputed percentiles for fast scoring
  seedPlus1Percentiles: Record<string, number>; // word -> percentile (0-100)
  seedPlus2Percentiles: Record<string, number>;
  prefixPercentiles: Record<string, number>;
  suffixPercentiles: Record<string, number>;
  
  // Metadata
  totalPhrases: number;
  uniqueWords: number;
  processedAt: string;
}
```

### Extraction Process

```typescript
function runDataIntake(phrases: string[], seedPhrase: string): IntakeStats {
  const seedWords = seedPhrase.toLowerCase().split(' ');
  const seedLower = seedPhrase.toLowerCase();
  
  const stats: IntakeStats = {
    wordFrequency: {},
    bigramFrequency: {},
    trigramFrequency: {},
    seedPlus1: {},
    seedPlus2: {},
    prefixes: {},
    suffixes: {},
    seedPlus1Percentiles: {},
    seedPlus2Percentiles: {},
    prefixPercentiles: {},
    suffixPercentiles: {},
    totalPhrases: phrases.length,
    uniqueWords: 0,
    processedAt: new Date().toISOString(),
  };
  
  for (const phrase of phrases) {
    const words = phrase.toLowerCase().split(' ');
    
    // 1. Word frequency
    for (const word of words) {
      stats.wordFrequency[word] = (stats.wordFrequency[word] || 0) + 1;
    }
    
    // 2. Bigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      stats.bigramFrequency[bigram] = (stats.bigramFrequency[bigram] || 0) + 1;
    }
    
    // 3. Trigrams
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      stats.trigramFrequency[trigram] = (stats.trigramFrequency[trigram] || 0) + 1;
    }
    
    // 4. Find seed position and extract seed+1, seed+2, prefix, suffix
    const phraseLower = phrase.toLowerCase();
    const seedIndex = phraseLower.indexOf(seedLower);
    
    if (seedIndex !== -1) {
      // Words before seed = prefix
      if (seedIndex > 0) {
        const prefix = phraseLower.substring(0, seedIndex).trim();
        if (prefix) {
          stats.prefixes[prefix] = (stats.prefixes[prefix] || 0) + 1;
        }
      }
      
      // Words after seed
      const afterSeed = phraseLower.substring(seedIndex + seedLower.length).trim();
      const afterWords = afterSeed.split(' ').filter(w => w);
      
      if (afterWords[0]) {
        stats.seedPlus1[afterWords[0]] = (stats.seedPlus1[afterWords[0]] || 0) + 1;
      }
      if (afterWords[1]) {
        stats.seedPlus2[afterWords[1]] = (stats.seedPlus2[afterWords[1]] || 0) + 1;
      }
      
      // Full suffix (everything after seed)
      if (afterSeed) {
        stats.suffixes[afterSeed] = (stats.suffixes[afterSeed] || 0) + 1;
      }
    }
  }
  
  // 5. Compute percentiles for scoring
  stats.seedPlus1Percentiles = computePercentiles(stats.seedPlus1);
  stats.seedPlus2Percentiles = computePercentiles(stats.seedPlus2);
  stats.prefixPercentiles = computePercentiles(stats.prefixes);
  stats.suffixPercentiles = computePercentiles(stats.suffixes);
  
  stats.uniqueWords = Object.keys(stats.wordFrequency).length;
  
  return stats;
}

function computePercentiles(freqMap: Record<string, number>): Record<string, number> {
  const entries = Object.entries(freqMap);
  const sorted = entries.sort((a, b) => a[1] - b[1]); // ascending by count
  const total = sorted.length;
  
  const percentiles: Record<string, number> = {};
  sorted.forEach(([word, count], index) => {
    // Percentile = position / total * 100
    percentiles[word] = Math.round((index / (total - 1)) * 100) || 0;
  });
  
  return percentiles;
}
```

---

## Storage

Data Intake results are stored in `sessions.intake_stats` as JSONB:

```sql
UPDATE sessions 
SET intake_stats = $intakeStats, updated_at = NOW()
WHERE id = $sessionId;
```

**Size estimate**: ~50-100KB per session (300-500 phrases produce ~2000-5000 unique patterns)

---

## P&C Scoring Using Intake Data

### Demand Score (0-100)

> **Note:** Function renamed from `calculatePopularity` to `calculateDemand` in December 2025.

Demand = how **common** the phrase patterns are.

```typescript
function calculateDemand(phrase: string, seedPhrase: string, stats: IntakeStats): number {
  const { prefix, seedPlus1, seedPlus2, suffix } = extractPhraseComponents(phrase, seedPhrase);
  
  // Get percentiles (high percentile = common = high demand)
  const prefixPct = stats.prefixPercentiles[prefix] ?? 50;
  const seedPlus1Pct = stats.seedPlus1Percentiles[seedPlus1] ?? 50;
  const seedPlus2Pct = stats.seedPlus2Percentiles[seedPlus2] ?? 50;
  const suffixPct = stats.suffixPercentiles[suffix] ?? 50;
  
  // Weighted average (seed+1 and seed+2 matter most)
  const demand = Math.round(
    prefixPct * 0.20 +
    seedPlus1Pct * 0.30 +
    seedPlus2Pct * 0.30 +
    suffixPct * 0.20
  );
  
  return demand;
}
```

### Opportunity Score (0-100)

> **Note:** Function renamed from `calculateCompetition` to `calculateOpportunity` in December 2025.

Opportunity = inverse of how **common** the patterns are (less common = more opportunity).

```typescript
function calculateOpportunity(phrase: string, seedPhrase: string, stats: IntakeStats): number {
  const { prefix, seedPlus1, seedPlus2, suffix } = extractPhraseComponents(phrase, seedPhrase);
  
  // Get percentiles (high percentile = common = lower opportunity)
  const prefixPct = stats.prefixPercentiles[prefix] ?? 50;
  const seedPlus1Pct = stats.seedPlus1Percentiles[seedPlus1] ?? 50;
  const seedPlus2Pct = stats.seedPlus2Percentiles[seedPlus2] ?? 50;
  const suffixPct = stats.suffixPercentiles[suffix] ?? 50;
  
  // Equal weighting for opportunity calculation
  const opportunity = Math.round(
    prefixPct * 0.25 +
    seedPlus1Pct * 0.25 +
    seedPlus2Pct * 0.25 +
    suffixPct * 0.25
  );
  
  return opportunity;
}
```

### Spread (Opportunity Indicator)

```typescript
const spread = demand - opportunity;
// Positive spread = good opportunity (high demand but unique phrasing)
// Negative spread = trap phrase (low demand, common phrasing)
```

---

## Example Output

**Session**: Content Creation (482 phrases)

| Phrase | Prefix | Seed+1 | Seed+2 | Suffix | P | C | Spread |
|--------|--------|--------|--------|--------|---|---|--------|
| How To Start Content Creation | how to start | (none) | (none) | (none) | 75 | 65 | +10 |
| Content Creation For Beginners | (none) | for | beginners | for beginners | 88 | 82 | +6 |
| Content Creation Psychology | (none) | psychology | (none) | psychology | 15 | 14 | +1 |
| Best Content Creation Tools 2024 | best | tools | 2024 | tools 2024 | 72 | 68 | +4 |

---

## Performance

| Metric | Value |
|--------|-------|
| Processing time | 200-500ms for 500 phrases |
| Memory usage | ~5-10MB during processing |
| Storage size | 50-100KB per session |
| Scoring time | <1ms per phrase |

---

## Future Enhancements

1. **Cross-Session Learning**: Aggregate patterns across all sessions for global rarity scoring
2. **Trending Detection**: Compare current session patterns to historical baselines
3. **Niche Fingerprinting**: Identify unique pattern signatures per niche
