# Display Mode Specification

## Overview

SuperTopics offers two display modes to accommodate different user preferences:

- **Essentials** — Clean, focused view with just what users need to make decisions
- **Full Details** — Complete data view with all metrics, lists, and power-user features

---

## Design Philosophy

### Build Full First, Then Strip Down

When building new features:

1. **Design and build with ALL metrics visible** (full mode)
2. **Test it, make sure everything works**
3. **Wrap "extra" elements in `{isFull && ...}`** to hide in essentials mode

This ensures:
- Nothing gets lost or forgotten
- Power users always have access to everything
- New users aren't overwhelmed
- You deliberately choose what to hide, not guess what to show

---

## Mode Definitions

| Mode | Internal Value | User-Facing Label | Description |
|------|----------------|-------------------|-------------|
| Essentials | `essentials` | "Keep it simple" | Streamlined interface, key metrics only |
| Full Details | `full` | "Show me everything" | All data, all metrics, all details |

---

## Where Display Mode is Set

### 1. Onboarding Step 1 (Initial Selection)

During onboarding, users choose their preferred display mode on the Welcome page.

**Location:** `/members/onboarding/step-1`

**Question:** "How much detail do you want to see?"

**Options:**

```
○ Keep it simple
  Just what I need to make decisions

○ Show me everything  
  All the metrics and details
```

**Default:** "Keep it simple" is pre-selected

**Database:** Saved to `channels.display_mode`

---

### 2. Account Settings (Change Anytime)

Users can change their display mode at any time from their Account page.

**Location:** Account → Preferences (or Account → Settings)

**UI:**

```
Display Mode
○ Keep it simple  ·  ○ Show me everything
```

**Behavior:** Change takes effect immediately across the app.

---

### 3. Per-Section Toggle (Inline Override)

On pages/modals with hidden content, users can temporarily toggle to see more.

**UI:** Small link or toggle at the section level

```
Showing: Essentials  [Show more ▼]
```

Or:

```
[Toggle: Essentials ↔ Full Details]
```

**Behavior:** 
- This is a temporary override for that view only
- Does NOT change the global setting
- Resets when user navigates away

---

## Database Schema

### user_profiles table

Column (added):

```sql
display_mode TEXT DEFAULT 'essentials'
```

Values: `'essentials'` or `'full'`

**Why user_profiles, not channels?**
Display mode is a personal preference that applies across ALL of a user's channels. If you're a "show me everything" person, you want that everywhere.

---

## TypeScript Types

```ts
type DisplayMode = 'essentials' | 'full';

interface UserProfile {
  // ... existing fields
  display_mode: DisplayMode;
}
```

---

## React Hook

Create a hook to access display mode throughout the app:

```ts
// src/hooks/useDisplayMode.ts

import { useUserProfile } from './useUserProfile'; // or however you access user profile

export function useDisplayMode() {
  const { profile } = useUserProfile();
  
  return {
    mode: profile?.display_mode ?? 'essentials',
    isEssentials: profile?.display_mode !== 'full',
    isFull: profile?.display_mode === 'full',
  };
}
```

---

## Component Pattern

For any component that shows/hides content based on display mode:

```tsx
import { useDisplayMode } from '@/hooks/useDisplayMode';

function ViewerLandscapeModal() {
  const { isEssentials, isFull } = useDisplayMode();
  const [localOverride, setLocalOverride] = useState(false);
  
  // Show full details if global setting is 'full' OR local override is true
  const showFullDetails = isFull || localOverride;
  
  return (
    <Modal>
      {/* Always visible */}
      <DemandBadge />
      <SummaryText />
      <WhosWatchingBars />
      <ViewerLandscapeSummary />
      
      {/* Only visible in Full Details mode */}
      {showFullDetails && (
        <>
          <ExactMatchStats />
          <PopularTopicsList />
          <WordsViewersUse />
          <CompetitionLink />
        </>
      )}
      
      {/* Toggle for Essentials users to see more */}
      {isEssentials && !localOverride && (
        <button onClick={() => setLocalOverride(true)}>
          Show more details ▼
        </button>
      )}
      
      <ActionButtons />
    </Modal>
  );
}
```

---

## Pages/Components Affected

### Phase 1: Viewer Landscape Modal (Target Page)

| Element | Essentials | Full Details |
|---------|------------|--------------|
| 🔥 Demand badge | ✅ Show | ✅ Show |
| Summary text ("Good opportunity...") | ✅ Show | ✅ Show |
| Who's Watching bars | ✅ Show | ✅ Show |
| Viewer Landscape summary | ✅ Show | ✅ Show |
| Create Session / Pass buttons | ✅ Show | ✅ Show |
| "14 of 14 exact match..." stats | ❌ Hide | ✅ Show |
| Popular Topics list (13 items) | ❌ Hide | ✅ Show |
| Words Viewers Use pills | ❌ Hide | ✅ Show |
| "Check competition on YouTube" link | ❌ Hide | ✅ Show |

---

### Phase 2: Seed Page

| Element | Essentials | Full Details |
|---------|------------|--------------|
| Seed input + Expand button | ✅ Show | ✅ Show |
| Progress during expansion | ✅ Show | ✅ Show |
| Topic count | ✅ Show | ✅ Show |
| "Topic Sources: Top 10 / Child / A-Z / Prefix" pills | ❌ Hide | ✅ Show |
| Step 1 Card (redundant info) | ❌ Hide | ✅ Show |
| Session dropdown | ❌ Hide | ✅ Show |

---

### Phase 3: Refine Page (Future)

| Element | Essentials | Full Details |
|---------|------------|--------------|
| Core scoring + top picks | ✅ Show | ✅ Show |
| Detailed breakdown scores | ❌ Hide | ✅ Show |
| Algorithm explanations | ❌ Hide | ✅ Show |

---

### Phase 4: Other Modals/Pages (Future)

Apply same pattern as needed.

---

## Implementation Status

1. ✅ **Database:** `display_mode` column added to `channels` table
2. ✅ **Onboarding:** Display mode selection on Step 1 (Welcome page)
3. ⬜ **Account Settings:** Add display mode toggle
4. ⬜ **Hook:** Create `useDisplayMode` hook
5. ⬜ **Viewer Landscape Modal:** Implement show/hide logic
6. ⬜ **Seed Page:** Implement show/hide logic
7. ⬜ **Other pages:** Roll out as needed

---

## Default Behavior

- New users: `essentials` (set during onboarding or as default)
- Existing users: `essentials` (migration default)
- If not set: Treat as `essentials`

---

## Summary

| Where | What Happens |
|-------|--------------|
| Onboarding | User picks "Keep it simple" or "Show me everything" |
| Account Settings | User can change anytime |
| Per-section toggle | Temporary override to see more (doesn't change global setting) |
| Database | `user_profiles.display_mode: 'essentials' | 'full'` |
| Code | `useDisplayMode()` hook returns current mode |

---

## User-Facing Copy

| Context | Essentials Label | Full Details Label |
|---------|------------------|---------------------|
| Onboarding | "Keep it simple" | "Show me everything" |
| Settings | "Keep it simple" | "Show me everything" |
| Inline toggle | "Essentials" | "Full Details" |
| Show more link | "Show more details ▼" | — |
| Show less link | — | "Show less ▲" |
