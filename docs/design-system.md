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

1. **Purpose and Scope** — Explain why the design system exists, which parts of the platform it covers today (public hero, header) and what future areas (members dashboard) are expected to adopt it.
2. **Typography System** — List each font role (hero, heading, body, nav), its Inter weight/size/line-height, and how to apply the tokens defined in `globals.css`. Mantine theme defaults (h1 3.3rem line-height 1.2, h2 2.4rem, h3 1.75rem) are also available and remain secondary to the CSS tokens above.
3. **Color System** — Document the background, surface, primary/secondary text, accent, and gradient values plus any accessibility notes on contrast.
4. **Token and Variable Contract** — Describe every CSS variable (e.g., `--font-h1-size`, `--accent-1`, `--text-secondary`), the naming convention, and how to extend safely.
5. **Spacing and Layout Rules** — Define the container widths, gutter spacing, and any spacing increments that stakeholders should reuse instead of hard-coding new values.
6. **Header and Navigation Standards** — Capture the logo asset and size, nav typography, alignment, and padding rules that keep the header consistent across screens. The single winning rule controlling the logo size is `.publicHeaderLogo` (height 92px desktop, 80px on screens ≤768px, width auto, display block).
7. **Component Styling Conventions** — Explain how to reference tokens inside components (buttons, hero, cards) and the preferred structure to avoid inline overrides.
8. **Do and Do Not List** — Provide clear examples of preferred practices (use tokens and shared gradients) and prohibited behaviors (hard-coded colors/spacing inside components).
9. **Update Protocol** — Detail how to propose token changes, what documentation to update (this file plus related CSS), and how to validate visual regressions before merging.
