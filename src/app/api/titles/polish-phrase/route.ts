import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db, super_topics } from '@/server/db';
import { eq } from 'drizzle-orm';
import { debugLog, debugError } from '@/lib/debug-logger';

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
    debugLog('Polish', '🚀 API Route HIT');
    console.log('[Polish Phrase] API Route HIT - Code Updated: ' + new Date().toISOString());
    const startTime = Date.now();

    try {
        const body: PolishRequest = await request.json();
        const { topicId, lockedTitle, lockedPhrase } = body;

        debugLog('Polish', 'Request received', { topicId, lockedTitle, lockedPhrase });

        if (!topicId || !lockedTitle || !lockedPhrase) {
            debugError('Polish', 'Missing required fields', { topicId: !!topicId, lockedTitle: !!lockedTitle, lockedPhrase: !!lockedPhrase });
            return NextResponse.json(
                { error: 'Missing required fields: topicId, lockedTitle, lockedPhrase' },
                { status: 400 }
            );
        }

        // Get topic for context
        debugLog('Polish', 'Looking up topic in DB...');
        const topic = await db.query.super_topics.findFirst({
            where: eq(super_topics.id, topicId),
        });

        if (!topic) {
            debugError('Polish', 'Topic not found in DB', { topicId });
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        debugLog('Polish', 'Topic found', { phrase: topic.phrase, emotion: topic.primary_emotion });

        // Build the polish prompt
        const systemPrompt = `You are a PRO YOUTUBE TITLE EDITOR.
Your Goal: Take the user's concept and refine it for Grammar and Clicks. Slight improvements, not total reinventions.

## INPUT CONTEXT
- Locked Title: "${lockedTitle}"
- Input Phrase: "${lockedPhrase}"
- Super Topic (SEO Keyword): "${topic.phrase || ''}"

## ⚠️ CRITICAL STYLE RULES ⚠️

**1. CHARACTER COUNT (THE "GOLDEN ZONE"):**
- **TARGET:** 48-56 Characters.
- **HARD CONSTRAINT:** Do not go under 40 or over 60.
- If it's too short, add "You", "Your", or a power word ("Finally").

**2. ABSOLUTELY NO SEPARATORS:**
-  NO colons (:), dashes (- – —), slashes (/), pipes (|).
- Write **ONE CLEAN STATEMENT**.

**3. FLUFF BAN:**
- Remove "In 2024", "Guide", "Tutorial" (unless user included them).

**4. GRAMMAR & FLOW:**
- Fix any broken English.
- **Flexibility:** You MAY change "Maker" to "Makers" or add articles (the/a) to make it sound like a Native Speaker.

**5. THUMBNAIL PHRASE:**
- Update the phrase **ONLY** if the title angle changes significantly.
- Keep it 2-4 words. Punchy.

## YOUR TASK: 
Generate 6-8 Variations in these 3 Buckets.

### BUCKET 1: HIGH CTR / BALANCED
- **Goal:** Optimize for Clicks & Grammar.
- **Instructions:** Improve the impact of the original title. Make it punchier.
- **Tag:** "balanced"

### BUCKET 2: RANK (SEO FIRST)
- **Goal:** Optimize for Search.
- **Rule:** The Keyword Phrase ("${topic.phrase || ''}") MUST be at the very start.
- **Tag:** "rank"

### BUCKET 3: WILD CARD
- **Goal:** Pattern Interrupt.
- **Instructions:** Try a negative angle ("Stop", "Don't") or a Secret ("The Truth").
- **Tag:** "wild"

## OUTPUT FORMAT (JSON)
{
  "variations": [
    { "title": "...", "phrase": "...", "type": "balanced", "improvement": "Improved grammar and flow", "characters": 52 },
    ...
  ],
  "winningIndex": 0,
  "strategyNote": "..."
}`;

        const userPrompt = `Generate the 3 Buckets and Pick a Winner for:
"${lockedTitle}"

Use GPT-5 Mini Low Reasoning. Keep the Strategy Note friendly and strategic (Porch Talk).`;

        console.log(`[Polish Phrase] Generating Variations + Winner Strategy using GPT-5 Mini`);
        console.log(`[Polish Phrase] Input: topicId=${topicId}, title="${lockedTitle}", phrase="${lockedPhrase}"`);

        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: 'gpt-5-mini',
                temperature: 1,
                top_p: 1,
                max_completion_tokens: 2500,
                reasoning_effort: 'low',
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
            });
            console.log(`[Polish Phrase] OpenAI call SUCCESS. Tokens used: ${completion.usage?.total_tokens}`);
        } catch (openaiError) {
            console.error('[Polish Phrase] OpenAI API FAILED:', openaiError);
            throw new Error(`OpenAI API failed: ${openaiError instanceof Error ? openaiError.message : 'Unknown OpenAI error'}`);
        }

        const responseText = completion.choices[0]?.message?.content || '{}';
        console.log(`[Polish Phrase] Raw response (first 300 chars): ${responseText.slice(0, 300)}`);

        let parsed: any;
        try {
            parsed = JSON.parse(responseText);
            console.log(`[Polish Phrase] JSON parsed successfully. Keys: ${Object.keys(parsed).join(', ')}`);
        } catch (e) {
            console.error('[Polish Phrase] JSON Parse Error:', e);
            console.error('[Polish Phrase] Raw text that failed to parse:', responseText.slice(0, 500));
            throw new Error('Failed to parse AI response as JSON');
        }

        // ------------------------------------------------------------------
        // ROBUST PARSING (Ported from topic-scoring.ts)
        // ------------------------------------------------------------------
        // Handle multiple response formats:
        // 1. { "variations": [...] } (Ideal)
        // 2. { "results": [...] }
        // 3. { "data": [...] }
        // 4. Bare array: [...]
        // ------------------------------------------------------------------
        let variations: any[] = [];

        if (parsed.variations && Array.isArray(parsed.variations)) {
            variations = parsed.variations;
        } else if (Array.isArray(parsed)) {
            variations = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
            // Try failover keys
            const possibleKeys = ['results', 'data', 'items', 'values'];
            for (const key of possibleKeys) {
                if (Array.isArray(parsed[key])) {
                    variations = parsed[key];
                    break;
                }
            }
            // Last resort: Look for any array value in the object
            if (variations.length === 0) {
                const arrayValue = Object.values(parsed).find(v => Array.isArray(v));
                if (Array.isArray(arrayValue)) {
                    variations = arrayValue as any[];
                }
            }
        }

        const winningIndex = (typeof parsed.winningIndex === 'number') ? parsed.winningIndex : 0;
        const strategyNote = parsed.strategyNote || "This is the strongest overall option.";

        if (!Array.isArray(variations) || variations.length === 0) {
            console.error('[Polish Phrase] Invalid Format. Received:', JSON.stringify(parsed).slice(0, 200));
            throw new Error('Invalid response format from GPT-5 Mini (No variations found)');
        }

        // Identify the winner and separate it
        const winningVariation = variations[winningIndex];
        const otherVariations = variations.filter((_, i) => i !== winningIndex);

        // Construct final list: [WINNER (first!), ...Others, Original (last)]
        const allVariations = [
            // The WINNER (First slot - most prominent)
            {
                title: winningVariation.title,
                phrase: winningVariation.phrase?.toUpperCase() || winningVariation.phrase,
                improvement: `🏆 STRATEGY: ${strategyNote}`,
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
            // Original at the END (for reference)
            {
                title: lockedTitle,
                phrase: lockedPhrase,
                improvement: 'Your original draft — for comparison',
                type: 'original',
                isOriginal: true,
            },
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
