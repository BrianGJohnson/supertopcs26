# Credit Allocation & Pricing Strategy

## Overview

This document captures our thinking on how to structure user credits, display usage, and price actions within SuperTopics.

---

## Core Philosophy

**Users should always know where they stand** - like a gas tank, not a surprise.

**Avoid anxiety** - Don't show per-action costs during use. Show aggregate usage instead.

**Be transparent** - Never cut users off without warning.

---

## Terminology Decision

**Use "Credits" not "Tokens"**

- "Tokens" is technical AI jargon
- "Credits" is universally understood
- Clean, simple, professional

---

## Header Display Design

### Current Mockup
```
[ 3,242 credits ]
```

### Proposed Enhancement: Micro Progress Bar
```
[ 3,242 credits ]
[🟢🟢🟢🟢🟢⚪⚪] 72% remaining
```

Or a simple colored bar beneath the number showing percentage remaining.

### Click Behavior
When user clicks the credits display, show:
- Credits remaining this period
- Credits used this period  
- Reset date (e.g., "Resets Jan 1")
- "Top Up" / "Buy More" option

---

## Cost Tiers (Our Actual Costs)

### Tier 1: Cheap (~$0.001 per action)
- Apify autocomplete lookups (Deep Dive drilling)
- Basic database reads
- **User cost:** Bundle into subscription (don't charge individually)

### Tier 2: Medium (~$0.01-0.03 per action)
- GPT-5 Mini calls
- Title generation
- Phrase polishing
- Light AI reasoning
- **User cost:** ~1 credit per action

### Tier 3: Expensive (~$0.04-0.08 per action)
- Image generation (thumbnails)
- Heavy AI reasoning tasks
- **User cost:** ~3-5 credits per action

---

## Subscription Tiers

### Beta Plan: $19.95/month
- Target: Early adopters, testing phase
- Generous credit allocation to encourage exploration
- Suggested: 1,000+ credits/month

### Standard Plan: $29.95/month
- Target: Active YouTubers post-beta
- More credits for heavier users
- Suggested: 2,000+ credits/month

---

## Credit Valuation

**Internal math (not shown to users):**

If we apply 4x margin on our costs:
- Tier 1 actions: ~0.4 cents → essentially free, bundled
- Tier 2 actions: ~8-12 cents → 1 credit = ~10 cents
- Tier 3 actions: ~16-32 cents → 3 credits = ~30 cents

**At $19.95/month with 1,000 credits:**
- $19.95 ÷ 1,000 = ~2 cents per credit face value
- Our actual cost per credit ≈ 0.5-1 cent
- Healthy margin maintained

---

## Abuse Prevention

### Concern
User could script/hammer the API to drain resources maliciously.

### Safeguards
1. **Rate limiting** - Max requests per minute/hour
2. **Anomaly detection** - Flag unusual usage patterns
3. **IP/session tracking** - Identify automated behavior
4. **Soft caps** - Throttle before hard cutoff
5. **Account suspension** - For egregious abuse

### Free Actions Consideration
Some actions (like landing on Blueprint page) could be free, but need rate limits to prevent abuse.

---

## Warning System

### At 70% usage
- Subtle indicator (yellow in progress bar)
- No popup, just visual

### At 90% usage  
- More prominent warning
- Email notification option
- "Top up" suggestion

### At 100% usage
- Clear message: "You've used your monthly credits"
- Options: Upgrade, top up, or wait for reset
- **Never a hard cutoff with no explanation**

---

## Open Questions

1. Should Tier 1 (cheap) actions be truly unlimited or have a hidden high cap?
2. Do credits roll over month-to-month? (Probably not for simplicity)
3. Should there be a "power user" tier above $29.95?
4. How to handle team/multi-user accounts?

---

## Next Steps

1. Finalize credit amounts per subscription tier
2. Design the credit display component
3. Build usage tracking infrastructure
4. Implement the warning system
5. Test with beta users and adjust

---

*Last updated: December 12, 2024*
*Status: Brainstorming / Planning*
