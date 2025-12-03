# Apify Costs

> Last updated: December 3, 2025

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

## 3. (Future) TBD

_Reserved for future methods_

| Metric | Value |
|--------|-------|
| **Cost** | TBD |
| **API calls** | TBD |

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
- Resets monthly

---

## Notes

- Storage: ~$0.02 cumulative (negligible)
- Proxy: $0.00
- Data transfer: $0.00
