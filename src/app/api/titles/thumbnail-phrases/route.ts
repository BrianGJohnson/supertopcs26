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

// Pass 1: Creative generation - GPT-4o for better cultural knowledge, temp 1.15 for creative but coherent
const CREATIVE_CONFIG = {
    model: "gpt-4o", // Full model has more slang/culture knowledge
    temperature: 1.10, // Slightly lower for more coherent output
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
// PERSONA DEFINITIONS (For Refresh Cycling)
// =============================================================================

// 0. VISCERAL EMPATH (Default / First Run) - Focus on FEELING
const PERSONA_EMPATH = `You are a VISCERAL EMPATH. You do not care about "marketing." You care about raw human connection.
Your goal is NOT to describe the video. It is to PROVOKE A PHYSICAL EMOTIONAL REACTION.
If the title is dry, find the emotional bleeding edge.
Use words that trigger deep feelings (Fear, Hope, Anger, Belonging).
Avoid corporate buzzwords. Speak to the soul.`;

// 1. RUTHLESS STRATEGIST (Refresh 1) - Focus on CLICK TACTICS (Old "Base" logic)
const PERSONA_STRATEGIST = `You are a RUTHLESS STRATEGIST. You hate generic marketing. You believe safe = no views.
Your goal is to win the click by any means necessary.
Analyze the emotional vector (Positive vs Negative) and double down on it.
If it's fear, make it terrifying. If it's hope, make it irresistible.`;

// 2. SKEPTICAL INSIDER (Refresh 2) - Focus on CURIOSITY/TRUTH
const PERSONA_SKEPTIC = `You are a CYNICAL INDUSTRY INSIDER. You hate hype. You prefer to drop "Truth Bombs."
Your goal is to challenge the viewer's worldview.
Use dry, cutting wit. Make them feel like they've been lied to.
Create "Curiosity Gaps" by implying you know a secret they don't.`;

// 3. MINIMALIST POET (Refresh 3) - Focus on IMPACT (Short, Abstract)
const PERSONA_MINIMALIST = `You are a MINIMALIST POET. You believe ONE word is stronger than three.
Your goal is to punch the viewer in the gut with brevity.
Fragments. Abstract concepts. Stark contrast.
Do not explain the video. Just hint at the emotional core.`;

const PERSONAS = [PERSONA_EMPATH, PERSONA_STRATEGIST, PERSONA_SKEPTIC, PERSONA_MINIMALIST];

// =============================================================================
// RUTHLESS CREATIVE PROMPT (Base Rules - Personas get prepended to this)
// =============================================================================
const RUTHLESS_CREATIVE_PROMPT = `
Your goal: Generate SHORT, VISCERAL text overlays that go ON a YouTube thumbnail.
These phrases should trigger emotion and stop the scroll.

VIDEO TITLE: "{{title}}"
PRIMARY EMOTION TO TRIGGER: {{emotion}}
SECONDARY EMOTION: {{secondaryEmotion}}
VIEWER GOAL: {{goal}}

## CRITICAL: ANALYZE THE TITLE FIRST
Look at the title and determine its emotional intensity:
- Is it HEAVILY NEGATIVE (fear, anger, warning, avoidance)? Examples: "Avoid X", "Don't Make This Mistake", "Pitfalls", "Traps"
- Is it HEAVILY POSITIVE (hope, opportunity, achievement)? Examples: "Unlock X", "Master Y", "Achieve Z"
- Is it BALANCED/NEUTRAL (curiosity, intrigue)? Examples: "What Happened", "The Truth About", "Inside Look"

## BANNED WORDS (never use these):
unlocked, unleashed, ultimate, guide, secrets, proven, simple, easy, powerful, amazing, incredible, hidden, transformative

## FORMAT RULES:
- Maximum 4 words per phrase
- Fragments are BETTER than complete sentences
- No punctuation EXCEPT question marks (?)
- ALL CAPS

## TONE:
- Visceral and attention-grabbing
- Vague (creates curiosity gaps)
- Emotional (makes people feel something)

## PHRASE MIX (CRITICAL - MATCH THE TITLE):

**IF TITLE IS HEAVILY NEGATIVE (fear/warning/avoidance):**
- 80% should be NEGATIVE/WARNING phrases matching the fear vibe
- 10% should be relief/escape phrases (still negative context)
- 10% wild cards

**IF TITLE IS HEAVILY POSITIVE (hope/achievement/opportunity):**
- 80% should be POSITIVE/ASPIRATIONAL phrases matching the hope vibe
- 10% should be contrast/challenge phrases
- 10% wild cards

**IF TITLE IS BALANCED/NEUTRAL:**
- 45% should match PRIMARY EMOTION: {{emotion}}
- 25% should match SECONDARY EMOTION: {{secondaryEmotion}}
- 30% wild cards

## EMOTION EXAMPLES:
- Curiosity: "WHAT'S REALLY HAPPENING?", "THEY WON'T SAY THIS"
- Fear/FOMO: "DON'T MISS THIS", "BEFORE IT'S GONE", "DANGER AHEAD", "ESCAPE THE TRAP"
- Hope: "THIS CHANGES EVERYTHING", "FINALLY POSSIBLE"
- Excitement: "IT'S HAPPENING", "GAME CHANGER"
- Validation: "YOU WERE RIGHT", "CALLED IT"
- Anger: "THEY LIED", "EXPOSED"

Generate exactly 30 phrases. One per line. No numbering, no explanations.
Be VISCERAL. Be EMOTIONAL. Generic = failure.`;

// =============================================================================
// POLISH PROMPT (Pass 1.5)
// =============================================================================
const POLISH_PROMPT = `You are a copy editor for YouTube thumbnails. Your job: POLISH the raw phrases to fix any issues while keeping them VISCERAL and POWERFUL.

VIDEO TITLE: "{{title}}"

## YOUR TASK:
1. Fix any grammar errors or typos
2. Improve clarity if confusing
3. Make sure it's 4 words or less
4. Keep the EMOTION and IMPACT
5. Remove any banned words if they snuck in
6. Ensure ALL CAPS format

## BANNED WORDS (remove these):
unlocked, unleashed, ultimate, guide, secrets, proven, simple, easy, powerful, amazing, incredible, hidden, transformative

## INPUT PHrases:
{{phrases}}

## OUTPUT:
Return the polished phrases as JSON array.
If a phrase is already perfect, return it unchanged.
If a phrase has issues, improve it while keeping the core emotion.

{"polishedPhrases": ["PHRASE 1", "PHRASE 2", ...]}`;

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
        const { superTopicId, title, refreshCount = 0 } = await request.json(); // Default refreshCount to 0

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
        const secondaryEmotion = topic.secondary_emotion || "Hope";
        const goal = topic.viewer_goal || "Learn";

        // SELECT PERSONA BASED ON REFRESH COUNT
        const personaIndex = refreshCount % PERSONAS.length;
        const selectedPersona = PERSONAS[personaIndex];
        const personaName = ["Visceral Empath", "Ruthless Strategist", "Skeptical Insider", "Minimalist Poet"][personaIndex];

        console.log(`[Ruthless Phrases] Generating for: "${title}" (Refresh #${refreshCount} -> Persona: ${personaName})`);
        const startTime = Date.now();

        // =================================================================
        // PASS 1: Creative generation (Persona + Base Rules)
        // =================================================================
        // We stick the Persona at the VERY TOP so it frames the entire task
        const fullPrompt = `${selectedPersona}\n\n${RUTHLESS_CREATIVE_PROMPT}`
            .replace("{{title}}", title)
            .replace(/\{\{emotion\}\}/g, emotion)
            .replace(/\{\{secondaryEmotion\}\}/g, secondaryEmotion)
            .replace("{{goal}}", goal);

        // Rename strict variable to generic 'creativePrompt' for clarity in use
        const creativePrompt = fullPrompt;

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
        // PASS 1.5: Polish - gpt-4o-mini at medium temp to fix issues
        // =================================================================
        const polishPrompt = POLISH_PROMPT
            .replace("{{title}}", title)
            .replace("{{phrases}}", phraseList.join("\n"));

        console.log(`[Ruthless Phrases] Pass 1.5: Calling gpt-4o-mini @ temp 0.5 to polish...`);

        const polishResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.5, // Medium temp for creative fixes
            max_completion_tokens: 800,
            response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: polishPrompt }],
        });

        const polishResult = polishResponse.choices[0]?.message?.content || '{}';
        let polishedPhrases: string[] = [];
        try {
            const jsonMatch = polishResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                polishedPhrases = parsed.polishedPhrases || parsed.phrases || phraseList;
            }
        } catch {
            console.warn('[Ruthless Phrases] Polish failed, using raw phrases');
            polishedPhrases = phraseList;
        }

        console.log(`[Ruthless Phrases] Pass 1.5: Polished ${polishedPhrases.length} phrases`);

        // =================================================================
        // PASS 2: Judge - gpt-4o-mini at low temp for consistent picking
        // =================================================================
        const judgePrompt = JUDGE_PROMPT
            .replace("{{title}}", title)
            .replace("{{phrases}}", polishedPhrases.join("\n"));

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
            topPicks = polishedPhrases.slice(0, 12);
        }

        // Compute wildCards = all phrases NOT in topPicks (from polished set)
        const topPicksSet = new Set(topPicks.map(p => p.toUpperCase()));
        const wildCards = polishedPhrases.filter(p => !topPicksSet.has(p.toUpperCase()));

        const elapsed = Date.now() - startTime;

        // Calculate cost - gpt-4o for pass 1, gpt-4o-mini for pass 1.5 and 2
        const pass1Tokens = creativeResponse.usage?.total_tokens || 0;
        const pass15Tokens = polishResponse.usage?.total_tokens || 0;
        const pass2Tokens = judgeResponse.usage?.total_tokens || 0;
        const totalTokens = pass1Tokens + pass15Tokens + pass2Tokens;

        // Cost: gpt-4o = $2.50/1M input, $10/1M output (blended ~$6/1M)
        // Cost: gpt-4o-mini = $0.15/1M input, $0.60/1M output (blended ~$0.375/1M)
        const pass1Cost = (pass1Tokens / 1_000_000) * 6;
        const pass15Cost = (pass15Tokens / 1_000_000) * 0.375;
        const pass2Cost = (pass2Tokens / 1_000_000) * 0.375;
        const totalCost = pass1Cost + pass15Cost + pass2Cost;

        console.log(`[Ruthless Phrases] Complete in ${elapsed}ms`);
        console.log(`[Ruthless Phrases] Tokens: ${pass1Tokens} (pass1) + ${pass15Tokens} (polish) + ${pass2Tokens} (judge) = ${totalTokens}`);
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
