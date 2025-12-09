# Apify Demand & Opportunity Scoring

## Overview

This document describes our methodology for scoring **demand** (viewer interest) and **opportunity** (ranking potential) for YouTube topic phrases using **Apify actors** exclusively.

**Goal**: Move completely away from direct YouTube/Google API calls to avoid IP blocking risks at scale.

> **UPDATE (December 5, 2025)**: The database now uses `demand` and `opportunity` columns. The old `popularity` and `competition` columns have been removed.

---

## The Problem: Apify Results vs Real YouTube

### What We Discovered (Historical - Old Actor)

> ⚠️ **DEPRECATED**: This section refers to the old `scraper-mind/youtube-autocomplete-scraper` actor. We no longer use this actor.

When testing the old Apify actor (`scraper-mind/youtube-autocomplete-scraper`), we found that it returned **different results** than what YouTube actually shows users.

**Example: "what does the youtube algorithm favor"**

| Source | Results Returned |
|--------|------------------|
| Real YouTube (typing in search bar) | 1 result |
| Apify actor | 7 results |

**What Apify returned:**
1. what does the youtube algorithm favor
2. does the youtube algorithm favor consistency
3. does the youtube algorithm favor longer videos
4. does the youtube algorithm favor new channels
5. do likes help the youtube algorithm
6. why is the youtube algorithm so bad
7. how does the youtube algorithm work

**What YouTube actually shows:**
1. what does the youtube algorithm favor

### Why This Matters

Our demand/competition scoring relies on counting:
- **Exact matches**: How many results START WITH the query phrase
- **Topic matches**: How many results contain the key words

If Apify returns extra/different results, our scoring becomes inaccurate:
- A phrase that looks "competitive" (many exact matches) might actually be unique
- A phrase that looks like "high demand" (many topic matches) might actually have low demand

### The Challenge

We now use our own custom Apify actor (`forward_flight~my-actor`) which:
- Uses Apify's proxy network for IP rotation
- Returns up to 14 suggestions per query (more than the old actor's 10)
- Batches multiple queries in a single call for speed
- Is fully under our control

See `/docs/apify-integration-guide.md` for implementation details.

---

## Current Apify Actor

### `forward_flight~my-actor` (Current - Our Custom Actor)

---

## Available Apify Actors for YouTube Autocomplete

### 1. `scraper-mind/youtube-autocomplete-scraper` (Current)
- **Price**: $5/month + usage
- **Pros**: 
  - `use_prefix` and `use_suffix` for bulk A-Z expansion
  - Fast (~6 sec for full expansion)
  - Working and tested
- **Cons**: 
  - Returns different/extra results than real YouTube
  - Breaks accurate demand/competition scoring
- **Best for**: Phrase expansion (getting variations)
- **Not ideal for**: Accurate scoring

### 2. `caprolok/youtube-search-bar-scraper`
- **Price**: $5/month + usage
- **Claims**: "Real-time data extraction closely matching real-time suggestions from YouTube"
- **How it works**: "Simulates user typing to fetch suggestions directly from YouTube's search endpoint"
- **Status**: Needs testing to verify accuracy
- **Worth exploring**: May return accurate results

### 3. `karamelo/youtube-keywords-shitter`
- **Price**: $5/month + usage
- **Status**: ⚠️ Under maintenance - not recommended currently
- **Features**: 1000s of longtail keywords, A-Z expansion

### 4. `easyapi/youtube-keywords-discovery-tool`
- **Price**: Unknown
- **Rating**: 5.0
- **Features**: Questions and related terms
- **Status**: Needs testing

### 5. `easyapi/keyword-suggestions-scraper`
- **Price**: Unknown
- **Rating**: 5.0
- **Features**: Multi-platform (YouTube, Google, Amazon)
- **Status**: Needs testing

---

## The Core Insight

When you type a phrase into YouTube's search bar, the autocomplete suggestions reveal:

1. **Whether the phrase is "real"** - If YouTube suggests it, people search for it
2. **How competitive the phrase is** - More exact matches = more creators targeting it
3. **How much demand exists** - More topic matches = more interest in the subject area

## Scoring Methodology

### Exact Match Score

**Definition**: Autocomplete results that **START WITH** the exact query phrase.

**How it works**:
- Query: `"how to introduce yourself on youtube"`
- Exact Match: `"how to introduce yourself on youtube channel"` ✓ (starts with query)
- Not Exact: `"how to present yourself on youtube"` ✗ (doesn't start with query)

**Interpretation**:
| Exact Matches | Meaning |
|---------------|---------|
| 0 | Not a real search phrase - skip it |
| 1 | Low competition - unique phrase, real keyword |
| 2-3 | Moderate competition |
| 4+ | High competition - crowded space |

### Topic Match Score

**Definition**: Results containing the **majority (50%+) of key words** from the phrase.

**How it works**:
- Query: `"how to introduce yourself on youtube"`
- Key words: `[introduce, yourself, youtube]` (stop words removed)
- Topic Match: `"how to introduce yourself virtually"` ✓ (2 of 3 key words = 67%)
- Not Topic: `"how to edit youtube videos"` ✗ (1 of 3 key words = 33%)

**Interpretation**:
| Topic Matches | Meaning |
|---------------|---------|
| 0-2 | Low demand - limited interest |
| 3-5 | Moderate demand |
| 6-10 | High demand - lots of interest in this topic |

## Opportunity Matrix

Combining both scores reveals opportunity:

| Exact Match | Topic Match | Opportunity |
|-------------|-------------|-------------|
| 0 | Any | ❌ SKIP - Not a real phrase |
| 1 | 5+ | 🌟 EXCELLENT - Real phrase, high demand, low competition |
| 1-2 | 3+ | ✅ GOOD - Low competition with decent demand |
| 4+ | 8+ | ⚠️ COMPETITIVE - High demand but crowded |
| 1-3 | 1-4 | ➡️ CONSIDER - Moderate opportunity |

## Test Results (December 2025)

We tested 49 phrases using direct YouTube Autocomplete API:

### 🌟 EXCELLENT Opportunities Found (3)

| Phrase | Exact | Topic | Why |
|--------|-------|-------|-----|
| `youtube algorithm shorts` | 1 | 10 | Specific variation, high topic interest |
| `youtube algorithm tips` | 1 | 5 | Actionable phrase, moderate interest |
| `how to introduce yourself on youtube` | 1 | 10 | Long-tail, very high topic interest |

### ✅ GOOD Opportunities (6)

| Phrase | Exact | Topic |
|--------|-------|-------|
| `youtube algorithm change` | 2 | 7 |
| `how to beat youtube algorithm` | 2 | 5 |
| `how to understand youtube algorithm` | 2 | 3 |
| `content creation without showing face` | 1 | 3 |
| `content creation vs content curation` | 0 | 4 |
| `content creation passive income` | 0 | 4 |

### ⚠️ Highly Competitive (12)

These are real phrases but crowded with competition:

| Phrase | Exact | Topic |
|--------|-------|-------|
| `youtube algorithm` | 10 | 10 |
| `content creation` | 10 | 10 |
| `youtube algorithm explained` | 9 | 10 |
| `content creation tips` | 10 | 10 |
| `content creation for beginners` | 10 | 10 |

### ❌ Not Real Phrases (14)

These returned 0 exact matches - people don't search for them exactly:

- `best youtube algorithm tips`
- `does youtube algorithm favor longer videos`
- `youtube algorithm for small channels`
- `content creation for therapists`
- `youtube algorithm first 24 hours`
- `best time to post youtube algorithm`

## Detailed Examples

### Example 1: EXCELLENT Opportunity

**Phrase**: `"how to introduce yourself on youtube"`

```
Query: "how to introduce yourself on youtube"
Key words: [introduce, yourself, youtube]
Exact Match: 1 of 10
Topic Match: 10 of 10
Rating: 🌟 EXCELLENT

Autocomplete results:
  ✓ EXACT  how to introduce yourself on youtube
  ○ TOPIC  how to introduce myself on youtube channel
  ○ TOPIC  how to introduce yourself in youtube channel in english
  ○ TOPIC  how to introduce myself in youtube video
  ○ TOPIC  how to introduce myself in youtube
  ○ TOPIC  how to introduce yourself virtually
  ○ TOPIC  how to introduce yourself shortly
  ○ TOPIC  how to introduce yourself in vlog
  ○ TOPIC  how to introduce yourself on camera
  ○ TOPIC  how to introduce yourself in blog
```

**Why it's excellent**: Only 1 exact match (low competition) but 10 topic matches (high demand). The topic is popular but this specific phrasing is unique.

### Example 2: High Competition

**Phrase**: `"youtube algorithm"`

```
Query: "youtube algorithm"
Key words: [youtube, algorithm]
Exact Match: 10 of 10
Topic Match: 10 of 10
Rating: ⚠️ COMPETITIVE

Autocomplete results:
  ✓ EXACT  youtube algorithm 2025
  ✓ EXACT  youtube algorithm
  ✓ EXACT  youtube algorithm explained
  ✓ EXACT  youtube algorithm sucks
  ✓ EXACT  youtube algorithm change
  ✓ EXACT  youtube algorithm anomalies
  ✓ EXACT  youtube algorithm 2025 explained
  ✓ EXACT  youtube algorithm broken
  ✓ EXACT  youtube algorithm is trash
  ✓ EXACT  youtube algorithm tips
```

**Why it's competitive**: All 10 results start with "youtube algorithm" - many creators are targeting this exact topic.

### Example 3: Skip - Not Real

**Phrase**: `"youtube algorithm for small channels"`

```
Query: "youtube algorithm for small channels"
Exact Match: 0 of 2
Topic Match: 2 of 2
Rating: ❌ SKIP

Autocomplete results:
  ○ TOPIC  youtube algorithm for views
  ○ TOPIC  youtube algorithm to get views
```

**Why to skip**: Zero exact matches means people don't actually search for this phrase. The results are related but not this specific phrase.

### Example 4: Low Demand Signal

**Phrase**: `"what does the youtube algorithm favor"`

```
Query: "what does the youtube algorithm favor"
Exact Match: 1 of 1
Topic Match: 1 of 1
Rating: ➡️ CONSIDER

Autocomplete results:
  ✓ EXACT  what does the youtube algorithm favor
```

**Interpretation**: It's a real phrase (1 exact match) but low topic matches suggests limited search volume. Could be a hidden gem or just low demand.

## Technical Implementation

### API Endpoint

```
https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q={query}
```

**Important**: Use `client=firefox` - other clients may return different/limited results.

### Response Format

```json
[
  "query string",
  ["suggestion 1", "suggestion 2", "suggestion 3", ...],
  [],
  { "metadata": {} }
]
```

### Stop Words (Excluded from Key Word Matching)

```javascript
const stopWords = [
  'how', 'to', 'what', 'does', 'the', 'for', 'on', 'in', 'is', 'a', 'an',
  'your', 'you', 'my', 'with', 'and', 'or', 'of', 'vs', 'be', 'do', 'why',
  'when', 'where', 'who', 'which', 'that', 'this', 'it', 'at', 'by', 'from'
];
```

## Using with Apify

### The Trade-off

| Approach | Speed | Accuracy | Scale Safety |
|----------|-------|----------|--------------|
| Direct YouTube API | Fast (~100ms) | ✅ Accurate | ⚠️ IP blocking risk at scale |
| Apify bulk (use_suffix) | ~6 sec | ❌ Different results | ✅ Safe |

### Recommended Hybrid Approach

1. **Use Apify** for initial phrase expansion (getting the A-Z variations)
2. **Use Direct YouTube API** for scoring individual phrases (demand/competition)
3. **Limit scoring calls** to top candidates only (not all expanded phrases)

### Example Workflow

```
1. User enters seed: "youtube algorithm"

2. Apify expansion (1 call, ~6 sec):
   → Returns 300+ phrase variations

3. Filter to top 50 candidates (by relevance)

4. Direct YouTube scoring (50 calls, ~5 sec):
   → Score each for exact/topic match

5. Rank by opportunity score:
   → Show best opportunities first
```

## Key Takeaways

1. **Exact Match = Competition**: How many creators target this exact phrase
2. **Topic Match = Demand**: How much interest exists in this topic area
3. **Best opportunities**: 1 exact match + 5+ topic matches
4. **Skip phrases**: 0 exact matches (not real searches)
5. **Use direct YouTube API** for accurate scoring (Apify returns different data)

## Files

- `scripts/test-demand-competition-scoring.mjs` - Test script with 49 sample phrases
- `src/lib/youtube-autocomplete.ts` - Current YouTube autocomplete implementation

## Next Steps

1. Integrate this scoring into the main phrase analysis flow
2. Add to the Top Phrases display (show exact/topic counts)
3. Consider caching scores to reduce API calls
4. Build opportunity ranking into phrase selection
