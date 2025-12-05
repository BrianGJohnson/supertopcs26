# Diagnostic Troubleshooting Guide

## Overview

This guide documents a systematic approach to debugging CSS/styling issues, API failures, and other problems that don't respond to simple fixes.

## When to Use This Guide

Say: *"Run the diagnostic troubleshooting guide for [problem description]"*

---

## Common Issue: "Failed to analyze seed phrase" / API 401 Errors

**Symptom:** Modal or component shows error, console shows 401 Unauthorized

**Cause:** Component using `fetch()` instead of `authFetch()` for authenticated API routes.

**Authenticated API Routes (require `authFetch`):**
- `/api/seed-signal` - Seed phrase analysis
- `/api/topics` - Topic expansion  
- `/api/topics/stream` - Streaming topic expansion

**Fix Pattern:**
```tsx
// ❌ Wrong - will get 401
const response = await fetch("/api/seed-signal", { ... });

// ✅ Correct - includes auth token
import { authFetch } from "@/lib/supabase";
const response = await authFetch("/api/seed-signal", { ... });
```

**Quick Check Command:**
```bash
# Find all fetch calls to authenticated routes missing authFetch
grep -r "await fetch.*\/api\/(seed-signal|topics)" src/
```

---

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

## API Error Checklist

**For "Failed to..." or 401/500 errors:**

- [ ] Check browser Network tab for actual status code
- [ ] Check browser Console for error details
- [ ] Is the API route using `createAuthenticatedSupabase`? → Use `authFetch`
- [ ] Are all required env vars set? (check terminal for warnings)
- [ ] Check the API route file for the actual error handling
- [ ] Check Vercel/server logs for server-side errors

**For refactoring-related breaks:**
- [ ] Were imports updated after file renames?
- [ ] Were all callers updated to use new function names?
- [ ] Run `grep` to find all usages of old patterns

---

## Demand Column Architecture (Updated Jan 2025)

**Key Change:** We now use a DEDICATED `demand` column, separate from the legacy `popularity` column.

### Database Schema:

| Column | Purpose | Source |
|--------|---------|--------|
| `demand` | Apify autocomplete-based score (0-99) | score-demand API |
| `demand_base` | Raw score before session multiplier | score-demand API |
| `popularity` | Legacy heuristic-based score (unused) | Old algorithm |
| `popularity_base` | Legacy base score (unused) | Old algorithm |

### Current Data Flow:
1. User clicks "Run Analysis → Demand"
2. API calls Apify for autocomplete data
3. Scores saved to `demand` column (not `popularity`)
4. RefinePageContent reads from `demand` column
5. DEM column displays the value

### Code Locations:
- **Write:** `/api/sessions/[sessionId]/score-demand/route.ts` → `demand` column
- **Read:** `RefinePageContent.tsx` → `analysis?.demand`
- **Display:** `RefineTable.tsx` → `pop` prop (mapped from demand)

### Why Two Columns?
- `popularity` = Old heuristic scoring (pattern matching, no API)
- `demand` = New Apify scoring (real autocomplete data)
- Keeping both avoids migration issues and maintains backward compatibility

### Quick Database Check:
```bash
# Check demand scores
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('seed_analysis').select('demand, demand_base').not('demand', 'is', null).limit(5).then(r => console.log(r.data));
"
```

### Clear Demand Scores:
```bash
node scripts/clear-popularity.mjs
```
(Script name is legacy - it now clears `demand` column)

---

## Quick Commands

```bash
# Clear Next.js cache
rm -rf .next

# Hard refresh in browser
Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

# Restart dev server
# Kill existing, then npm run dev

# Find unauthenticated API calls
grep -r "await fetch.*\/api\/(seed-signal|topics)" src/

# TypeScript check
npx tsc --noEmit

# ESLint check on specific files
npx eslint src/path/to/file.tsx
```

