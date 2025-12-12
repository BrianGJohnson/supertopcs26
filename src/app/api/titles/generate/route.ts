import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/server/db";
import { super_topics, channels } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// MODEL CONFIG
// =============================================================================

// Pass 1: Creative generation - GPT-4o at moderated temperature for coherent hooks
const CREATIVE_CONFIG = {
    model: "gpt-4o",
    temperature: 0.85, // Lowered from 1.15 to prevent nonsensical titles
    top_p: 1,
    max_completion_tokens: 2500,
} as const;

// Pass 2: Judge - GPT-4o-mini at low temperature for consistent ranking
const JUDGE_CONFIG = {
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_completion_tokens: 2000,
    response_format: { type: "json_object" as const },
} as const;

// =============================================================================
// BANNED GENERIC PHRASES
// =============================================================================
const BANNED_PHRASES = [
    "step by step",
    "for beginners",
    "ultimate guide",
    "complete guide",
    "everything you need",
    "what you need to know",
    "made easy",
    "simplified",
    "explained",
    "like a pro",
    "in 2024",
    "in 2025",
];

// =============================================================================
// RUTHLESS CREATIVE PROMPT
// =============================================================================
const RUTHLESS_CREATIVE_PROMPT = `You are a ruthless YouTube title strategist. Your job is to create titles that DEMAND clicks.

## KEYWORD PHRASE (CRITICAL - THIS IS YOUR ANCHOR)
"{{phrase}}"

## ⚠️ MANDATORY KEYWORD PHRASE RULES ⚠️

**THE KEYWORD PHRASE MUST REMAIN INTACT AND UNBROKEN.**

1. The keyword phrase "{{phrase}}" must appear as ONE CONTINUOUS CHUNK
2. Keep the EXACT word order — do not rearrange
3. Do NOT split the phrase apart with other words
4. Do NOT insert words inside the phrase
5. Do NOT rephrase or substitute with synonyms

**HOW TO BUILD YOUR TITLE:**
- Add 1-3 LEAD-IN WORDS before the keyword phrase to make it punchier
- You may add words AFTER the keyword phrase
- Keep everything as ONE CLEAN STATEMENT

✅ GOOD (keyword intact): "Why AI Thumbnail Maker Could Destroy Your Channel"
✅ GOOD (keyword intact): "The AI Thumbnail Maker Nobody Warned You About"  
❌ BAD (keyword broken): "AI Tools: The Thumbnail Maker Revolution"
❌ BAD (keyword rephrased): "Automatic Thumbnail Generator Is Changing Everything"

## STRUCTURE RULE (CRITICAL)
- Write ONE clean headline-style statement
- NO separators: colons (:), dashes (– — -), slashes (/), pipes (|), parentheses ()
- NO two-part headlines like "Thing: Other Thing"
- ONE IDEA per title

## PUNCTUATION (USE SPARINGLY)
- Exclamation points (!) and question marks (?) ARE allowed
- Use as pattern interrupts: "Stop! AI Thumbnail Maker Might..." or "Warning! The Truth About..."
- Aim for only 2-3 punctuated titles out of 30 — do NOT overuse
- Questions can be powerful: "Is AI Thumbnail Maker Actually Worth It?"

## PRIMARY EMOTION: {{primaryEmotion}}
Lead with this emotion. It's what the viewer feels.

## BANNED PHRASES (too generic)
${BANNED_PHRASES.map(p => `- "${p}"`).join("\n")}

## LENGTH (CRITICAL)
- Target: 45-58 characters (The "Golden Zone" for YouTube)
- HARD CAP: 62 characters (reject anything longer)
- Aim for 5-7 words total
- Do NOT go under 40 characters

## DISTRIBUTION (Generate exactly 30 titles)
- **9 titles (30%)**: Lead with the PRIMARY EMOTION ({{primaryEmotion}})
- **8 titles (25%)**: Negative/Warning angle (fear, what to avoid, mistakes)
- **8 titles (25%)**: Curiosity-driven (open loops, reveals, secrets)
- **5 titles (20%)**: Wildcard - whatever creates the most visceral click reaction

## STYLE GUIDELINES
- Create genuine curiosity gaps
- Use specific numbers when impactful
- Questions can be powerful
- Urgency without being clickbait
- One clean statement, no separators

Generate exactly 30 titles, one per line. No numbering, no explanations.`;

// =============================================================================
// JUDGE PROMPT
// =============================================================================
const JUDGE_PROMPT = `You are a YouTube CTR expert. Pick the 15 best titles from this list and rank them.

KEYWORD PHRASE: "{{phrase}}"
PRIMARY EMOTION: "{{primaryEmotion}}"
SECONDARY EMOTION: "{{secondaryEmotion}}"

## HARD REJECTION RULES (Filter these OUT first)
**REJECT any title that:**
1. Contains separators: colons (:), em-dashes (—), en-dashes (–), slashes (/), pipes (|), or parentheses ()
2. Is over 62 characters
3. Is under 35 characters
4. Breaks the keyword phrase apart or rephrases it
5. Has the keyword phrase words in wrong order

Note: Exclamation points (!) and question marks (?) are ALLOWED.

## EVALUATION CRITERIA
1. Does it create an irresistible urge to click?
2. Is the keyword phrase "{{phrase}}" intact and in correct order?
3. Is it 45-58 characters? (hard cap: 62)
4. Would you STOP scrolling if you saw this?
5. Is it ONE clean headline statement (no separators)?

## DIVERSITY REQUIREMENT
Ensure the 15 titles you pick have a MIX of hook types:
- At least 3-4 titles leveraging the PRIMARY emotion
- At least 2-3 titles leveraging the SECONDARY emotion  
- At least 2-3 curiosity-driven titles
- At least 2-3 fear/warning/FOMO titles
- 1-2 wild/unexpected angles

## INPUT TITLES
{{titles}}

## OUTPUT
Pick exactly 15 titles. Categorize them:
- "winner": Your absolute #1 pick
- "runnerUps": 3 strong alternatives with DIFFERENT hooks
- "alternatives": 11 more options

For each title, include:
- title: The title text
- characters: Character count
- leadInWords: Number of words BEFORE the keyword phrase starts
- angle: Brief note on why it works (1 sentence)
- hookType: One of "curiosity" | "fomo" | "fear" | "excitement" | "hope" | "validation" | "wild"

Return as JSON:
{
  "winner": { "title": "...", "characters": 52, "leadInWords": 2, "angle": "...", "hookType": "curiosity" },
  "runnerUps": [{ "title": "...", "characters": 48, "leadInWords": 1, "angle": "...", "hookType": "fear" }, ...],
  "alternatives": [{ "title": "...", "characters": 50, "leadInWords": 3, "angle": "...", "hookType": "fomo" }, ...],
  "keywordIntact": true
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
// MAIN API HANDLER
// =============================================================================
export async function POST(request: NextRequest) {
    try {
        const { superTopicId, selectedFormats } = await request.json();

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
        const primaryEmotion = topic.primary_emotion || "Curiosity";
        const secondaryEmotion = topic.secondary_emotion || "Hope";

        console.log(`[Title Generation] Generating ruthless titles for: "${topic.phrase}"`);
        console.log(`[Title Generation] Primary emotion: ${primaryEmotion}`);
        const startTime = Date.now();

        // =====================================================================
        // PASS 1: Creative generation (30 wild titles)
        // =====================================================================
        const creativePrompt = RUTHLESS_CREATIVE_PROMPT
            .replace(/\{\{phrase\}\}/g, topic.phrase)
            .replace(/\{\{primaryEmotion\}\}/g, primaryEmotion);

        const fullCreativePrompt = `${creatorContext}\n\n${creativePrompt}`;

        console.log(`[Title Generation] Pass 1: Calling GPT-4o @ temp ${CREATIVE_CONFIG.temperature}...`);

        const creativeResponse = await openai.chat.completions.create({
            model: CREATIVE_CONFIG.model,
            temperature: CREATIVE_CONFIG.temperature,
            top_p: CREATIVE_CONFIG.top_p,
            max_completion_tokens: CREATIVE_CONFIG.max_completion_tokens,
            messages: [{ role: "user", content: fullCreativePrompt }],
        });

        const rawTitles = creativeResponse.choices[0]?.message?.content || "";

        // Parse titles (one per line, clean up)
        const titleList = rawTitles
            .split("\n")
            .map(t => t.trim())
            .filter(t => t.length > 10 && t.length < 80) // Reasonable title length
            .map(t => t.replace(/^\d+\.\s*/, "")) // Remove numbering
            .map(t => t.replace(/^["']|["']$/g, "")) // Remove quotes
            .slice(0, 30);

        console.log(`[Title Generation] Pass 1: Generated ${titleList.length} raw titles`);

        // =====================================================================
        // PASS 2: Judge picks the best 15
        // =====================================================================
        const judgePrompt = JUDGE_PROMPT
            .replace("{{phrase}}", topic.phrase)
            .replace("{{primaryEmotion}}", primaryEmotion)
            .replace("{{secondaryEmotion}}", secondaryEmotion)
            .replace("{{titles}}", titleList.map((t, i) => `${i + 1}. ${t}`).join("\n"));

        console.log(`[Title Generation] Pass 2: Calling GPT-4o-mini @ temp ${JUDGE_CONFIG.temperature} to judge...`);

        const judgeResponse = await openai.chat.completions.create({
            model: JUDGE_CONFIG.model,
            temperature: JUDGE_CONFIG.temperature,
            max_completion_tokens: JUDGE_CONFIG.max_completion_tokens,
            response_format: JUDGE_CONFIG.response_format,
            messages: [{ role: "user", content: judgePrompt }],
        });

        const judgeResult = judgeResponse.choices[0]?.message?.content || "{}";

        // Parse the judge response
        type TitleItem = { title: string; characters: number; angle: string; hookType?: string };
        let parsed: {
            winner?: TitleItem;
            runnerUps?: TitleItem[];
            alternatives?: TitleItem[];
        } = {};

        try {
            const jsonMatch = judgeResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        } catch {
            // Fallback: create structure from raw titles with default hookTypes
            const hookTypes = ["curiosity", "fear", "fomo", "excitement", "hope", "validation", "wild"];
            parsed = {
                winner: { title: titleList[0], characters: titleList[0].length, angle: "Top pick", hookType: "curiosity" },
                runnerUps: titleList.slice(1, 4).map((t, i) => ({ title: t, characters: t.length, angle: "Alternative", hookType: hookTypes[i % hookTypes.length] })),
                alternatives: titleList.slice(4, 15).map((t, i) => ({ title: t, characters: t.length, angle: "Alternative", hookType: hookTypes[(i + 3) % hookTypes.length] })),
            };
        }

        // Add thumbnailPhrases placeholder and preserve hookType
        const addPhrases = (item: TitleItem) => ({
            ...item,
            thumbnailPhrases: [], // Will be generated via the phrase API
            hookType: item.hookType || "curiosity",
        });

        const finalTitles = {
            winner: parsed.winner ? addPhrases(parsed.winner) : null,
            runnerUps: (parsed.runnerUps || []).map(addPhrases),
            alternatives: (parsed.alternatives || []).map(addPhrases),
        };

        const elapsed = Date.now() - startTime;

        // Calculate costs
        const pass1Tokens = creativeResponse.usage?.total_tokens || 0;
        const pass2Tokens = judgeResponse.usage?.total_tokens || 0;
        const totalTokens = pass1Tokens + pass2Tokens;

        // Cost: gpt-4o = $2.50/1M input, $10/1M output (blended ~$6/1M)
        // Cost: gpt-4o-mini = $0.15/1M input, $0.60/1M output (blended ~$0.375/1M)
        const pass1Cost = (pass1Tokens / 1_000_000) * 6;
        const pass2Cost = (pass2Tokens / 1_000_000) * 0.375;
        const totalCost = pass1Cost + pass2Cost;

        console.log(`[Title Generation] Complete in ${elapsed}ms`);
        console.log(`[Title Generation] Tokens: ${pass1Tokens} (pass1) + ${pass2Tokens} (pass2) = ${totalTokens}`);
        console.log(`[Title Generation] Cost: ~${(totalCost * 100).toFixed(2)}¢`);
        console.log(`[Title Generation] Winner: "${finalTitles.winner?.title}"`);

        // Store title options in database
        await db
            .update(super_topics)
            .set({
                title_options: finalTitles,
            })
            .where(eq(super_topics.id, superTopicId));

        return NextResponse.json({
            success: true,
            message: "Generated 15 ruthless titles",
            stats: {
                durationMs: elapsed,
                tokens: totalTokens,
                costCents: (totalCost * 100).toFixed(2),
                model: CREATIVE_CONFIG.model,
                temperature: CREATIVE_CONFIG.temperature,
                rawCount: titleList.length,
            },
            titles: finalTitles,
        });
    } catch (error) {
        console.error("[Title Generation] ERROR:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: "Failed to generate titles", details: message },
            { status: 500 }
        );
    }
}
