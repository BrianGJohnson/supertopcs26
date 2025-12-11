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
        const systemPrompt = `You are a master YouTube copywriter. Your job: create 3-5 REFINED variations of a locked title and thumbnail phrase to find the absolute best version.

CRITICAL RULES:
1. Keep the CORE MEANING and EMOTION intact
2. Try subtle word swaps that increase impact
3. Fix any grammar or clarity issues
4. Ensure thumbnail phrase is 4 words or less
5. Make variations DISTINCT from each other
6. Each variation should be slightly BETTER than the original

EMOTION TO MAINTAIN: ${topic.primary_emotion || 'Curiosity'}

OUTPUT FORMAT:
Return exactly 5 variations as JSON:
{
  "variations": [
    {
      "title": "Refined title version",
      "phrase": "REFINED PHRASE",
      "improvement": "What makes this better than original"
    }
  ]
}`;

        const userPrompt = `Create 5 refined variations of this title and thumbnail phrase:

ORIGINAL TITLE: "${lockedTitle}"
ORIGINAL PHRASE: "${lockedPhrase}"

CONTEXT:
- Primary Emotion: ${topic.primary_emotion || 'Curiosity'}
- Secondary Emotion: ${topic.secondary_emotion || 'N/A'}
- Mindset: ${topic.mindset || 'N/A'}

Generate 5 variations that are subtly better than the original.`;

        console.log(`[Polish Phrase] Generating 5 variations for: "${lockedTitle}" + "${lockedPhrase}"`);

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.7, // Medium-high for creative variations
            max_completion_tokens: 1000,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(responseText);
        const variations = parsed.variations || [];

        if (!Array.isArray(variations) || variations.length === 0) {
            throw new Error('Invalid response format from GPT-4o-mini');
        }

        // Always include the original as the first option
        const allVariations = [
            {
                title: lockedTitle,
                phrase: lockedPhrase,
                improvement: 'Original version (already great!)',
                isOriginal: true,
            },
            ...variations.slice(0, 5).map((v: any) => ({
                title: v.title,
                phrase: v.phrase?.toUpperCase() || v.phrase,
                improvement: v.improvement,
                isOriginal: false,
            })),
        ];

        const durationMs = Date.now() - startTime;
        const totalTokens = completion.usage?.total_tokens || 0;
        const costCents = Math.ceil((totalTokens / 1_000_000) * 0.375 * 100);

        console.log(`[Polish Phrase] Generated ${allVariations.length} variations in ${durationMs}ms`);
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
