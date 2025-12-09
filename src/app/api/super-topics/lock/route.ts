import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { super_topics } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const { superTopicId, selectedFormats, notes } = await request.json();

        if (!superTopicId) {
            return NextResponse.json(
                { error: "superTopicId is required" },
                { status: 400 }
            );
        }

        // Get the super topic to find its session
        const [topic] = await db
            .select()
            .from(super_topics)
            .where(eq(super_topics.id, superTopicId))
            .limit(1);

        if (!topic) {
            return NextResponse.json({ error: "Super topic not found" }, { status: 404 });
        }

        // Reset all winners in this session to false
        if (topic.source_session_id) {
            await db
                .update(super_topics)
                .set({ is_winner: false })
                .where(eq(super_topics.source_session_id, topic.source_session_id));
        }

        // Set this one as the winner with user selections
        // Store selectedFormats in alternate_formats and notes in notes field
        const [updated] = await db
            .update(super_topics)
            .set({
                is_winner: true,
                alternate_formats: selectedFormats || [],
                notes: notes || null,
            })
            .where(eq(super_topics.id, superTopicId))
            .returning();

        console.log(`[Super Topics] Locked winner: "${topic.phrase}"`);
        console.log(`[Super Topics] Selected formats: ${(selectedFormats || []).join(", ")}`);
        if (notes) console.log(`[Super Topics] Notes: ${notes}`);

        return NextResponse.json({
            success: true,
            message: "Video locked as winner",
            topic: updated,
        });
    } catch (error) {
        console.error("[Super Topics] Lock error:", error);
        return NextResponse.json(
            { error: "Failed to lock super topic" },
            { status: 500 }
        );
    }
}
