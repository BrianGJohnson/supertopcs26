---
description: Standard member page template structure and design rules
---

# Member Page Template

Use this template for ALL pages under `/members/build/*` to ensure visual continuity.

---

## Page Structure (REQUIRED)

Every member page MUST follow this exact structure:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { Icon[YourIcon] } from "@tabler/icons-react";

export function YourPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const topicId = searchParams.get("topic_id");

  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        
        <HeroModule
          icon={Icon[YourIcon]}
          line1="Your First Line Here"      // 3-4 words
          line2="Second Line"                // 2-3 words
          description="Single sentence description of what this page does."
        />
        
        <BuilderStepper activeStep={2} />  // 1=Target, 2=Seed, 3=Refine, 4=Super, 5=Title, 6=Blueprint
        
        {/* YOUR PAGE CONTENT HERE */}
        
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

## Text Size Standards (CRITICAL)

**NEVER use text smaller than `text-sm` (14px).**

| Use Case | Class | Pixels | Opacity |
|----------|-------|--------|---------|
| Hero description | `text-[1.5rem]` | 24px | `text-white/80` |
| Section headings | `text-xl` | 20px | `text-white/90` |
| Body text (standard) | `text-base` | 16px | `text-white/75` or `text-white/80` |
| Body text (minimum) | `text-sm` | 14px | `text-white/70` |
| Labels/helper text | `text-sm` | 14px | `text-white/60` |
| Muted text | `text-sm` | 14px | `text-white/50` |

**Opacity Rule:** For white text on dark inky blue background (#0B1220), use **80% opacity** (`text-white/80`) for most body text. 100% hurts the eyes.

---

## Max Width Standards

| Section | Max Width | Class |
|---------|-----------|-------|
| Main content container | 1024px | `max-w-5xl` |
| Hero section | 896px | `max-w-4xl` |
| Wide content (title page) | 1152px | `max-w-6xl` |
| Narrow content (forms) | 768px | `max-w-3xl` |

---

## Spacing Standards

| Element | Gap/Margin | Class |
|---------|------------|-------|
| Main sections | 48px | `gap-12` |
| Card spacing | 16px | `gap-4` |
| Button groups | 16px | `gap-4` |
| Inline elements | 12px | `gap-3` |

---

## Button Styling

**ALWAYS use glass-card buttons.** Refer to `/button-styling` workflow for full details.

### Quick Reference:

**Purple (AI/Premium):**
```tsx
className="px-6 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 border-2 bg-gradient-to-b from-[#7A5CFA]/15 to-[#6548E5]/15 hover:from-[#7A5CFA]/20 hover:to-[#6548E5]/20 text-[#C3B6EB] border-[#7A5CFA]/40 shadow-[0_0_10px_rgba(122,92,250,0.1)] hover:shadow-[0_0_12px_rgba(122,92,250,0.15)]"
```

**Green (Primary/Success):**
```tsx
className="px-6 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 border-2 bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 hover:from-[#2BD899]/20 hover:to-[#25C78A]/20 text-[#4AE8B0] border-[#2BD899]/40 shadow-[0_0_8px_rgba(43,216,153,0.08)] hover:shadow-[0_0_10px_rgba(43,216,153,0.12)]"
```

**Blue (Secondary):**
```tsx
className="px-6 py-4 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2 border-2 bg-gradient-to-b from-[#5AACFF]/15 to-[#4A9CFF]/15 hover:from-[#5AACFF]/20 hover:to-[#4A9CFF]/20 text-[#A0DCFF] border-[#5AACFF]/40 shadow-[0_0_8px_rgba(90,172,255,0.08)] hover:shadow-[0_0_10px_rgba(90,172,255,0.12)]"
```

---

## Card Styling

Standard glass-card pattern for content containers:

```tsx
className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
```

For interactive cards (clickable):
```tsx
className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/25 hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all cursor-pointer"
```

---

## Loading States

```tsx
{isLoading && (
  <div className="bg-surface/40 backdrop-blur-md border border-white/10 rounded-2xl p-16 text-center">
    <div className="flex flex-col items-center gap-6">
      <IconLoader2 className="w-12 h-12 text-primary animate-spin" />
      <div>
        <p className="text-white/75 text-xl font-medium">
          Loading...
        </p>
        <p className="text-white/50 text-base mt-2">
          Please wait
        </p>
      </div>
    </div>
  </div>
)}
```

---

## Error States

```tsx
{error && (
  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-12 text-center">
    <p className="text-red-400 text-lg">Something went wrong</p>
    <p className="text-white/50 text-sm mt-2">{error}</p>
    <button
      onClick={handleRetry}
      className="mt-6 px-6 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
    >
      Try Again
    </button>
  </div>
)}
```

---

## Empty States

```tsx
{items.length === 0 && (
  <div className="bg-surface/40 border border-white/10 rounded-2xl p-12 text-center">
    <p className="text-white/60 text-lg">No items found.</p>
  </div>
)}
```

---

## Section Separators

Use subtle gradient dividers between major sections:

```tsx
<div className="w-full max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
```

---

## HeroModule Props

```tsx
<HeroModule
  icon={IconYourIcon}           // Tabler icon component
  line1="First Line Text"       // 3-4 words, white text
  line2="Second Line"           // 2-3 words, gradient text
  description="Single sentence description of what this page does for the user."
/>
```

**Rules:**
- Total headline: 6-7 words
- Line 1: 3-4 words (white)
- Line 2: 2-3 words (gradient purple-to-accent)
- Description: Single sentence, 24px, 80% opacity

---

## BuilderStepper Steps

| Step | Page | Route |
|------|------|-------|
| 1 | Target | `/members/build/target` |
| 2 | Seed | `/members/build/seed` |
| 3 | Refine | `/members/build/refine` |
| 4 | Super Topics | `/members/build/super` |
| 5 | Title | `/members/build/title` |
| 6 | Blueprint | `/members/build/blueprint` |

---

## Common Patterns

### Toolbar Pattern (Refine page style)
```tsx
<div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
  {/* Left side: filters/options */}
  <div className="flex items-center gap-3">
    <button className="h-[52px] px-6 rounded-xl text-base font-semibold bg-[#39C7D8]/15 border border-[#39C7D8]/40 text-[#39C7D8]">
      Filter
    </button>
  </div>
  
  {/* Right side: actions */}
  <div className="flex items-center gap-3">
    <button className="h-[52px] px-6 rounded-xl text-base font-semibold bg-gradient-to-b from-[#2BD899]/15 to-[#25C78A]/15 text-[#4AE8B0] border-2 border-[#2BD899]/40">
      Action
    </button>
  </div>
</div>
```

### Modal Pattern
```tsx
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-[#0B1220] border border-white/20 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
      {/* Modal content */}
    </div>
  </div>
)}
```

---

## CRITICAL REMINDERS

1. **Text Opacity:** Always use `text-white/80` for body text on dark backgrounds
2. **Minimum Text Size:** Never go below `text-sm` (14px)
3. **Button Style:** Always use glass-card buttons (never solid fills)
4. **Max Width:** Use `max-w-5xl` for main content containers
5. **Spacing:** Use `gap-12` between major sections
6. **Hero Module:** Always include on member pages
7. **Ambient Glow:** Always include the background glow div
8. **Footer:** Always include the standard footer
9. **No AI Stock Images:** NEVER use generic AI-generated stock images, placeholder images, or "AI ask" style generated visuals. All imagery should be authentic, branded, and intentional. If an image is needed, use real screenshots, custom icons, or actual product visuals only.

---

## Example: Minimal Blueprint Page

```tsx
"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { MemberHeader } from "@/components/layout/MemberHeader";
import { HeroModule } from "@/components/layout/HeroModule";
import { BuilderStepper } from "@/components/stepper/BuilderStepper";
import { IconWand } from "@tabler/icons-react";

export function BlueprintPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const topicId = searchParams.get("topic_id");

  return (
    <PageShell>
      <div className="flex flex-col gap-12 relative z-10 max-w-5xl mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

        <MemberHeader />
        
        <HeroModule
          icon={IconWand}
          line1="Create Your Perfect"
          line2="Thumbnail Blueprint"
          description="Generate AI-powered thumbnail concepts and prompts that stop the scroll."
        />
        
        <BuilderStepper activeStep={6} />
        
        {/* YOUR CONTENT HERE */}
        <div className="space-y-8">
          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10">
            <h2 className="text-xl font-bold text-white/90 mb-4">Step 1: Choose Concept Count</h2>
            <p className="text-base text-white/75">
              Select how many visual concepts you'd like to generate.
            </p>
          </div>
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

**When in doubt, study the existing pages:**
- `/members/build/seed/page.tsx` - Clean structure
- `/members/build/title/_components/TitlePageContent.tsx` - Complex interactions
- `/members/build/refine/_components/RefinePageContent.tsx` - Toolbar patterns
