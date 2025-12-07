# Auto-Pick & Progression Design

**Page 3 (Refine) → Page 4 (Super Topics)**

---

## Core Numbers

| Metric | Value | Rationale |
|--------|-------|-----------|
| **Auto-Pick Selects** | 18 phrases | Forces 5 conscious deselections |
| **Gate to proceed** | 13 stars | Matches Super Topics layout (1 top + 12 grid) |
| **Minimum to proceed** | 3 stars | Ensures intentionality without frustration |

---

## Auto-Pick Button Behavior

Single unified button replaces current "Auto-Pick" + "Select X more":

### States

**Initial (0 starred):**
```
[ ⚡ Auto-Pick 18 ]
  ↳ Hover: "We'll select 18 top phrases — you choose 13"
```

**After Auto-Pick (18 starred):**
```
[ ★ 18 Selected — Deselect 5 to proceed ]
```

**User deselects to 13:**
```
[ ★ 13 Selected — Go to Super Topics → ]
```

**Manual starring to 3+:**
```
[ ★ X Selected — Go to Super Topics → ]
```

---

## Auto-Pick Algorithm

### Composite Score (100 points max)

```
AutoPickScore = (
    Topic Strength × 0.20 +    // Niche alignment
    Audience Fit × 0.20 +      // User's specific audience
    Demand × 0.25 +            // Search volume signal
    Opportunity × 0.35         // Low comp + LTV potential
)
```

### Diversity Requirements

**Must ensure phrase variety by anchor/modifier type:**

1. **Anchor diversity** — Don't pick 5 phrases all containing "tutorial"
2. **Intent diversity** — Mix of how-to, what-is, review, comparison
3. **Length diversity** — Include short (3-4 words) and long (5-7 words)

Reference: `data-intake.ts` scoring logic, `audience-fit.ts` for onboarding context

### Tiebreakers

1. Phrase length 4-7 words preferred
2. Unique word coverage (avoid near-duplicates)
3. Generation method variety (seed, child, top10, prefix, az)

---

## Jump to Title Flow

| Stars Selected | Behavior |
|----------------|----------|
| 1 star | Direct jump to Title page with that phrase |
| 2-10 stars | Modal opens: "Choose a phrase to analyze" → User selects one → Title page |
| 11+ stars | Same as above, modal shows scrollable list |

---

## Super Topics Page Layout (Page 4)

```
┌─────────────────────────────────────────────────┐
│                   TOP TILE                      │
│   [Thumbnail] "Best Phrase" - Demand: 87        │
│              [ Swap Winner ↔ ]                  │
└─────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Phrase 2 │ │ Phrase 3 │ │ Phrase 4 │ │ Phrase 5 │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Phrase 6 │ │ Phrase 7 │ │ Phrase 8 │ │ Phrase 9 │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Phrase10 │ │ Phrase11 │ │ Phrase12 │ │ Phrase13 │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Total: 1 (top) + 12 (3×4 grid) = 13 phrases**

---

## User Dashboard Integration

When user proceeds to Super Topics:
- Session saved to their account
- Dashboard shows:
  ```
  My Super Topics
  ├── "YouTube algorithm" — Dec 7, 2025 — 13 phrases
  ├── "AI video tools" — Dec 1, 2025 — 13 phrases
  └── "Podcast editing" — Nov 28, 2025 — 11 phrases
  ```
- Session name = seed phrase (human readable)
- Users can revisit, refine, or continue to Title

---

## Implementation Checklist

- [ ] Update Auto-Pick button to unified design
- [ ] Implement composite scoring algorithm
- [ ] Add anchor/modifier diversity logic
- [ ] Add gate check (3 minimum, 13 maximum to proceed)
- [ ] Build Jump to Title modal for multi-selection
- [ ] Save sessions to user account on Super Topics entry
