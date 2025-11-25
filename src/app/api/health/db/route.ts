import { db, health_checks } from '@/server/db';

export async function GET() {
  try {
    const inserted = await db.insert(health_checks).values({ note: 'test from /api/health/db' }).returning();
    const last = await db.select().from(health_checks).orderBy(health_checks.created_at.desc()).limit(1);

    if (!last || last.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'no rows returned' }), { status: 500 });
    }

    const lastRow = last[0];

    return new Response(
      JSON.stringify({ ok: true, lastId: lastRow.id, lastNote: lastRow.note }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
}
