# Blueprint Page Upgrade — December 12, 2025

> This document captures the issues, analysis, and proposed improvements for the Blueprint/Package page (Step 6) based on user testing feedback.

---

## Issues Identified

### 1. Grammar Not Being Fixed by GPT-5 Mini

**Problem:** The polish prompt generates titles but doesn't correct grammar issues.

**Examples from testing:**
| Input | Current Output | Expected Output |
|-------|---------------|-----------------|
| "AI thumbnail maker" | "AI thumbnail maker" | "AI Thumbnail Makers" (plural + Title Case) |
| "How ai thumbnail maker Can Kill Views" | Same | "How AI Thumbnail Maker Can Kill Your Views" |
| "Warning! AI Thumbnail Maker Could Ruin Your Channel" | Same | "Warning! AI Thumbnail Makers Could Ruin Your Channel" |

**Root Cause:** The prompt doesn't explicitly instruct the model to:
1. Fix grammar issues
2. Use proper Title Case for every word
3. Consider singular vs plural for broader impact
4. Add personalization ("your" for emotional connection)
5. Add intensifiers when appropriate ("absolutely", "completely")

---

### 2. Title Case Inconsistency

**Problem:** Output shows "How ai thumbnail maker Can Kill Views" instead of "How AI Thumbnail Maker Can Kill Views"

**Fix Required:** Add explicit Title Case enforcement rule to the prompt.

---

### 3. Titles Too Short

**Problem:** Some polished titles are only 32-37 characters — below the 45-55 character sweet spot.

| Title | Characters | Issue |
|-------|------------|-------|
| "How ai thumbnail maker Can Kill Views" | 37 | Too short, missing personalization |
| "Don't Use ai thumbnail maker Yet" | 32 | Way too short |

**Fix Required:** Add minimum length enforcement to prompt (45+ characters).

---

### 4. UI Layout Issues

**Problem:** The current layout shows "Original" first, but the **Winner** should be shown first.

**Current Order:**
1. Original (position 1)
2. Winner (position 2)
3. Other variations (positions 3-9)

**Expected Order:**
1. **Winner** (position 1, with trophy icon + "Winner" label)
2. Other variations (positions 2-8)
3. Original (last, as reference)

---

### 5. "Browse Polished Variations" Should Be At Top

**Problem:** The hero section ("Your Current Package") pushes the polished variations below the fold. Users don't see them loading.

**Fix:** Move "Browse Polished Variations" carousel to the TOP of the page, above the hero thumbnail preview.

---

### 6. Text Too Small

**Problem:** The variation cards have small text that's hard to read.

**Specific Issues:**
- Title text in variation cards too small
- "Thumbnail Text" label too small
- "Why This Works" strategy note too small

**Fix:** Apply modal-styling workflow text size guidelines:
- Headlines: `text-2xl` minimum
- Body text: `text-lg` minimum
- Labels: `text-base` minimum

---

### 7. Loading State Needs Proper Modal

**Problem:** The loading state for polish generation is just a spinner inside the card — too subtle for a 5-10 second wait.

**Current:** "Generating polished variations... This usually takes a few seconds"

**Fix:** Create a proper overlay modal matching the phrase generation modal styling:
- Dark backdrop with blur
- Silvery-blue border
- Phase messages (e.g., "Polishing Your Title", "Crafting Variations", "Selecting The Winner")
- Progress bar
- Large headline text

---

### 8. Multiple Phrase Selection for Split Testing

**Problem:** Currently only one phrase can be carried forward to Blueprint.

**User Need:** Ability to select multiple phrases to create different thumbnail variations for A/B split testing on YouTube.

**Fix:** 
- Allow 2-3 phrases to be "locked" on the title page
- Carry all locked phrases to Blueprint
- Generate thumbnail variations for each phrase

---

## Proposed Prompt Improvements

### Current Prompt Issues

The current `polish-phrase/route.ts` prompt doesn't enforce:
1. Grammar correction
2. Title Case standardization
3. Personalization ("your", "you")
4. Minimum character count
5. Intensifier usage

### New Prompt Additions

Add these sections to the GPT-5 mini prompt:

```
## ⚠️ YOU ARE A PROFESSIONAL COPYWRITER ⚠️

**GRAMMAR ENFORCEMENT:**
- Fix ALL grammar issues in the input title
- Ensure subject-verb agreement
- Consider singular vs plural for maximum impact ("AI Thumbnail Maker" vs "AI Thumbnail Makers")

**TITLE CASE (MANDATORY):**
- EVERY word must start with a capital letter
- Exceptions: articles (a, an, the), prepositions (of, in, to) — but capitalize if they start the title
- Example: "How AI Thumbnail Maker Can Kill Your Views" ✅
- Example: "How ai thumbnail maker can kill views" ❌

**PERSONALIZATION:**
- Use "your" or "you" to make it personal
- Example: "Could Ruin Your Channel" beats "Could Ruin Channels"

**INTENSIFIERS (USE STRATEGICALLY):**
- Add power words when appropriate: "absolutely", "completely", "exactly", "really"
- Example: "How AI Thumbnail Maker Can Absolutely Kill Your Views"

**MINIMUM LENGTH:**
- All titles MUST be at least 45 characters
- Target: 50-55 characters
- If a draft is too short, expand it naturally with personalization or intensifiers
```

---

## UI Changes Required

### 1. Reorder Variation Carousel
- Winner first (with 🏆 trophy icon)
- Other variations (2-8)
- Original last

### 2. Move Carousel to Top
- "Browse Polished Variations" section at TOP of page
- Hero thumbnail preview moves to middle

### 3. Increase Text Sizes
- Title in variation cards: `text-2xl font-bold`
- Thumbnail phrase: `text-lg font-semibold`
- Strategy note: `text-base text-white/70`

### 4. Add Winner Badge
- Trophy icon + "Winner" label
- Green glow/border for winner card

### 5. Add Loading Modal
- Overlay with dark backdrop
- Phase messages for polish generation
- Progress bar
- Silvery-blue border

---

## Files to Modify

| File | Changes |
|------|---------|
| `/api/titles/polish-phrase/route.ts` | Add grammar, Title Case, personalization rules to prompt |
| `/members/build/blueprint/_components/BlueprintPageContent.tsx` | Reorder UI, add loading modal, increase text sizes |
| `/.agent/workflows/modal-styling.md` | Add Polish Generation Loading section |

---

## Priority Order

1. **HIGH:** Fix GPT-5 mini prompt (grammar, Title Case, minimum length)
2. **HIGH:** Reorder variations (Winner first)
3. **MEDIUM:** Add loading modal for polish generation
4. **MEDIUM:** Increase text sizes
5. **MEDIUM:** Move carousel to top of page
6. **LOW:** Multiple phrase selection (requires Title page changes too)

---

## Success Criteria

- [ ] All polished titles use proper Title Case (every word capitalized)
- [ ] Grammar issues are corrected automatically
- [ ] Titles are 45-55 characters (never below 45)
- [ ] Winner is shown first with trophy badge
- [ ] Loading modal appears during polish generation
- [ ] Text is readable without squinting

---

*Last Updated: December 12, 2025*
