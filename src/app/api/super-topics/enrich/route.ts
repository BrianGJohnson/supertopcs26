import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/server/db";
import { super_topics, channels } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// On-demand enrichment - higher quality for user-requested analysis
const ENRICHMENT_CONFIG = {
    model: "gpt-5-mini",
    temperature: 1,
    top_p: 1,
    max_completion_tokens: 2500,
    reasoning_effort: "medium" as const,
    response_format: { type: "json_object" as const },
} as const;

const ENRICHMENT_PROMPT = `You are providing detailed analysis for a YouTube video topic.

Generate rich text content following "Porch Talk" style:
- 8th grade reading ease, 6th-7th grade vocabulary
- Under 15 words per sentence
- No dashes or semicolons, only periods
- Friendly and direct, like texting a smart friend
- Use "you" and "your"

Return valid JSON:
{
  "viewerGoal": "<Learn|Validate|Solve|Vent|Be Entertained>",
  "porchTalk": "<2 sentences - the personalized pitch>",
  "hook": "<1-2 sentences - opening hook suggestion>",
  "viewerGoalDescription": "<2-3 sentences about what viewer wants>",
  "whyThisCouldWork": "<2-3 sentences about creator fit>",
  "algorithmAngle": "<2-3 sentences about strategic play>",
  "alternateFormats": ["<format1>", "<format2>"]
}`;

// Build creator context
function buildCreatorContext(channel: {
    niche?: string | null;
    content_pillars?: unknown;
    primary_motivation?: string | null;
    video_formats?: unknown;
    target_audience?: string | null;
    audience_expertise?: string | null;
    channel_description?: string | null;
}): string {
    const pillars = Array.isArray(channel.content_pillars)
        ? channel.content_pillars.join(", ")
        : "";
    const formats = Array.isArray(channel.video_formats)
        ? channel.video_formats.join(", ")
        : "";

    return `Primary goal: ${channel.primary_motivation || "growth"}
Niche: ${channel.niche || "general"}
Content pillars: ${pillars || "not specified"}
Video formats: ${formats || "various"}
Target audience: ${channel.target_audience || "general viewers"}
Audience expertise: ${channel.audience_expertise || "mixed"}`;
}

export async function POST(request: NextRequest) {
    try {
        const { superTopicId } = await request.json();

        if (!superTopicId) {
            return NextResponse.json(
                { error: "superTopicId is required" },
                { status: 400 }
            );
        }

        // Get the super topic
        const [topic] = await db
            .select()
            .from(super_topics)
            .where(eq(super_topics.id, superTopicId))
            .limit(1);

        if (!topic) {
            return NextResponse.json({ error: "Super topic not found" }, { status: 404 });
        }

        // Check if already enriched
        if (topic.porch_talk && topic.hook) {
            return NextResponse.json({
                success: true,
                message: "Already enriched",
                topic,
            });
        }

        // Get channel for creator context
        const [channel] = await db
            .select()
            .from(channels)
            .where(eq(channels.id, topic.channel_id))
            .limit(1);

        if (!channel) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 });
        }

        const creatorContext = buildCreatorContext(channel);

        console.log(`[Super Topics] On-demand enrichment for: "${topic.phrase}"`);
        const startTime = Date.now();

        // Call GPT for enrichment
        const completion = await openai.chat.completions.create({
            model: ENRICHMENT_CONFIG.model,
            temperature: ENRICHMENT_CONFIG.temperature,
            top_p: ENRICHMENT_CONFIG.top_p,
            max_completion_tokens: ENRICHMENT_CONFIG.max_completion_tokens,
            reasoning_effort: ENRICHMENT_CONFIG.reasoning_effort,
            response_format: ENRICHMENT_CONFIG.response_format,
            messages: [
                { role: "system", content: ENRICHMENT_PROMPT },
                { role: "user", content: `=== CREATOR CONTEXT ===\n${creatorContext}\n\n=== PHRASE TO ANALYZE ===\n"${topic.phrase}"` },
            ],
        });

        const responseText = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(responseText.trim());

        const elapsed = Date.now() - startTime;
        console.log(`[Super Topics] Enrichment complete in ${elapsed}ms`);

        // Update the super topic with enrichment data
        const [updated] = await db
            .update(super_topics)
            .set({
                viewer_goal: parsed.viewerGoal || "Learn",
                porch_talk: parsed.porchTalk || "",
                hook: parsed.hook || "",
                viewer_goal_description: parsed.viewerGoalDescription || "",
                why_this_could_work: parsed.whyThisCouldWork || "",
                algorithm_angle_description: parsed.algorithmAngle || "",
                alternate_formats: parsed.alternateFormats || [],
            })
            .where(eq(super_topics.id, superTopicId))
            .returning();

        return NextResponse.json({
            success: true,
            message: "Enrichment complete",
            stats: { durationMs: elapsed },
            topic: updated,
        });
    } catch (error) {
        console.error("[Super Topics] Enrichment error:", error);
        return NextResponse.json(
            { error: "Failed to enrich super topic" },
            { status: 500 }
        );
    }
}
