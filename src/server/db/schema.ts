import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const health_checks = pgTable('health_checks', {
  id: serial('id').primaryKey(),
  created_at: timestamp('created_at').defaultNow(),
  note: text('note').nullable(),
});
