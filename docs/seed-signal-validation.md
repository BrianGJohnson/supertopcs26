# Seed Signal Validation

## Overview

Seed Signal Validation provides **instant feedback** on seed phrase popularity by checking YouTube autocomplete response volume. This helps users validate their topic choice **before** investing time in full expansion.

**The Core Insight**: YouTube autocomplete count directly correlates with search demand. More suggestions = more people searching for this topic.

---

## How It Works

When a user enters a seed phrase, we call YouTube autocomplete and count:
1. **Total suggestions** - How many phrases YouTube returns (max 10-12)
2. **Exact matches** - How many start with the exact seed phrase

These metrics determine the **signal strength**:

| Signal | Suggestions | Exact Matches | Meaning |
|--------|-------------|---------------|---------|
| 🟢 Strong | 8+ | 6+ | High search demand, great topic |
| 🔵 Moderate | 5-7 | 3+ | Good foundation, proceed with confidence |
| 🟠 Weak | 3-4 | 1-2 | Limited activity, consider broadening |
| 🔴 Very Weak | 0-2 | 0 | Very niche, search discovery will be hard |

**Note**: YouTube autocomplete typically returns 9-10 suggestions max (the seed itself counts as one slot).

---

## Real Examples

### Strong Signal: "youtube algorithm"
```
Suggestions: 9
Exact matches: 9 (all start with "youtube algorithm")
Signal: 🟢 Strong
```
- youtube algorithm
- youtube algorithm 2025
- youtube algorithm explained
- youtube algorithm sucks
- youtube algorithm explained in 5 minutes
- youtube algorithm change
- youtube algorithm 2025 explained
- youtube algorithm anomalies
- youtube algorithm is trash
- youtube algorithm broken
- youtube algorithm change 2025
- youtube algorithm 2025 shorts

### Moderate Signal: "how to introduce yourself on youtube"
```
Suggestions: 10
Exact matches: 1 (only first is exact)
Signal: 🔵 Moderate
```
Why moderate? The phrase is so specific that YouTube offers related but not exact alternatives:
- how to introduce yourself on youtube ✓
- how to introduce myself on youtube channel
- how to introduce yourself in youtube channel in english
- how to introduce myself in youtube video
- etc.

### Weak Signal: "thumbnail contrast"
```
Suggestions: 3
Exact matches: 1
Signal: 🟠 Weak
```
- thumbnail contrast
- high contrast thumbnail
- thumbnail tips
- thumbnail concept

---

## Implementation

### API Endpoint

**POST /api/seed-signal**

```json
// Request
{ "seed": "youtube algorithm" }

// Response
{
  "seed": "youtube algorithm",
  "suggestionCount": 12,
  "exactMatchCount": 12,
  "signalStrength": "strong",
  "message": "Strong Search Activity",
  "explanation": "YouTube has lots of search activity around this topic. Great seed to explore!",
  "suggestions": ["youtube algorithm", "youtube algorithm 2025", ...]
}
```

### React Component

```tsx
import { SeedSignalIndicator } from "@/components/ui/SeedSignalIndicator";

// In your form
<input 
  value={seedInput}
  onChange={(e) => setSeedInput(e.target.value)}
/>
<SeedSignalIndicator 
  seed={seedInput}
  onSignalChange={(signal) => console.log(signal)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `seed` | string | required | The seed phrase to validate |
| `minChars` | number | 3 | Min characters before validation triggers |
| `debounceMs` | number | 500 | Debounce delay for API calls |
| `onSignalChange` | function | - | Callback when signal changes |
| `compact` | boolean | false | Compact mode for inline display |

---

## User Experience

### Where It Appears

1. **Session Creation Modal** - When entering a new seed phrase
2. **Future: Onboarding Step** - During initial topic selection

### Behavior

- **Debounced** - Waits 600ms after typing stops before calling API
- **Non-blocking** - Users can proceed even with weak signals
- **Helpful suggestions** - Shows alternative topics for weak seeds

### Messaging Philosophy

We **inform, don't prevent**. A weak signal doesn't mean a bad topic:
- Might be an untapped niche opportunity
- User might have existing audience for discovery
- Search isn't the only way viewers find content

---

## Files

| File | Purpose |
|------|---------|
| `/src/lib/seed-signal.ts` | Core signal calculation logic |
| `/src/app/api/seed-signal/route.ts` | API endpoint |
| `/src/components/ui/SeedSignalIndicator.tsx` | React component |
| `/docs/seed-signal-validation.md` | This documentation |

---

## Future Enhancements

1. **Letter sampling** - Quick A-Z sample for phrase count estimation
2. **Question variants** - Check "how to X", "why X", "what is X"
3. **Historical comparison** - Compare to previously successful seeds
4. **Niche benchmarks** - What's "good" varies by niche

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-02 | Initial implementation |
