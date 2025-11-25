# Agent UI Build Playbook (Primary Guide for Agents)

This is the primary document all agents must follow when building UI for Super Topics. The tech stack is Next.js (App Router), TypeScript, Mantine UI, Inter font, and minimal custom CSS. The focus is on speed by using Mantine primitives, theme tokens, and homegrown components instead of inventing new layouts or frameworks.

## Tech Stack and Purpose

- **Next.js 14+ (App Router)**: File-based routing, server/client components, SSR.
- **TypeScript**: Strict typing for props, events, and API responses.
- **Mantine UI**: Complete component library for layout, styling, forms, and data display.
- **Inter font**: Global typography standard loaded via Next.js font optimization.
- **Minimal custom CSS**: Only for gradient headlines, logo sizing, and token-driven global rules in `globals.css`.

The goal is to ship UI fast by composing Mantine primitives and homegrown components rather than writing new CSS or importing additional frameworks.

## Non-Negotiable Rules

1. **Use Mantine only for layout and styling.** No Tailwind, no Shadcn, no new CSS frameworks.
2. **Layout uses Stack, Group, Grid, SimpleGrid with `gap` and theme spacing.** Never write custom flexbox or grid CSS.
3. **Limit style props on a single component instance.** If you need more than 3-4 inline props, extract a reusable component or use `defaultProps` at the theme level.
4. **All colors come from the Mantine theme palette.** Reference 10-shade color palettes (e.g., `blue.6`, `gray.3`) instead of hard-coding hex values.
5. **All spacing uses theme tokens** (`xs`, `sm`, `md`, `lg`, `xl`). Do not hard-code pixel values for margins or gaps.

## Vertical Rhythm and Layout Decision Tree

Choose the right Mantine primitive based on the layout pattern:

- **Stack**: Vertical stacking with consistent gap. Use for hero sections, content columns, form fields.
- **Group**: Horizontal row with consistent gap. Use for button groups, nav links, inline badges.
- **SimpleGrid**: Equal-width grid columns with automatic wrapping. Use for card grids, stat panels, feature lists.
- **Grid**: Advanced grid with col spans and breakpoints. Use for dashboard layouts, asymmetric sections.

Always use theme spacing tokens for `gap`, `p`, `m`:
- `xs` = 10px
- `sm` = 12px
- `md` = 16px
- `lg` = 20px
- `xl` = 24px

Do not chase pixel-perfect spacing. Fix layout via Stack, Group, Grid and theme tokens—never custom CSS.

## Theme and Tokens as Single Source of Truth

The Mantine theme (`src/theme.ts`) defines:
- **10-shade color palettes** for brand colors (e.g., `blue`, `teal`, `gray`).
- **Global typography** using Inter font with weights 400, 500, 600, 700, 800.
- **Dark mode and SSR** handled via `MantineProvider` and `ColorSchemeScript` injected in the root layout.

Never hard-code colors or fonts in components. Reference theme tokens:
```tsx
<Button color="blue.6" />
<Text c="gray.7" />
<Box bg="gray.1" />
```

The theme also configures `defaultProps` for Button, Card, TextInput, etc., so every instance inherits consistent radius, size, and variant.

## Global defaultProps and Homegrown Components

Configure common components at the theme level to avoid repeating props:
- **Button**: Default `size="md"`, `radius="md"`, `variant="filled"`.
- **Card**: Default `withBorder`, `radius="md"`, `shadow="sm"`.
- **TextInput, PasswordInput, Textarea**: Default `size="md"`, `radius="md"`.

Create reusable homegrown components for repeated patterns:
- **HeroSection**: Stack with centered title, subtitle, CTA buttons.
- **LandingSection**: Stack or SimpleGrid for feature blocks, testimonials, pricing.
- **OnboardingStepLayout**: Stepper + form fields + navigation buttons.
- **StatCard**: Card with number, label, trend indicator.

Extract these when a pattern repeats 2-3 times. Store them in `src/components/` organized by domain (e.g., `marketing/`, `members/`, `shared/`).

## Header and Footer Lock-In

The public header and footer designs are considered “locked.” Agents must not change their structure, spacing, nav items, or visual style without an explicit request to redesign them.

**Header Pattern:**
- **Left:** Clickable logo + “Super Topics” wordmark that links to `/`.
- **Right:** Nav links `Blog`, `Pricing`, `Demo` (no Home link).

**Footer Pattern:**
- **Line 1:** “Super Topics” text on the left, `Docs`, `Changelog`, `Status` links on the right.
- **Line 2:** Centered copyright line.

Any future changes should be done by editing `PublicHeader`, `SiteFooter`, or `PublicLayout`, not scattered across pages.

## Client Components

- Any component that uses Next.js `Link` via `component={Link}` or other interactive Mantine elements (Button, Anchor, NavLink, Menu, etc) must be a client component.
- These files must start with `"use client";` as the first line.
- Example files: PublicHeader, SiteFooter, any navigation bars or interactive footers.

## Marketing vs Members Area

**Marketing pages** (landing, pricing, about):
- Use hero + section layouts built from Stack, Group, SimpleGrid, and Paper.
- Gradient headline follows the approved `heroHeadline` CSS pattern from `design-system.md`.
- Sections use SimpleGrid for cards, Group for button rows, Stack for vertical content.

**Members area** (dashboard, onboarding, settings):
- Use AppShell for persistent nav/header.
- Stepper for multi-step onboarding flows.
- Card, Table, Badge, Progress, Tabs for data display.
- Form fields use Mantine inputs with theme defaults.

Both areas reference the same theme tokens and homegrown components, so layout and styling stay consistent.

## Step-by-Step Workflow for Building Any New Page

1. **Identify page type**: Marketing or members area?
2. **List content blocks**: Hero, feature grid, CTA, form, data table, etc.
3. **Map blocks to Mantine primitives**:
   - Hero → Stack with Title, Text, Group of Buttons.
   - Feature grid → SimpleGrid with Paper or Card.
   - Form → Stack with TextInput, Button.
   - Data table → Table with Thead, Tbody, Tr, Td.
4. **Check for existing homegrown components**: If a pattern exists (e.g., HeroSection, StatCard), use it.
5. **Extract new components when patterns repeat**: If a block appears 2-3 times, move it to `src/components/`.
6. **Reference theme tokens only**: Colors via `c`, `bg`, `color`; spacing via `gap`, `p`, `m` with theme tokens.
7. **Test dark mode**: Ensure colors and backgrounds adapt via Mantine's `useMantineColorScheme`.

## Anti-Patterns Agents Must Avoid

- **No Tailwind or Shadcn.** The project uses Mantine exclusively.
- **No ad hoc CSS files for layout or spacing.** Use Stack, Group, Grid and theme tokens instead.
- **No inline styles for layout or colors.** Use Mantine's style props (`p`, `m`, `c`, `bg`) that reference the theme.
- **Do not chase pixel-perfect margins.** Fix layout via Stack, Group, Grid with theme spacing tokens.
- **Do not hard-code hex colors.** Use the 10-shade palettes from the theme.
- **Do not write custom flexbox or grid CSS.** Mantine's primitives handle all layout patterns.
- **Do not create new CSS frameworks or utility systems.** Mantine is the system.

## Quick Reference

**Layout primitives**: Stack, Group, Grid, SimpleGrid, Flex, Box, Paper, Card.  
**Theme spacing**: `xs`, `sm`, `md`, `lg`, `xl` for gaps, padding, margins.  
**Theme colors**: Reference via `c="blue.6"`, `bg="gray.1"`, `color="teal.5"`.  
**Typography**: Title (h1-h6), Text, Code, Mark, Highlight.  
**Forms**: TextInput, PasswordInput, Textarea, Select, Checkbox, Radio, Button.  
**Data display**: Table, Badge, Progress, Tabs, Accordion, Timeline.  
**Navigation**: AppShell, Stepper, Tabs, Breadcrumbs, Pagination.  

When in doubt, search the Mantine docs (mantine.dev) for the primitive that matches the layout pattern. Do not write custom CSS.

## Final Checklist Before Shipping

- [ ] All layout uses Stack, Group, Grid, or SimpleGrid with theme spacing.
- [ ] All colors reference the theme palette (e.g., `blue.6`, `gray.3`).
- [ ] No Tailwind, Shadcn, or custom CSS frameworks imported.
- [ ] Gradient headlines use the approved `heroHeadline` pattern from `design-system.md`.
- [ ] Repeated patterns are extracted into homegrown components in `src/components/`.
- [ ] Dark mode works via Mantine's color scheme without custom CSS.
- [ ] No inline styles for layout or colors—only Mantine style props that reference the theme.
