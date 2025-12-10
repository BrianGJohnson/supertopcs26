import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { super_topics } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
            return NextResponse.json(
                { error: "session_id is required" },
                { status: 400 }
            );
        }

        // Fetch super topics for this session (max 13)
        const topics = await db
            .select()
            .from(super_topics)
            .where(eq(super_topics.source_session_id, sessionId))
            .orderBy(desc(super_topics.growth_fit_score))
            .limit(13);

        console.log(`[Super Topics List] Found ${topics.length} topics for session`);


        return NextResponse.json({
            success: true,
            topics,
            count: topics.length,
        });
    } catch (error) {
        console.error("[Super Topics List] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch super topics" },
            { status: 500 }
        );
    }
}
