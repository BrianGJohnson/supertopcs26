# Thumbnail Blueprint Page Specification

**Route:** `/members/build/blueprint`

## Overview

The Blueprint page is a **guided wizard** that helps users create a complete thumbnail plan. The output is a "recipe" they can execute on external tools (Canva, Midjourney) OR on our future Studio page.

**Goal:** Make it dead simple. We do the hard thinking so they don't have to.

---

## User Flow

```
From Title Page (selected title + 1-3 phrases)
    ↓
Step 1: What type of thumbnail?
    ↓
Step 2: What's the vibe/style?
    ↓  
Step 3: Colors (we suggest based on emotion)
    ↓
Step 4: Your phrase placement
    ↓
Step 5: Review your Blueprint
    ↓
Generate (future) OR Export Plan
```

---

## Step 1: Thumbnail Type

**Question:** "What kind of thumbnail do you want to create?"

### Options (Card Selection)

| Type | Icon | Description | Example Use |
|------|------|-------------|-------------|
| **Graphic + Text** | 🎨 | Bold imagery with your phrase overlaid | Tech videos, explainers |
| **Face + Text** | 👤 | Your face/reaction with phrase | Vlogs, commentary |
| **Object Focus** | 📦 | Single striking object tells the story | Product reviews, reveals |
| **Pure Typography** | 🔤 | Text IS the thumbnail | Hot takes, questions |
| **Split/Comparison** | ⚡ | Before/after, vs, choices | Comparisons, debates |

**Default Selection:** Based on their video type if we know it.

---

## Step 2: Visual Style

**Question:** "What vibe should your thumbnail have?"

### Options (Pill Selection)

| Style | Description |
|-------|-------------|
| **Dramatic** | High contrast, intense, cinematic |
| **Clean & Modern** | Minimal, professional, sleek |
| **Techy** | Digital effects, circuits, futuristic |
| **Illustrated** | Slightly cartoonish, artistic |
| **Realistic** | Photo-real, natural |

**Smart Default:** Match to their channel's existing style if we can detect it.

---

## Step 3: Colors

**Question:** "We've picked colors based on your video's emotion. Adjust if you'd like."

### Auto-Suggested Palette (from emotion selected on Title page)

| Emotion | Primary | Secondary | Accent | Reasoning |
|---------|---------|-----------|--------|-----------|
| Curiosity | Deep Blue #1E3A5F | Cyan #00D9FF | White | Mystery, depth |
| Fear/FOMO | Red #CC0000 | Orange #FF6B00 | Black | Urgency, danger |
| Excitement | Yellow #FFD93D | Gold #FFC107 | Black | Energy, positivity |
| Hope | Green #2BD899 | Teal #00A896 | White | Growth, optimism |
| Anger | Dark Red #8B0000 | Black #1A1A1A | White | Intensity, power |

### User Can:
- Accept suggested palette ✓
- Swap to "Dark Mode" (inverts to dark bg + light text)
- Swap to "Light Mode" (light bg + dark text)
- Pick custom colors (advanced)

---

## Step 4: Phrase & Text Layout

**Question:** "Where should your phrase appear?"

### Show their selected phrase(s) from Title page

**Layout Options:**

| Position | Best For |
|----------|----------|
| **Top Left** | Face on right side |
| **Top Center** | Centered designs |
| **Top Right** | Face on left side |
| **Bottom Banner** | Text bar across bottom |
| **Center Large** | Typography-focused |

### Text Style Options:
- **Bold Impact** - All caps, heavy weight
- **Clean Sans** - Modern, readable
- **Handwritten** - Casual, personal

**Smart Default:** Based on thumbnail type selected in Step 1.

---

## Step 5: Blueprint Summary

**"Here's your thumbnail plan!"**

Display a visual preview card showing:

```
┌─────────────────────────────────────┐
│  [Style: Dramatic + Techy]          │
│                                     │
│  ┌───────────────────────────────┐  │
│  │     "AI IS LYING TO YOU"     │  │
│  │                               │  │
│  │    [Robot silhouette]         │  │
│  │                               │  │
│  │     🔴 Red + ⚫ Black         │  │
│  └───────────────────────────────┘  │
│                                     │
│  Type: Graphic + Text               │
│  Style: Dramatic, Techy             │
│  Colors: Red #CC0000, Black         │
│  Text: Top Center, Bold Impact      │
│                                     │
│  [📋 Copy Plan] [🎨 Generate]       │
└─────────────────────────────────────┘
```

### Actions:
1. **Copy Plan** - Exports a text prompt they can paste into Midjourney/DALL-E/Canva
2. **Generate Thumbnails** (Phase 2) - Uses our AI to create thumbnails
3. **Edit** - Go back and change any step

---

## Export: The Thumbnail Prompt

When user clicks "Copy Plan", we generate:

```
YouTube thumbnail, 16:9 aspect ratio

STYLE: Dramatic, techy, high contrast
COLORS: Primary red (#CC0000), black background, white text
COMPOSITION: Graphic + Text layout

TEXT: "AI IS LYING TO YOU" 
- Position: Top center
- Font style: Bold impact, all caps
- Color: White with subtle red glow

IMAGERY: 
- Robot or AI figure silhouette
- Tech circuit patterns in background
- Dramatic lighting from below
- Dark, ominous mood

EMOTION: Fear, urgency, revelation
```

---

## Data Passed from Title Page

```typescript
interface BlueprintInput {
  topicId: string;
  sessionId: string;
  selectedTitle: string;
  selectedPhrases: string[]; // 1-3 phrases
  emotion: string;           // Curiosity, Fear, etc.
}
```

---

## Data Saved from Blueprint

```typescript
interface ThumbnailBlueprint {
  id: string;
  topicId: string;
  
  // Step 1
  thumbnailType: 'graphic_text' | 'face_text' | 'object' | 'typography' | 'split';
  
  // Step 2
  visualStyle: 'dramatic' | 'clean' | 'techy' | 'illustrated' | 'realistic';
  
  // Step 3
  colorMode: 'auto' | 'dark' | 'light' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Step 4
  phraseToUse: string;
  textPosition: 'top_left' | 'top_center' | 'top_right' | 'bottom' | 'center';
  textStyle: 'bold_impact' | 'clean_sans' | 'handwritten';
  
  // Generated
  exportPrompt: string;
  createdAt: Date;
}
```

---

## UI Components Needed

1. **StepIndicator** - Shows progress (Step 1 of 5)
2. **TypeSelector** - Card grid for thumbnail types
3. **StylePills** - Pill selection for visual style
4. **ColorPalette** - Color swatch display with swap options
5. **LayoutPreview** - Visual preview of text positioning
6. **BlueprintSummary** - Final review card

---

## Progressive Disclosure Approach

Each step only shows after the previous is completed:
- Step 1 visible immediately
- Step 2 appears after type selected
- Step 3 appears after style selected
- etc.

This keeps the page from being overwhelming.

---

## Mobile Considerations

- Steps should stack vertically
- Cards should be full-width on mobile
- Preview should be collapsible on mobile
- "Sticky" Next/Continue button at bottom

---

## Next Steps

1. [ ] Design mockups for each step
2. [ ] Create route `/members/build/blueprint`
3. [ ] Build step components
4. [ ] Wire up data flow from Title page
5. [ ] Implement prompt export
6. [ ] Test end-to-end flow
