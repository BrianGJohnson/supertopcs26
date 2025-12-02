# Viewer Landscape Analysis

## Overview

**Viewer Landscape Analysis** provides instant insight into the *people* behind a seed phrase — not just demand volume, but who they are, what they're feeling, and whether this audience is a fit for your content style.

When a user enters a seed phrase, we paint a complete picture:
1. **Demand Level** — How many viewers are actively interested?
2. **Seed Strength** — How focused is this topic? (formerly "Exact Match Ratio")
3. **Viewer Vibe** — What's the emotional landscape? Are they learning, frustrated, curious, or venting?

This analysis appears on:
- **Page 1 (Target)** — When clicking on a phrase
- **Page 2 (Seed)** — When evaluating seed phrases
- **Page 4 (Super Topic)** — Deep validation with competition analysis

---

## Components

### 1. Demand Level

**What it measures:** Raw search activity based on autocomplete suggestion count.

**Labels (8 tiers):**

| Tier | Suggestion Count | Label | Color |
|------|-----------------|-------|-------|
| 1 | 10+ | Extreme Demand | 🟢 Bright Green |
| 2 | 9 | Incredible Demand | 🟢 Green |
| 3 | 7-8 | High Demand | 🟢 Green |
| 4 | 5-6 | Strong Demand | 🔵 Blue |
| 5 | 4 | Solid Demand | 🔵 Blue |
| 6 | 3 | Moderate Demand | 🔵 Light Blue |
| 7 | 2 | Low Demand | 🟠 Orange |
| 8 | 0-1 | Very Low Demand | 🔴 Red |

**Display:**
```
Extreme Demand
10 suggestions from YouTube
```

**Why it matters:** Two-word seed phrases typically return 8-10 suggestions. Anything below 5 is a warning sign for discoverability.

---

### 2. Seed Strength

**What it measures:** How many autocomplete suggestions start with the exact seed phrase.

**Formerly:** "Exact Match Ratio" (too technical)

**New Label:** "Seed Strength" or "Topic Focus"

**What it tells users:**
- **100% match** = "Your seed phrase dominates — viewers search for exactly this"
- **High match (70%+)** = "Strong foundation — most viewers use your exact words"
- **Medium match (40-69%)** = "Related interest — viewers search variations"
- **Low match (<40%)** = "Scattered interest — consider a different angle"

**Display (simple):**
```
Strong Seed
9 of 9 suggestions match your phrase
```

**Display (with detail button):**
```
Strong Seed ⓘ
9 of 9 match
────────────────
[Click ⓘ to see]:
"All 9 suggestions begin with 'youtube algorithm' — 
this means viewers are specifically searching for 
this exact topic, not being redirected to related terms."
```

**Special Case — Long Phrases (5+ words):**

For phrases like "how to introduce yourself on youtube":
- Only 1/10 exact match
- BUT all 10 are semantic variations (same intent, different words)

This is actually a **strong signal** — it means:
- Low literal competition (few exact matches)
- High semantic density (everyone wants the same thing)
- **Long-Term Views potential** (we'll use this on Page 4)

---

### 3. Viewer Vibe (Emotional Landscape)

**What it measures:** The emotional state and intent of viewers searching this topic.

**Alternative names considered:**
- Viewer Vibe ← **Recommended** (casual, approachable)
- Viewer Landscape
- Audience Pulse
- Global Viewer Mood
- Emotional Context

**Categories:**

| Vibe | Signal Words | Icon | What it means |
|------|-------------|------|---------------|
| 🎓 **Learning** | explained, tutorial, how to, guide, basics, 101 | 📚 | Viewers want to understand |
| 😤 **Frustrated** | sucks, broken, trash, hate, worst, annoying | 😤 | Viewers are venting/upset |
| 🔧 **Problem-Solving** | fix, help, not working, issue, error | 🔧 | Viewers need solutions |
| 🤔 **Curious** | why, what is, how does, meaning | 🤔 | Viewers are exploring |
| ⏰ **Current** | 2025, new, update, latest, change | ⏰ | Viewers want fresh info |
| ⚖️ **Comparing** | vs, better, alternatives, which | ⚖️ | Viewers are evaluating |
| 🎯 **Action-Ready** | tips, tricks, strategy, how to start | 🎯 | Viewers want to DO something |
| 💬 **Opinionated** | best, worst, overrated, underrated | 💬 | Viewers have strong opinions |

**Display — Visual Breakdown:**

```
┌─────────────────────────────────────────┐
│  Viewer Vibe                            │
├─────────────────────────────────────────┤
│  🎓 Learning      ████████░░  35%       │
│  😤 Frustrated    ██████████  40%       │
│  🔧 Problem       ████░░░░░░  15%       │
│  ⏰ Current       ██░░░░░░░░  10%       │
└─────────────────────────────────────────┘
```

**Insight Message (based on dominant vibe):**

| Dominant Vibe | Message |
|---------------|---------|
| 🎓 Learning 50%+ | "Viewers are eager to learn — educational content will resonate" |
| 😤 Frustrated 40%+ | "Many viewers are frustrated — consider an empathetic, understanding angle" |
| 😤 Frustrated 60%+ | "⚠️ Heads up: Most viewers are venting. Be ready to meet them where they are." |
| 🔧 Problem 40%+ | "Viewers need help — solution-focused content will connect" |
| ⏰ Current 30%+ | "Viewers want the latest — fresh, timely content is key" |
| Mixed (no dominant) | "Diverse audience — you have flexibility in your approach" |

---

## Implementation

### Data Source

We already have this built in `/src/lib/viewer-demand.ts`:
- **900+ signal words** across 8 categories
- Learning, Question, Timely, Emotional, Actionable, Comparison, Problem, Specificity
- Regex patterns for years, numbered lists, durations

### API Enhancement

**Current:** `/api/seed-signal` returns basic signal strength

**Enhanced:** Add viewer vibe breakdown to response:

```typescript
// Enhanced response
{
  seed: "youtube algorithm",
  
  // Demand Level
  demandLevel: "extreme",
  demandLabel: "Extreme Demand",
  suggestionCount: 10,
  
  // Seed Strength
  seedStrength: "strong",
  seedStrengthLabel: "Strong Seed",
  exactMatchCount: 9,
  exactMatchPercent: 90,
  
  // Viewer Vibe
  viewerVibe: {
    dominant: "frustrated",
    distribution: {
      learning: 35,
      frustrated: 40,
      problemSolving: 15,
      current: 10,
      curious: 0,
      comparing: 0,
      actionReady: 0,
      opinionated: 0
    },
    insight: "Many viewers are frustrated — consider an empathetic, understanding angle"
  },
  
  // Raw data
  suggestions: [...]
}
```

### Component

**File:** `/src/components/ui/ViewerLandscapeModal.tsx`

**Props:**
```typescript
interface ViewerLandscapeModalProps {
  seed: string;
  isOpen: boolean;
  onClose: () => void;
  // Optional: pre-fetched data (for when we already have it)
  data?: ViewerLandscapeData;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  "youtube algorithm"                               ✕    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Extreme Demand  │  │ Strong Seed     │              │
│  │ 10 suggestions  │  │ 9 of 10 match   │  ⓘ          │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Viewer Vibe                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎓 Learning     ████████░░░░  35%               │   │
│  │ 😤 Frustrated   ██████████░░  40%               │   │
│  │ 🔧 Problem      ████░░░░░░░░  15%               │   │
│  │ ⏰ Current      ██░░░░░░░░░░  10%               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Many viewers are frustrated with this topic.        │
│     Consider an empathetic angle that acknowledges      │
│     their challenges before offering solutions.         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Colors (Brand):**
- Background: `#1A1D24` (card dark)
- Borders: `#2A2F3A` (card border)
- Primary accent: `#6B9BD1` (electric blue)
- Success: `#2BD899` (primary green)
- Warning: `#F59E0B` (trending orange)
- Text: `#FFFFFF` / `#A6B0C2` (primary/secondary)

---

## Page 4: Competition Analysis (Future)

For longer phrases (5-6 words), we add deeper analysis:

### Semantic Similarity Check

When a user selects a specific phrase like "how to introduce yourself on youtube":

1. **Pull Top 10 autocomplete** for that exact phrase
2. **Analyze semantic similarity:**
   - How many suggestions are just rephrasing the same idea?
   - "how to introduce yourself on youtube"
   - "how to introduce myself on youtube channel"
   - "how to introduce yourself in youtube video"
   - → These are ALL the same intent!

3. **Calculate Competition Signal:**
   - 1 exact match + 9 semantic duplicates = **Low Competition, High Opportunity**
   - 1 exact match + 9 unrelated suggestions = **Phrase too specific, limited interest**

### Long-Term Views Indicator

**Criteria for "Long-Term Views Potential":**
- Strong semantic focus (80%+ similar intent)
- Moderate-to-high demand
- Learning or Problem-Solving dominant vibe
- Evergreen topic (not tied to specific year/event)

**Display:**
```
┌─────────────────────────────────────────────────┐
│  ⭐ Long-Term Views Potential                    │
│                                                 │
│  This phrase has signals for sustained traffic: │
│  • Low literal competition (1 exact match)      │
│  • High intent focus (all variations = same Q)  │
│  • Learning audience (want to understand)       │
│                                                 │
│  Videos on this topic can generate views        │
│  day after day, month after month.              │
└─────────────────────────────────────────────────┘
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `/src/lib/viewer-demand.ts` | 900+ signal words, scoring logic |
| `/src/lib/seed-signal.ts` | Basic signal calculation |
| `/src/app/api/seed-signal/route.ts` | API endpoint |
| `/src/components/ui/SeedSignalIndicator.tsx` | Current simple indicator |
| `/src/components/ui/ViewerLandscapeModal.tsx` | **NEW** - Full analysis modal |
| `/docs/viewer-landscape-analysis.md` | This documentation |

---

## Implementation Phases

### Phase 1: Core Modal (Now)
- [ ] Create `ViewerLandscapeModal.tsx`
- [ ] Display Demand Level (8 tiers)
- [ ] Display Seed Strength with info button
- [ ] Display Viewer Vibe breakdown (bars)
- [ ] Show insight message based on dominant vibe
- [ ] Integrate on Page 1 (Target) and Page 2 (Seed)

### Phase 2: Enhanced API
- [ ] Extend `/api/seed-signal` response
- [ ] Add vibe distribution calculation
- [ ] Add insight message generation

### Phase 3: Page 4 Competition Analysis (Future)
- [ ] Semantic similarity detection
- [ ] Long-Term Views indicator
- [ ] Competition signal calculation

---

## Example Analyses

### Example 1: "youtube algorithm"

```
Demand Level: Extreme Demand (10 suggestions)
Seed Strength: Strong (9/10 exact match)
Viewer Vibe:
  - 😤 Frustrated: 40%
  - 🎓 Learning: 35%  
  - 🔧 Problem: 15%
  - ⏰ Current: 10%

Insight: "Many viewers are frustrated with this topic. 
Consider an empathetic angle that acknowledges their 
challenges before offering solutions."
```

### Example 2: "thumbnail contrast"

```
Demand Level: Low Demand (3 suggestions)
Seed Strength: Weak (1/3 exact match)
Viewer Vibe:
  - 🎓 Learning: 60%
  - 🎯 Action: 40%

Insight: "Limited search activity. Viewers who do 
search are eager to learn — but consider a broader 
angle to reach more people."
```

### Example 3: "legacy planning"

```
Demand Level: Solid Demand (5 suggestions)
Seed Strength: Weak (1/5 exact match)
Viewer Vibe:
  - 🏢 Brand/Company: 60% (law group, insurance)
  - 🎓 Learning: 25%
  - 🤔 Curious: 15%

Insight: "⚠️ Most results are businesses, not viewers.
Consider 'estate planning' or 'financial legacy' 
for better viewer reach."
```

### Example 4: "how to introduce yourself on youtube" (Long Phrase)

```
Demand Level: High Demand (10 suggestions)
Seed Strength: Low literal (1/10 exact)
              BUT High semantic (10/10 same intent)
Viewer Vibe:
  - 🎓 Learning: 80%
  - 🎯 Action: 20%

Insight: "Strong opportunity! All viewers want the 
same answer — just phrased differently. Low 
competition, high Long-Term Views potential."
```

---

## Design Notes

### Brand Colors
- Use `#6B9BD1` (Electric Blue) for highlights, not purple/gray
- Use `#2BD899` (Green) for positive signals
- Use `#F59E0B` (Orange) for warnings
- Dark backgrounds: `#1A1D24`, `#0F1117`

### UX Principles
- **Scannable** — Users should understand in 2 seconds
- **Informative, not blocking** — We inform, never prevent
- **Empathetic messaging** — Acknowledge challenges, offer perspective
- **Progressive disclosure** — Simple view + detail button for more

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-02 | Initial documentation |
