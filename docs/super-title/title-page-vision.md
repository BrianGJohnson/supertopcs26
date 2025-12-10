# Title Page — Implementation Status

> From tool to weapon. The cockpit for crafting the highest-CTR title + thumbnail combo.

---

## ✅ IMPLEMENTED (December 9, 2025)

### Current State

The Title page (`/members/build/title`) is now fully functional with a premium "cockpit" experience for title and thumbnail phrase selection.

---

## UI Components

### Hero Section
- **Top Pick Badge** — Yellow pill with trophy icon, centered above thumbnail
- **Thumbnail Preview** — Large 16:9 aspect ratio with emotion-based styling
- **Title Display** — Selected title shown below thumbnail with character count badge

### Thumbnail Styling (COMPLETED)
The thumbnail uses a dark glass + glowing border effect based on the primary emotion:

```css
/* Dark center with emotion-colored edges */
background: radial-gradient(ellipse at center, #0a0a0f 0%, {emotion.from}80 80%, {emotion.from} 100%);

/* Glowing emotion-colored border */  
border: 2px solid {emotion.accent};
box-shadow: 0 0 40px {accent}40, 0 0 80px {accent}20, inset 0 0 80px {accent}25;

/* Overall opacity for subtle blend */
opacity: 0.65;
```

**Emotion → Color Mapping** (stored in EMOTION_GRADIENTS):

| Emotion | From | To | Accent |
|---------|------|-----|--------|
| Curiosity | `#1e3a5f` | `#0a1929` | `#60a5fa` (blue) |
| Hope | `#1a4d2e` | `#0d2818` | `#4ade80` (green) |
| Fear | `#5f1e1e` | `#290a0a` | `#f87171` (red) |
| Frustration | `#5f3d1e` | `#291a0a` | `#fb923c` (orange) |
| FOMO | `#3d1e5f` | `#1a0a29` | `#c084fc` (purple) |
| Validation | `#5f4d1e` | `#29210a` | `#fbbf24` (amber) |
| Excitement | `#5f1e4d` | `#290a21` | `#f472b6` (pink) |
| Relief | `#1e5f5f` | `#0a2929` | `#2dd4bf` (teal) |

### Phrase Display
- **4 phrases at a time** — Top picks from the judge
- **Clickable pills** — Click to preview on thumbnail
- **Selected state** — Green border with checkmark

### Action Buttons (Unified Styling)
All buttons use the same amber/gold glowing glass style from Page 3:

```css
h-[52px] min-w-[160px] px-6 rounded-xl
bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B]
hover:bg-[#F59E0B]/25 hover:border-[#F59E0B]/60
```

**Buttons:**
1. **Balanced** (dropdown) — Optimization mode selector
2. **Generate Phrases** — Triggers two-pass API (costs ~1¢)
3. **Refresh** — Cycles through 12 top picks, 4 at a time (FREE)
4. **Mad Scientist** — Reveals 18 wild card phrases (FREE)
5. **Lock & Continue** — Saves and navigates to Package page

### Runner-Ups Section
- 3-column grid of alternative titles
- Character count badge per title
- "Swap to Top" button to promote a runner-up

### Alternatives Section
- Collapsible section with remaining titles
- Click to swap to top

---

## Ruthless Phrase Generation API

**Endpoint:** `/api/titles/thumbnail-phrases`

### Two-Pass System

**Pass 1: Creative Generation**
```typescript
Model: gpt-4o (full model for cultural knowledge)
Temperature: 1.2 (pushed high for wild ideas)
Output: 30 raw phrases
```

**Pass 2: Judge & Filter**
```typescript
Model: gpt-4o-mini
Temperature: 0.3 (low for consistent picking)  
Output: Top 12 ranked phrases
```

### Ruthless Prompt (Creative Pass)

The prompt instructs GPT to be a "ruthless YouTube packaging strategist" with:

**Banned Words:** `unlocked, unleashed, ultimate, guide, secrets, proven, simple, easy, powerful, amazing, incredible, hidden, transformative`

**Format Rules:**
- Max 4 words
- Fragments over sentences
- ALL CAPS
- No punctuation except `?`

**Tone Mix:**
- 50% Negative/Warning (fear, urgency)
- 50% Specific Gain/Numbers

**Psychological Triggers:**
- Curiosity Gap
- FOMO
- Fear of Loss
- Urgency
- Validation Seeking
- Controversy

### API Response Format
```typescript
{
  success: true,
  topPicks: string[],    // Best 12 phrases, ranked
  wildCards: string[],   // Remaining ~18 "mad scientist" phrases
  rawCount: number,      // Total generated (30)
  stats: {
    durationMs: number,
    tokens: number,
    costCents: string,
    model: string,
    temperature: number
  }
}
```

### Cost Breakdown
- **Pass 1** (gpt-4o @ 1.2 temp): ~0.5-0.7¢
- **Pass 2** (gpt-4o-mini @ 0.3 temp): ~0.05¢
- **Total per generation**: ~0.6-0.8¢

---

## User Flow

1. **Page loads** → Titles generated automatically (or loaded from DB)
2. **Top Pick displayed** → Winner title shown in hero section
3. **Click Generate Phrases** → Two-pass API generates 30 phrases
4. **Judge picks 12** → First 4 shown as clickable pills
5. **Click Refresh (FREE)** → Cycle to next 4 from the 12
6. **Click Mad Scientist (FREE)** → See remaining 18 wild phrases
7. **Click a phrase** → Preview on thumbnail instantly
8. **Click Lock & Continue** → Save selection, navigate to Package page

---

## Files

| File | Purpose |
|------|---------|
| `/members/build/title/_components/TitlePageContent.tsx` | Main UI component (~680 lines) |
| `/api/titles/thumbnail-phrases/route.ts` | Two-pass phrase generation API |
| `/api/titles/generate/route.ts` | Title generation API |
| `/api/titles/lock/route.ts` | Lock selection API |

---

## TODO / Future Work

- [ ] Wire up optimization mode dropdown to actually affect title generation
- [ ] Add "More Titles" regeneration feature
- [ ] Consider A/B testing different temperature values (1.1-1.3)
- [ ] Track phrase selection analytics

---

*Last Updated: December 9, 2025*
