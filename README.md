# Super Topics

YouTube topic research and video package builder.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Database

Schema is managed by Drizzle. Source of truth: `src/server/db/schema.ts`

```bash
# Push schema changes to database
npx drizzle-kit push --force

# View database in browser
npx drizzle-kit studio
```

## Project Structure

```
src/
├── app/                    # Next.js pages
│   └── members/build/      # Builder wizard (seed → refine → super → title → package → upload)
├── components/             # React components
├── hooks/                  # Data hooks (useSessions, useSeedPhrases)
├── lib/                    # Utilities (supabase client)
├── server/db/              # Drizzle schema
└── types/                  # TypeScript types
```

## Database Tables

- **sessions** - Research workspaces
- **seeds** - Generated phrases from autocomplete
- **seed_analysis** - Scoring and analysis per seed
