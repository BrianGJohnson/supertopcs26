# Apify Migration Plan

## Overview

This document outlines the plan to migrate from direct YouTube/Google autocomplete API calls to **Apify-only** autocomplete. The goal is to completely deprecate direct API usage to avoid IP blocking risks at scale.

---

## Current System (Direct YouTube API)

### Four Expansion Methods

| Method | API Calls | Output | Tag |
|--------|-----------|--------|-----|
| **Top-10** | 1 call | ~10 phrases | `simple_top10` |
| **Child Expansion** | ~30 calls | ~80 phrases | `child_phrase`, `child_prefix_*` |
| **A-to-Z Complete** | 26 calls | ~230 phrases | `a2z_complete` |
| **Prefix Complete** | 25 calls | ~100 phrases | `prefix_complete` |
| **TOTAL** | ~82 calls | ~400 phrases | — |

### Child Phrase Generation Flow

1. Get Top-10 for seed phrase (e.g., "content creation")
2. For EACH Top-10 phrase:
   - Query autocomplete with the phrase (direct expansion)
   - Query "how to {phrase}"
   - Query "what does {phrase}"
3. Tag phrases that START WITH the parent phrase as "children"
4. Store `parentBucketItemId` for lineage tracking

### Tagging System

| Priority | `popularitySource` | `tagDisplay` | `tagSortPriority` |
|----------|-------------------|--------------|-------------------|
| 1 | `simple_top10` | `Top-10` | 1 |
| 2 | `child_phrase` | `Child` | 2 |
| 2 | `child_prefix_how_to` | `Child` | 2 |
| 2 | `child_prefix_what_does` | `Child` | 2 |
| 3 | `a2z_complete` | `A-to-Z -` | 3 |
| 4 | `prefix_complete` | `Prefix -` | 4 |

**Rules:**
- First discovery wins (immutable tag)
- `sources[]` array tracks all discovery methods
- Parent-child relationships preserved via `parentBucketItemId`

---

## Apify Capabilities

### What We've Confirmed Works

| Feature | Status | Notes |
|---------|--------|-------|
| Basic autocomplete | ✅ Works | ~2.5-3 seconds per call |
| `use_suffix: true` | ✅ Works | A-Z expansion in 1 call (~6 sec) |
| `use_prefix: true` | ✅ Works | A-Z prefix expansion in 1 call |
| Child expansion | ✅ Works | Individual calls per Top-10 phrase |
| Top-10 results | ✅ Works | Returns 10 suggestions |

### What Apify Does Differently

| Aspect | Direct YouTube API | Apify |
|--------|-------------------|-------|
| Speed | ~100ms per call | ~2.5-3 sec per call |
| IP blocking risk | High at scale | None (proxied) |
| Result accuracy | 100% matches YouTube | Sometimes different results |
| A-Z expansion | 26 calls | 1 call with `use_suffix` |
| Prefix expansion | 25 calls | 1 call with `use_prefix` |

### Known Issues

1. **Apify returns different/extra results** for some queries
   - Example: "what does the youtube algorithm favor" → Apify returns 7, YouTube returns 1
   - Impact: Demand/competition scoring may be inaccurate
   - Status: Need to test alternative Apify actors

---

## Migration Strategy

### Phase 1: Replace A-Z Complete ✅ READY

**Current:** 26 individual calls
**Apify:** 1 call with `use_suffix: true`

```javascript
// Single call replaces 26 calls
const response = await fetch(APIFY_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify({
    query: seedPhrase,
    use_suffix: true,  // A-Z expansion
    language: 'English',
    country: 'United States'
  })
});
```

**Timing:** ~6 seconds (vs ~5-10 seconds with delays for 26 calls)
**Cost:** ~$0.001 (vs ~$0.026 for 26 calls)

### Phase 2: Replace Top-10 Simple Search ✅ READY

**Current:** 1 call
**Apify:** 1 call (same)

No change in structure, just switch endpoint.

**Timing:** ~2.5 seconds (vs ~100ms)
**Trade-off:** Slower but no IP risk

### Phase 3: Replace Child Expansion ⚠️ NEEDS WORK

**Current:** 
- For each Top-10 phrase: 3 calls (direct + "how to" + "what does")
- Total: ~30 calls

**Apify Options:**

#### Option A: Individual Calls (Same Structure)
- 3 calls per Top-10 phrase
- Total: ~30 calls × 2.5 sec = ~75 seconds
- **Pros:** Maintains exact current behavior
- **Cons:** Slow

#### Option B: Batch with Semantic Prefixes
- 1 call with `use_prefix: true` gets A-Z variations (not our prefixes)
- Still need individual calls for "how to", "what does"
- **Pros:** Slightly faster
- **Cons:** `use_prefix` gives A-Z, not semantic prefixes

#### Option C: Parallel Calls
- Run 3-5 Apify calls in parallel
- **Risk:** May hit Apify rate limits
- **Needs testing**

### Phase 4: Replace Prefix Complete ⚠️ PARTIAL

**Current:** 25 calls (one per prefix)
**Apify:** `use_prefix: true` gives A-Z prefixes, NOT our semantic prefixes

**Our 25 Semantic Prefixes:**
```
what, what does, why, how, how to, does, can, is, will,
why does, problems, tip, how does, understand, explain,
change, update, fix, guide to, learn, broken, improve,
help with, strategy, plan for
```

**Apify `use_prefix: true` gives:**
```
a {seed}, b {seed}, c {seed}, ... z {seed}
```

**These are DIFFERENT expansions!**

**Options:**
1. Make 25 individual Apify calls (slow but accurate)
2. Use Apify A-Z prefix AND our semantic prefixes (more coverage)
3. Only use Apify A-Z prefix (lose some intent-based phrases)

---

## Tagging Requirements for Apify

### Must Preserve

1. **`popularitySource`** - Same values: `simple_top10`, `child_phrase`, `a2z_complete`, `prefix_complete`
2. **`tagDisplay`** - Same UI labels: `Top-10`, `Child`, `A-to-Z -`, `Prefix -`
3. **`tagSortPriority`** - Same order: 1, 2, 3, 4
4. **`sources[]`** - Track discovery methods
5. **`parentBucketItemId`** - Child-parent relationships

### New Tracking (Optional)

| Field | Purpose |
|-------|---------|
| `apiSource` | `'apify'` or `'direct_youtube'` |
| `apifyCallId` | Track which Apify call generated phrase |
| `expansionMode` | `'suffix'`, `'prefix'`, `'individual'` |

---

## Implementation Checklist

### Core Changes

- [ ] Create Apify wrapper for Top-10 calls
- [ ] Create Apify wrapper for A-Z with `use_suffix: true`
- [ ] Create Apify wrapper for Child expansion
- [ ] Create Apify wrapper for Prefix expansion
- [ ] Maintain all tagging logic unchanged
- [ ] Maintain parent-child relationship tracking

### API Route Updates

| Route | File | Change |
|-------|------|--------|
| Simple Search | `server/routes/bucket.ts` | Replace `callAutocompleteSimple()` |
| A-to-Z | `server/routes/a2z-complete.ts` | Use `use_suffix: true` |
| Prefix | `server/routes/prefix-complete.ts` | Individual Apify calls |
| Child | `server/routes/bucket.ts` | Replace `runPostSimpleSearchExpansion()` |

### Testing Required

- [ ] Verify Top-10 results match expected format
- [ ] Verify A-Z expansion returns all 26 letter variations
- [ ] Verify Child expansion correctly identifies child phrases
- [ ] Verify tagging is applied correctly to all sources
- [ ] Verify parent-child relationships stored correctly
- [ ] Performance test: Full expansion timing
- [ ] Cost test: Track actual Apify costs

### Deprecation

- [ ] Remove/comment direct YouTube API calls
- [ ] Remove fallback endpoints
- [ ] Update documentation

---

## Timing Estimates

### Current System (Direct API)
| Phase | Calls | Time |
|-------|-------|------|
| Top-10 | 1 | ~0.1s |
| Child | 30 | ~3s (with delays) |
| A-Z | 26 | ~5s (with delays) |
| Prefix | 25 | ~4s (with delays) |
| **Total** | 82 | **~12s** |

### Apify System (Optimized)
| Phase | Calls | Time |
|-------|-------|------|
| Top-10 | 1 | ~3s |
| Child | 30 | ~75s (sequential) or ~15s (parallel) |
| A-Z | 1 | ~6s |
| Prefix | 25 | ~60s (sequential) |
| **Total** | 57 | **~100-150s** |

### Potential Optimizations

1. **Parallel Apify calls** - Test if we can run 3-5 concurrent calls
2. **Background processing** - Run expansion async after page load
3. **Caching** - Cache common seed phrase results
4. **Progressive loading** - Show results as they come in

---

## Open Questions

1. **Can we run parallel Apify calls?** 
   - Need to test rate limits
   - Could reduce Child + Prefix time significantly

2. **Should we use Apify A-Z prefix instead of semantic prefixes?**
   - Different results but same A-Z pattern
   - May miss intent-based phrases like "how to", "why does"

3. **How to handle Apify result differences?**
   - Accept approximate results?
   - Test alternative Apify actors?
   - Adjust scoring methodology?

4. **Should we add `apiSource` tracking?**
   - Helpful for debugging
   - Could enable fallback logic later

---

## Next Steps

1. **Test parallel Apify calls** - See if we can run 3-5 concurrent
2. **Test alternative Apify actors** - Check if any give more accurate results
3. **Build Apify wrapper functions** - Drop-in replacements for current API calls
4. **Update routes one at a time** - Start with A-Z (easiest)
5. **Full integration test** - Run complete expansion with Apify

---

## Sign-Off Points

Before implementation, confirm:

- [ ] **Child expansion approach**: Individual calls or parallel?
- [ ] **Prefix expansion approach**: Keep semantic prefixes or use A-Z?
- [ ] **Performance trade-off**: Accept 100-150s runtime vs 12s?
- [ ] **Result accuracy**: Accept potential Apify differences?
- [ ] **Tagging**: Keep all current tags unchanged?

