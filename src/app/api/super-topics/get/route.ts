import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { super_topics } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "id is required" },
                { status: 400 }
            );
        }

        const [topic] = await db
            .select()
            .from(super_topics)
            .where(eq(super_topics.id, id))
            .limit(1);

        if (!topic) {
            return NextResponse.json({ error: "Super topic not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            topic,
        });
    } catch (error) {
        console.error("[Super Topics] Get error:", error);
        return NextResponse.json(
            { error: "Failed to get super topic" },
            { status: 500 }
        );
    }
}
