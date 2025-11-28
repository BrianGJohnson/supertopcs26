# Super Topics Builder — AI Agent Instructions

This file provides instructions for AI coding agents (Claude, Copilot, etc.) working on this codebase.

---

## ⚠️ CRITICAL: Brand Voice — Read First

**Never use SEO/keyword terminology.** This is a viewer-focused tool, not an SEO tool.

| ❌ Never Say | ✅ Always Say |
|-------------|---------------|
| Keyword | Topic |
| Search volume | Viewer interest |
| Rankings | Viewer appeal |
| SEO | Topic discovery |
| Optimize | Refine |

**Full terminology guide:** `/docs/brand-voice-guide.md`

The core philosophy is **"Built for the Viewer"** — every feature helps creators understand what their audience wants to watch, not how to game algorithms.

---

## 🎨 Before Building Any UI

**Always check these docs first:**

| Doc | Purpose |
|-----|---------|
| `/docs/brand-voice-guide.md` | **Terminology, tone, viewer-first philosophy** |
| `/docs/brand-guidelines.md` | Colors, spacing, typography, card styles, table styles |
| `/docs/modal-style-guide.md` | Modal patterns, button styles, text sizes |
| `/docs/header-style-guide.md` | Header and navigation patterns |
| `/docs/architecture-guide.md` | Folder structure, modularity rules, component isolation |

**Do not deviate from documented values.** If a color, font size, opacity, or spacing value is defined in the docs, use it exactly.

---

## 🏗️ Architecture Rules

### Folder Structure
- Each page lives in its own folder under `/src/app/`
- Page-specific components go in a `_components/` subfolder
- Shared/reusable components go in `/src/components/`
- Hooks go in `/src/hooks/`
- Types go in `/src/types/`
- Utilities go in `/src/lib/utils/`

### Component Isolation
- **Keep components isolated** — a bug in one component should not break others
- **No global state unless absolutely necessary** — prefer props and local state
- **Co-locate related code** — if a component is only used on one page, keep it in that page's `_components/` folder
- **Extract to shared only when reused** — don't prematurely abstract

### Page Independence
- Each page should be independently loadable
- Avoid cross-page dependencies
- Use route-based code splitting (Next.js App Router handles this)

---

## 🗄️ Database

- **ORM**: Drizzle ORM
- **Database**: Supabase PostgreSQL
- **Schema**: `/src/server/db/schema.ts`
- **Types**: `/src/types/database.ts`

When modifying database:
1. Update schema in `/src/server/db/schema.ts`
2. Run `npx drizzle-kit push` to sync
3. Update TypeScript types in `/src/types/database.ts`
4. Update any affected hooks in `/src/hooks/`

---

## 🎯 Key Brand Values (Quick Reference)

### Colors
- Background: `#0B1220`
- Surface: `#161c27`
- Primary: `#7A5CFA` (purple)
- Accent: `#3CCFB1` (teal)
- Brand Green: `#2BD899`
- Midnight Blue: `#1A2754`

### Source Colors (Generator Buttons & Tags)
- Top 10: `#FF8A3D` (orange)
- Child: `#D4E882` (yellow-green)
- A–Z: `#4DD68A` (emerald)
- Prefix: `#39C7D8` (teal)

### Common Opacities
- Card backgrounds: 40%
- Borders: 10%
- Description text: 60%
- Secondary text: varies (see brand-guidelines.md)

### Font Sizes
- Modal title: `1.375rem` (22px)
- Body/description text: `1.125rem` (18px)
- Table headers: `18px`
- Small labels: `14px`

---

## ⚠️ Common Mistakes to Avoid

1. **Don't use SEO terminology** — Say "topic" not "keyword", see brand-voice-guide.md
2. **Don't use arbitrary colors** — Always reference the palette
3. **Don't use `text-sm` or `text-lg` in modals** — Use exact rem values from modal-style-guide
4. **Don't create components in `/src/components/` unless they're reused across multiple pages**
5. **Don't modify shared components without checking all usages**
6. **Don't add new dependencies without discussion**
7. **Don't frame benefits around algorithms** — Frame around VIEWERS

---

## 📁 Current Folder Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── members/           # Protected member pages
│   │   └── build/        # Builder flow
│   │       ├── seed/     # Step 1: Seed page
│   │       │   └── _components/  # Page-specific components
│   │       ├── refine/   # Step 2: Refine page
│   │       └── ...       # Other steps
│   └── ...
├── components/            # Shared/reusable components
│   ├── ui/               # Base UI primitives (Modal, etc.)
│   ├── layout/           # Layout components (Header, PageShell)
│   └── ...
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
├── server/               # Server-side code (DB, etc.)
└── types/                # TypeScript type definitions
```

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Push database schema changes
npx drizzle-kit push

# Check for TypeScript errors
npx tsc --noEmit
```
