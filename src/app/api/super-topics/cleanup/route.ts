import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { super_topics } from "@/server/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Cleanup API for Super Topics
 * 
 * This endpoint:
 * 1. Resets all is_winner flags to false
 * 2. For sessions with more than 13 rows, keeps only top 13 by growth_fit_score
 * 3. Reports what was cleaned up
 */
export async function POST(request: NextRequest) {
    try {
        const { sessionId, deleteAll } = await request.json();

        // If deleteAll is true, remove all super_topics for this session
        if (deleteAll && sessionId) {
            const deleted = await db
                .delete(super_topics)
                .where(eq(super_topics.source_session_id, sessionId))
                .returning({ id: super_topics.id });

            console.log(`[Cleanup] Deleted ${deleted.length} super_topics for session ${sessionId}`);

            return NextResponse.json({
                success: true,
                message: `Deleted all ${deleted.length} super topics for session. Page 4 will regenerate fresh data.`,
                deleted: deleted.length,
            });
        }

        // Otherwise, do a soft cleanup
        const results: string[] = [];

        // Step 1: Reset all is_winner flags to false for the session
        if (sessionId) {
            await db
                .update(super_topics)
                .set({ is_winner: false })
                .where(eq(super_topics.source_session_id, sessionId));

            results.push("Reset is_winner to false for all phrases in session");
        }

        // Step 2: Count total rows
        const topics = await db
            .select()
            .from(super_topics)
            .where(sessionId ? eq(super_topics.source_session_id, sessionId) : sql`1=1`)
            .orderBy(desc(super_topics.growth_fit_score));

        results.push(`Found ${topics.length} total super_topics`);

        // Step 3: If more than 13, delete excess
        if (sessionId && topics.length > 13) {
            // Get IDs to keep (top 13)
            const idsToKeep = topics.slice(0, 13).map(t => t.id);
            const idsToDelete = topics.slice(13).map(t => t.id);

            // Delete excess
            for (const id of idsToDelete) {
                await db.delete(super_topics).where(eq(super_topics.id, id));
            }

            results.push(`Deleted ${idsToDelete.length} excess rows (keeping top 13)`);
        }

        // Step 4: Report final state
        const finalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(super_topics)
            .where(sessionId ? eq(super_topics.source_session_id, sessionId) : sql`1=1`);

        const winnerCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(super_topics)
            .where(sessionId
                ? sql`source_session_id = ${sessionId} AND is_winner = true`
                : sql`is_winner = true`
            );

        return NextResponse.json({
            success: true,
            message: "Cleanup complete",
            results,
            finalState: {
                totalRows: Number(finalCount[0]?.count || 0),
                winners: Number(winnerCount[0]?.count || 0),
            },
        });
    } catch (error) {
        console.error("[Cleanup] Error:", error);
        return NextResponse.json(
            { error: "Cleanup failed" },
            { status: 500 }
        );
    }
}
