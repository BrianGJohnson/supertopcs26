import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db, super_topics, thumbnail_concepts, channels } from '@/server/db';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateConceptsRequest {
    topicId: string;
    conceptCount: 5 | 10;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: GenerateConceptsRequest = await request.json();
        const { topicId, conceptCount } = body;

        // Validate required fields
        if (!topicId || !conceptCount) {
            return NextResponse.json(
                { error: 'Missing required fields: topicId and conceptCount' },
                { status: 400 }
            );
        }

        if (conceptCount !== 5 && conceptCount !== 10) {
            return NextResponse.json(
                { error: 'conceptCount must be 5 or 10' },
                { status: 400 }
            );
        }

        // Fetch super_topic data
        const topic = await db.query.super_topics.findFirst({
            where: eq(super_topics.id, topicId),
        });

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic not found' },
                { status: 404 }
            );
        }

        // Fetch channel data for context
        const channel = topic.channel_id
            ? await db.query.channels.findFirst({
                where: eq(channels.id, topic.channel_id),
            })
            : null;

        // Build the system prompt for "The Architect" - CREATIVE PASS
        const creativeSystemPrompt = `You are a Creative Director specializing in YouTube thumbnail concepts. Your job is to generate WILD, VISCERAL visual concepts for thumbnails.

CRITICAL RULES:
1. Describe ONLY the visual elements and action - do NOT mention style, colors, or artistic techniques
2. Each concept should be 2-3 sentences maximum
3. Focus on concrete objects, people, and actions that can be visualized
4. Be CREATIVE and BOLD - push boundaries
5. Create concepts that STOP THE SCROLL
6. Match the primary emotion: ${topic.primary_emotion || 'Curiosity'}

OUTPUT FORMAT:
Generate exactly ${conceptCount * 3} concepts (we'll filter to the best ${conceptCount} later).
Return as JSON array with this structure:
{
  "concepts": [
    {
      "title": "Short 3-5 word title",
      "description": "2-3 sentence visual description",
      "emotionMatch": "How this concept conveys ${topic.primary_emotion}"
    }
  ]
}

EXAMPLES OF GOOD CONCEPTS:
- "A robot hand with glowing red joints is crushing a modern mechanical keyboard. Keys are flying outward in mid-air, with sparks and circuit board fragments scattering."
- "A massive hourglass filled with dollar bills instead of sand. The bills are pouring down rapidly while a person frantically tries to catch them at the bottom."
- "A split screen showing two identical rooms. Left side is chaos with papers flying everywhere. Right side is pristine with everything organized in glowing containers."

BAD CONCEPTS (too vague or mention style):
- "A dramatic, high-contrast image of AI taking over coding jobs"
- "An artistic representation of productivity in a minimalist style"
- "A cinematic shot with moody lighting showing technology"`;

        // Build the user prompt for creative pass
        const creativeUserPrompt = `Generate ${conceptCount * 3} visual concepts for this YouTube thumbnail:

CONTEXT:
- Keyword Phrase: "${topic.phrase}"
- Video Title: "${topic.locked_title || topic.phrase}"
- Primary Emotion: ${topic.primary_emotion || 'Curiosity'}
- Secondary Emotion: ${topic.secondary_emotion || 'N/A'}
- Mindset: ${topic.mindset || 'N/A'}
- Video Format: ${topic.sub_format || 'N/A'}
${channel?.niche ? `- Channel Niche: ${channel.niche}` : ''}
${channel?.target_audience ? `- Target Audience: ${channel.target_audience}` : ''}
${topic.viewer_goal ? `- Viewer Goal: ${topic.viewer_goal}` : ''}

Generate ${conceptCount * 3} WILD, CREATIVE visual concepts. Be bold. Stop the scroll.`;

        // =================================================================
        // PASS 1: Creative wild generation (GPT-4o @ temp 1.15)
        // =================================================================
        console.log(`[Concept Generation] Pass 1: Calling GPT-4o @ temp 1.15 for ${conceptCount * 3} concepts...`);

        const creativeResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            temperature: 1.15, // High creativity, right on the edge
            top_p: 1,
            max_completion_tokens: 3000,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: creativeSystemPrompt },
                { role: 'user', content: creativeUserPrompt },
            ],
        });

        const creativeResponseText = creativeResponse.choices[0]?.message?.content || '{}';
        const creativeParsed = JSON.parse(creativeResponseText);
        const rawConcepts = creativeParsed.concepts || creativeParsed.thumbnailConcepts || [];

        if (!Array.isArray(rawConcepts) || rawConcepts.length === 0) {
            throw new Error('Invalid response format from GPT-4o creative pass');
        }

        console.log(`[Concept Generation] Pass 1: Generated ${rawConcepts.length} raw concepts`);

        // =================================================================
        // PASS 2: Judge - GPT-4o-mini @ low temp to pick best concepts
        // =================================================================
        const judgeSystemPrompt = `You are a ruthless YouTube CTR analyst. Your job: pick the TOP ${conceptCount} thumbnail concepts that will create the HIGHEST click-through rate.

EVALUATION CRITERIA:
1. Does it create an irresistible CURIOSITY GAP?
2. Is it VISUALLY STRIKING and memorable?
3. Does it match the emotion: ${topic.primary_emotion || 'Curiosity'}?
4. Would you STOP SCROLLING if you saw this thumbnail?
5. Is it CONCRETE enough to visualize clearly?

Pick EXACTLY ${conceptCount} of the best concepts, ranked from best to worst.
Return as JSON with "selectedConcepts" array containing the full concept objects.`;

        const judgeUserPrompt = `VIDEO TITLE: "${topic.locked_title || topic.phrase}"
PRIMARY EMOTION: ${topic.primary_emotion || 'Curiosity'}

INPUT CONCEPTS:
${JSON.stringify(rawConcepts, null, 2)}

Pick the TOP ${conceptCount} concepts that will get the most clicks.`;

        console.log(`[Concept Generation] Pass 2: Calling GPT-4o-mini @ temp 0.3 to judge...`);

        const judgeResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.3, // Low temp for consistent judging
            max_completion_tokens: 2000,
            response_format: { type: 'json_object' },
            messages: [
                { role: 'system', content: judgeSystemPrompt },
                { role: 'user', content: judgeUserPrompt },
            ],
        });

        const judgeResponseText = judgeResponse.choices[0]?.message?.content || '{}';
        const judgeParsed = JSON.parse(judgeResponseText);
        const selectedConcepts = judgeParsed.selectedConcepts || judgeParsed.concepts || [];

        if (!Array.isArray(selectedConcepts) || selectedConcepts.length === 0) {
            // Fallback: take first N concepts from creative pass
            console.warn('[Concept Generation] Judge failed, using first N concepts');
            selectedConcepts.push(...rawConcepts.slice(0, conceptCount));
        }

        console.log(`[Concept Generation] Pass 2: Selected ${selectedConcepts.length} best concepts`);

        // Generate a batch ID for this generation
        const batchId = uuidv4();

        // Store concepts in database
        const storedConcepts = [];
        for (const concept of selectedConcepts.slice(0, conceptCount)) {
            const stored = await db.insert(thumbnail_concepts).values({
                super_topic_id: topicId,
                user_id: topic.user_id,
                generation_batch_id: batchId,
                concept_count: conceptCount,
                title: concept.title,
                description: concept.description,
                emotion_match: concept.emotionMatch || concept.emotion_match,
                recommended_styles: concept.recommendedStyles || concept.recommended_styles || [],
                is_selected: false,
            }).returning();

            storedConcepts.push(stored[0]);
        }

        // Update super_topic with the batch ID
        await db.update(super_topics)
            .set({ thumbnail_concept_batch_id: batchId })
            .where(eq(super_topics.id, topicId));

        const durationMs = Date.now() - startTime;

        // Calculate cost - GPT-4o for pass 1, GPT-4o-mini for pass 2
        const pass1Tokens = creativeResponse.usage?.total_tokens || 0;
        const pass2Tokens = judgeResponse.usage?.total_tokens || 0;
        const totalTokens = pass1Tokens + pass2Tokens;

        // Cost: gpt-4o = $2.50/1M input, $10/1M output (blended ~$6/1M)
        // Cost: gpt-4o-mini = $0.15/1M input, $0.60/1M output (blended ~$0.375/1M)
        const pass1Cost = (pass1Tokens / 1_000_000) * 6;
        const pass2Cost = (pass2Tokens / 1_000_000) * 0.375;
        const totalCost = pass1Cost + pass2Cost;
        const costCents = Math.ceil(totalCost * 100);

        console.log(`[Concept Generation] Complete in ${durationMs}ms`);
        console.log(`[Concept Generation] Tokens: ${pass1Tokens} (pass1) + ${pass2Tokens} (pass2) = ${totalTokens}`);
        console.log(`[Concept Generation] Cost: ~${costCents}¢`);

        return NextResponse.json({
            concepts: storedConcepts.map(c => ({
                id: c.id,
                title: c.title,
                description: c.description,
                emotionMatch: c.emotion_match,
                recommendedStyles: c.recommended_styles,
            })),
            stats: {
                durationMs,
                costCents,
                inputTokens: pass1Tokens + pass2Tokens,
                outputTokens: 0, // Combined in total_tokens
                rawConceptCount: rawConcepts.length,
                selectedConceptCount: storedConcepts.length,
            },
        });

    } catch (error) {
        console.error('[Generate Concepts API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate concepts', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
