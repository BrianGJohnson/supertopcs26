# Design System

This document captures the core tokens, typography, color palette, and header rules that keep the public experience consistent today and that will guide members-area work in the future. It references the dark, inky palette and Inter typography that are already implemented in the live layout so designers and engineers stay aligned. It points to `globals.css` tokens such as `--bg-main` alongside companion `--app-bg-base` (the latter mirrors the Mantine dark palette slot used for surfaces), ensuring the doc tracks the actual values.

## Current Token Values (Code Truth)
- Layout:
	- `--content-max`: 900px
	- `--content-max-wide`: 1200px
- Backgrounds and text:
	- `--bg-main`: #0B1220
	- `--app-bg-base`: #060B12
	- `--text-primary`: #E7ECF5
	- `--text-secondary`: #E3E7EC
- Primary accents:
	- `--accent-1`: #f7fbff
	- `--accent-2`: #3a7bd5
- Supporting accents (currently unused):
	- `--accent-mint`: #3CCFB1
	- `--accent-violet`: #7A5CFA
	- `--accent-amber`: #E9A23B
- Typography:
	- `--font-h1-size`: 84px
	- `--font-h1-weight`: 900
	- `--font-h2-size`: 48px
	- `--font-h2-weight`: 800
	- `--font-body-size`: 24px
	- `--font-body-weight`: 400
	- `--font-nav-size`: 16px
	- `--font-nav-weight`: 500
- Line heights:
	- `--line-h1`: 1.10
	- `--line-h2`: 1.2
	- `--line-body`: 1.4

1. **Purpose and Scope** — Define why the design system exists, which surfaces it governs today (public hero, header), and what future areas (members dashboard, tools) must adopt it. This section anchors every guideline to the shared goals of coherence and measurable parity across the platform.

Checklist:
- Confirm every new surface references this document before shipping design changes.
- Make adoption of the hero headline and color tokens a gating criterion for public and members-area work.
- Surface departures for review in the change log described below.

## How to Use This System

Every new page or component should begin by referencing the tokens documented here rather than inventing new colors or spacing. Gradient typography must follow the approved hero headline rules so descenders render consistently, and the same palette tokens should carry across public and members areas. If layout adjustments are required, constrain them to the spacing increments listed below and rely on token-driven margins/padding. This practice keeps every surface aligned, minimizes duplication, and makes regressions easier to spot during QA.

2. **Typography System** — Enumerate each font role (hero, heading, body, nav), its Inter weight/size/line-height, and how to apply the tokens defined in `globals.css`; Mantine defaults (h1 3.3rem line-height 1.2, h2 2.4rem) remain secondary.

Checklist:
- Reference the hero, heading, and body tokens rather than creating new scales.
- Keep typography alignment consistent with the declared line-height tokens.
- Apply the specified tokens inside both Mantine components and raw markup.

### Mobile Scaling Rules

Hero H1 should scale to 48–56px on mobile breakpoints, H2 should scale to 32–36px, and body text should remain within 20–22px so typography retains rhythm without manual overrides.

Checklist:
- Apply the hero/token sizes in `globals.css` for desktop.
- Drop only within the specified mobile range when scaling down.
- Avoid custom font-size overrides outside this guidance.

3. **Color System** — Describe the background, surface, primary/secondary text, accent, and gradient values together with any accessibility notes on contrast.

Checklist:
- Use the defined accent and text tokens directly in layouts.
- Verify contrast ratios against text token guidance.
- Reference the gradient and background tokens whenever a new surface is introduced.

4. **Token and Variable Contract** — Define every CSS variable (e.g., `--font-h1-size`, `--accent-1`, `--text-secondary`), the naming convention, and the approved extension pattern.

Checklist:
- Extend the system only by adding variables with the established prefix/range convention.
- Document new variables inside this file before merging.
- Avoid inline hard-coded color or spacing values in components.

5. **Spacing and Layout Rules** — Specify the container widths, gutter spacing, and repeatable increments that new work must reuse instead of inventing ad hoc values.

Checklist:
- Reuse the listed container widths and gutters when creating new sections.
- Treat the spacing increments as authoritative instead of arbitrary pixel values.
- Align hero and stacking margins with the shared token spacing in `globals.css`.

6. **Header and Navigation Standards** — Record the logo asset/size, nav typography, alignment, and padding rules that keep the header consistent; `.publicHeaderLogo` is the authoritative sizing rule (height 92px desktop, 80px on screens ≤768px, width auto, display block).

Checklist:
- Apply the logo sizing token before customizing the header.
- Maintain the declared nav typography and spacing when extending navigation.
- Keep header padding/placement consistent with the token values.

7. **Component Styling Conventions** — Clarify how components (buttons, hero, cards) should reference tokens, structure their markup, and avoid inline overrides.

Checklist:
- Pull colors/spacing directly from this doc’s tokens within components.
- Keep shared gradients and palettes referenced from `globals.css` rather than duplicated in components.
- Eschew inline overrides for spacing; instead, compose tokens through CSS classes.

8. **Do and Do Not List** — List preferred behaviors (use tokens and shared gradients) and prohibited ones (hard-coded colors/spacing inside components).

Checklist:
- Do rely on the shared tokens and gradient rules.
- Do not inject new colors or spacing that hasn’t been reviewed.
- Do keep component styling aligned with the defined palette.

9. **Update Protocol** — Explain how to propose token changes, which documentation (this file plus its CSS counterparts) to update, and the visual regression checks required before merging.

Checklist:
- Document token changes in this file and the associated CSS before code review.
- Run visual regression checks before preparing the PR.
- Archive any intentional deviations alongside the change request.

## Application Layer

Components should never hard-code colors, spacing, or typography; instead, they consume the `globals.css` tokens listed above. Utility classes or component wrappers may compose those tokens for spacing/margins, but inline overrides should be avoided because they bypass the system’s measurements. Always reference the gradient headline rules when invoking hero typography so the WebKit clipping fix remains intact. This ensures public and members surfaces stay visually aligned and simplifies future updates.

## Starter Template

Use this minimal structure as the baseline for new hero sections or landing pages:

```html
<section class="heroStack">
	<h1 class="heroHeadline">
		<span>Stop Guessing.</span>
		<span>Start Growing.</span>
	</h1>
	<p class="heroLead">Text sourced from `--text-secondary` keeps the supporting copy consistent.</p>
</section>
```

The template relies on the shared hero stack, gradient rules, and text tokens so nothing needs to be reinvented for each campaign.

## Gradient Headline Implementation Rules

WebKit still clips descenders when gradients are applied directly to text, so all gradient headlines must follow the approved gradient headline implementation to stay consistent and avoid rendering bugs.

Required CSS pattern:
- Apply the gradient directly to `.heroHeadline` and never to the individual spans.
- Use `padding-right: 6px` with `padding-top`/`padding-bottom: 2px` to expand the paint box and counterbalance that extra space with `margin-right: -6px` so the visual alignment stays fixed.
- Set `background-origin: padding-box` so the gradient covers the extended paint region, and keep the wrapping spans `display: block` for consistent line control.
- Avoid mask-image, clip-text, pseudo-elements, and overflow hacks—this pattern is the single source of truth for gradient headlines across the site.

Do / Do Not
- **DO** use the padding plus negative margin technique to expand the paint area without shifting layout.
- **DO NOT** apply gradients to the spans themselves.
- **DO NOT** rely on `-webkit-text-fill-color` alone to fix clipping.
- **DO NOT** render gradient headlines via pseudo-element clones of the text.
