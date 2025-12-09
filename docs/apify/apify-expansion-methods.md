# Apify Expansion Methods

> **Version:** 1.0  
> **Last Updated:** December 3, 2025  
> **Actor:** `forward_flight~my-actor`

This document describes the four expansion methods used to discover YouTube topic phrases via the Apify autocomplete actor.

---

## Overview

| Method | Queries | Time | Tag | Purpose |
|--------|---------|------|-----|---------|
| **Top-10** | 1 | ~3.5s | `simple_top10` | Seed validation & initial phrases |
| **Child** | ~30 | ~10s | `child_phrase` | Expand top results with prefixes |
| **A-Z** | 26 | ~15s | `a2z_complete` | Alphabetic suffix variations |
| **Prefix** | 18 | ~12s | `prefix_complete` | Intent-based prefix variations |

**Total:** ~75 queries in ~40 seconds (4 batch API calls)

---

## 1. Top-10 Complete

### Purpose
Validates the seed phrase and captures the most popular autocomplete suggestions.

### How It Works
1. Send the seed phrase directly to autocomplete
2. Returns up to 14 suggestions (YouTube's max)
3. These represent the highest-demand variations

### Query Pattern
```
seed: "content creation"
→ "content creation tips"
→ "content creation for beginners"
→ "content creation 2025"
→ ... (up to 14 results)
```

### Tagging
| Field | Value |
|-------|-------|
| `demandSource` | `simple_top10` |
| `tagDisplay` | `Top-10` |
| `tagSortPriority` | `1` (highest) |

### Use Cases
- **Seed validation**: If no results, the seed may be too niche
- **Initial phrase discovery**: Quick snapshot of demand
- **Parent phrases for Child expansion**: Top-10 results feed into Child method

---

## 2. Child Expansion

### Purpose
Expands each Top-10 result by querying it directly and with intent prefixes, discovering second-level demand signals.

### How It Works
1. Take each phrase from Top-10 results
2. Query each phrase directly (child of the child)
3. Query with "how to [phrase]" and "what does [phrase]"
4. Collect all unique suggestions

### Query Pattern
```
Parent: "content creation tips"
├── Direct: "content creation tips" → suggestions
├── Prefix: "how to content creation tips" → suggestions
└── Prefix: "what does content creation tips" → suggestions

Parent: "content creation for beginners"
├── Direct: "content creation for beginners" → suggestions
├── Prefix: "how to content creation for beginners" → suggestions
└── Prefix: "what does content creation for beginners" → suggestions
```

### Child Prefixes
```typescript
const CHILD_PREFIXES = ['how to', 'what does'];
```

### Tagging
| Field | Value |
|-------|-------|
| `demandSource` | `child_phrase` or `child_prefix_how_to` or `child_prefix_what_does` |
| `tagDisplay` | `Child` |
| `tagSortPriority` | `2` |

### Why Child Matters
- Discovers **nested demand** (what people search after the initial topic)
- High-value for **tutorial content** planning
- Shows **follow-up questions** viewers have

---

## 3. A-Z Complete

### Purpose
Appends each letter of the alphabet to the seed, discovering long-tail variations that wouldn't appear in Top-10.

### How It Works
1. Generate 26 queries: `[seed] a`, `[seed] b`, ... `[seed] z`
2. Send all in one batch API call
3. Collect suggestions grouped by letter

### Query Pattern
```
seed: "content creation"
├── "content creation a" → "content creation apps", "content creation ai"
├── "content creation b" → "content creation business", "content creation budget"
├── "content creation c" → "content creation course", "content creation career"
└── ... (26 letters)
```

### Tagging
| Field | Value |
|-------|-------|
| `demandSource` | `a2z_complete` |
| `tagDisplay` | `A-to-Z -` |
| `tagSortPriority` | `3` |

### Why A-Z Matters
- **Comprehensive coverage**: Finds phrases Top-10 misses
- **Long-tail discovery**: Niche variations with less competition
- **Alphabetic diversity**: Ensures variety in results

---

## 4. Prefix Complete

### Purpose
Prepends intent-based prefixes to the seed, discovering how viewers phrase their searches around the topic.

### How It Works
1. Generate queries with each prefix + seed
2. Send all in one batch API call
3. Collect suggestions that reveal intent patterns

### Query Pattern
```
seed: "content creation"
├── "how content creation" → suggestions
├── "what content creation" → suggestions
├── "why content creation" → suggestions
├── "how to content creation" → suggestions
└── ... (18 prefixes)
```

### The 18 Optimized Prefixes

Ordered by value (best first, no shuffle needed):

#### High-Value Singles (1-6)
| # | Prefix | Intent |
|---|--------|--------|
| 1 | `how` | General how questions |
| 2 | `what` | Definitions |
| 3 | `why` | Reasoning/motivation |
| 4 | `best` | Comparisons |
| 5 | `tips` | Actionable advice |
| 6 | `can` | Possibilities |

#### High-Value Phrases (7-9)
| # | Prefix | Intent |
|---|--------|--------|
| 7 | `how to` | #1 tutorial intent |
| 8 | `what is` | Definitions |
| 9 | `what does` | Explanations |

#### Secondary Singles (10-12)
| # | Prefix | Intent |
|---|--------|--------|
| 10 | `fix` | Problem-solving |
| 11 | `learn` | Education |
| 12 | `improve` | Enhancement |

#### Secondary Phrases (13-18)
| # | Prefix | Intent |
|---|--------|--------|
| 13 | `why does` | Deep understanding |
| 14 | `how does` | Mechanics |
| 15 | `is it` | Verification |
| 16 | `can you` | Capability |
| 17 | `guide to` | Walkthroughs |
| 18 | `should I` | Decision-making |

### Why This Order?
- **Singles first**: Broader matches, higher volume
- **Phrases 7-9**: Highest tutorial/education intent
- **No shuffle**: Batch mode sends all at once, order doesn't affect results
- **Best first**: Easier to debug, cleaner code

### Tagging
| Field | Value |
|-------|-------|
| `demandSource` | `prefix_complete` |
| `tagDisplay` | `Prefix -` |
| `tagSortPriority` | `4` |

### Why Prefix Matters
- **Intent discovery**: Shows HOW people search, not just WHAT
- **Content angles**: Each prefix suggests a video format (tutorial, comparison, fix guide)
- **Viewer language**: Matches the actual words viewers type

---

## Batch Mode Architecture

### Old Approach (Deprecated)
```
Query 1 → API → Wait → Delay
Query 2 → API → Wait → Delay
Query 3 → API → Wait → Delay
...
(82 individual calls, ~3 minutes, shuffle needed)
```

### Current Approach
```
[Query 1, Query 2, Query 3, ...Query N] → Single API Call → All Results
(4 batch calls, ~40 seconds, no shuffle needed)
```

### API Call Structure
```typescript
// Single batch call with multiple queries
const response = await fetch(APIFY_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    queries: ['how content creation', 'what content creation', ...],
    language: 'en',
    country: 'US'
  })
});

// Response: array of { seed, suggestion } objects
const data = await response.json();
// [
//   { seed: 'how content creation', suggestion: 'how content creation works' },
//   { seed: 'how content creation', suggestion: 'how content creation makes money' },
//   { seed: 'what content creation', suggestion: 'what content creation means' },
//   ...
// ]
```

---

## Execution Order

The hybrid expansion runs phases in this order:

```
1. Top-10     (~3.5s)  → Validates seed, gets parent phrases
      ↓
2. Child      (~10s)   → Expands each Top-10 result
      ↓
3. A-Z        (~15s)   → Alphabetic suffix variations
      ↓
4. Prefix     (~12s)   → Intent-based prefix variations
      ↓
   COMPLETE   (~40s total)
```

### Why This Order?
1. **Top-10 first**: Validates seed before spending resources
2. **Child second**: Uses Top-10 results as parents
3. **A-Z third**: Independent, can run anytime
4. **Prefix fourth**: Independent, can run anytime

---

## Tagging Priority

When a phrase is found by multiple methods, the **first tag wins**:

| Priority | Source | Tag Display |
|----------|--------|-------------|
| 1 | `simple_top10` | Top-10 |
| 2 | `child_phrase` / `child_prefix_*` | Child |
| 3 | `a2z_complete` | A-to-Z - |
| 4 | `prefix_complete` | Prefix - |

The `sources[]` array tracks all methods that found the phrase, but display uses the highest-priority tag.

---

## Configuration

### Environment Variables
```bash
APIFY_API_TOKEN=apify_api_xxxxx
APIFY_AUTOCOMPLETE_ACTOR=forward_flight~my-actor  # Optional, this is the default
```

### Constants
```typescript
// Timeout per API call
export const APIFY_TIMEOUT_MS = 30000; // 30 seconds

// Retry configuration
export const APIFY_RETRY_CONFIG = {
  maxRetries: 2,
  baseBackoffMs: 1000,
  maxBackoffMs: 5000,
  retryableStatuses: [429, 500, 502, 503, 504]
};
```

---

## Performance Summary

| Metric | Value |
|--------|-------|
| Total Queries | ~75 |
| Total API Calls | 4 (batch) |
| Total Time | ~40 seconds |
| Results per Seed | 200-400 unique phrases |
| Cost per Expansion | ~$0.004 |

---

## Related Documentation

- `/docs/apify-integration-guide.md` - API integration details
- `/docs/apify-costs.md` - Cost analysis
- `/src/lib/apify-autocomplete.ts` - Implementation
