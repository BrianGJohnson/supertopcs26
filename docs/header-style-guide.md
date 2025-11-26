# Header Style Guide

This document explains how the header component works on the Seed page (`/members/build/seed`) and provides guidance for adjusting its elements safely.

---

## Overview

The header (AppBar) contains three main elements:

1. **Logo Icon** — A circular gradient container with an SVG eye icon.
2. **Wordmark** — The text "Super Topics" displayed next to the icon.
3. **User Navigation** — A circular avatar button showing user initials (e.g., "BJ").

The header uses a flex layout with `justify-between` to push the logo/wordmark to the left and the user navigation to the right.

---

## Header Text Size: What We Learned

### The Problem

During development, we attempted to increase the "Super Topics" wordmark size using Tailwind CSS classes:

- `text-xl` (1.25rem / 20px)
- `text-[1.4rem]` (22.4px)
- `text-[1.55rem]` (24.8px)
- `text-2xl` (1.5rem / 24px)

Despite updating the class values, the visible text size did not change as expected.

### Root Cause

The project uses **Tailwind CSS v4** with both:
- An `@theme` block in `globals.css`
- A `tailwind.config.ts` file

This dual configuration can cause inconsistencies in how arbitrary values and standard classes are compiled. Additionally, browser caching and HMR (Hot Module Replacement) may not always reflect class changes immediately.

### The Solution

To guarantee the font size is applied correctly, we now use an **inline React style prop** for the wordmark:

```tsx
<span 
  className="font-bold text-white tracking-tight" 
  style={{ fontSize: '1.501rem' }}
>
  Super Topics
</span>
```

This bypasses Tailwind's class compilation and applies the size directly to the element.

---

## How to Adjust the Wordmark Size

Follow these steps to safely change the "Super Topics" text size:

### Step 1: Locate the Component

Open the file:
```
src/app/members/build/seed/page.tsx
```

Find the `AppBar` function component. Inside, locate the `<span>` element containing "Super Topics".

### Step 2: Modify the Inline Style

Change the `fontSize` value in the `style` prop:

```tsx
// Current size
style={{ fontSize: '1.501rem' }}  // 24px

// To increase by ~10%
style={{ fontSize: '1.65rem' }}   // ~26.4px

// To decrease by ~10%
style={{ fontSize: '1.35rem' }}   // ~21.6px
```

### Step 3: Verify the Change

1. Save the file.
2. Hard refresh the browser (`Cmd + Shift + R` on macOS).
3. If the change doesn't appear, restart the dev server (`npm run dev`).

### Step 4: Do Not Use Tailwind Classes for This Element

Avoid switching back to Tailwind text classes like `text-2xl` or `text-[1.75rem]` for the wordmark. The inline style approach is more reliable in this project's configuration.

---

## Alignment and Spacing Guidelines

### Current Header Layout

| Element | Size | Notes |
|---------|------|-------|
| Logo icon container | `w-10 h-10` (40px) | Circular with gradient |
| Logo SVG | `w-6 h-6` (24px) | Centered inside container |
| Wordmark text | `1.501rem` (24px) | Inline style, not Tailwind class |
| User avatar | `w-10 h-10` (40px) | Matches logo icon size |
| Gap between icon and wordmark | `gap-3` (12px) | Flex gap |
| Header horizontal padding | `px-2` (8px) | Both sides |
| Header vertical padding | `py-4` (16px) | Top and bottom |

### Maintaining Balance

- The logo icon and user avatar should remain the same size (`w-10 h-10`) for visual symmetry.
- If you increase the wordmark size significantly, consider increasing the logo icon proportionally.
- Keep the gap between icon and wordmark at `gap-3` unless the wordmark becomes much larger.

---

## Do Not Include Yet

The following topics are **not covered** in this document and will be addressed in separate guides:

- [ ] Brand colors and color palette
- [ ] Gradient definitions and usage
- [ ] Full theming rules and dark/light mode
- [ ] Menu behavior and dropdown logic
- [ ] Responsive header behavior on mobile
- [ ] Animation and transition effects
- [ ] Icon library and icon usage guidelines

---

## File Reference

**Header component location:**
```
src/app/members/build/seed/page.tsx → AppBar()
```

**Related files:**
- `src/app/globals.css` — Theme tokens
- `src/app/layout.tsx` — Font configuration
- `src/components/layout/PageShell.tsx` — Page wrapper

---

*Last updated: November 26, 2025*
