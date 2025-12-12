import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { super_topics } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { debugLog, debugError } from "@/lib/debug-logger";

export async function POST(request: NextRequest) {
    debugLog('TitleLock', '🔒 Lock endpoint called');

    try {
        const { superTopicId, lockedTitle, thumbnailPhrases } = await request.json();

        debugLog('TitleLock', 'Request received', { superTopicId, lockedTitle, thumbnailPhrases });

        if (!superTopicId || !lockedTitle) {
            debugError('TitleLock', 'Missing required fields', { superTopicId: !!superTopicId, lockedTitle: !!lockedTitle });
            return NextResponse.json(
                { error: "superTopicId and lockedTitle are required" },
                { status: 400 }
            );
        }

        // Update the super topic with the locked title and first thumbnail phrase
        const firstPhrase = thumbnailPhrases && thumbnailPhrases.length > 0 ? thumbnailPhrases[0] : null;

        const [updated] = await db
            .update(super_topics)
            .set({
                locked_title: lockedTitle,
                title_locked_at: new Date(),
                // Save the first/primary thumbnail phrase
                thumbnail_phrase: firstPhrase,
                // Store all thumbnail phrases for package page
                notes: JSON.stringify({ thumbnailPhrases: thumbnailPhrases || [] }),
            })
            .where(eq(super_topics.id, superTopicId))
            .returning();

        debugLog('TitleLock', '✅ Title locked successfully', { id: updated?.id, title: lockedTitle });
        console.log(`[Title] Locked title: "${lockedTitle}"`);

        return NextResponse.json({
            success: true,
            message: "Title locked",
            topic: updated,
        });
    } catch (error) {
        debugError('TitleLock', 'Lock failed', error);
        console.error("[Title] Lock error:", error);
        return NextResponse.json(
            { error: "Failed to lock title" },
            { status: 500 }
        );
    }
}
