import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { super_topics } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const { superTopicId, lockedTitle, thumbnailPhrases } = await request.json();

        if (!superTopicId || !lockedTitle) {
            return NextResponse.json(
                { error: "superTopicId and lockedTitle are required" },
                { status: 400 }
            );
        }

        // Update the super topic with the locked title
        const [updated] = await db
            .update(super_topics)
            .set({
                locked_title: lockedTitle,
                title_locked_at: new Date(),
                // Store thumbnail phrases for package page
                notes: JSON.stringify({ thumbnailPhrases: thumbnailPhrases || [] }),
            })
            .where(eq(super_topics.id, superTopicId))
            .returning();

        console.log(`[Title] Locked title: "${lockedTitle}"`);

        return NextResponse.json({
            success: true,
            message: "Title locked",
            topic: updated,
        });
    } catch (error) {
        console.error("[Title] Lock error:", error);
        return NextResponse.json(
            { error: "Failed to lock title" },
            { status: 500 }
        );
    }
}
