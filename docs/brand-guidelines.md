================================================================================
SUPER TOPICS BUILDER — BRAND FOUNDATIONS REPORT v1.1
================================================================================

This document defines the visual system for the Super Topics Builder UI as of
November 29, 2025. All values are extracted from the current implementation
and should be used as the source of truth for Page 2 and future pages.

================================================================================
SECTION 1: GLOBAL VISUAL IDENTITY
================================================================================

CORE AESTHETIC
- Dark premium SaaS aesthetic
- Dark charcoal backgrounds with subtle variations
- Calm contrast, no harsh striping
- Hierarchy driven by opacity, size, and spacing rather than loud colors

GLOBAL COLOR TOKENS
- Background (page):           #0B1220
- Surface (cards):             #161c27
- Primary (accent):            #7A5CFA (purple-violet) — USE SPARINGLY
- Accent (secondary):          #3CCFB1 (teal-cyan)
- Electric Blue (default):     #6B9BD1 — PREFERRED FOR UI ELEMENTS
- Text Primary:                #E7ECF5
- Text Secondary:              #A6B0C2

COLOR USAGE GUIDELINES
┌─────────────────────────────────────────────────────────────────────────────┐
│ ELECTRIC BLUE (#6B9BD1) — DEFAULT CHOICE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Use for:                                                                    │
│ - Modal success/info indicators                                             │
│ - Toast action links ("View Results →")                                     │
│ - Interactive elements in modals                                            │
│ - Checkmarks and completion indicators                                      │
│ - Secondary buttons and links                                               │
│ - Progress indicators in dialogs                                            │
│                                                                             │
│ This is the workhorse brand color for UI interactions.                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PURPLE (#7A5CFA) — USE SPARINGLY                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Reserved for:                                                               │
│ - Hero gradients and headline accents                                       │
│ - Primary CTA buttons (e.g., "Expand Topic")                                │
│ - Ambient background glows                                                  │
│ - Brand moments that need to feel premium/special                           │
│                                                                             │
│ Do NOT use purple for:                                                      │
│ - Modals, toasts, or utility dialogs                                        │
│ - Secondary UI elements                                                     │
│ - Repetitive interface patterns                                             │
│                                                                             │
│ Purple should feel like a reward, not wallpaper.                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ GREEN — DO NOT USE FOR UI ACCENTS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Green is RESERVED for the tag hierarchy system only:                        │
│ - A-Z source tags (#4DD68A)                                                 │
│ - Prefix source tags (#39C7D8 teal-green)                                   │
│ - Child source tags (#D4E882 yellow-green)                                  │
│                                                                             │
│ Do NOT use green for:                                                       │
│ - Toast success indicators (use gray #8A95A5 instead)                       │
│ - Modal checkmarks or confirmation icons                                    │
│ - Buttons or interactive elements                                           │
│ - Status badges outside of topic sources                                    │
│                                                                             │
│ For success/completion indicators, use:                                     │
│ - Subdued gray: #8A95A5                                                     │
│ - Electric blue: #6B9BD1                                                    │
│ - Charcoal variants: #2E3338 to #1E2228                                     │
│                                                                             │
│ This prevents green from losing its special meaning in the tag hierarchy.   │
└─────────────────────────────────────────────────────────────────────────────┘

BORDER RADIUS SCALE
- Small:   0.375rem (6px)  — sm
- Medium:  0.75rem (12px)  — md
- Large:   1rem (16px)     — lg
- XL:      0.75rem (12px)  — rounded-xl (used on buttons)
- 2XL:     1rem (16px)     — rounded-2xl (used on table container)
- 3XL:     1.5rem (24px)   — rounded-3xl (used on cards)
- Full:    9999px          — rounded-full (used on pills)

FONT SYSTEM
- Font Family: Inter (via CSS variable --font-inter), system-ui fallback
- Base hierarchy uses font weight and opacity for distinction

================================================================================
SECTION 2: PAGE SHELL AND LAYOUT
================================================================================

PAGE SHELL CONTAINER (LOCKED)
- Minimum height: 100vh (full viewport)
- Background: var(--color-background) (#0B1220)
- Text color: var(--color-text-primary) (#E7ECF5)
- Content max width: 80rem (max-w-7xl)
- Horizontal padding: 1.5rem mobile, 2rem desktop (px-6 md:px-8)
- Vertical padding: 3rem mobile, 4rem desktop (py-12 md:py-16)

CONTENT CONTAINER (SEED PAGE)
- Layout: Flex column
- Gap between sections: 3rem (gap-12)
- Max width: 64rem (max-w-5xl)
- Centered: mx-auto
- Position: relative z-10

AMBIENT BACKGROUND GLOW
- Position: Absolute, centered horizontally
- Width: 800px
- Height: 600px
- Color: var(--color-primary) at 10% opacity
- Blur: 120px
- Z-index: -10 (behind content)

================================================================================
SECTION 3: HEADER AND NAVIGATION (LOCKED)
================================================================================

HEADER CONTAINER
- Width: Full
- Horizontal padding: 0.5rem (px-2)
- Vertical padding: 1rem (py-4)
- Layout: Flex, justify-between, items-center
- Border: Bottom only, white at 5% opacity
- Backdrop: blur-sm
- Z-index: 10

LOGO SECTION
- Logo image height: 3.5rem (56px / h-14)
- Logo-to-wordmark gap: 0.75rem (gap-3)
- Wordmark text: "Super Topics"
- Wordmark font size: 1.468rem (inline style)
- Wordmark color: #D6DBE6
- Wordmark weight: Bold (font-bold)
- Wordmark tracking: Tight (tracking-tight)

USER NAVIGATION (RIGHT SIDE)
- Tokens pill + avatar combined as single button
- Pill left padding: 1.25rem (pl-5)
- Pill right padding: 0 (avatar flush right)
- Pill background: Gradient from gray-800 to gray-900
- Pill border: White at 10% opacity
- Pill hover: Border white at 20% opacity
- Tokens text: 14px (text-sm), bold, gray-200
- Tokens text hover: White

AVATAR CIRCLE
- Size: 39px x 39px (inline style)
- Background: #1A2754 (Midnight Blue)
- Text: White, 14px, bold
- Corner radius: Full circle
- Shadow: #1A2754 at 30% opacity

================================================================================
SECTION 4: MEMBERS HERO AREA (LOCKED)
================================================================================

HERO CONTAINER
- Layout: Flex column, items-center, text-center
- Gap: 0
- Margin top: -22px (mt-[-22px])

ICON WRAPPER
- Outer container: 144px x 144px (w-36 h-36)
- Margin bottom: -38px (mb-[-38px])
- Ambient glow: Primary color at 8% opacity, blur-2xl, rounded-full

ICON STYLING
- Size: 100px
- Stroke width: 1.5
- Color: var(--color-primary)
- Drop shadow: Primary color at 25% opacity, 8px blur

HEADLINE (H1)
- Font size: 3.4rem mobile, 4.2rem desktop
- Font weight: Extra bold (font-extrabold)
- Color: White
- Tracking: Tight
- Line height: 1.22
- Drop shadow: lg

HEADLINE LINE 1 (WHITE)
- Word count: 3-4 words
- Color: White (text-white)

HEADLINE LINE 2 (GRADIENT)
- Word count: 2-3 words
- Background: Gradient from primary (#7A5CFA) to accent (#3CCFB1)
- Text fill: Transparent with background-clip text
- Display: inline-block
- Padding bottom: 0.15em
- White-space: nowrap

DESCRIPTION
- Font size: 1.5rem (24px)
- Color: var(--color-text-secondary)
- Font weight: Light
- Margin top: 20px
- Max width: 42rem (max-w-2xl)

DIVIDER
- Width: Full up to 28rem (max-w-md)
- Height: 1px
- Background: Gradient from transparent via gray-500 to transparent
- Opacity: 40%
- Margin top: 1rem (mt-4)

================================================================================
SECTION 5: BUILDER PROGRESS STEPPER (LOCKED)
================================================================================

STEP COUNT: 6
- Step 1: Seed
- Step 2: Refine
- Step 3: Super
- Step 4: Title
- Step 5: Package
- Step 6: Upload

STEPPER CONTAINER
- Layout: Flex, justify-between, items-start
- Max width: 48rem (max-w-3xl)
- Horizontal padding: 1rem (px-4)
- Vertical padding: 1rem (py-4)
- Margin top: -1rem (-mt-4)

PROGRESS BAR (CONNECTING LINE)
- Position: Absolute
- Top: 2.5rem (top-10)
- Left/Right inset: 4rem (left-16 right-16)
- Height: 1px
- Color: #1A2754 (Midnight Blue)
- Z-index: -10

STEP CIRCLE — INACTIVE
- Size: 48px x 48px (w-12 h-12)
- Background: var(--color-surface)
- Border: 2px, white at 20% opacity
- Ring: 4px, var(--color-background)
- Text color: var(--color-text-secondary)
- Font weight: Medium
- Overall opacity: 60%

STEP CIRCLE — ACTIVE
- Size: 48px x 48px (w-12 h-12)
- Background: #1A2754 (Midnight Blue)
- Border: 2px, white at 20% opacity
- Ring: 4px, var(--color-background)
- Text color: White
- Font weight: Bold
- Shadow: 0 0 20px rgba(26,39,84,0.4)

STEP LABEL
- Font size: 10px mobile, 12px desktop
- Font weight: Light
- Text transform: Uppercase
- Letter spacing: Widest (tracking-widest)
- Gap from circle: 0.75rem (gap-3)

STEP LABEL — INACTIVE
- Color: var(--color-text-secondary)

STEP LABEL — ACTIVE
- Color: White at 75% opacity
- Drop shadow: 0 0 10px rgba(26,39,84,0.5)

================================================================================
SECTION 6: CARD SYSTEM
================================================================================

BASE CARD STYLING
- Background: var(--color-surface) at 40% opacity (bg-surface/40)
- Backdrop blur: Medium (backdrop-blur-md)
- Border: 1px, white at 10% opacity
- Border radius: 1.5rem (rounded-3xl)
- Shadow: 2xl

SEED INPUT CARD (SEED CARD)
- Negative margin top: -1rem (-mt-4)
- Padding: 2rem mobile, 2.5rem desktop (p-8 md:p-10)
- Position: relative, overflow-hidden

TOP ACCENT BAR
- Height: 4px (h-1)
- Width: Full
- Background: Gradient from primary via accent to primary
- Opacity: 25%
- Position: Absolute top-left

INPUT FIELD
- Background: Black at 40% + gradient from white/3% to transparent
- Border: 1px, white at 30% opacity
- Border radius: 1rem (rounded-2xl)
- Padding: 2rem horizontal, 1.25rem vertical (px-8 py-5)
- Font size: 1.25rem (text-xl)
- Text color: White
- Text alignment: Center
- Placeholder color: White at 85% opacity
- Focus border: Primary at 50%
- Focus ring: 2px, primary at 20% opacity

GENERATOR BUTTONS (4-COLUMN GRID)
- Grid: 2 columns mobile, 4 columns desktop
- Gap: 1rem (gap-4)
- Button padding: 1rem horizontal, 1rem vertical (px-4 py-4)
- Border radius: 0.75rem (rounded-xl)
- Font size: 17px
- Font weight: Semibold
- Line height: Tight

GENERATOR BUTTON COLORS (SOURCE-SPECIFIC)

Top 10 (Orange):
- Background: #FF8A3D at 10%, hover 20%
- Border: #FF8A3D at 30%
- Text: #FF8A3D
- Shadow: 0 0 15px rgba(255,138,61,0.1)

Child (Yellow-Green):
- Background: #D4E882 at 10%, hover 20%
- Border: #D4E882 at 30%
- Text: #D4E882
- Shadow: 0 0 15px rgba(212,232,130,0.1)

A–Z (Emerald):
- Background: #4DD68A at 10%, hover 20%
- Border: #4DD68A at 30%
- Text: #4DD68A
- Shadow: 0 0 15px rgba(77,214,138,0.1)

Prefix (Teal):
- Background: #39C7D8 at 10%, hover 20%
- Border: #39C7D8 at 30%
- Text: #39C7D8
- Shadow: 0 0 15px rgba(57,199,216,0.1)

================================================================================
SECTION 7: STEP 1 CARD (STATUS CARD)
================================================================================

CARD STRUCTURE
- Two sections: Top (status) and Bottom (session/sources)
- Divider between: 1px, white at 5% opacity

TOP SECTION
- Padding: 2rem mobile, 2.5rem desktop (p-8 md:p-10)
- Layout: Flex column mobile, flex row desktop
- Alignment: Center mobile, between desktop
- Gap: 2.5rem (gap-10)

STEP TITLE
- Font size: 1.875rem (text-3xl)
- Font weight: Bold
- Color: White
- Format: "Step N • [Title]"

STEP DESCRIPTION
- Font size: 1.125rem (text-lg)
- Color: var(--color-text-secondary)
- Font weight: Light
- Line height: Relaxed

"YOUR TOPICS" PILL (GRAPHITE PILL — INFORMATIONAL)
- Padding: 1.75rem horizontal, 1rem vertical (px-7 py-4)
- Background: Gradient from #2E3338 to #1E2228
- Border: 2px, #6B9BD1 at 50% (electric blue)
- Border radius: Full (rounded-full)
- Text color: White
- Font weight: Bold
- Inner shadow: inset 0 1px 0 rgba(255,255,255,0.08) (metallic sheen)

WARNING ACTION BUTTON (RED — NEEDS MORE)
- Padding: 2rem horizontal, 1rem vertical (px-8 py-4)
- Background: Gradient from #D95555/15 to #C94545/15
- Hover background: 25% opacity
- Border: 2px, red-500 at 20%
- Border radius: 0.75rem (rounded-xl)
- Text color: red-300
- Font weight: Bold
- Shadow: 0 0 15px rgba(239,68,68,0.15)
- Includes right arrow icon

PROCEED BUTTON (UTILITY — READY STATE)
- Padding: 2rem horizontal, 1rem vertical (px-8 py-4)
- Background: Gradient from #1E2A38 to #151D28
- Hover background: from #243040 to #1A2530
- Border: 1px, #4A5568 at 60%
- Border radius: 0.75rem (rounded-xl)
- Text color: #A8C4E0
- Font weight: Bold
- Inner shadow: inset 0 1px 0 rgba(255,255,255,0.06)
- Includes right arrow icon

BOTTOM SECTION (SESSION & SOURCES)
- Padding: 2.5rem horizontal, 2.5rem vertical (px-10 py-10 md:px-12)
- Background: Black at 20% (bg-black/20)
- Layout: Flex column mobile, flex row desktop
- Alignment: Between, center items
- Gap: 1.5rem (gap-6)

SESSION BUTTON (GRAPHITE PILL — INTERACTIVE)
- Padding: 1.75rem horizontal, 1rem vertical (px-7 py-4)
- Background: Gradient from #2E3338 to #1E2228
- Hover background: from #353A40 to #252A30
- Border: 2px, #6B9BD1 at 50% (electric blue)
- Border radius: Full (rounded-full)
- Text color: White at 82% opacity
- Font weight: Bold
- Inner shadow: inset 0 1px 0 rgba(255,255,255,0.08) (metallic sheen)
- Includes chevron-down icon (w-4 h-4)

================================================================================
SECTION 8: TAG AND TOPIC SOURCE PILLS (LOCKED)
================================================================================

TAG COLOR HIERARCHY — DIFFICULTY TO VIEWS SYSTEM

The tag colors follow a traffic-light inspired system to guide creators toward
topics with the best opportunity for views. This is NOT decorative — it
communicates competitive difficulty at a glance.

COLOR PROGRESSION (Hardest → Easiest):
┌─────────┬─────────────┬──────────────────────────────────────────────────────┐
│ Tag     │ Color       │ Meaning                                              │
├─────────┼─────────────┼──────────────────────────────────────────────────────┤
│ Seed    │ #E85C4A     │ Burnt orange/red — STOP. Most competitive. Your      │
│         │ (Red-Orange)│ starting point, not your destination.                │
├─────────┼─────────────┼──────────────────────────────────────────────────────┤
│ Top 10  │ #FF8A3D     │ Orange — CAUTION. Competitive but doable. The dream  │
│         │ (Orange)    │ topics, but know you're competing.                   │
├─────────┼─────────────┼──────────────────────────────────────────────────────┤
│ Child   │ #D4E882     │ Yellow-green — GO ZONE BEGINS. Opportunity zone.     │
│         │ (Lime)      │ Derived from Top 10, less competition.               │
├─────────┼─────────────┼──────────────────────────────────────────────────────┤
│ A-Z     │ #4DD68A     │ Green — FANTASTIC. Great terms. High topic strength  │
│         │ (Green)     │ scores here indicate excellent video potential.      │
├─────────┼─────────────┼──────────────────────────────────────────────────────┤
│ Prefix  │ #39C7D8     │ Teal — FANTASTIC. Same opportunity as A-Z. Question- │
│         │ (Teal)      │ based phrases often have clearer viewer intent.      │
└─────────┴─────────────┴──────────────────────────────────────────────────────┘

CREATOR GUIDANCE:
- Child, A-Z, Prefix = Where creators should focus
- Top 10 = Aspirational but competitive
- Seed = Reference point only, not a target

This hierarchy should inform all UI decisions involving tag display, filtering,
or sorting. When in doubt, green/teal = good, red/orange = challenging.

TOPIC SOURCES LABEL
- Text: "Topic Sources:"
- Color: White at 68% opacity
- Font size: 16px (text-base)
- Font weight: Bold
- Right margin: 0.5rem (mr-2)

TOPIC SOURCE PILLS — ACTIVE STATE (HAS DATA)
- Padding: 0.875rem horizontal, 0.375rem vertical (px-3.5 py-1.5)
- Background: Gradient from #2A2E34 to #1E2228
- Border radius: Full (rounded-full)
- Font size: 14px (text-sm)
- Font weight: Medium
- Border: 1px

Top 10 Active:
- Text color: #CC7A3D
- Border color: #CC7A3D at 45%

TOPIC SOURCE PILLS — INACTIVE STATE (ZERO DATA)
- Padding: 0.875rem horizontal, 0.375rem vertical (px-3.5 py-1.5)
- Background: Gradient from #252930 to #1A1E24
- Border radius: Full (rounded-full)
- Font size: 14px (text-sm)
- Font weight: Medium
- Border: 1px
- Text opacity: 70%
- Hover text opacity: 80%
- Border opacity: 35%
- Hover border opacity: 45%

Child Inactive:
- Text color: #B8CC75 at 70%
- Border color: #B8CC75 at 35%

A–Z Inactive:
- Text color: #45B87A at 70%
- Border color: #45B87A at 35%

Prefix Inactive:
- Text color: #35AABC at 70%
- Border color: #35AABC at 35%

SOURCE COLOR PALETTE (CANONICAL)
- Top 10:  #CC7A3D (orange)
- Child:   #B8CC75 (yellow-green)
- A–Z:     #45B87A (emerald)
- Prefix:  #35AABC (teal)

================================================================================
SECTION 9: BASE TABLE COMPONENT (LOCKED — REUSE ON PAGE 2)
================================================================================

This table is the canonical pattern for all data tables in the Builder flow.
Page 2 and future pages must reuse this exact styling. Only additional columns
may be added; the visual treatment must not be modified.

TABLE CONTAINER
- Background: var(--color-surface) at 40% opacity (bg-surface/40)
- Backdrop blur: Medium (backdrop-blur-md)
- Border: 1px, white at 10% opacity
- Border radius: 1rem (rounded-2xl)
- Overflow: Hidden
- Shadow: xl

TABLE ELEMENT
- Width: Full
- Text alignment: Left
- Border collapse: Collapse

TABLE HEADER ROW
- Border bottom: 1px, white at 5% opacity
- Background: White at 5% opacity (bg-white/5)

TABLE HEADER CELLS (PHRASE AND TAG)
- Font size: 18px (text-[18px])
- Font weight: Bold
- Text color: White at 86% opacity (text-white/[0.86])
- Text transform: Uppercase
- Letter spacing: 0.15em (tracking-[0.15em])
- Vertical padding: 1.25rem (py-5)

PHRASE HEADER ALIGNMENT
- Left padding: 2.25rem (pl-9)
- Right padding: 2rem (pr-8)
- Text alignment: Left (default)

TAG HEADER ALIGNMENT
- Left padding: 2rem (pl-8)
- Right padding: 3rem (pr-12)
- Text alignment: Right

TABLE BODY
- Divider between rows: 1px, white at 5% opacity
- Background: Black at 3% opacity (bg-black/[0.03])

TABLE BODY ROWS
- Default state: No additional background
- Hover state: White at 4% opacity (hover:bg-white/[0.04])
- Transition: Colors

TABLE BODY CELLS
- Horizontal padding: 2rem (px-8)
- Vertical padding: 1.25rem (py-5)

PHRASE CELL (LEFT COLUMN)
- Text color: White at 86% opacity (text-white/[0.86])
- Hover text color: White (group-hover:text-white)
- Transition: Colors

TAG CELL (RIGHT COLUMN)
- Text alignment: Right

TAG PILL (IN TABLE)
- Padding: 0.75rem horizontal, 0.25rem vertical (px-3 py-1)
- Background: Gradient from #2A2E34 to #1E2228
- Border radius: Full (rounded-full)
- Font size: 12px (text-xs)
- Font weight: Medium
- Border: 1px, #CC7A3D at 55% (for Top 10)
- Text color: #CC7A3D (for Top 10)
- Inner shadow: inset 0 1px 0 rgba(255,255,255,0.05)

TAG PILL COLORS (MATCH SOURCE PALETTE)
- Top 10: Text #CC7A3D, Border #CC7A3D/55
- Child:  Text #B8CC75, Border #B8CC75/55
- A–Z:    Text #45B87A, Border #45B87A/55
- Prefix: Text #35AABC, Border #35AABC/55

================================================================================
SECTION 10: FOOTER (LOCKED)
================================================================================

FOOTER CONTAINER
- Text alignment: Center
- Font size: 15px (text-[15px])
- Text color: White at 49% opacity
- Font weight: Normal
- Line height: Snug (leading-snug)
- Letter spacing: Wide (tracking-wide)
- Border: Bottom only, white at 7% opacity
- Padding top: 1rem (pt-4)
- Padding bottom: 1.25rem (pb-5)
- Negative margins: -mt-4 -mb-5 (to counteract parent gap-12)

FOOTER TEXT
- Content: "SuperTopics.app © 2025 • All Rights Reserved • You Dig?"
- Separator: • (bullet)

================================================================================
SECTION 11: REUSE GUIDELINES FOR PAGE 2 AND BEYOND
================================================================================

MANDATORY REUSE (DO NOT MODIFY)

1. Page Shell
   - Use PageShell component exactly as implemented
   - Do not change padding, max-width, or background

2. Header
   - Use MemberHeader component exactly as implemented
   - Do not modify logo size, spacing, or navigation elements

3. Hero Module
   - Use HeroModule component for all Builder pages
   - Follow headline word count rules (3-4 + 2-3 words)
   - Do not modify spacing values marked as LOCKED

4. Builder Stepper
   - Use BuilderStepper component with appropriate activeStep
   - Do not modify circle sizes, colors, or label styling

5. Base Table
   - Reuse table container, header, and row styling exactly
   - Additional columns may be added using same cell styling
   - Hover behavior must remain: bg-white/[0.04]
   - Row dividers must remain: divide-white/5
   - Tag pills must use source color palette

6. Tag Pills
   - Use identical pill styling for all source indicators
   - Colors are locked to source palette
   - Active/inactive states follow defined opacity rules

7. Footer
   - Include footer on all Builder pages
   - Use exact text, spacing, and negative margin values

ALLOWED MODIFICATIONS

1. Table Columns
   - New columns may be added to the table
   - New columns must use same cell padding (px-8 py-5)
   - New header cells must use same styling (18px, bold, 86% white, uppercase)

2. Card Content
   - Card interiors may have different content
   - Card container styling must match (surface/40, rounded-3xl, border-white/10)

3. Button Text
   - Button labels may change
   - Button styling must match defined button types

FORBIDDEN MODIFICATIONS

- Do not change any color values
- Do not change any opacity values
- Do not change any font sizes for headers, labels, or body text
- Do not change border radius values
- Do not change shadow or glow intensities
- Do not change spacing or padding values
- Do not introduce new colors outside the defined palette

================================================================================
SECTION 12: QUICK REFERENCE — KEY VALUES
================================================================================

COLORS
- Background:        #0B1220
- Surface:           #161c27
- Primary:           #7A5CFA
- Accent:            #3CCFB1
- Midnight Blue:     #1A2754
- Electric Blue:     #6B9BD1
- Top 10 Orange:     #CC7A3D / #FF8A3D (button variant)
- Child Yellow:      #B8CC75 / #D4E882 (button variant)
- A–Z Emerald:       #45B87A / #4DD68A (button variant)
- Prefix Teal:       #35AABC / #39C7D8 (button variant)

GRAPHITE GRADIENT (PILLS & BUTTONS)
- From: #2E3338
- To:   #1E2228

COMMON OPACITIES
- Card backgrounds:     40%
- Border (default):     10%
- Border (hover):       20%
- Table header text:    86%
- Table body text:      86%
- Session button text:  82%
- Topic Sources label:  68%
- Footer text:          49%
- Inactive pill text:   70%
- Inactive pill border: 35%

FONT SIZES
- Hero headline:        3.4rem / 4.2rem
- Hero description:     1.5rem
- Step title:           1.875rem
- Step description:     1.125rem
- Table headers:        18px
- Generator buttons:    17px
- Topic source pills:   14px
- Table tag pills:      12px
- Footer:               15px

BORDER RADIUS
- Cards:                1.5rem (rounded-3xl)
- Table container:      1rem (rounded-2xl)
- Buttons:              0.75rem (rounded-xl)
- Pills:                9999px (rounded-full)
- Input field:          1rem (rounded-2xl)

================================================================================
END OF BRAND FOUNDATIONS REPORT
================================================================================
