import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/server/db";
import { super_topics, channels } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// MODEL CONFIG - Optimized for creative title generation
// =============================================================================
const TITLE_GENERATION_CONFIG = {
    model: "gpt-4o-mini",
    temperature: 1,
    top_p: 1,
    max_completion_tokens: 3000,
    response_format: { type: "json_object" as const },
} as const;

// =============================================================================
// SYSTEM PROMPT - Strict keyword preservation + maximum CTR
// =============================================================================
const TITLE_SYSTEM_PROMPT = `You are a YouTube title expert focused on maximum CTR (click-through rate).

## CRITICAL KEYWORD RULES (MUST FOLLOW)

1. **The keyword phrase MUST appear in every title** — use the core words in the same relative order
2. **NEVER replace the main verb with synonyms** — if the phrase says "beat", every title says "beat" (NOT "master", "crack", "dominate", "hack")
3. **You may ADD words** — articles (the, a), qualifiers (finally, step by step), but NEVER substitute

Example for "how to beat YouTube algorithm":
✅ "How To Beat The YouTube Algorithm (What Actually Works)"
✅ "How To Beat YouTube Algorithm Step by Step"
✅ "Beat The YouTube Algorithm: The Simple Truth"
❌ "Master the YouTube Algorithm" (replaced "beat" with "master")
❌ "Crack the YouTube Algorithm" (replaced "beat" with "crack")

## TITLE REQUIREMENTS

- **Length: 45-52 characters** (ideal for CTR)
- Create genuine curiosity or urgency
- Make viewers NEED to click
- No year tags (like "2025") — keep them timeless

## OUTPUT STRUCTURE

Return 15 titles in 3 tiers:

1. **Winner** (1): Your absolute #1 pick for highest CTR
2. **Runner-Ups** (3): Strong alternatives with DIFFERENT hooks (vary the ending, not the keyword)
3. **Alternatives** (11): Variety of approaches

For each title, also suggest 1-2 thumbnail phrases (1-4 words, ALL CAPS). These go ON the thumbnail image, not in the title.

## RESPONSE FORMAT (JSON)
{
  "winner": {
    "title": "The title text",
    "characters": 52,
    "thumbnailPhrases": ["THE TRUTH", "FINALLY"],
    "angle": "Brief note on the approach (1 sentence)"
  },
  "runnerUps": [
    {
      "title": "...",
      "characters": 48,
      "thumbnailPhrases": ["...", "..."],
      "angle": "..."
    }
  ],
  "alternatives": [
    {
      "title": "...",
      "characters": 55,
      "thumbnailPhrases": ["..."],
      "angle": "..."
    }
  ]
}`;

// =============================================================================
// REGENERATE PROMPT - 5 more titles
// =============================================================================
const REGENERATE_SYSTEM_PROMPT = `You are a YouTube title optimization expert. Generate 5 MORE title options that are DIFFERENT from the ones already generated.

## OUTPUT STRUCTURE
Return 5 titles:
1. **Winner** (1): Your best new pick
2. **Runner-Ups** (2): Strong alternatives with different angles
3. **Alternatives** (2): More variety

Same format as before - include title, characters, thumbnailPhrases, and angle.

## RESPONSE FORMAT (JSON)
{
  "winner": { "title": "...", "characters": 52, "thumbnailPhrases": ["..."], "angle": "..." },
  "runnerUps": [...],
  "alternatives": [...]
}`;

// =============================================================================
// HELPER: Build creator context
// =============================================================================
function buildCreatorContext(channel: {
    niche?: string | null;
    content_pillars?: unknown;
    primary_motivation?: string | null;
    video_formats?: unknown;
    target_audience?: string | null;
    audience_expertise?: string | null;
    content_style_name?: string | null;
}): string {
    const pillars = Array.isArray(channel.content_pillars)
        ? channel.content_pillars.join(", ")
        : "";
    const formats = Array.isArray(channel.video_formats)
        ? channel.video_formats.join(", ")
        : "";

    return `CREATOR PROFILE:
- Niche: ${channel.niche || "general"}
- Content Style: ${channel.content_style_name || "not specified"}
- Primary Goal: ${channel.primary_motivation || "growth"}
- Target Audience: ${channel.target_audience || "general viewers"}
- Audience Level: ${channel.audience_expertise || "mixed"}
- Content Pillars: ${pillars || "not specified"}
- Typical Formats: ${formats || "various"}`;
}

// =============================================================================
// HELPER: Build phrase context
// =============================================================================
function buildPhraseContext(topic: {
    phrase: string;
    primary_bucket?: string | null;
    sub_format?: string | null;
    primary_emotion?: string | null;
    secondary_emotion?: string | null;
    mindset?: string | null;
    viewer_goal?: string | null;
    algorithm_targets?: string[] | null;
    demand?: number | null;
    opportunity?: number | null;
    topic_strength?: number | null;
    audience_fit?: number | null;
}, selectedFormats: string[]): string {
    const targets = Array.isArray(topic.algorithm_targets)
        ? topic.algorithm_targets.join(", ")
        : "";

    return `KEYWORD PHRASE: "${topic.phrase}"

VIDEO CONTEXT:
- Format Category: ${topic.primary_bucket || "Info"}
- User's Selected Formats: ${selectedFormats.join(", ")}
- Primary Emotion: ${topic.primary_emotion || "Curiosity"}
- Secondary Emotion: ${topic.secondary_emotion || "Hope"}
- Mindset: ${topic.mindset || "Positive"}
- Viewer Goal: ${topic.viewer_goal || "Learn"}
- Algorithm Targets: ${targets || "Long-Term Views"}

SCORES (for context):
- Demand: ${topic.demand || 50}/99
- Opportunity: ${topic.opportunity || 50}/99
- Topic Strength: ${topic.topic_strength || 50}/99
- Audience Fit: ${topic.audience_fit || 50}/99`;
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================
export async function POST(request: NextRequest) {
    try {
        const { superTopicId, selectedFormats, regenerate = false, existingTitles = [] } = await request.json();

        if (!superTopicId) {
            return NextResponse.json(
                { error: "superTopicId is required" },
                { status: 400 }
            );
        }

        if (!selectedFormats || selectedFormats.length === 0) {
            return NextResponse.json(
                { error: "At least one format must be selected" },
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
        const phraseContext = buildPhraseContext({
            phrase: topic.phrase,
            primary_bucket: topic.primary_bucket,
            sub_format: topic.sub_format,
            primary_emotion: topic.primary_emotion,
            secondary_emotion: topic.secondary_emotion,
            mindset: topic.mindset,
            viewer_goal: topic.viewer_goal,
            algorithm_targets: topic.algorithm_targets as string[] | null,
            demand: topic.demand,
            opportunity: topic.opportunity,
            topic_strength: topic.topic_strength,
            audience_fit: topic.audience_fit,
        }, selectedFormats);

        console.log(`[Title Generation] ${regenerate ? "Regenerating" : "Generating"} titles for: "${topic.phrase}"`);
        const startTime = Date.now();

        // Build the user prompt
        let userPrompt = `${creatorContext}\n\n${phraseContext}`;

        if (regenerate && existingTitles.length > 0) {
            userPrompt += `\n\nALREADY GENERATED TITLES (create DIFFERENT ones):\n${existingTitles.map((t: string, i: number) => `${i + 1}. "${t}"`).join("\n")}`;
        }

        // Call GPT
        const completion = await openai.chat.completions.create({
            model: TITLE_GENERATION_CONFIG.model,
            temperature: TITLE_GENERATION_CONFIG.temperature,
            top_p: TITLE_GENERATION_CONFIG.top_p,
            max_completion_tokens: TITLE_GENERATION_CONFIG.max_completion_tokens,
            response_format: TITLE_GENERATION_CONFIG.response_format,
            messages: [
                {
                    role: "system",
                    content: regenerate ? REGENERATE_SYSTEM_PROMPT : TITLE_SYSTEM_PROMPT
                },
                { role: "user", content: userPrompt },
            ],
        });

        const responseText = completion.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(responseText.trim());

        const elapsed = Date.now() - startTime;

        // Extract token usage for cost tracking
        const usage = {
            input_tokens: completion.usage?.prompt_tokens || 0,
            output_tokens: completion.usage?.completion_tokens || 0,
            total_tokens: completion.usage?.total_tokens || 0,
        };

        // Calculate cost (gpt-4o-mini pricing)
        const cost = (usage.input_tokens / 1_000_000) * 0.15 + (usage.output_tokens / 1_000_000) * 0.60;

        console.log(`[Title Generation] Complete in ${elapsed}ms`);
        console.log(`[Title Generation] Tokens: ${usage.total_tokens}, Cost: $${cost.toFixed(4)} (~${(cost * 100).toFixed(2)}¢)`);

        // Store title options in database
        await db
            .update(super_topics)
            .set({
                title_options: parsed,
            })
            .where(eq(super_topics.id, superTopicId));

        return NextResponse.json({
            success: true,
            message: regenerate ? "Generated 5 more titles" : "Generated 15 titles",
            stats: {
                durationMs: elapsed,
                tokens: usage.total_tokens,
                costCents: (cost * 100).toFixed(2),
            },
            titles: parsed,
        });
    } catch (error) {
        console.error("[Title Generation] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate titles" },
            { status: 500 }
        );
    }
}
