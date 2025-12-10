import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { super_topics, channels, sessions, seeds } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";

// =============================================================================
// SAVE ENDPOINT - Takes pre-analyzed data and creates DB records
// =============================================================================
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const { userId } = await createAuthenticatedSupabase(request);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            // Required
            phrase,
            selectedFormats,
            channelId,
            // Scores
            growthFitScore,
            clickabilityScore,
            intentScore,
            demand,
            opportunity,
            // Classifications
            primaryBucket,
            subFormat,
            alternateFormats,
            primaryEmotion,
            secondaryEmotion,
            mindset,
            viewerGoal,
            algorithmTargets,
            // Enrichment
            viewerAngle,
            porchTalk,
            hook,
            viewerGoalDescription,
            whyThisCouldWork,
            algorithmAngle,
        } = body;

        if (!phrase) {
            return NextResponse.json({ error: "phrase is required" }, { status: 400 });
        }

        if (!selectedFormats || selectedFormats.length === 0) {
            return NextResponse.json({ error: "At least one format must be selected" }, { status: 400 });
        }

        // Get channel (use provided channelId or get default)
        let channel;
        if (channelId) {
            const [found] = await db
                .select()
                .from(channels)
                .where(eq(channels.id, channelId))
                .limit(1);
            channel = found;
        } else {
            const [found] = await db
                .select()
                .from(channels)
                .where(and(eq(channels.user_id, userId), eq(channels.is_default, true)))
                .limit(1);
            channel = found;
        }

        if (!channel) {
            return NextResponse.json({ error: "No channel found." }, { status: 400 });
        }

        console.log(`[Fast-Track Save] Creating records for: "${phrase}"`);
        const startTime = Date.now();

        // =====================================================================
        // CREATE SESSION
        // =====================================================================
        const [newSession] = await db
            .insert(sessions)
            .values({
                user_id: userId,
                channel_id: channel.id,
                name: phrase,
                seed_phrase: phrase,
                current_step: 5, // Jump straight to Title step
                status: "active",
            })
            .returning();

        console.log(`[Fast-Track Save] Session created: ${newSession.id}`);

        // =====================================================================
        // CREATE SEED (for tracking)
        // =====================================================================
        const [newSeed] = await db
            .insert(seeds)
            .values({
                session_id: newSession.id,
                phrase: phrase,
                generation_method: "deep_dive",
                position: 1,
                is_selected: true,
                is_finalist: true,
            })
            .returning();

        // =====================================================================
        // CREATE SUPER TOPIC (fully enriched from analyze step)
        // =====================================================================
        const [superTopic] = await db
            .insert(super_topics)
            .values({
                channel_id: channel.id,
                user_id: userId,
                source_session_id: newSession.id,
                source_session_name: phrase,
                source_seed_phrase: phrase,
                source_seed_id: newSeed.id,
                phrase: phrase,

                // Scores
                growth_fit_score: growthFitScore || 70,
                clickability_score: clickabilityScore || 70,
                intent_score: intentScore || 70,
                demand: demand || 50,
                opportunity: opportunity || 50,
                opportunity_score: opportunity || 50,

                // Video format
                primary_bucket: primaryBucket || "Info",
                sub_format: subFormat || "Explainer",
                alternate_formats: alternateFormats || [],
                selected_formats: selectedFormats,

                // Emotional format
                primary_emotion: primaryEmotion || "Curiosity",
                secondary_emotion: secondaryEmotion || "Hope",
                mindset: mindset || "Neutral",

                // Algorithm targets
                algorithm_targets: algorithmTargets || ["Long-Term Views"],

                // Core content
                viewer_goal: viewerGoal || "Learn",
                viewer_angle: viewerAngle || null,
                porch_talk: porchTalk || "",
                hook: hook || "",

                // Text sections
                viewer_goal_description: viewerGoalDescription || "",
                why_this_could_work: whyThisCouldWork || "",
                algorithm_angle_description: algorithmAngle || "",

                // Display
                tier: "winner",
                rank_order: 1,
                is_winner: true, // This is THE phrase they chose
            })
            .returning();

        const elapsed = Date.now() - startTime;
        console.log(`[Fast-Track Save] Complete in ${elapsed}ms`);
        console.log(`[Fast-Track Save] Super topic created: ${superTopic.id}`);

        return NextResponse.json({
            success: true,
            message: "Fast-track save complete",
            sessionId: newSession.id,
            superTopicId: superTopic.id,
            stats: {
                durationMs: elapsed,
            },
        });
    } catch (error) {
        console.error("[Fast-Track Save] Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Fast-track save failed", details: message },
            { status: 500 }
        );
    }
}
