import { db } from '@/server/db';
import { sessions } from '@/server/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Simple connection test - just count sessions
    const result = await db.select({ count: sql<number>`count(*)` }).from(sessions);
    
    return new Response(
      JSON.stringify({ ok: true, sessionCount: result[0]?.count ?? 0 }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}
