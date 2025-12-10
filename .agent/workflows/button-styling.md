---
description: Premium glass-card button styling rules for SuperTopics
---

# Button Styling Rules

## ⚠️ CRITICAL: Always Use Glass-Card Style

**Never use solid-fill buttons with white text.** They look flat and generic.

---

## Typography Standards (from Brand Guide)

### Font Family
- **Primary:** System default / Inter (if loaded)
- **Weights:** `font-medium` for body, `font-bold` for buttons/headings

### Text Sizes
| Use Case | Class | Pixels |
|----------|-------|--------|
| Body text minimum | `text-sm` | 14px |
| Standard body | `text-base` | 16px |
| Button text (medium) | `text-lg` | 18px |
| Button text (large CTA) | `text-xl` | 20px |
| Card headings | `text-xl` | 20px |
| Hero descriptions | `text-[1.5rem]` | 24px |

### Text Opacities
```
Hero headlines:   text-white (100%) — main page titles only
Card headings:    text-white/90 (90%) — softer, easier on eyes
Body text:        text-white/70
Secondary text:   text-white/60
Muted/helper:     text-white/50
Subtle/disabled:  text-white/40
```

---

## The Glass-Card Button Pattern

Every button must have:
1. **Semi-transparent gradient background**: `from-[color]/15 to-[color]/15`
2. **Colored border**: `border-2 border-[color]/40`
3. **Outer glow shadow**: `shadow-[0_0_10px_rgba(r,g,b,0.1)]`
4. **Hover effect**: Increased opacity on background + stronger glow

---

## ✅ FINALIZED Button Color System (December 2024)

These 4 button colors are the **official SuperTopics button palette**. Use these exact values across ALL pages.

### 1. PURPLE — AI/Premium Actions
**Use for:** Fast-Track, Jump to Title, AI-powered features, premium actions

| Property | Value |
|----------|-------|
| Base Hex | `#7A5CFA` |
| **Text Hex** | `#C3B6EB` |
| Border | `border-2 border-[#7A5CFA]/40` |
| Background | `bg-gradient-to-b from-[#7A5CFA]/15 to-[#6548E5]/15` |
| Hover BG | `hover:from-[#7A5CFA]/20 hover:to-[#6548E5]/20` |
| Shadow | `shadow-[0_0_10px_rgba(122,92,250,0.1)]` |
| Hover Shadow | `hover:shadow-[0_0_12px_rgba(122,92,250,0.15)]` |

**Full class (Large CTA):**
```
w-full px-6 py-5 font-bold text-xl rounded-xl transition-all flex items-center justify-center gap-3 border-2 bg-gradient-to-b from-[#7A5CFA]/15 to-[#6548E5]/15 hover:from-[#7A5CFA]/20 hover:to-[#6548E5]/20 text-[#C3B6EB] border-[#7A5CFA]/40 shadow-[0_0_10px_rgba(122,92,250,0.1)] hover:shadow-[0_0_12px_rgba(122,92,250,0.15)]
```

---

### 2. GREEN — Primary/Success Actions
**Use for:** Expand Topic, Continue, → Super Topics, success confirmations

| Property | Value |
|----------|-------|
| Base Hex | `#2BD899` |
| **Text Hex** | `#4AE8B0` |
| Border | `border-2 border-[#2BD899]/40` |
| Background | `bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15` |
| Hover BG | `hover:from-[#2BD899]/20 hover:to-[#25C78A]/20` |
| Shadow | `shadow-[0_0_8px_rgba(43,216,153,0.08)]` |
| Hover Shadow | `hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]` |

**Full class (Medium):**
```
flex-1 px-6 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 border-2 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] border-[#2BD899]/40 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]
```

---

### 3. BLUE — Secondary Actions
**Use for:** New Phrase, alternate options, secondary choices

| Property | Value |
|----------|-------|
| Base Hex | `#5AACFF` |
| **Text Hex** | `#A0DCFF` |
| Border | `border-2 border-[#5AACFF]/40` |
| Background | `bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15` |
| Hover BG | `hover:from-[#5AACFF]/20 hover:to-[#4A9CFF]/20` |
| Shadow | `shadow-[0_0_8px_rgba(90,172,255,0.08)]` |
| Hover Shadow | `hover:shadow-[0_0_10px_rgba(90,172,255,0.12)]` |

**Full class (Medium):**
```
flex-1 px-6 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 border-2 bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15 hover:from-[#5AACFF]/20 hover:to-[#4A9CFF]/20 text-[#A0DCFF] border-[#5AACFF]/40 shadow-[0_0_8px_rgba(90,172,255,0.08)] hover:shadow-[0_0_10px_rgba(90,172,255,0.12)]
```

---

### 4. ORANGE — Warning/Attention States
**Use for:** "Deselect X to proceed", limits exceeded, validation warnings

| Property | Value |
|----------|-------|
| Base Hex | `#F59E0B` |
| **Text Hex** | `#F59E0B` |
| Border | `border border-[#F59E0B]/40` |
| Background | `bg-[#F59E0B]/15` |
| Hover BG | `hover:bg-[#F59E0B]/25` |

**Full class (Toolbar):**
```
h-[52px] flex items-center gap-2 px-6 rounded-xl text-base font-semibold whitespace-nowrap bg-[#F59E0B]/15 border border-[#F59E0B]/40 text-[#F59E0B]
```

---

### 5. CYAN — Auto-Pick/Personalization (Bonus)
**Use for:** Auto-Pick actions, customization features

| Property | Value |
|----------|-------|
| Base Hex | `#39C7D8` |
| **Text Hex** | `#39C7D8` |
| Border | `border border-[#39C7D8]/40` |
| Background | `bg-[#39C7D8]/15` |
| Hover BG | `hover:bg-[#39C7D8]/25 hover:border-[#39C7D8]/60` |

**Full class (Toolbar):**
```
h-[52px] flex items-center gap-2 px-6 rounded-xl text-base font-semibold whitespace-nowrap bg-[#39C7D8]/15 border border-[#39C7D8]/40 text-[#39C7D8] hover:bg-[#39C7D8]/25 hover:border-[#39C7D8]/60 transition-all
```

---

## Button Sizing

| Size | Padding | Font | Icon Size | Use Case |
|------|---------|------|-----------|----------|
| Small | `px-4 py-2` | `text-sm` (14px) | 16px | Inline/compact actions |
| Medium | `px-6 py-4` | `text-lg` (18px) | 22px | Standard buttons |
| Large | `px-6 py-5` | `text-xl` (20px) | 24px | Hero CTAs |
| Toolbar | `h-[52px] px-6` | `text-base` (16px) | 16-20px | Fixed-height toolbars |

---

## Disabled State Pattern
```
bg-[color]/10 border-[color]/20 text-[TextColor]/50 cursor-not-allowed
```

Example (Purple disabled):
```
bg-[#7A5CFA]/10 border-[#7A5CFA]/20 text-[#C3B6EB]/50 cursor-not-allowed
```

---

## Loading State Pattern
- Add `cursor-wait`
- Use `<IconLoader2 className="animate-spin" />`
- Keep the structure, just reduce text opacity to `/50`

---

## Button Group Layout

```tsx
{/* Stacked: Primary full-width, secondary row below */}
<div className="flex flex-col gap-4">
  <button className="w-full ...purple-glass-styles...">
    Primary Action
  </button>
  <div className="flex gap-4">
    <button className="flex-1 ...green-glass-styles...">
      Secondary A
    </button>
    <button className="flex-1 ...blue-glass-styles...">
      Secondary B
    </button>
  </div>
</div>
```

---

## Quick Reference: When to Use Each Color

| Color | Semantic Meaning | Examples |
|-------|------------------|----------|
| **Purple** | AI/Magic/Premium | **STRICT USE:** Only for AI generation buttons. Do NOT use for inputs or data displays. |
| **Green** | Primary/Go/Success | Expand Topic, Continue, → Super Topics |
| **Blue** | Secondary/Neutral/Data | New Phrase, Search Inputs, Data Displays, alternative options |
| **Orange** | Warning/Attention | Deselect to proceed, limits, validations |
| **Cyan** | Auto/Smart/Personalize | Auto-Pick, smart selections |

---

## Brand Background Colors (for reference)

```
Background (page):  #0B1220 (dark navy)
Surface (cards):    #1A1E24
Active state:       #1A2754 (midnight blue)
```
