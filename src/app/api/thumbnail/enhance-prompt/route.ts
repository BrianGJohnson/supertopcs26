import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface EnhancePromptRequest {
    // Core context
    phrase: string;
    title: string;

    // Blueprint choices
    thumbnailType: 'graphic_text' | 'face_text' | 'object' | 'typography' | 'split';
    visualStyle: 'dramatic' | 'clean' | 'techy' | 'illustrated' | 'realistic';
    textPosition: 'top_left' | 'top_center' | 'top_right' | 'bottom' | 'center';
    textStyle: 'bold_impact' | 'clean_sans' | 'handwritten';

    // Colors
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;

    // Emotional context
    emotion: string;
    mindset?: string;

    // Optional user hint
    userHint?: string;

    // Channel context (if available)
    channelNiche?: string;
    videoFormat?: string;
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body: EnhancePromptRequest = await request.json();

        const {
            phrase,
            title,
            thumbnailType,
            visualStyle,
            textPosition,
            textStyle,
            primaryColor,
            secondaryColor,
            accentColor,
            emotion,
            mindset,
            userHint,
            channelNiche,
            videoFormat,
        } = body;

        // Validate required fields
        if (!phrase || !title || !thumbnailType || !visualStyle) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Build the prompt for GPT-5 mini
        const systemPrompt = `You are a professional YouTube thumbnail designer. Your job is to create detailed, actionable prompts for AI image generators (Midjourney, DALL-E, Recraft V3).

RULES:
- Be specific and visual
- Describe lighting, composition, mood in detail
- Include exact color codes
- Specify text styling precisely
- Target the viewer's emotional state
- Keep it under 300 words
- Use professional design terminology`;

        const userPrompt = `Create a detailed thumbnail generation prompt for:

TOPIC: "${phrase}"
VIDEO TITLE: "${title}"

THUMBNAIL TYPE: ${thumbnailType.replace('_', ' + ')}
VISUAL STYLE: ${visualStyle}
EMOTION: ${emotion}${mindset ? ` (${mindset} mindset)` : ''}

TEXT REQUIREMENTS:
- Text: "${phrase}"
- Position: ${textPosition.replace('_', ' ')}
- Style: ${textStyle.replace('_', ' ')}
- Color: ${accentColor}

COLOR PALETTE:
- Primary: ${primaryColor}
- Secondary: ${secondaryColor}
- Accent: ${accentColor}

${userHint ? `USER DIRECTION: ${userHint}\n` : ''}${channelNiche ? `CHANNEL NICHE: ${channelNiche}\n` : ''}${videoFormat ? `VIDEO FORMAT: ${videoFormat}\n` : ''}
OUTPUT FORMAT:
Generate a complete prompt with these sections:

CONCEPT: [1-2 sentence overview of the visual]
MAIN SUBJECT: [Detailed description of the primary visual element]
LIGHTING & MOOD: [Specific lighting setup and emotional atmosphere]
TEXT: "${phrase}" - [Exact styling, effects, positioning]
BACKGROUND: [What's behind the main subject]
COLOR PALETTE: [How to use the provided colors]
EMOTIONAL TARGET: [Who this appeals to and why]

Make it ready to paste directly into an AI image generator.`;

        // Call GPT-5 mini with minimal reasoning
        const completion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            temperature: 1,
            top_p: 1,
            max_completion_tokens: 2500,
            // @ts-ignore - reasoning_effort is valid for gpt-5-mini
            reasoning_effort: 'minimal',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        });

        const enhancedPrompt = completion.choices[0]?.message?.content || '';

        const durationMs = Date.now() - startTime;

        // Calculate cost (approximate)
        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const costCents = Math.ceil((inputTokens * 0.00015 + outputTokens * 0.0006) * 100);

        return NextResponse.json({
            enhancedPrompt,
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
            { error: 'Failed to enhance prompt' },
            { status: 500 }
        );
    }
}
