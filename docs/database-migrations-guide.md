# Database Migrations Guide

## Overview

This project uses **Drizzle ORM** to manage the PostgreSQL database hosted on Supabase. All schema changes should go through Drizzle, not the Supabase dashboard.

## Quick Reference

### Add a Column

1. Edit the schema file: `src/server/db/schema.ts`
2. Add your column to the appropriate table
3. Run: `npx drizzle-kit push`

### Example: Adding a Boolean Column

```typescript
// In src/server/db/schema.ts, find the table and add:
is_hidden: boolean('is_hidden').default(false),
```

Then run:
```bash
npx drizzle-kit push
```

---

## How It Works

### Schema File Location
```
src/server/db/schema.ts
```

This file defines ALL tables and columns. Drizzle reads this and syncs it to the database.

### Config File
```
drizzle.config.ts
```

This tells Drizzle where to find the schema and how to connect to the database.

### Database Connection

The `DATABASE_URL` in `.env.local` provides direct PostgreSQL access:
```
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres
```

---

## Common Operations

### 1. Add a New Column

```typescript
// src/server/db/schema.ts
export const seed_analysis = pgTable('seed_analysis', {
  // ... existing columns ...
  
  // Add new column here:
  is_hidden: boolean('is_hidden').default(false),
});
```

```bash
npx drizzle-kit push
```

### 2. Add a New Table

```typescript
// src/server/db/schema.ts
export const new_table = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// Don't forget to export types:
export type NewTable = typeof new_table.$inferSelect;
export type InsertNewTable = typeof new_table.$inferInsert;
```

```bash
npx drizzle-kit push
```

### 3. View Pending Changes (Dry Run)

```bash
npx drizzle-kit push --dry-run
```

### 4. Generate Migration Files (Optional)

If you want SQL migration files for version control:
```bash
npx drizzle-kit generate
```

Migration files go to the `drizzle/` folder.

---

## Column Types Reference

```typescript
import { pgTable, text, timestamp, integer, boolean, uuid, jsonb } from 'drizzle-orm/pg-core';

// Common column types:
id: uuid('id').primaryKey().defaultRandom(),
name: text('name').notNull(),
count: integer('count').default(0),
is_active: boolean('is_active').default(true),
metadata: jsonb('metadata'),
created_at: timestamp('created_at').defaultNow(),

// Foreign key:
session_id: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
```

---

## Troubleshooting

### Error: "Column does not exist"

The code is trying to use a column that hasn't been added to the database yet.

**Solution:**
1. Add the column to `src/server/db/schema.ts`
2. Run `npx drizzle-kit push`

### Error: "Cannot find project ref" (Supabase CLI)

Don't use `supabase` CLI for migrations. Use Drizzle instead:
```bash
npx drizzle-kit push
```

### Error: "Access token not provided"

This is a Supabase CLI error. Ignore it - use Drizzle:
```bash
npx drizzle-kit push
```

### Error: "Connection refused"

Check that `DATABASE_URL` is set correctly in `.env.local`.

---

## DO NOT

- ❌ Edit tables directly in Supabase dashboard
- ❌ Use `supabase db push` or `supabase migration`
- ❌ Manually write SQL migrations (let Drizzle handle it)

## DO

- ✅ Edit `src/server/db/schema.ts` for all schema changes
- ✅ Run `npx drizzle-kit push` to apply changes
- ✅ Export types for new tables/columns

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/server/db/schema.ts` | Database schema definition |
| `drizzle.config.ts` | Drizzle configuration |
| `.env.local` | Contains `DATABASE_URL` |
| `drizzle/` | Generated migration files (optional) |
