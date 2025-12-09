import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/server/db";
import { super_topics, channels, sessions, seeds, seed_analysis } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// MODEL CONFIGURATIONS - Optimized for cost ($0.05-0.07 per session)
// =============================================================================

// Step 1: Score all 13 phrases (fast, cheap)
const SCORING_CONFIG = {
    model: "gpt-5-mini",
    temperature: 1,
    top_p: 1,
    max_completion_tokens: 12000, // Higher for medium reasoning
    reasoning_effort: "medium" as const,
    response_format: { type: "json_object" as const },
} as const;

// Step 2: Enrich top 4 phrases (deeper analysis)
const ENRICHMENT_CONFIG = {
    model: "gpt-5-mini",
    temperature: 1,
    top_p: 1,
    max_completion_tokens: 4000,
    reasoning_effort: "low" as const,
    response_format: { type: "json_object" as const },
} as const;

// =============================================================================
// STEP 1: SCORING PROMPT - Get numeric scores for all 13 phrases
// =============================================================================
const SCORING_SYSTEM_PROMPT = `You are scoring YouTube video topics.

## clickabilityScore (0-99): Compelling words that create urgency/curiosity?

NOT compelling (65-75): Basic topics, just adding a year, simple questions
- "YouTube algorithm 2025" = 68 (year adds nothing)
- "How does X work" = 70 (basic question)

Somewhat compelling (76-85): Problem words, action words, some emotion
- "Why your tomatoes are dying" = 78
- "mistakes killing your channel" = 82

Very compelling (86-95): Secrets, specific results, strong emotion
- "The algorithm secret nobody tells you" = 88
- "I grew 100 tomatoes with ONE trick" = 90

## intentScore (0-99): How specifically do we know what they want?

Vague (50-70): Broad topic, could want many things
- "YouTube algorithm" = 68

Specific (75-85): Clear direction, particular aspect
- "YouTube algorithm for shorts" = 80

Very specific (86-95): Exact need, multiple qualifiers
- "Best posting time YouTube shorts 2025" = 88

## OTHER FIELDS
- primaryBucket (CATEGORY): Info, Opinion, Review, Entertainment, Analysis, News, List (pick ONE)
- subFormat (SPECIFIC TYPE): Tutorial, Explainer, Hot Take, Deep Dive, Comparison, Tips, etc. (must be DIFFERENT from bucket)
- primaryEmotion: Curiosity, FOMO, Fear, Hope, Frustration, Validation, Excitement, Relief
- secondaryEmotion: Same options
- mindset: Positive, Negative, Neutral, Insightful
- viewerGoal: Learn, Validate, Solve, Vent, Be Entertained (what does the searcher want?)
- algorithmTargets: 2-3 from: Long-Term Views, High Click Trigger, High Intent, Secret Strategy, Mistakes & Warnings, Story Hook

Return JSON: { "phrases": [{ "phrase": "", "clickabilityScore": 0, "intentScore": 0, "primaryBucket": "", "subFormat": "", "primaryEmotion": "", "secondaryEmotion": "", "mindset": "", "viewerGoal": "", "algorithmTargets": [] }] }`;

// =============================================================================
// STEP 2: ENRICHMENT PROMPT - Get rich text content for top 4
// =============================================================================
const ENRICHMENT_SYSTEM_PROMPT = `You are a respected YouTube mentor with deep knowledge and proven success. You're sitting on the porch with a creator who needs honest, smart guidance.

Write in "Porch Talk" style:
- 8th grade reading level, simple vocabulary
- Short sentences (under 15 words)
- No dashes or semicolons. Only periods.
- Friendly but direct. This is truth they need to hear.
- Use "you" and "your" but don't overuse it

You will receive phrases WITH their scores. DO NOT just list the scores. Pick the ONE most impressive metric and explain what it means.

## SECTION: Why This Topic (porchTalk)
Purpose: Convince them THIS phrase is special. Pick the standout signal and explain it.
Length: 3-4 sentences.

APPROACH:
1. Look at the scores and find what stands out (highest Topic Strength? Great Intent? Strong Audience Fit?)
2. Lead with what that metric MEANS in plain language
3. Then cite the score as proof
4. Connect to their channel

SCORE MEANINGS (use these):
- Topic Strength (high = 85+): "This phrase is very specific. We know exactly what the viewer wants."
- Audience Fit (high = 85+): "This matches your channel perfectly. Your audience is already looking for this."
- Intent (high = 80+): "The intent here is clear. Viewers searching this have a specific goal."
- Clickability (high = 80+): "This phrase has built-in curiosity. People want to click."
- Opportunity (high = 40+): "There's room to rank here. Not too crowded."

GOOD example:
"This phrase is very specific. We know exactly what the viewer wants. Not just 'YouTube algorithm' but HOW it works. That shows in the Topic Strength score of 96. It fits your explainer style perfectly."

BAD example (don't do this):
"This phrase scores 73 on GrowthFit and 44 on Opportunity. Intent is 74 and Clickability is 72."
(This just lists numbers. The user can see the numbers. Explain what they MEAN.)

## SECTION: Viewer Goal Description (viewerGoalDescription)
Purpose: Describe who is searching this and what they REALLY want.
Length: 2-3 sentences.

GOOD example:
"Someone searching this is stuck. They've tried things that didn't work. They want a clear explanation they can act on today."

BAD example:
"You want clear facts. You want to learn. You want good information."
(Too many "you", says nothing specific)

## SECTION: Algorithm Angle (algorithmAngle)
Purpose: Explain the strategic play for the algorithm.
Length: 2-3 sentences.

GOOD example:
"This is a Long-Term Views play. People search this year-round. One video can bring traffic for months if you nail the SEO."

## SECTION: Hook
Purpose: Opening line suggestion for the video.
Length: 1-2 punchy sentences.

GOOD example:
"The algorithm isn't broken. You've just been fighting it wrong."

BAD example:
"In this video I will explain the algorithm."

## OTHER FIELDS
- viewerGoal: One of: Learn, Validate, Solve, Vent, Be Entertained
- whyThisCouldWork: 2-3 sentences about creator fit
- alternateFormats: Array of 2 backup video formats

Return valid JSON:
{
  "phrases": [
    {
      "phrase": "<exact phrase>",
      "viewerGoal": "<goal>",
      "porchTalk": "<3-4 sentences>",
      "hook": "<1-2 sentences>",
      "viewerGoalDescription": "<2-3 sentences>",
      "whyThisCouldWork": "<2-3 sentences>",
      "algorithmAngle": "<2-3 sentences>",
      "alternateFormats": ["<format1>", "<format2>"]
    }
  ]
}`;

// =============================================================================
// GROWTH FIT CALCULATION - We control this, not GPT
// =============================================================================
function calculateGrowthFit(params: {
    demand: number;
    opportunity: number;
    audienceFit: number;
    clickability: number;
    intent: number;
}): number {
    // Formula from approved fix plan:
    // Growth Fit = (Demand × 0.25) + (Opportunity × 0.25) + (Audience Fit × 0.20)
    //            + (Clickability × 0.15) + (Intent × 0.15)
    const score =
        (params.demand * 0.25) +
        (params.opportunity * 0.25) +
        (params.audienceFit * 0.20) +
        (params.clickability * 0.15) +
        (params.intent * 0.15);

    return Math.round(Math.min(99, Math.max(0, score)));
}

// Assign tier based on rank
function assignTier(rank: number): "winner" | "runner-up" | "contender" {
    if (rank === 1) return "winner";
    if (rank <= 4) return "runner-up";
    return "contender";
}

// Token usage tracking
interface TokenUsage {
    input_tokens: number;
    output_tokens: number;
    reasoning_tokens: number;
    total_tokens: number;
}

// GPT-5 Mini pricing (check OpenAI dashboard for current rates)
const PRICING = {
    input_per_million: 1.10,      // $1.10 per 1M input tokens
    output_per_million: 4.40,     // $4.40 per 1M output tokens
    cached_input_per_million: 0.275, // 75% discount for cached
};

// =============================================================================
// STEP 1: Score all 13 phrases
// =============================================================================
async function scoreAllPhrases(
    creatorContext: string,
    phrases: string[]
): Promise<{
    results: Map<string, {
        clickabilityScore: number;
        intentScore: number;
        primaryBucket: string;
        subFormat: string;
        primaryEmotion: string;
        secondaryEmotion: string;
        mindset: string;
        algorithmTargets: string[];
    }>;
    usage: TokenUsage;
}> {
    const userPrompt = `=== CREATOR CONTEXT ===
${creatorContext}

=== PHRASES TO SCORE (${phrases.length} total) ===
${phrases.map((p, i) => `${i + 1}. "${p}"`).join("\n")}`;

    const completion = await openai.chat.completions.create({
        model: SCORING_CONFIG.model,
        temperature: SCORING_CONFIG.temperature,
        top_p: SCORING_CONFIG.top_p,
        max_completion_tokens: SCORING_CONFIG.max_completion_tokens,
        reasoning_effort: SCORING_CONFIG.reasoning_effort,
        response_format: SCORING_CONFIG.response_format,
        messages: [
            { role: "system", content: SCORING_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
    });

    // Extract token usage
    const usage: TokenUsage = {
        input_tokens: completion.usage?.prompt_tokens || 0,
        output_tokens: completion.usage?.completion_tokens || 0,
        reasoning_tokens: ((completion.usage as unknown) as { reasoning_tokens?: number })?.reasoning_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
    };

    const responseText = completion.choices[0]?.message?.content || "{}";
    console.log("[Super Topics] GPT raw response length:", responseText.length);

    let parsed;
    try {
        parsed = JSON.parse(responseText.trim());
    } catch (e) {
        console.error("[Super Topics] JSON parse error:", e);
        parsed = { phrases: [] };
    }

    console.log("[Super Topics] Parsed phrases count:", parsed.phrases?.length || 0);
    console.log("[Super Topics] Input phrases count:", phrases.length);

    // Debug: log first phrase to see structure
    if (parsed.phrases?.[0]) {
        console.log("[Super Topics] First parsed phrase:", JSON.stringify(parsed.phrases[0]));
    }

    const results = new Map();
    const clamp = (n: number) => Math.min(99, Math.max(0, Math.round(n || 50)));

    // Use index-based matching - phrases[i] corresponds to parsed.phrases[i]
    // This avoids issues when GPT returns slightly different phrase text
    for (let i = 0; i < (parsed.phrases || []).length; i++) {
        const item = parsed.phrases[i];
        const originalPhrase = phrases[i]; // Use original phrase, not GPT's
        if (originalPhrase && item) {
            results.set(originalPhrase, {
                clickabilityScore: clamp(item.clickabilityScore),
                intentScore: clamp(item.intentScore),
                primaryBucket: item.primaryBucket || "Info",
                subFormat: item.subFormat || "Tutorial",
                primaryEmotion: item.primaryEmotion || "Curiosity",
                secondaryEmotion: item.secondaryEmotion || "Hope",
                mindset: item.mindset || "Neutral",
                viewerGoal: item.viewerGoal || "Learn",
                algorithmTargets: item.algorithmTargets || ["Long-Term Views"],
            });
        }
    }

    console.log("[Super Topics] Results map size:", results.size);

    return { results, usage };
}

// =============================================================================
// STEP 2: Enrich top 4 phrases
// =============================================================================
async function enrichTopPhrases(
    creatorContext: string,
    phraseData: Array<{
        phrase: string;
        clickabilityScore: number;
        intentScore: number;
        growthFit: number;
        opportunity: number;
        demand: number;
    }>,
    allScores?: {
        growthFit: { min: number; max: number; avg: number };
        intent: { min: number; max: number; avg: number };
        clickability: { min: number; max: number; avg: number };
        opportunity: { min: number; max: number; avg: number };
    }
): Promise<{
    results: Map<string, {
        viewerGoal: string;
        porchTalk: string;
        hook: string;
        viewerGoalDescription: string;
        whyThisCouldWork: string;
        algorithmAngle: string;
        alternateFormats: string[];
    }>;
    usage: TokenUsage;
}> {
    const phraseList = phraseData.map((p, i) =>
        `${i + 1}. "${p.phrase}" (Rank #${i + 1}, GrowthFit=${p.growthFit}, Opportunity=${p.opportunity}, Demand=${p.demand}, Intent=${p.intentScore}, Clickability=${p.clickabilityScore})`
    ).join("\n");

    const scoreContext = allScores ? `
=== SCORE RANGES FOR ALL 13 PHRASES ===
This helps you compare each phrase to others:
- GrowthFit: min=${allScores.growthFit.min}, max=${allScores.growthFit.max}, avg=${allScores.growthFit.avg}
- Intent: min=${allScores.intent.min}, max=${allScores.intent.max}, avg=${allScores.intent.avg}
- Clickability: min=${allScores.clickability.min}, max=${allScores.clickability.max}, avg=${allScores.clickability.avg}
- Opportunity: min=${allScores.opportunity.min}, max=${allScores.opportunity.max}, avg=${allScores.opportunity.avg}

Use this to say things like "this scored highest in Intent" or "above average clickability".
` : "";

    const userPrompt = `=== CREATOR CONTEXT ===
${creatorContext}
${scoreContext}
=== TOP PHRASES TO ANALYZE (ranked by GrowthFit) ===
${phraseList}

For each phrase, reference how it compares to the other 13 when writing porchTalk.`;

    const completion = await openai.chat.completions.create({
        model: ENRICHMENT_CONFIG.model,
        temperature: ENRICHMENT_CONFIG.temperature,
        top_p: ENRICHMENT_CONFIG.top_p,
        max_completion_tokens: ENRICHMENT_CONFIG.max_completion_tokens,
        reasoning_effort: ENRICHMENT_CONFIG.reasoning_effort,
        response_format: ENRICHMENT_CONFIG.response_format,
        messages: [
            { role: "system", content: ENRICHMENT_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
    });

    // Extract token usage
    const usage: TokenUsage = {
        input_tokens: completion.usage?.prompt_tokens || 0,
        output_tokens: completion.usage?.completion_tokens || 0,
        reasoning_tokens: ((completion.usage as unknown) as { reasoning_tokens?: number })?.reasoning_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
    };

    const responseText = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(responseText.trim());

    const results = new Map();

    // Use index-based matching - phraseData[i] corresponds to parsed.phrases[i]
    // This avoids issues when GPT returns slightly different phrase text
    const originalPhrases = phraseData.map(p => p.phrase);

    for (let i = 0; i < (parsed.phrases || []).length; i++) {
        const item = parsed.phrases[i];
        // Use the original phrase text, not GPT's returned phrase
        const originalPhrase = originalPhrases[i];
        if (originalPhrase) {
            results.set(originalPhrase, {
                viewerGoal: item.viewerGoal || "Learn",
                porchTalk: item.porchTalk || "",
                hook: item.hook || "",
                viewerGoalDescription: item.viewerGoalDescription || "",
                whyThisCouldWork: item.whyThisCouldWork || "",
                algorithmAngle: item.algorithmAngle || "",
                alternateFormats: item.alternateFormats || [],
            });
        }
    }

    return { results, usage };
}

// Build creator context from channel data
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
Video formats they make: ${formats || "various"}
Target audience: ${channel.target_audience || "general viewers"}
Audience expertise: ${channel.audience_expertise || "mixed"}
Channel description: ${channel.channel_description || "not provided"}`;
}

// =============================================================================
// MAIN API HANDLER
// =============================================================================
export async function POST(request: NextRequest) {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return NextResponse.json(
                { error: "sessionId is required" },
                { status: 400 }
            );
        }

        // =====================================================================
        // CHECK FOR EXISTING DATA (Upsert Logic)
        // =====================================================================
        const existingTopics = await db
            .select({ id: super_topics.id })
            .from(super_topics)
            .where(eq(super_topics.source_session_id, sessionId))
            .limit(1);

        if (existingTopics.length > 0) {
            console.log("[Super Topics] Data already exists for session, skipping generation");
            // Return existing data instead of generating new
            const topics = await db
                .select()
                .from(super_topics)
                .where(eq(super_topics.source_session_id, sessionId))
                .orderBy(desc(super_topics.growth_fit_score));

            return NextResponse.json({
                success: true,
                message: "Super topics already exist for this session",
                stats: { cached: true, total: topics.length },
                topics,
            });
        }

        // =====================================================================
        // GET SESSION AND CHANNEL DATA
        // =====================================================================
        const [session] = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1);

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const channelId = session.channel_id;
        const userId = session.user_id;

        if (!channelId) {
            return NextResponse.json({ error: "Session has no channel" }, { status: 400 });
        }

        const [channel] = await db
            .select()
            .from(channels)
            .where(eq(channels.id, channelId))
            .limit(1);

        if (!channel) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 });
        }

        // =====================================================================
        // GET STARRED PHRASES WITH EXISTING SCORES
        // =====================================================================
        const seedsWithAnalysis = await db
            .select({
                seed: seeds,
                analysis: seed_analysis,
            })
            .from(seeds)
            .leftJoin(seed_analysis, eq(seeds.id, seed_analysis.seed_id))
            .where(
                and(
                    eq(seeds.session_id, sessionId),
                    eq(seeds.is_selected, true)
                )
            )
            .orderBy(desc(seed_analysis.demand), desc(seed_analysis.opportunity))
            .limit(13);

        if (seedsWithAnalysis.length === 0) {
            return NextResponse.json(
                { error: "No starred phrases found. Please star at least 10 phrases on the Refine page." },
                { status: 400 }
            );
        }

        const phraseData = seedsWithAnalysis.map((s) => ({
            seedId: s.seed.id,
            phrase: s.seed.phrase,
            demand: s.analysis?.demand ?? 50,
            opportunity: s.analysis?.opportunity ?? 50,
            audienceFit: s.analysis?.audience_fit ?? 50,
            topicStrength: s.analysis?.topic_strength ?? 50,
        }));

        const creatorContext = buildCreatorContext(channel);
        const phraseTexts = phraseData.map((p) => p.phrase);

        console.log(`[Super Topics] Starting 2-step analysis for ${phraseData.length} phrases...`);
        const startTime = Date.now();

        // =====================================================================
        // STEP 1: Score all 13 phrases
        // =====================================================================
        console.log("[Super Topics] Step 1: Scoring all phrases...");
        const scoringResponse = await scoreAllPhrases(creatorContext, phraseTexts);
        const scoringResults = scoringResponse.results;
        const scoringUsage = scoringResponse.usage;
        console.log(`[Super Topics] Step 1 complete: scored ${scoringResults.size} phrases`);

        // =====================================================================
        // CALCULATE GROWTH FIT AND RANK
        // =====================================================================
        const rankedPhrases = phraseData.map((p) => {
            const scores = scoringResults.get(p.phrase) || {
                clickabilityScore: 50,
                intentScore: 50,
                primaryBucket: "Info",
                subFormat: "Tutorial",
                primaryEmotion: "Curiosity",
                secondaryEmotion: "Hope",
                mindset: "Neutral",
                viewerGoal: "Learn",
                algorithmTargets: ["Long-Term Views"],
            };

            const growthFit = calculateGrowthFit({
                demand: p.demand,
                opportunity: p.opportunity,
                audienceFit: p.audienceFit,
                clickability: scores.clickabilityScore,
                intent: scores.intentScore,
            });

            return { ...p, ...scores, growthFit };
        });

        // Sort by Growth Fit (highest first) and assign ranks
        rankedPhrases.sort((a, b) => b.growthFit - a.growthFit);
        rankedPhrases.forEach((p, i) => {
            (p as typeof p & { rank: number; tier: string }).rank = i + 1;
            (p as typeof p & { tier: string }).tier = assignTier(i + 1);
        });

        // =====================================================================
        // STEP 2: Enrich top 4 phrases only
        // =====================================================================
        const top4PhraseData = rankedPhrases.slice(0, 4).map((p) => ({
            phrase: p.phrase,
            clickabilityScore: p.clickabilityScore,
            intentScore: p.intentScore,
            growthFit: p.growthFit,
            opportunity: p.opportunity,
            demand: p.demand,
        }));

        const elapsed = Date.now() - startTime;
        console.log(`[Super Topics] Generation complete: ${elapsed}ms`);

        // Calculate cost (Step 1 only now)
        const calculateCost = (usage: TokenUsage) => {
            const inputCost = (usage.input_tokens / 1_000_000) * PRICING.input_per_million;
            const outputCost = (usage.output_tokens / 1_000_000) * PRICING.output_per_million;
            return inputCost + outputCost;
        };

        const step1Cost = calculateCost(scoringUsage);
        console.log(`\n====== SUPER TOPICS TOKEN REPORT ======`);
        console.log(`Input tokens:     ${scoringUsage.input_tokens}`);
        console.log(`Output tokens:    ${scoringUsage.output_tokens}`);
        console.log(`Reasoning tokens: ${scoringUsage.reasoning_tokens}`);
        console.log(`Total tokens:     ${scoringUsage.total_tokens}`);
        console.log(`COST: $${step1Cost.toFixed(4)} (~${(step1Cost * 100).toFixed(1)} cents)`);
        console.log(`========================================\n`);

        // =====================================================================
        // SAVE TO DATABASE
        // =====================================================================
        const savedTopics = await Promise.all(
            rankedPhrases.map(async (p) => {
                const typedP = p as typeof p & { rank: number; tier: string };

                const [inserted] = await db
                    .insert(super_topics)
                    .values({
                        channel_id: channelId,
                        user_id: userId,
                        source_session_id: sessionId,
                        source_session_name: session.name,
                        source_seed_id: p.seedId,
                        phrase: p.phrase,
                        // Growth Fit Score (calculated by us!)
                        growth_fit_score: p.growthFit,
                        // GPT Step 1 scores
                        clickability_score: p.clickabilityScore,
                        intent_score: p.intentScore,
                        // Video format
                        primary_bucket: p.primaryBucket,
                        sub_format: p.subFormat,
                        alternate_formats: [], // Populated on enrichment
                        // Emotional format
                        primary_emotion: p.primaryEmotion,
                        secondary_emotion: p.secondaryEmotion,
                        mindset: p.mindset,
                        // Algorithm targets
                        algorithm_targets: p.algorithmTargets,
                        // Core content - viewerGoal from Step 1, text from on-demand enrichment
                        viewer_goal: (p as typeof p & { viewerGoal?: string }).viewerGoal || "Learn",
                        porch_talk: null, // On-demand enrichment
                        hook: null, // On-demand enrichment
                        // Text sections - on-demand enrichment
                        viewer_goal_description: null,
                        why_this_could_work: null,
                        algorithm_angle_description: null,
                        // Display
                        tier: typedP.tier,
                        rank_order: typedP.rank,
                        is_winner: false, // NEVER set winner at generation - only on Lock
                        // Legacy scores from seed analysis
                        demand: p.demand,
                        opportunity: p.opportunity,
                        audience_fit: p.audienceFit,
                        topic_strength: p.topicStrength,
                    })
                    .returning();

                return inserted;
            })
        );

        return NextResponse.json({
            success: true,
            message: `Generated ${savedTopics.length} super topics`,
            stats: {
                total: phraseData.length,
                success: savedTopics.length,
                durationMs: elapsed,
            },
            cost: {
                scoring: {
                    description: "Score all 13 phrases",
                    input_tokens: scoringUsage.input_tokens,
                    output_tokens: scoringUsage.output_tokens,
                    reasoning_tokens: scoringUsage.reasoning_tokens,
                    cost_usd: step1Cost.toFixed(4),
                },
            },
            topics: savedTopics,
        });
    } catch (error) {
        console.error("[Super Topics] Generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate super topics" },
            { status: 500 }
        );
    }
}
