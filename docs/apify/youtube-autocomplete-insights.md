# YouTube Autocomplete as a Research Tool

## Overview

YouTube's autocomplete (search suggestions) is a goldmine of audience intelligence. This document explains how SuperTopics leverages autocomplete data to understand **what viewers want to watch**.

---

## What Autocomplete Tells Us

### 1. Search Volume (Position = Popularity)

Autocomplete results are **ordered by search volume**, not alphabetically.

```
Seed: "youtube algorithm"

Position 1: "youtube algorithm 2025"         ← Most searched
Position 2: "youtube algorithm explained"    ← Second most
Position 3: "youtube algorithm shorts"       ← Third most
...
Position 9: "youtube algorithm anomalies"    ← Ninth most
```

**Key insight:** Position 1 has dramatically more volume than Position 9.

### 2. Anchor Patterns (Common Themes)

When an anchor word appears multiple times in Top 9, it reveals strong demand:

```
Position 1: "youtube algorithm 2025"
Position 3: "youtube algorithm 2025 explained"
Position 5: "youtube algorithm 2025 changes"
```

The anchor "2025" appearing 3 times tells us: **People really want 2025 content**.

### 3. Result Count (Competition Signal)

How many results autocomplete returns tells us about competition:

| Query | Results | Interpretation |
|-------|---------|----------------|
| "how to edit videos" | 9+ | Saturated, high competition |
| "youtube algorithm anomalies" | 2-3 | Niche, moderate competition |
| "what does the youtube algorithm favor" | 1 | Specific, low competition |
| "completely random phrase" | 0 | No demand |

### 4. Topic Matches vs Exact Matches

When you search "how to introduce yourself on youtube":

```
Exact: "how to introduce yourself on youtube"
Topic: "how to introduce yourself on youtube channel"
Topic: "how to introduce myself on youtube"
Topic: "how to introduce yourself in youtube video"
```

These are **semantically identical** but different search queries. This tells us:
- People search the same intent different ways
- One video could rank for ALL of these
- High topic match count = validated demand

---

## How SuperTopics Uses Autocomplete

### Data Collection Phase

For each seed phrase, we collect:

1. **Top 9 Results** - Direct autocomplete suggestions
2. **Child Phrases** - Recursive autocomplete on Top 9
3. **A-Z Patterns** - Alphabet completion (`seed a`, `seed b`, etc.)
4. **Prefix Patterns** - Starting word variations

This generates ~400 phrases per session.

### Analysis Phase

#### Position-Weighted Scoring
```typescript
const POSITION_WEIGHTS = [
  1.00,  // Position 1
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

#### Anchor Frequency Analysis
```typescript
// Count how often each anchor appears in Top 9
const anchorCounts = new Map<string, number>();
for (const phrase of top9Phrases) {
  for (const word of extractAnchors(phrase)) {
    anchorCounts.set(word, (anchorCounts.get(word) || 0) + 1);
  }
}
```

#### Session-Wide Pattern Detection
```typescript
// Extract bigrams from ALL phrases
const bigramFreq = new Map<string, number>();
for (const phrase of allPhrases) {
  for (const bigram of extractBigrams(phrase)) {
    bigramFreq.set(bigram, (bigramFreq.get(bigram) || 0) + 1);
  }
}
```

---

## The Phrase Length Insight

### Short Phrases (Seed: 2-3 words)
```
"youtube algorithm" → 9 varied results
```
- High volume, high competition
- Results cover broad topics
- Most share exact seed words

### Medium Phrases (4-5 words)
```
"youtube algorithm for beginners" → 5-7 results
```
- Moderate volume, focused competition
- Results more similar to each other
- Topic matches emerge

### Long Phrases (6+ words)
```
"what does the youtube algorithm favor" → 1 result
```
- Low volume, low competition
- Very specific intent
- Fewer videos targeting this

**Pattern:** As length increases:
- Autocomplete results decrease
- Specificity increases
- Competition decreases
- Intent clarity increases

---

## Competition Analysis via Autocomplete

### Future Feature: Phrase Competition Check

For any phrase, we can query autocomplete and analyze:

```typescript
interface CompetitionCheck {
  phrase: string;
  resultCount: number;
  exactMatchFound: boolean;
  topicMatches: string[];
  expansions: string[];      // Results that start with phrase
  alternatives: string[];    // Completely different topics
}

function analyzeCompetition(data: CompetitionCheck): string {
  if (data.resultCount === 0) return "No Demand";
  if (data.resultCount <= 2) return "Low Competition";
  if (data.topicMatches.length > 5) return "Saturated Topic";
  if (data.expansions.length > 3) return "Room to Specialize";
  return "Moderate Competition";
}
```

### Example Analysis

**Query:** "how to introduce yourself on youtube"

```
Results: 9
Exact match: Yes
Topic matches: 
  - "how to introduce yourself on youtube channel"
  - "how to introduce myself on youtube"
  - "how to introduce yourself in youtube video"
  - "how to introduce yourself in youtube video in english"
Expansions: 4
Alternatives: 1

Analysis: Saturated Topic (but with expansion opportunities)
```

---

## Best Practices for Autocomplete Research

### 1. Always Check Top 9
The first 9 results reveal what YouTube considers most popular.

### 2. Look for Anchor Patterns
Repeated anchors = strong demand signals.

### 3. Test Phrase Length
Enter your phrase and see how many results return:
- Many results → high competition
- Few results → low competition or low demand

### 4. Analyze Topic Matches
Semantic variations indicate validated demand - one video can capture multiple queries.

### 5. Consider Freshness
Current year anchors ("2025") appearing frequently indicate trending topics.

---

## Technical Implementation

### API Endpoint
```
GET https://suggestqueries-clients6.youtube.com/complete/search
  ?client=youtube
  &ds=yt
  &q={phrase}
```

### Response Parsing
```typescript
// Response is JSONP format
// [0] = query
// [1] = array of suggestions
// Each suggestion: [phrase, position, metadata]

function parseAutocomplete(response: string): string[] {
  const data = JSON.parse(response.replace(/^[^(]+\(|\)$/g, ''));
  return data[1].map((item: unknown[]) => item[0] as string);
}
```

### Rate Considerations
- No documented rate limits
- Be respectful: ~1 request per 100ms
- Cache results when possible
- Batch requests during intake phase

---

## Summary

YouTube autocomplete is our primary data source because it reveals:

1. **What viewers are searching** (position = volume)
2. **What topics are trending** (anchor frequency)
3. **How competitive topics are** (result count)
4. **Semantic variations** (topic matches)
5. **Specificity signals** (phrase length effects)

By systematically analyzing autocomplete data, SuperTopics helps creators find topics that balance **high demand** with **manageable competition**.
