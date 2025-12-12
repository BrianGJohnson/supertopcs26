import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db, super_topics } from '@/server/db';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// FINAL POLISH - Generate 3-5 variations of locked title + phrase
// =============================================================================

interface PolishRequest {
    topicId: string;
    lockedTitle: string;
    lockedPhrase: string;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: PolishRequest = await request.json();
        const { topicId, lockedTitle, lockedPhrase } = body;

        if (!topicId || !lockedTitle || !lockedPhrase) {
            return NextResponse.json(
                { error: 'Missing required fields: topicId, lockedTitle, lockedPhrase' },
                { status: 400 }
            );
        }

        // Get topic for context
        const topic = await db.query.super_topics.findFirst({
            where: eq(super_topics.id, topicId),
        });

        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // Build the polish prompt
        const systemPrompt = `You are the world's best YouTube Title Optimizer. Your goal is to refine a "Draft Title" into 3 specific categories of perfection.

## INPUT CONTEXT
- Locked Title: "${lockedTitle}"
- Phrase: "${lockedPhrase}"
- Super Topic (SEO Keyword): "${topic.phrase || ''}"
- Emotion: ${topic.primary_emotion || 'Curiosity'}

## ⚠️ CRITICAL RULES FOR ALL BUCKETS ⚠️

**KEYWORD PHRASE MUST STAY INTACT:**
- The keyword phrase "${topic.phrase}" must appear as ONE CONTINUOUS CHUNK
- Do NOT split it apart, insert words inside, or rephrase with synonyms
- Keep the EXACT word order

**NO SEPARATORS:**
- NO colons (:), dashes (– — -), slashes (/), pipes (|), or parentheses ()
- Write ONE clean headline-style statement
- NO two-part headlines like "Thing: Other Thing"

**PUNCTUATION (USE SPARINGLY):**
- Exclamation points (!) and question marks (?) ARE allowed
- Use sparingly for impact, not on every title

**LENGTH:**
- 45-55 characters ideal
- 60 characters MAX. NEVER exceed 60.
- Aim for 5-7 words

**THUMBNAIL PHRASE:**
- 3-6 words. ALL CAPS.

## YOUR TASK:
1. Generate 6-9 Variations in 3 Buckets (Balanced, Rank, Wild).
2. **PICK A WINNER:** Choose the single best option for this specific creator/topic.
3. **WRITE A STRATEGY NOTE:** A 2-3 sentence "Porch Talk" explanation of WHY this is the winner.

### BUCKET 1: BALANCED (The "Perfect" Cut)
- **Goal:** The best blend of CTR and Grammar.
- **Keyword Rule:** May add 1-3 lead-in words BEFORE the keyword phrase
- **Tag:** "balanced"

### BUCKET 2: RANK (SEO Optimization) ⚠️ SPECIAL RULE
- **Goal:** Maximum Search Ranking.
- **Keyword Rule:** Keyword phrase MUST START the title (NO lead-in words!)
- **Why:** YouTube weights early keywords for search ranking
- **Tag:** "rank"

### BUCKET 3: WILD (Pattern Interrupt)
- **Goal:** Stop the scroll.
- **Keyword Rule:** May add 1-3 lead-in words BEFORE the keyword phrase
- **Rules:** Extreme curiosity, unexpected angles
- **Tag:** "wild"

## OUTPUT FORMAT (respond with valid JSON)
{
  "variations": [
    { "title": "...", "phrase": "...", "type": "balanced", "improvement": "...", "characters": 52, "leadInWords": 2 },
    ...
  ],
  "winningIndex": 0,
  "strategyNote": "Hey, I picked the Balanced option because..."
}`;

        const userPrompt = `Generate the 3 Buckets and Pick a Winner for:
"${lockedTitle}"

Use GPT-5 Mini Low Reasoning. Keep the Strategy Note friendly and strategic (Porch Talk).`;

        console.log(`[Polish Phrase] Generating Variations + Winner Strategy using GPT-5 Mini`);

        const completion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            temperature: 1,
            top_p: 1,
            reasoning_effort: 'low', // Matches working Refine page enrichment config
            max_completion_tokens: 2500,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);
        const variations = parsed.variations || [];
        const winningIndex = parsed.winningIndex || 0;
        const strategyNote = parsed.strategyNote || "This is the strongest overall option.";

        if (!Array.isArray(variations) || variations.length === 0) {
            throw new Error('Invalid response format from GPT-5 Mini');
        }

        // Identify the winner and separate it
        const winningVariation = variations[winningIndex];
        const otherVariations = variations.filter((_, i) => i !== winningIndex);

        // Construct final list: [Original, WINNER, ...Others]
        const allVariations = [
            {
                title: lockedTitle,
                phrase: lockedPhrase,
                improvement: 'Original Draft',
                type: 'original',
                isOriginal: true,
            },
            // The WINNER (Second slot, first AI option shown)
            {
                title: winningVariation.title,
                phrase: winningVariation.phrase?.toUpperCase() || winningVariation.phrase,
                improvement: `🏆 STRATEGY: ${strategyNote}`, // Inject Strategy Note here
                type: winningVariation.type || 'balanced',
                isOriginal: false,
                isWinner: true,
            },
            // The Rest
            ...otherVariations.map((v: any) => ({
                title: v.title,
                phrase: v.phrase?.toUpperCase() || v.phrase,
                improvement: v.improvement,
                type: v.type || 'balanced',
                isOriginal: false,
            })),
        ];

        const durationMs = Date.now() - startTime;
        const totalTokens = completion.usage?.total_tokens || 0;
        const costCents = Math.ceil((totalTokens / 1_000_000) * 0.375 * 100);

        console.log(`[Polish Phrase] Generated ${allVariations.length} variations. Winner Type: ${winningVariation.type}`);
        console.log(`[Polish Phrase] Cost: ~${costCents}¢`);

        return NextResponse.json({
            variations: allVariations,
            stats: {
                durationMs,
                costCents,
                totalTokens,
            },
        });

    } catch (error) {
        console.error('[Polish Phrase API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate variations', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
