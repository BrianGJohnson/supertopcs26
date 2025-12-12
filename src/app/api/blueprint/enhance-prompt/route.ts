import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db, thumbnail_concepts, thumbnail_prompts, style_gallery, brand_styles, super_topics } from '@/server/db';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface EnhancePromptRequest {
    conceptId: string;
    styleId: string;
    brandStyleId?: string;
    userHint?: string;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: EnhancePromptRequest = await request.json();
        const { conceptId, styleId, brandStyleId, userHint } = body;

        // Validate required fields
        if (!conceptId || !styleId) {
            return NextResponse.json(
                { error: 'Missing required fields: conceptId and styleId' },
                { status: 400 }
            );
        }

        // Fetch concept
        const concept = await db.query.thumbnail_concepts.findFirst({
            where: eq(thumbnail_concepts.id, conceptId),
        });

        if (!concept) {
            return NextResponse.json({ error: 'Concept not found' }, { status: 404 });
        }

        // Fetch style recipe
        const style = await db.query.style_gallery.findFirst({
            where: eq(style_gallery.style_id, styleId),
        });

        if (!style) {
            return NextResponse.json({ error: 'Style not found' }, { status: 404 });
        }

        // Fetch super_topic for thumbnail phrase
        if (!concept.super_topic_id) {
            return NextResponse.json({ error: 'Concept has no associated topic' }, { status: 400 });
        }

        const topic = await db.query.super_topics.findFirst({
            where: eq(super_topics.id, concept.super_topic_id),
        });

        if (!topic) {
            return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
        }

        // Fetch brand style if provided
        let brandStyle = null;
        if (brandStyleId) {
            brandStyle = await db.query.brand_styles.findFirst({
                where: eq(brand_styles.id, brandStyleId),
            });
        }

        // Build the system prompt for "The Engineer"
        const systemPrompt = `You are a Prompt Engineer specializing in ${style.model_display_name || style.recommended_model} image generation.

Your job is to convert a visual concept into a detailed, model-specific image generation prompt.

CRITICAL RULE: RENDER TEXT AS A PHYSICAL OBJECT IN THE SCENE
- DO NOT say "leave space for text"
- DO NOT say "text overlay"
- INSTEAD: Describe how the text "${topic.thumbnail_phrase || topic.phrase}" appears as a physical element in the scene
- Follow the text integration rule: ${style.text_integration_rule}

STYLE RECIPE TO FOLLOW:
${style.prompt_template}

OUTPUT FORMAT:
Generate a 150-250 word prompt that includes:
1. Style specification (from recipe)
2. Visual concept description
3. Text integration (how "${topic.thumbnail_phrase || topic.phrase}" appears as physical object)
4. Colors and lighting
5. Composition and framing
6. Aspect ratio: 16:9

Make it ready to paste directly into ${style.model_display_name || style.recommended_model}.`;

        // Build the user prompt
        const userPrompt = `Convert this visual concept into a detailed ${style.model_display_name || style.recommended_model} prompt:

VISUAL CONCEPT:
Title: ${concept.title}
Description: ${concept.description}

STYLE: ${style.name}
TEXT TO RENDER: "${topic.thumbnail_phrase || topic.phrase}"

${brandStyle ? `BRAND COLORS:
- Primary: ${brandStyle.primary_color}
- Secondary: ${brandStyle.secondary_color}
- Accent: ${brandStyle.accent_color}
` : ''}

${userHint ? `USER HINT: ${userHint}\n` : ''}

Generate the complete prompt following the style recipe above.`;

        // Call GPT-5 mini
        const completion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            temperature: 1,
            top_p: 1,
            max_completion_tokens: 2500,

            reasoning_effort: 'minimal',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        });

        const enhancedPrompt = completion.choices[0]?.message?.content || '';

        // Store the enhanced prompt
        const stored = await db.insert(thumbnail_prompts).values({
            concept_id: conceptId,
            super_topic_id: concept.super_topic_id,
            user_id: concept.user_id,
            style_id: styleId,
            style_name: style.name,
            brand_style_id: brandStyleId || null,
            enhanced_prompt: enhancedPrompt,
            recommended_model: style.recommended_model,
            user_hint: userHint || null,
            gpt_model: 'gpt-5-mini',
            generation_duration_ms: Date.now() - startTime,
            estimated_cost_cents: Math.ceil((completion.usage?.prompt_tokens || 0) * 0.00015 + (completion.usage?.completion_tokens || 0) * 0.0006) * 100,
        }).returning();

        // Update super_topic with the final prompt ID
        if (concept.super_topic_id) {
            await db.update(super_topics)
                .set({ thumbnail_final_prompt_id: stored[0].id })
                .where(eq(super_topics.id, concept.super_topic_id));
        }

        const durationMs = Date.now() - startTime;
        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const costCents = Math.ceil((inputTokens * 0.00015 + outputTokens * 0.0006) * 100);

        return NextResponse.json({
            enhancedPrompt,
            recommendedModel: style.model_display_name || style.recommended_model,
            stats: {
                durationMs,
                costCents,
                inputTokens,
                outputTokens,
            },
        });

    } catch (error) {
        console.error('[Enhance Prompt API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to enhance prompt', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
