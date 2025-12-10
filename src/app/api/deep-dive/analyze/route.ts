import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/server/db";
import { channels } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// MODEL CONFIG - GPT-4o-mini for cost efficiency
// =============================================================================
const ANALYZE_CONFIG = {
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: "json_object" as const },
} as const;

// =============================================================================
// COMPREHENSIVE ANALYSIS PROMPT (Single Call - All Data)
// =============================================================================
const ANALYZE_PROMPT = `You are a YouTube strategy expert analyzing a single video topic.

Analyze this phrase and return comprehensive data for title generation.

## SCORING (0-99 scale)
- clickabilityScore: How compelling are the words? Do they create urgency/curiosity?
- intentScore: How specifically do we know what the viewer wants?

## CLASSIFICATIONS
- primaryBucket: One of: Info, Opinion, Review, Entertainment, Analysis, News, List
- subFormat: Specific format type that fits the bucket (e.g., for Info: Tutorial, Explainer, How-To, Walkthrough)
- primaryEmotion: Curiosity, FOMO, Fear, Hope, Frustration, Validation, Excitement, or Relief
- secondaryEmotion: Same options (different from primary)
- mindset: Positive, Negative, Neutral, or Insightful
- viewerGoal: Learn, Validate, Solve, Vent, or Be Entertained
- algorithmTargets: 2-3 from: Long-Term Views, High Click Trigger, High Intent, Secret Strategy, Mistakes & Warnings, Story Hook, Evergreen, Trending

## ENRICHMENT TEXT (Use friendly "Porch Talk" style - 8th grade reading, short sentences)
- viewerAngle: 1 sentence describing what the viewer is feeling/thinking
- porchTalk: 2-3 sentences explaining why this topic is worth making
- hook: 1-2 sentence opening hook suggestion for the video
- viewerGoalDescription: 2-3 sentences about what the viewer really wants
- whyThisCouldWork: 2-3 sentences about why this fits the creator
- algorithmAngle: 2-3 sentences about the strategic play
- alternateFormats: Array of 2 backup video format suggestions from the SAME bucket

Return valid JSON with all fields.`;

// Build creator context from channel data
function buildCreatorContext(channel: {
    niche?: string | null;
    content_pillars?: unknown;
    primary_motivation?: string | null;
    video_formats?: unknown;
    target_audience?: string | null;
    audience_expertise?: string | null;
}): string {
    const pillars = Array.isArray(channel.content_pillars)
        ? channel.content_pillars.join(", ")
        : "";
    const formats = Array.isArray(channel.video_formats)
        ? channel.video_formats.join(", ")
        : "";

    return `CREATOR PROFILE:
- Niche: ${channel.niche || "general"}
- Primary Goal: ${channel.primary_motivation || "growth"}
- Target Audience: ${channel.target_audience || "general viewers"}
- Audience Level: ${channel.audience_expertise || "mixed"}
- Content Pillars: ${pillars || "not specified"}
- Video Formats: ${formats || "various"}`;
}

// =============================================================================
// GROWTH FIT CALCULATION
// =============================================================================
function calculateGrowthFit(params: {
    demand: number;
    opportunity: number;
    clickability: number;
    intent: number;
}): number {
    const score =
        (params.demand * 0.30) +
        (params.opportunity * 0.30) +
        (params.clickability * 0.20) +
        (params.intent * 0.20);

    return Math.round(Math.min(99, Math.max(0, score)));
}

// =============================================================================
// MAIN API HANDLER - Analyze only, no DB writes
// =============================================================================
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await createAuthenticatedSupabase(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { phrase, demandScore, opportunityScore } = await request.json();

        if (!phrase) {
            return NextResponse.json({ error: "phrase is required" }, { status: 400 });
        }

        // Get user's default channel for context
        const [channel] = await db
            .select()
            .from(channels)
            .where(and(eq(channels.user_id, userId), eq(channels.is_default, true)))
            .limit(1);

        if (!channel) {
            return NextResponse.json({ error: "No channel found. Please complete onboarding." }, { status: 400 });
        }

        console.log(`[Analyze] Processing: "${phrase}"`);
        const startTime = Date.now();

        // =====================================================================
        // SINGLE GPT CALL - Get all data upfront
        // =====================================================================
        const creatorContext = buildCreatorContext(channel);
        const userPrompt = `${creatorContext}

PHRASE TO ANALYZE: "${phrase}"

Additional context:
- Viewer Demand Score: ${demandScore || 50}/99
- Creator Opportunity Score: ${opportunityScore || 50}/99`;

        const completion = await openai.chat.completions.create({
            model: ANALYZE_CONFIG.model,
            temperature: ANALYZE_CONFIG.temperature,
            max_tokens: ANALYZE_CONFIG.max_tokens,
            response_format: ANALYZE_CONFIG.response_format,
            messages: [
                { role: "system", content: ANALYZE_PROMPT },
                { role: "user", content: userPrompt },
            ],
        });

        const responseText = completion.choices[0]?.message?.content || "{}";
        let parsed;
        try {
            parsed = JSON.parse(responseText.trim());
        } catch {
            console.error("[Analyze] JSON parse error, using defaults");
            parsed = {};
        }

        // Extract with defaults
        const clickabilityScore = Math.min(99, Math.max(0, parsed.clickabilityScore || 70));
        const intentScore = Math.min(99, Math.max(0, parsed.intentScore || 70));
        const demand = demandScore || 50;
        const opportunity = opportunityScore || 50;

        // Calculate Growth Fit
        const growthFitScore = calculateGrowthFit({
            demand,
            opportunity,
            clickability: clickabilityScore,
            intent: intentScore,
        });

        const elapsed = Date.now() - startTime;
        const tokens = completion.usage?.total_tokens || 0;
        const costUsd = (tokens / 1_000_000) * 0.30;

        console.log(`[Analyze] Complete in ${elapsed}ms, ${tokens} tokens, $${costUsd.toFixed(4)}`);

        // Return ALL the data - no DB writes yet
        return NextResponse.json({
            success: true,
            channelId: channel.id,
            phrase,
            // Scores
            growthFitScore,
            clickabilityScore,
            intentScore,
            demand,
            opportunity,
            // Classifications
            primaryBucket: parsed.primaryBucket || "Info",
            subFormat: parsed.subFormat || "Explainer",
            alternateFormats: parsed.alternateFormats || [],
            primaryEmotion: parsed.primaryEmotion || "Curiosity",
            secondaryEmotion: parsed.secondaryEmotion || "Hope",
            mindset: parsed.mindset || "Neutral",
            viewerGoal: parsed.viewerGoal || "Learn",
            algorithmTargets: parsed.algorithmTargets || ["Long-Term Views"],
            // Enrichment text
            viewerAngle: parsed.viewerAngle || "",
            porchTalk: parsed.porchTalk || "",
            hook: parsed.hook || "",
            viewerGoalDescription: parsed.viewerGoalDescription || "",
            whyThisCouldWork: parsed.whyThisCouldWork || "",
            algorithmAngle: parsed.algorithmAngle || "",
            // Stats
            stats: {
                durationMs: elapsed,
                tokens,
                costUsd: costUsd.toFixed(4),
            },
        });
    } catch (error) {
        console.error("[Analyze] Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Analysis failed", details: message },
            { status: 500 }
        );
    }
}
