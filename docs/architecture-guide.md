================================================================================
SUPER TOPICS BUILDER — ARCHITECTURE & MODULARITY GUIDE v1.0
================================================================================

This document defines the architectural principles, folder structure, and 
modularity rules for the Super Topics Builder application. Follow these 
guidelines to maintain a scalable, maintainable, and performant codebase.

================================================================================
SECTION 1: CORE PRINCIPLES
================================================================================

1. ISOLATION
   - Each page should be self-contained
   - A bug in one component should not crash the entire app
   - Components should have clear boundaries and responsibilities

2. MODULARITY
   - Build in small, composable pieces
   - Prefer many small files over few large files
   - Each file should do one thing well

3. CO-LOCATION
   - Keep related code together
   - Page-specific components live with their page
   - Only extract to shared when genuinely reused

4. INDEPENDENCE
   - Pages should load independently
   - Minimize cross-page dependencies
   - Use route-based code splitting (automatic with Next.js App Router)

5. PERFORMANCE
   - Smaller, isolated components = faster page loads
   - Tree-shaking works better with modular code
   - Lazy load heavy components when possible

================================================================================
SECTION 2: FOLDER STRUCTURE
================================================================================

ROOT STRUCTURE
```
/
├── CLAUDE.md              # AI agent instructions (always read first)
├── docs/                  # Documentation (style guides, API docs)
├── public/                # Static assets (images, icons, branding)
├── scripts/               # Build/utility scripts
├── src/                   # Application source code
├── supabase/              # Database migrations
├── drizzle.config.ts      # Drizzle ORM configuration
├── next.config.ts         # Next.js configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

SOURCE FOLDER STRUCTURE
```
src/
├── app/                   # Next.js App Router (pages & API routes)
├── components/            # SHARED components (used across multiple pages)
├── constants/             # App-wide constants (colors, routes)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities, helpers, third-party wrappers
├── server/                # Server-side code (database, etc.)
└── types/                 # TypeScript type definitions
```

================================================================================
SECTION 3: PAGE STRUCTURE PATTERN
================================================================================

Every page in the `/members/` flow should follow this pattern:

```
src/app/members/build/[step-name]/
├── page.tsx               # Main page component (thin orchestrator)
└── _components/           # Page-specific components
    ├── ComponentA.tsx
    ├── ComponentB.tsx
    └── ComponentC.tsx
```

WHY THE `_components/` FOLDER?
- The underscore prefix tells Next.js to ignore it for routing
- Keeps page-specific components co-located with their page
- Makes it obvious these components are NOT shared
- Easy to find all code related to a specific page

EXAMPLE: SEED PAGE
```
src/app/members/build/seed/
├── page.tsx               # Orchestrates the page, manages shared state
└── _components/
    ├── SeedCard.tsx       # The seed input card with generator buttons
    ├── Step1Card.tsx      # The status/progress card
    ├── TopicsTable.tsx    # The phrases table
    └── PhraseSelectModal.tsx  # Modal for selecting phrases
```

================================================================================
SECTION 4: COMPONENT PLACEMENT RULES
================================================================================

WHEN TO USE `_components/` (Page-Specific)
- Component is only used on ONE page
- Component has page-specific logic or styling
- Component is tightly coupled to the page's data/state

WHEN TO USE `/src/components/` (Shared)
- Component is used on TWO OR MORE pages
- Component is a generic UI primitive (Modal, Button, etc.)
- Component is part of the app shell (Header, Footer, PageShell)

DECISION FLOWCHART
```
Is this component used on multiple pages?
├── YES → Put in /src/components/
└── NO → Put in page's _components/ folder
         │
         └── Will it LIKELY be reused soon?
             ├── YES → Still put in _components/, extract later when needed
             └── NO → Definitely put in _components/
```

RULE: Don't prematurely abstract. It's easy to move a component from 
`_components/` to `/src/components/` later. It's harder to untangle 
a shared component that shouldn't have been shared.

================================================================================
SECTION 5: SHARED COMPONENTS STRUCTURE
================================================================================

```
src/components/
├── ui/                    # Base UI primitives
│   ├── Modal.tsx          # Generic modal component
│   ├── Button.tsx         # (if needed) Generic button
│   └── ...
├── layout/                # Layout components
│   ├── PageShell.tsx      # Page wrapper with background, padding
│   ├── MemberHeader.tsx   # Header for member pages
│   └── HeroModule.tsx     # Hero section component
├── stepper/               # Builder stepper
│   └── BuilderStepper.tsx # Step progress indicator
├── icons/                 # Custom icon components
│   └── SeedIcon.tsx       # Seedling icon variants
└── SessionMenu.tsx        # Session dropdown (used in header)
```

NAMING CONVENTIONS
- PascalCase for component files: `MyComponent.tsx`
- Match filename to default export: `MyComponent.tsx` exports `MyComponent`
- Group by feature/purpose, not by type

================================================================================
SECTION 6: HOOKS STRUCTURE
================================================================================

```
src/hooks/
├── index.ts               # Re-exports all hooks
├── useSessions.ts         # Session CRUD operations
└── useSeedPhrases.ts      # Seed phrase operations
```

HOOK RULES
- One hook per file (or closely related hooks)
- Hooks should be reusable across pages
- Page-specific hooks can live in `_components/` or the page file itself
- Always handle loading and error states

================================================================================
SECTION 7: STATE MANAGEMENT
================================================================================

PREFER LOCAL STATE
- Use `useState` for component-local state
- Use props to pass data down
- Use callbacks to pass events up

WHEN TO LIFT STATE
- When two sibling components need the same data
- Lift to the nearest common ancestor (usually the page)

AVOID GLOBAL STATE
- No Redux, Zustand, or similar unless absolutely necessary
- React Context is OK for truly app-wide state (auth, theme)
- Most state should be local or server-fetched

SERVER STATE
- Use direct async calls in components (with useEffect)
- Consider React Query or SWR for complex caching needs
- Database operations go through hooks in `/src/hooks/`

================================================================================
SECTION 8: API ROUTES STRUCTURE
================================================================================

```
src/app/api/
├── autocomplete/
│   └── route.ts           # YouTube autocomplete API
├── health/
│   └── db/
│       └── route.ts       # Database health check
└── [future-endpoints]/
    └── route.ts
```

API ROUTE RULES
- One route per folder (Next.js App Router convention)
- Use `route.ts` as the filename
- Handle errors gracefully, return proper HTTP status codes
- Validate inputs before processing

================================================================================
SECTION 9: TYPE DEFINITIONS
================================================================================

```
src/types/
├── index.ts               # Re-exports all types
└── database.ts            # Database entity types
```

TYPE RULES
- Define types for all database entities
- Export types from a central location
- Use TypeScript strictly (no `any` unless unavoidable)
- Keep types in sync with Drizzle schema

================================================================================
SECTION 10: IMPORT ORDER CONVENTION
================================================================================

Organize imports in this order:

```typescript
// 1. React and Next.js
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party libraries
import { IconPlus, IconCheck } from "@tabler/icons-react";

// 3. Internal components (absolute imports)
import { Modal, ModalButton } from "@/components/ui/Modal";
import { PageShell } from "@/components/layout/PageShell";

// 4. Hooks
import { useSessions } from "@/hooks/useSessions";

// 5. Types
import type { Session } from "@/types/database";

// 6. Relative imports (local components)
import { SeedCard } from "./_components/SeedCard";

// 7. Styles (if any)
import styles from "./page.module.css";
```

================================================================================
SECTION 11: FILE SIZE GUIDELINES
================================================================================

COMPONENT FILES
- Aim for < 200 lines per component
- If a component exceeds 300 lines, consider splitting
- Extract sub-components to separate files

PAGE FILES
- Page files should be thin orchestrators
- Most logic should live in `_components/`
- Page file primarily handles:
  - Layout composition
  - Shared state management
  - Data fetching coordination

HOOK FILES
- One primary hook per file
- Helper functions can be in the same file
- If a hook exceeds 150 lines, consider splitting

================================================================================
SECTION 12: ERROR BOUNDARIES
================================================================================

RECOMMENDED PATTERN
- Wrap major sections in error boundaries
- A crash in one card shouldn't crash the whole page
- Use Next.js `error.tsx` for page-level errors

EXAMPLE STRUCTURE
```
src/app/members/build/seed/
├── page.tsx
├── error.tsx              # Page-level error boundary
├── loading.tsx            # Page-level loading state
└── _components/
    └── ...
```

================================================================================
SECTION 13: PERFORMANCE CONSIDERATIONS
================================================================================

CODE SPLITTING
- Next.js App Router automatically code-splits by route
- Each page only loads the JS it needs
- Isolated `_components/` means unused components aren't bundled

LAZY LOADING
- Use `dynamic()` for heavy components that aren't needed immediately
- Consider lazy loading modals until they're opened

BUNDLE SIZE
- Keep dependencies minimal
- Check bundle size impact before adding new packages
- Prefer lighter alternatives when available

================================================================================
SECTION 14: CHECKLIST FOR NEW PAGES
================================================================================

When creating a new page:

□ Create folder: `src/app/members/[section]/[page-name]/`
□ Create `page.tsx` as thin orchestrator
□ Create `_components/` folder for page-specific components
□ Add `loading.tsx` for loading state (optional)
□ Add `error.tsx` for error handling (optional)
□ Check `/docs/brand-guidelines.md` for styling
□ Use existing shared components from `/src/components/`
□ Only create new shared components if genuinely reusable

================================================================================
SECTION 15: CHECKLIST FOR NEW COMPONENTS
================================================================================

When creating a new component:

□ Decide: page-specific (`_components/`) or shared (`/src/components/`)?
□ Keep it focused — one responsibility per component
□ Define prop types with TypeScript interface
□ Handle loading and error states if data-dependent
□ Follow existing naming conventions
□ Check docs for relevant style guides
□ Add comments for complex logic

================================================================================
END OF ARCHITECTURE GUIDE
================================================================================
