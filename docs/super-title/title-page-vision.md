# Blueprint Lab — Master Vision

> From tool to weapon. The cockpit for crafting the highest-CTR title + thumbnail combo.

---

## The Experience

### Stage 1: Title Selection

User lands on page with their keyword phrase. GPT has generated 15 titles.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔒 LOCKED PHRASE                                               │
│  "How To Beat YouTube Algorithm"                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🏆 TOP PICK                                            [52ch]  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ How To Beat The YouTube Algorithm (What Actually Works)   ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  RUNNER-UPS                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
│  │ Beat YouTube's   │ │ How To Beat The  │ │ YouTube Algorithm││
│  │ Algorithm: The   │ │ Algorithm Step   │ │ Secrets: How To  ││
│  │ Simple Truth     │ │ by Step          │ │ Beat It          ││
│  └──────────────────┘ └──────────────────┘ └──────────────────┘│
│                                                                 │
│  [Show 11 More Alternatives ↓]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

User clicks a title → **Page morphs into Stage 2.**

---

### Stage 2: The Cockpit

Page transforms. The selected title is locked. Now they're in the cockpit.

**The Big Visual:**
- Giant mock thumbnail (16:9 ratio)
- Color based on PRIMARY EMOTION from phrase analysis
- Title displayed below like YouTube watch page

**Emotion → Color Mapping:**

| Emotion | Color | Gradient |
|---------|-------|----------|
| Curiosity | Blue | `from-[#1e3a5f] to-[#0a1929]` |
| Hope | Green | `from-[#1a4d2e] to-[#0d2818]` |
| Fear | Red | `from-[#5f1e1e] to-[#290a0a]` |
| Frustration | Orange | `from-[#5f3d1e] to-[#291a0a]` |
| FOMO | Purple | `from-[#3d1e5f] to-[#1a0a29]` |
| Validation | Gold | `from-[#5f4d1e] to-[#29210a]` |
| Excitement | Pink | `from-[#5f1e4d] to-[#290a21]` |
| Relief | Teal | `from-[#1e5f5f] to-[#0a2929]` |

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  THE COCKPIT                                                    │
│  ═══════════                                                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                    [GRADIENT BACKGROUND]                  │ │
│  │                     based on emotion                      │ │
│  │                                                           │ │
│  │             ┌─────────────────────────┐                   │ │
│  │             │     "THE TRUTH"         │ ← clickable phrase│ │
│  │             └─────────────────────────┘                   │ │
│  │                                                           │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  "How To Beat The YouTube Algorithm (What Actually Works)"      │
│  ───────────────────────────────────────────────────────────── │
│  52 chars • Curiosity • Recommended Mode                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  THUMBNAIL PHRASES                                              │
│  ─────────────────                                              │
│                                                                 │
│  Click to preview on thumbnail:                                 │
│                                                                 │
│  Compelling:                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │THE TRUTH│ │ FINALLY │ │ IT WORKS│ │ PROVEN  │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│    ↑ active                                                    │
│                                                                 │
│  Wild Cards:                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                          │
│  │GAME OVER│ │CRACKED IT│ │ SHOOK  │                          │
│  └─────────┘ └─────────┘ └─────────┘                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOOLS                                                          │
│  ─────                                                          │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ 🔍 Search     │  │ 🔄 More       │  │ ✏️ Refine     │       │
│  │    Titles     │  │    Titles     │  │    Direction  │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ┌──────────────────────────────────────────────────────┐   │
│     │ ✅ Lock Blueprint → Create Thumbnail                 │   │
│     └──────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │ ← Change Title                                             ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Interactive Phrase Clicking

User clicks a phrase → It appears on the mock thumbnail instantly.

**The feedback loop:**
1. See phrase in list
2. Click it
3. See it on the thumbnail preview
4. Decide if it works
5. Click another to compare
6. Pick the winner

This is tactile. This is fun. This is how you make decisions.

---

## The Morph Effect

When user selects a title:

1. Title selection cards fade/shrink
2. Selected title moves to center-bottom (like YouTube title position)
3. Mock thumbnail expands from above
4. Phrase options appear below
5. Tools section slides in

**CSS transition:** 300-500ms, smooth ease-out. Feels intentional.

---

## GPT Prompt Rules (Title Generation)

### Core Rules:
1. **Keyword phrase must appear** — core words, same order
2. **Never replace the main verb** — "beat" stays "beat"
3. **Add words, don't substitute**
4. **Length: 45-52 chars** for Recommended mode
5. **No year tags** unless Search mode

### What We Send:
```
KEYWORD PHRASE: "How To Beat YouTube Algorithm"

PRIMARY EMOTION: Curiosity (from Page 4 analysis)
VIEWER GOAL: Learn
FORMAT: Tutorial

RULES:
- The phrase "beat YouTube algorithm" MUST appear in every title
- You may add articles (the, a), timeframes, or qualifiers
- NEVER replace "beat" with synonyms like "master", "crack", "dominate"
- Target length: 45-52 characters
- Make it compelling — this is about CTR, not just SEO
```

---

## GPT Prompt Rules (Thumbnail Phrases)

### Two-Pass System:

**Pass 1: Creative (High Temp)**
```
Model: gpt-4o-mini
Temperature: 1.2
Max Tokens: 500

Generate 15-20 short thumbnail phrases (1-4 words) for this video:
Title: "How To Beat The YouTube Algorithm (What Actually Works)"
Emotion: Curiosity
Goal: Learn

Rules:
- ALL CAPS or Title Case
- Punchy, attention-grabbing
- Can use synonyms (different from title)
- Should COMPLEMENT the title, not repeat it
- Mix of safe/proven and wild/risky
```

**Pass 2: Filter (Cheap)**
```
Model: gpt-5-mini
Reasoning: minimal
Max Tokens: 200

Pick the 8 best phrases from this list.
Split into:
- "Compelling" (4): Will definitely drive clicks
- "Wild Cards" (4): Risky but could work big
```

---

## Cost Breakdown

| Component | Model | Est. Cost |
|-----------|-------|-----------|
| Title generation (15) | gpt-4o-mini | ~1.5¢ |
| Thumbnail phrases (creative) | gpt-4o-mini temp 1.2 | ~0.5¢ |
| Thumbnail phrases (filter) | gpt-5-mini minimal | ~0.2¢ |
| Search titles (optional) | gpt-5-mini | ~0.5¢ |
| More titles (optional) | gpt-4o-mini | ~0.5¢ |
| **Typical run** | | **~2.2¢** |
| **Everything** | | **~3.2¢** |

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `/api/titles/generate/route.ts` | Update prompt with new rules |
| `/api/titles/thumbnail-phrases/route.ts` | NEW: Two-pass phrase generation |
| `/members/build/title/_components/TitlePageContent.tsx` | Rebuild with cockpit design |
| `/members/build/title/_components/ThumbnailPreview.tsx` | NEW: Mock thumbnail with emotion colors |
| `/members/build/title/_components/PhraseSelector.tsx` | NEW: Clickable phrase pills |

---

## What User Walks Away With

1. **Locked Title** — 45-60 chars, keyword preserved
2. **Selected Phrases** — 1-3 phrases for thumbnail
3. **Thumbnail Direction** — Emotion, color, vibe
4. **Ready for Creation** — Next page turns blueprint into reality

---

*Last Updated: December 9, 2025*
