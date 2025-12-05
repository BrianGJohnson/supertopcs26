# Apify YouTube Autocomplete Integration Guide

## Overview

**Version:** 3.0  
**Last Updated:** December 3, 2025  
**Status:** Production  
**Author:** Super Topics Engineering

This guide documents our **Custom Apify Actor** for YouTube autocomplete. We use our own Apify actor (`forward_flight~my-actor`) exclusively - no third-party actors or direct YouTube/Google API calls.

> ⚠️ **DEPRECATED:** The old `scraper-mind~youtube-autocomplete-scraper` actor is no longer used. All references to it in this document are for historical context only.

---

## What Changed (v3.0)

| Aspect | Old (v2.0) | New (v3.0) |
|--------|------------|------------|
| **Actor** | `scraper-mind~youtube-autocomplete-scraper` | `forward_flight~my-actor` |
| **Input Format** | `{ query: string, use_suffix: bool }` | `{ queries: string[] }` |
| **Output Format** | `{ query, suggestion_01...suggestion_10 }` | `{ seed, suggestion }` per result |
| **Results per query** | Max 10 | Up to 14 |
| **Bulk mode** | `use_suffix: true` | Send all queries in array |
| **A-Z time** | ~65s (26 calls) | **~14s (1 batch call)** |

---

## Table of Contents

1. [Why Apify?](#1-why-apify)
2. [Hybrid Strategy (Option C)](#2-hybrid-strategy-option-c)
3. [Architecture](#3-architecture)
4. [Configuration](#4-configuration)
5. [API Reference](#5-api-reference)
6. [Expansion Modes](#6-expansion-modes)
7. [Tagging System](#7-tagging-system)
8. [Cost Tracking](#8-cost-tracking)
9. [Error Handling](#9-error-handling)
10. [Migration Checklist](#10-migration-checklist)

---

## 1. Why Apify?

### Problem: Direct Google API Risks

| Risk | Severity | Description |
|------|----------|-------------|
| **IP Blocking** | 🔴 Critical | 250-500 users × 75 calls = 18,750-37,500 calls/month from same IP range |
| **Rate Limiting** | 🔴 Critical | No official API = no documented limits = unpredictable blocks |
| **Service Disruption** | 🔴 Critical | Google can change/block the endpoint without notice |

### Solution: Apify Proxy Layer

| Benefit | Description |
|---------|-------------|
| **Distributed IPs** | Requests originate from Apify's proxy network, not our server |
| **Rate Limit Handling** | Apify manages request pacing on their infrastructure |
| **Reliability** | Professional service with SLAs and support |
| **Scalability** | No practical limit on concurrent users |

---

## 2. Hybrid Strategy (Option C)

### The Approach

We use a **hybrid strategy** that optimizes for speed while maintaining phrase coverage:

| Phase | Method | Queries | Time | Tag |
|-------|--------|---------|------|-----|
| **Top-10** | Batch (1 query) | 1 | ~3.5s | `simple_top10` |
| **Child** | Batch | ~30 | ~10s | `child_phrase` |
| **A-Z** | Batch (26 queries) | 26 | ~15s | `a2z_complete` |
| **Prefix** | Batch (25 queries) | 25 | ~14s | `prefix_complete` |
| **TOTAL** | 4 batch calls | **~82** | **~42s** | — |

### Comparison to Previous System

| Metric | Old (Direct API) | Old Apify | New Custom Actor |
|--------|------------------|-----------|------------------|
| Total Calls | 82 individual | 82 individual | **4 batch** |
| Total Time | ~3 min | ~3.4 min | **~42 seconds** |
| IP Risk | High | None | None |

### Key Optimizations

1. **Batch Mode**: All queries sent in single API calls (vs individual calls)
2. **Full 25 Prefixes**: Restored complete intent coverage
3. **Custom Actor**: Full control, no third-party dependency
4. **Up to 14 results**: More suggestions per query than before

### Full Prefix Set (25 phrases)

```typescript
const SEMANTIC_PREFIXES = [
  // Question words
  'what', 'what does', 'why', 'why does', 'how', 'how to', 'how does',
  // Possibility/capability
  'does', 'can', 'is', 'will',
  // Problem-solving
  'problems', 'fix', 'broken', 'help with',
  // Learning/improvement
  'understand', 'explain', 'learn', 'improve', 'guide to',
  // Actionable
  'tip', 'change', 'update', 'strategy', 'plan for'
];
```

---

## 3. Architecture

### Before (Direct Calls) - DEPRECATED
```
User Request → Vercel Server → Google Autocomplete API
                    ↑
              (Our IP exposed, rate limit risk)
```

### After (Custom Apify Actor) - CURRENT
```
User Request → Vercel Server → Apify API → Google Autocomplete API
                    ↑              ↑
              (Safe API call)  (Apify's proxies handle this)
```

### Module Structure
```
src/lib/
├── apify-autocomplete.ts        # Apify-based autocomplete (PRIMARY)
└── youtube-autocomplete.ts      # Legacy direct calls (DEPRECATED)
```

---

## 4. Configuration

### Environment Variables

```env
# Apify Configuration (in .env.local)
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxxxxxxxxxx
APIFY_AUTOCOMPLETE_ACTOR=forward_flight~my-actor
```

### Actor Details

| Property | Value |
|----------|-------|
| Actor ID | `forward_flight~my-actor` (our custom actor) |
| Endpoint | `https://api.apify.com/v2/acts/forward_flight~my-actor/run-sync-get-dataset-items` |
| Control | Full control - we own this actor |
| Output | Up to 14 suggestions per query |

---

## 5. API Reference

### Apify Endpoint

**URL:**
```
POST https://api.apify.com/v2/acts/forward_flight~my-actor/run-sync-get-dataset-items?token={APIFY_API_TOKEN}
```

### Input Format

Send queries as an array:

```json
{
  "queries": ["youtube algorithm", "youtube algorithm a", "youtube algorithm b"],
  "language": "en",
  "country": "US"
}
```

### Response Format

Each suggestion is returned as a separate object:

```json
[
  { "seed": "youtube algorithm", "suggestion": "youtube algorithm 2025" },
  { "seed": "youtube algorithm", "suggestion": "youtube algorithm explained" },
  { "seed": "youtube algorithm a", "suggestion": "youtube algorithm analytics" },
  { "seed": "youtube algorithm a", "suggestion": "youtube algorithm and seo" },
  { "seed": "youtube algorithm b", "suggestion": "youtube algorithm broken" }
]
```

### Parsing Response

```typescript
interface ApifyResponse {
  seed: string;
  suggestion: string;
}

function parseApifyResponse(data: ApifyResponse[]): string[] {
  if (!data || data.length === 0) return [];
  return data.map(item => item.suggestion);
}

function groupBySeed(data: ApifyResponse[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const item of data) {
    const suggestions = grouped.get(item.seed) || [];
    suggestions.push(item.suggestion);
    grouped.set(item.seed, suggestions);
  }
  return grouped;
}
```

### Performance Benchmarks

| Test | Queries | Results | Time |
|------|---------|---------|------|
| Single query | 1 | ~14 | ~3.5s |
| A-Z complete | 26 | ~272 | **~14s** |
| Child expansion (13 phrases) | 13 | ~168 | ~10.5s |
| Full Top-10 + Child | 14 | ~182 | ~14s |
```

---

## 6. Expansion Modes

### Updated Strategy (v3.0)

With our custom actor, we batch queries for efficiency:

| Mode | Method | Time | Tag |
|------|--------|------|-----|
| **Top-10** | 1 query in batch | ~3.5s | `simple_top10` |
| **Child** | All children in 1 batch | ~10s | `child_phrase` |
| **A-Z** | 26 queries in 1 batch | **~14s** | `a2z_complete` |
| **Prefix** | All prefixes in 1 batch | ~5s | `prefix_complete` |
| **TOTAL** | **3-4 batch calls** | **~30-35s** | — |

### Top-10 Generation

```typescript
async function fetchTop10(seed: string): Promise<string[]> {
  const response = await fetch(APIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries: [seed] })
  });
  const data = await response.json();
  return data.map(item => item.suggestion);
}
```

### A-Z Complete (Batch Mode)

**All 26 letters in ONE call!**

```typescript
async function fetchAZComplete(seed: string): Promise<string[]> {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const queries = alphabet.map(letter => `${seed} ${letter}`);
  
  const response = await fetch(APIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries })
  });
  const data = await response.json();
  return [...new Set(data.map(item => item.suggestion))];
}
```

### Child Expansion (Batch Mode)

```typescript
async function fetchChildExpansion(parentPhrases: string[]): Promise<string[]> {
  const response = await fetch(APIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries: parentPhrases })
  });
  const data = await response.json();
  return [...new Set(data.map(item => item.suggestion))];
}
```

### Prefix Complete (Batch Mode)

Uses the full 25 semantic prefixes for comprehensive intent coverage:

```typescript
const SEMANTIC_PREFIXES = [
  // Question words
  'what', 'what does', 'why', 'why does', 'how', 'how to', 'how does',
  // Possibility/capability
  'does', 'can', 'is', 'will',
  // Problem-solving
  'problems', 'fix', 'broken', 'help with',
  // Learning/improvement
  'understand', 'explain', 'learn', 'improve', 'guide to',
  // Actionable
  'tip', 'change', 'update', 'strategy', 'plan for'
];

async function fetchPrefixComplete(seed: string): Promise<string[]> {
  const queries = SEMANTIC_PREFIXES.map(prefix => `${prefix} ${seed}`);
  
  const response = await fetch(APIFY_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries })
  });
  const data = await response.json();
  return [...new Set(data.map(item => item.suggestion))];
}
```

---

## 7. Tagging System

### CRITICAL: Tags Must Not Change

The tagging system is the backbone of scoring. All tags must remain exactly as they were:

| Priority | `demandSource` | `tagDisplay` | `tagSortPriority` |
|----------|-------------------|--------------|-------------------|
| 1 | `simple_top10` | `Top-10` | 1 |
| 2 | `child_phrase` | `Child` | 2 |
| 2 | `child_prefix_how_to` | `Child` | 2 |
| 2 | `child_prefix_what_does` | `Child` | 2 |
| 3 | `a2z_complete` | `A-to-Z -` | 3 |
| 4 | `prefix_complete` | `Prefix -` | 4 |

### Tagging Rules

1. **First tag wins** — Once a phrase has a tag, it's immutable
2. **Source merging** — If found by multiple methods, `sources[]` tracks all
3. **Parent linking** — Child phrases store `parentBucketItemId`

### Tag Assignment Logic

```typescript
function assignTag(
  phrase: string,
  source: string,
  existingPhrases: Map<string, Phrase>
): Phrase {
  const normalized = phrase.toLowerCase().trim();
  
  if (existingPhrases.has(normalized)) {
    // Merge sources, keep original tag
    const existing = existingPhrases.get(normalized)!;
    existing.sources.push(source);
    return existing;
  }
  
  // New phrase - assign tag based on source
  const tagConfig = TAG_CONFIG[source];
  return {
    text: phrase,
    textNormalized: normalized,
    demandSource: tagConfig.demandSource,
    tagDisplay: tagConfig.tagDisplay,
    tagSortPriority: tagConfig.priority,
    sources: [source],
  };
}
```

---

## 8. Cost Tracking

### Hybrid Approach Costs

| Phase | Calls | Est. Cost |
|-------|-------|-----------|
| Top-10 | 1 | ~$0.001 |
| Child | 30 | ~$0.03 |
| A-Z | 1 | ~$0.001 |
| Prefix | 6-9 | ~$0.009 |
| **Total** | **~40** | **~$0.04/session** |

### Monthly Projections

| Users | Sessions/Month | Est. Cost |
|-------|----------------|-----------|
| 100 | 400 | ~$16 |
| 250 | 1,000 | ~$40 |
| 500 | 2,000 | ~$80 |

Plus $5/month base for the Apify actor.

---

## 9. Error Handling

### Retry Strategy

```typescript
const RETRY_CONFIG = {
  maxRetries: 2,
  baseBackoffMs: 1000,
  maxBackoffMs: 5000,
  retryableStatuses: [429, 500, 502, 503, 504],
};
```

### Error Categories

| Category | Action | Log Level |
|----------|--------|-----------|
| **Timeout** | Retry with backoff | WARN |
| **Rate Limit (429)** | Retry with longer backoff | WARN |
| **Auth Error (401/403)** | Fail immediately, check token | ERROR |
| **Server Error (5xx)** | Retry with backoff | WARN |
| **Network Error** | Retry with backoff | WARN |

### No Fallback to Direct API

We do NOT fall back to direct YouTube/Google API. Apify is our only source to avoid any IP blocking risk.

---

## 10. Migration Checklist

### Configuration
- [x] Add APIFY_API_TOKEN to .env.local
- [x] Set APIFY_AUTOCOMPLETE_ACTOR=forward_flight~my-actor
- [x] Create custom Apify actor with got-scraping
- [x] Document new API format

### Implementation
- [ ] Update apify-autocomplete.ts response parser
- [ ] Update API call format (query → queries array)
- [ ] Refactor expansion functions for batch mode
- [ ] Update Page 1 seed validation
- [ ] Update Page 2 expansion integration

### Testing
- [x] Verify single query returns up to 14 phrases
- [x] Verify A-Z batch returns ~272 phrases in ~14s
- [x] Verify child expansion works in batch mode
- [ ] Verify full flow end-to-end
- [ ] Verify all tags applied correctly

### Cleanup
- [ ] Remove old scraper-mind references from code
- [x] Update documentation to v3.0
- [ ] Monitor first 10 production runs

---

## Custom Actor Code

Our Apify actor (`forward_flight~my-actor`) source code:

```javascript
import { Actor } from "apify";
import { gotScraping } from "got-scraping";

await Actor.init();

const input = await Actor.getInput() || {};
const queries = input.queries || [];
const language = input.language || "en";
const country = input.country || "US";

const proxyConfiguration = await Actor.createProxyConfiguration();

const results = [];

for (const seed of queries) {
    try {
        const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(seed)}&hl=${language}&gl=${country}`;
        
        const response = await gotScraping({
            url,
            proxyUrl: await proxyConfiguration.newUrl(),
            responseType: 'text',
        });

        const text = response.body;
        const match = text.match(/\[.*\]/s);
        if (!match) continue;

        const arr = JSON.parse(match[0]);
        const suggestions = arr[1] || [];

        for (const suggestion of suggestions) {
            const suggestionText = Array.isArray(suggestion) ? suggestion[0] : suggestion;
            results.push({
                seed,
                suggestion: suggestionText
            });
        }
    } catch (error) {
        console.log(`Error for "${seed}":`, error.message);
    }
}

await Actor.pushData(results);
await Actor.exit();
```

---

*This documentation is maintained by Super Topics Engineering. Last updated: December 3, 2025.*
