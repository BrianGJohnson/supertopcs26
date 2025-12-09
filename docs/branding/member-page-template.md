# Member Page Template Guide

## Overview

All member-area pages follow a consistent template structure to create a cohesive, professional experience across SuperTopics.

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        MemberHeader                             │
│                    (Logo + Navigation)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                         HeroModule                              │
│                                                                 │
│                      [100px Icon]                               │
│                                                                 │
│              Line 1: 3-4 words (white)                          │
│              Line 2: 2-3 words (gradient)                       │
│                                                                 │
│              Single sentence description                        │
│                                                                 │
│              ─────────── divider ───────────                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      Page Content                               │
│                  (Cards, Forms, Tables)                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                         Footer                                  │
│         SuperTopics.app © 2025 • All Rights Reserved            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Required Components

### 1. PageShell
The outer wrapper providing consistent background and padding.

```tsx
import { PageShell } from "@/components/layout/PageShell";

<PageShell>
  {/* Page content */}
</PageShell>
```

### 2. MemberHeader
Logo and navigation at the top of every member page.

```tsx
import { MemberHeader } from "@/components/layout/MemberHeader";

<MemberHeader />
```

### 3. HeroModule
The hero section with icon, headline, and description.

```tsx
import { HeroModule } from "@/components/layout/HeroModule";
import { IconSeedling } from "@tabler/icons-react";

<HeroModule
  icon={IconSeedling}
  line1="Create Your Next Winning"
  line2="Video Package"
  description="Enter your topic and click Expand to discover what viewers want to watch."
/>
```

---

## HeroModule Headline Rules

### Word Counts (STRICT)
| Line | Words | Style |
|------|-------|-------|
| Line 1 | 3-4 words | White text |
| Line 2 | 2-3 words | Gradient text (purple → teal) |
| **Total** | **6-7 words** | Always two lines |

### Examples

✅ **Good Headlines:**
```
"Create Your Next Winning"     (4 words)
"Video Package"                (2 words)
Total: 6 words ✓

"Build Your Perfect"           (3 words)
"Content Strategy"             (2 words)
Total: 5 words ✗ (too few)

"Welcome to Your"              (3 words)
"Content Strategy"             (2 words)
Total: 5 words ✗ (close, but try for 6-7)
```

✅ **Better:**
```
"Welcome to Your Personal"     (4 words)
"Content Strategy"             (2 words)
Total: 6 words ✓
```

### Dev Warning
In development mode, HeroModule will console.warn if word counts are off:
```
HeroModule: line1 should have 3-4 words, got 2
HeroModule: total headline should have 6-7 words, got 5
```

---

## Content Width

All member pages use a consistent max-width container:

```tsx
<div className="max-w-5xl mx-auto">
  {/* Standard width for all member pages */}
</div>
```

**Note**: Always use `max-w-5xl` for consistency across all member pages.

---

## Ambient Background Glow

Add a subtle glow behind content for depth:

```tsx
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />
```

---

## Standard Footer

```tsx
<footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
  SuperTopics.app © 2025 • All Rights Reserved • You Dig?
</footer>
```

---

## Color Palette

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-background` | `#0B1220` | Page background |
| `--color-surface` | `#161c27` | Card backgrounds |
| `--color-primary` | `#7A5CFA` | Primary accent (purple) |
| `--color-accent` | `#3CCFB1` | Secondary accent (teal) |
| `--color-text-primary` | `#E7ECF5` | Main text |
| `--color-text-secondary` | `#A6B0C2` | Muted text |

### Button Colors
| Type | Color | Usage |
|------|-------|-------|
| Primary Action | `#2BD899` (green) | Main CTAs |
| Secondary | `bg-white/5` | Back buttons, cancel |
| Destructive | `#D95555` (red) | Delete, danger |

---

## Icon Selection

Use [Tabler Icons](https://tabler-icons.io/) for consistency.

### Common Page Icons
| Page | Icon | Import |
|------|------|--------|
| Seed (Page 1) | 🌱 | `IconSeedling` |
| Refine (Page 2) | ✨ | `IconSparkles` |
| Package (Page 3) | 📦 | `IconPackage` |
| Title (Page 4) | 🎯 | `IconTarget` |
| Upload (Page 5) | 🚀 | `IconRocket` |
| Onboarding | 🚀 | `IconRocket` |
| Dashboard | 📊 | `IconChartBar` |
| Account | 👤 | `IconUser` |

---

## Complete Page Template

```tsx
"use client";

import React from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { IconSeedling } from "@tabler/icons-react";

export default function ExamplePage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Header */}
        <MemberHeader />

        {/* Hero */}
        <HeroModule
          icon={IconSeedling}
          line1="Your Three to Four"
          line2="Word Headline"
          description="A single sentence that explains what this page does and why it matters to the user."
        />

        {/* Page Content */}
        <div className="space-y-8">
          {/* Your cards, forms, tables go here */}
        </div>

        {/* Footer */}
        <footer className="text-center text-[15px] text-white/[0.49] font-normal leading-snug tracking-wide border-b border-white/[0.07] pt-4 pb-5 -mt-4 -mb-5">
          SuperTopics.app © 2025 • All Rights Reserved • You Dig?
        </footer>
      </div>
    </PageShell>
  );
}
```

---

## Checklist for New Member Pages

- [ ] Uses `PageShell` wrapper
- [ ] Includes `MemberHeader` at top
- [ ] Has `HeroModule` with valid headline (6-7 words total)
- [ ] Icon selected from Tabler Icons
- [ ] Content within `max-w-5xl` or `max-w-3xl` container
- [ ] Ambient glow added for depth
- [ ] Footer included at bottom
- [ ] Follows color palette
- [ ] No dev warnings in console for word counts

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-30 | Initial template guide |
