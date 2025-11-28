# Diagnostic Troubleshooting Guide

## Overview

This guide documents a systematic approach to debugging CSS/styling issues and other problems that don't respond to simple fixes.

## When to Use This Guide

Say: *"Run the diagnostic troubleshooting guide for [problem description]"*

## The Process

### Step 1: Define the Desired Outcome
- What should it look like/do?
- What is it currently doing instead?

### Step 2: Generate Exhaustive List of Possible Causes
Don't jump to solutions. First, list ALL possible reasons the issue could exist:

**For CSS/Styling Issues:**
1. Tailwind class not compiling (purge/content config)
2. Class being overridden by higher specificity
3. Cached CSS (browser or build cache)
4. Wrong file being edited
5. Component not re-rendering
6. Class syntax error (typo, wrong format)
7. Conflicting classes on same element
8. Parent element constraining child
9. CSS variable not defined
10. Media query overriding
11. `!important` elsewhere overriding
12. Inline styles overriding
13. Dev server not hot-reloading
14. Wrong component instance being viewed

### Step 3: Systematically Check Each Item
- Go through the list one by one
- Check the actual code/state for each
- Document findings
- Fix if problematic
- Move to next item

### Step 4: Verify Fix
- Hard refresh browser (Cmd+Shift+R)
- Clear .next cache if needed (`rm -rf .next`)
- Restart dev server if needed

---

## Example Usage

**Problem:** "Nav link spacing not increasing"

**Desired Outcome:** More space between navigation links (gap-2 or gap-3)

**Checklist:**
- [ ] Verify the correct file was edited
- [ ] Check the actual rendered HTML in browser DevTools
- [ ] Look for competing gap/margin/padding classes
- [ ] Check if parent has flex properties that override
- [ ] Check for inline styles
- [ ] Verify Tailwind is processing the class
- [ ] Clear browser cache / hard refresh
- [ ] Clear .next build cache
- [ ] Restart dev server

---

## Quick Commands

```bash
# Clear Next.js cache
rm -rf .next

# Hard refresh in browser
Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

# Restart dev server
# Kill existing, then npm run dev
```
