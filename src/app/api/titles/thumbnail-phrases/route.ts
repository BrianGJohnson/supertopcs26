import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/server/db";
import { super_topics } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// RUTHLESS TWO-PASS THUMBNAIL PHRASE GENERATION
// Pass 1: Creative wild person (GPT-4o-mini @ high temp) — 30 visceral phrases
// Pass 2: Ruthless judge (GPT-5-mini minimal reasoning) — pick top 4-6
// =============================================================================

// Pass 1: Creative generation - GPT-4o for better cultural knowledge, temp 1.2 for wild ideas
const CREATIVE_CONFIG = {
    model: "gpt-4o", // Full model has more slang/culture knowledge
    temperature: 1.2, // Pushed higher for more creative output
    top_p: 1,
    max_completion_tokens: 1200,
} as const;

// Pass 2: Judge/filter - gpt-4o-mini at low temperature for consistent judging
const JUDGE_CONFIG = {
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_completion_tokens: 600,
    response_format: { type: "json_object" as const },
} as const;

// =============================================================================
// RUTHLESS CREATIVE PROMPT
// =============================================================================
const RUTHLESS_CREATIVE_PROMPT = `You are a ruthless YouTube packaging strategist. You HATE generic marketing. You believe safe = no views.

Your goal: Generate SHORT, VISCERAL text overlays that go ON a YouTube thumbnail.
These phrases should trigger FEAR, URGENCY, CURIOSITY, even MORBID CURIOSITY.

VIDEO TITLE: "{{title}}"
PRIMARY EMOTION TO TRIGGER: {{emotion}}
VIEWER GOAL: {{goal}}

## BANNED WORDS (never use these):
unlocked, unleashed, ultimate, guide, secrets, proven, simple, easy, powerful, amazing, incredible, hidden, transformative

## FORMAT RULES:
- Maximum 4 words per phrase
- Fragments are BETTER than complete sentences
- No punctuation EXCEPT question marks (?)
- ALL CAPS

## TONE:
- Aggressive
- Vague (creates curiosity gaps)
- Controversial (makes people react)

## MIX:
- 50% should be NEGATIVE/WARNING (danger, mistakes, problems)
- 50% should be SPECIFIC GAIN with NUMBERS when possible

## TRIGGERS TO LEVERAGE:
- Curiosity ("What is...?")
- FOMO ("Everyone knows...")  
- Fear ("Don't...")
- Urgency ("Before...")
- Validation ("You're right...")
- Controversy ("The truth...")

Generate exactly 30 phrases. One per line. No numbering, no explanations.
Be WEIRD. Be AGGRESSIVE. Generic = failure.`;

// =============================================================================
// RUTHLESS JUDGE PROMPT
// =============================================================================
const JUDGE_PROMPT = `You are a ruthless YouTube CTR analyst. Your job: pick the TOP 12 phrases that will create the HIGHEST click-through rate.

VIDEO TITLE: "{{title}}"

## EVALUATION CRITERIA:
1. Does it create an irresistible CURIOSITY GAP?
2. Does it CONTRAST the title (not repeat it)?
3. Would you STOP SCROLLING if you saw this?
4. Is it SHORT enough to read in 0.5 seconds?

## INPUT PHRASES:
{{phrases}}

## OUTPUT:
Pick EXACTLY 12 of the best phrases, ranked from best to worst.
Return as JSON with "topPicks" array.

{"topPicks": ["BEST", "2ND BEST", "3RD BEST", "4TH", "5TH", "6TH", "7TH", "8TH", "9TH", "10TH", "11TH", "12TH"]}`;

// =============================================================================
// MAIN API HANDLER
// =============================================================================
export async function POST(request: NextRequest) {
    try {
        const { superTopicId, title } = await request.json();

        if (!superTopicId || !title) {
            return NextResponse.json(
                { error: "superTopicId and title are required" },
                { status: 400 }
            );
        }

        // Get the super topic for emotion/goal context
        const [topic] = await db
            .select()
            .from(super_topics)
            .where(eq(super_topics.id, superTopicId))
            .limit(1);

        if (!topic) {
            return NextResponse.json({ error: "Super topic not found" }, { status: 404 });
        }

        const emotion = topic.primary_emotion || "Curiosity";
        const goal = topic.viewer_goal || "Learn";

        console.log(`[Ruthless Phrases] Generating for: "${title}"`);
        const startTime = Date.now();

        // =================================================================
        // PASS 1: Creative wild generation (high temperature)
        // =================================================================
        const creativePrompt = RUTHLESS_CREATIVE_PROMPT
            .replace("{{title}}", title)
            .replace("{{emotion}}", emotion)
            .replace("{{goal}}", goal);

        console.log(`[Ruthless Phrases] Pass 1: Calling GPT-4o-mini @ temp ${CREATIVE_CONFIG.temperature}...`);

        const creativeResponse = await openai.chat.completions.create({
            model: CREATIVE_CONFIG.model,
            temperature: CREATIVE_CONFIG.temperature,
            top_p: CREATIVE_CONFIG.top_p,
            max_completion_tokens: CREATIVE_CONFIG.max_completion_tokens,
            messages: [{ role: "user", content: creativePrompt }],
        });

        const rawPhrases = creativeResponse.choices[0]?.message?.content || "";

        // Parse phrases (one per line, clean up)
        const phraseList = rawPhrases
            .split("\n")
            .map(p => p.trim())
            .filter(p => p.length > 0 && p.length <= 40) // Max 40 chars
            .map(p => p.replace(/^\d+\.\s*/, "")) // Remove any numbering
            .map(p => p.toUpperCase())
            .slice(0, 30); // Cap at 30

        console.log(`[Ruthless Phrases] Pass 1: Generated ${phraseList.length} raw phrases`);

        // =================================================================
        // PASS 2: Judge - gpt-4o-mini at low temp for consistent picking
        // =================================================================
        const judgePrompt = JUDGE_PROMPT
            .replace("{{title}}", title)
            .replace("{{phrases}}", phraseList.join("\n"));

        console.log(`[Ruthless Phrases] Pass 2: Calling gpt-4o-mini @ temp ${JUDGE_CONFIG.temperature} to judge...`);

        const judgeResponse = await openai.chat.completions.create({
            model: JUDGE_CONFIG.model,
            temperature: JUDGE_CONFIG.temperature,
            max_completion_tokens: JUDGE_CONFIG.max_completion_tokens,
            response_format: JUDGE_CONFIG.response_format,
            messages: [{ role: "user", content: judgePrompt }],
        });

        const judgeResult = judgeResponse.choices[0]?.message?.content || "{}";

        // Extract JSON from response (handle potential markdown wrapper)
        let topPicks: string[] = [];
        try {
            const jsonMatch = judgeResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                topPicks = parsed.topPicks || parsed.phrases || [];
            }
        } catch {
            console.error("[Ruthless Phrases] Failed to parse judge response, using first 12");
            topPicks = phraseList.slice(0, 12);
        }

        // Compute wildCards = all phrases NOT in topPicks
        const topPicksSet = new Set(topPicks.map(p => p.toUpperCase()));
        const wildCards = phraseList.filter(p => !topPicksSet.has(p.toUpperCase()));

        const elapsed = Date.now() - startTime;

        // Calculate cost - gpt-4o for pass 1, gpt-4o-mini for pass 2
        const pass1Tokens = creativeResponse.usage?.total_tokens || 0;
        const pass2Tokens = judgeResponse.usage?.total_tokens || 0;
        const totalTokens = pass1Tokens + pass2Tokens;

        // Cost: gpt-4o = $2.50/1M input, $10/1M output (blended ~$6/1M)
        // Cost: gpt-4o-mini = $0.15/1M input, $0.60/1M output (blended ~$0.375/1M)
        const pass1Cost = (pass1Tokens / 1_000_000) * 6;
        const pass2Cost = (pass2Tokens / 1_000_000) * 0.375;
        const totalCost = pass1Cost + pass2Cost;

        console.log(`[Ruthless Phrases] Complete in ${elapsed}ms`);
        console.log(`[Ruthless Phrases] Tokens: ${pass1Tokens} (pass1) + ${pass2Tokens} (pass2) = ${totalTokens}`);
        console.log(`[Ruthless Phrases] Cost: ~${(totalCost * 100).toFixed(2)}¢`);
        console.log(`[Ruthless Phrases] Top picks: ${topPicks.length}, Wild cards: ${wildCards.length}`);

        return NextResponse.json({
            success: true,
            topPicks, // Best 12, ranked
            wildCards, // The remaining ~18 "mad scientist" phrases
            rawCount: phraseList.length,
            stats: {
                durationMs: elapsed,
                tokens: totalTokens,
                costCents: (totalCost * 100).toFixed(2),
                model: CREATIVE_CONFIG.model,
                temperature: CREATIVE_CONFIG.temperature,
            },
        });
    } catch (error) {
        console.error("[Ruthless Phrases] ERROR:", error);
        // Return more details in dev
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to generate thumbnail phrases", details: message },
            { status: 500 }
        );
    }
}
