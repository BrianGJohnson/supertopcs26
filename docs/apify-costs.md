# Apify Costs

> Last updated: December 4, 2025

---

## Overview

This document tracks Apify API costs for each feature. Use this to understand costs and set pricing.

**Base rate**: ~$0.001 per API call (0.1 cents)

---

## 1. Keyword Expansion

Full seed phrase expansion with all methods.

| Metric | Value |
|--------|-------|
| **Cost** | $0.04 (4 cents) |
| **Suggested price** | $0.05 (5 cents) |
| **Margin** | $0.01 (25%) |
| **API calls** | 38 |
| **Duration** | ~2-3 minutes |

### Call Breakdown

| Phase | Calls | Description |
|-------|-------|-------------|
| Top-10 | 1 | Initial seed suggestions |
| Child | 30 | 10 parents × 3 queries each |
| A-Z | 1 | Bulk suffix expansion |
| Prefix | 6 | Semantic prefixes |
| **Total** | **38** | |

### Validation

- Tested: December 3, 2025
- Before: $0.24, After: $0.28, Difference: $0.04 ✓

---

## 2. Seed Signal Check

Quick validation of a seed phrase (Top-10 only).

| Metric | Value |
|--------|-------|
| **Cost** | $0.001 (0.1 cents) |
| **API calls** | 1 |
| **Duration** | ~3 seconds |

---

## 3. Demand Scoring

Score demand for up to 75 phrases using YouTube autocomplete.

| Metric | Value |
|--------|-------|
| **Cost** | ~$0.013 (1.3 cents) |
| **API calls** | ~13 (6 phrases per batch) |
| **Duration** | ~30-45 seconds |
| **Max phrases** | 75 |

### How It Works

1. Phrases are batched (6 per API call for natural pacing)
2. Each batch queries YouTube autocomplete
3. Suggestions are analyzed for exact/topic matches
4. Scores calculated and saved to database

### Cost Calculation

```
75 phrases ÷ 6 per batch = 12.5 → 13 API calls
13 calls × $0.001 = $0.013 (~1.3 cents)
```

### Pacing (Natural Pattern Variation)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Base delay | 1.5-3.5s | Random jitter between batches |
| Extra delay | +2s | 30% chance per batch |
| Total time | 30-45s | Varies by randomness |

This creates varied timing patterns:
- Some batches: 1.5s delay (fast)
- Some batches: 3.5s delay (normal)  
- Some batches: 5.5s delay (slow, with extra thinking time)

### Database Storage

- **Column**: `seed_analysis.demand` (0-100 score)
- **Raw data**: `seed_analysis.demand_base` (pre-multiplier score)
- **Details**: `seed_analysis.extra.demand_v2` (full breakdown)

---

## 4. Opportunity Scoring

Calculate opportunity scores from existing demand data.

| Metric | Value |
|--------|-------|
| **Cost** | $0.00 (no API calls) |
| **Duration** | <1 second |

Opportunity scoring uses data already collected during Demand scoring.
No additional API calls needed - just computation.

---

## Projections

Based on Keyword Expansion at $0.04 cost / $0.05 price:

| Runs | Cost | Revenue | Profit |
|------|------|---------|--------|
| 1 | $0.04 | $0.05 | $0.01 |
| 100 | $4.00 | $5.00 | $1.00 |
| 1,000 | $40.00 | $50.00 | $10.00 |

---

## Free Tier

Apify provides $5/month free:
- ~125 Keyword Expansions
- ~5,000 Seed Signal Checks
- ~500 Demand Scoring runs
- Resets monthly

---

## Notes

- Storage: ~$0.02 cumulative (negligible)
- Proxy: $0.00
- Data transfer: $0.00
