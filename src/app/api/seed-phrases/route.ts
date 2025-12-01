import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT-5-mini config for seed phrase generation
const MODEL_CONFIG = {
  model: "gpt-4o-mini",
  temperature: 1,
  max_tokens: 2000,
  response_format: { type: "json_object" as const },
} as const;

const SYSTEM_PROMPT = `You are a YouTube topic expert. Generate diverse 2-word seed phrases that viewers would search for.

RULES:
1. Exactly 2 words per phrase
2. No prefixes like "how to", "best", "top"
3. Just the core topic seed
4. Diverse across the subject area
5. Phrases viewers actually type into YouTube search

Return JSON: { "phrases": ["phrase one", "phrase two", ...] }`;

/**
 * GET: Fetch cached phrases or generate new ones
 * POST: Generate new phrases (forces regeneration)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pillar = searchParams.get("pillar");
    const subNiche = searchParams.get("subNiche");

    if (!pillar || !subNiche) {
      return NextResponse.json(
        { error: "Missing pillar or subNiche parameter" },
        { status: 400 }
      );
    }

    const { supabase, userId } = await createAuthenticatedSupabase(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for cached phrases
    const { data: cached, error: cacheError } = await supabase
      .from("seed_phrases")
      .select("phrases, used_phrases")
      .eq("user_id", userId)
      .eq("pillar", pillar)
      .eq("sub_niche", subNiche)
      .single();

    if (cached && !cacheError) {
      // Return cached phrases
      return NextResponse.json({
        phrases: cached.phrases,
        usedPhrases: cached.used_phrases || [],
        cached: true,
      });
    }

    // No cache - generate new phrases
    const phrases = await generatePhrases(subNiche);

    // Save to database
    const { error: insertError } = await supabase
      .from("seed_phrases")
      .insert({
        user_id: userId,
        pillar,
        sub_niche: subNiche,
        phrases,
        used_phrases: [],
      });

    if (insertError) {
      console.error("Failed to cache phrases:", insertError);
      // Still return the phrases even if caching fails
    }

    return NextResponse.json({
      phrases,
      usedPhrases: [],
      cached: false,
    });

  } catch (error) {
    console.error("Seed phrases API error:", error);
    return NextResponse.json(
      { error: "Failed to generate seed phrases" },
      { status: 500 }
    );
  }
}

/**
 * POST: Mark a phrase as used
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pillar, subNiche, phrase } = body;

    if (!pillar || !subNiche || !phrase) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { supabase, userId } = await createAuthenticatedSupabase(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current used phrases
    const { data: current } = await supabase
      .from("seed_phrases")
      .select("used_phrases")
      .eq("user_id", userId)
      .eq("pillar", pillar)
      .eq("sub_niche", subNiche)
      .single();

    const usedPhrases = current?.used_phrases || [];
    
    // Add new phrase if not already used
    if (!usedPhrases.includes(phrase)) {
      usedPhrases.push(phrase);
      
      await supabase
        .from("seed_phrases")
        .update({ used_phrases: usedPhrases })
        .eq("user_id", userId)
        .eq("pillar", pillar)
        .eq("sub_niche", subNiche);
    }

    return NextResponse.json({ success: true, usedPhrases });

  } catch (error) {
    console.error("Mark phrase used error:", error);
    return NextResponse.json(
      { error: "Failed to mark phrase as used" },
      { status: 500 }
    );
  }
}

/**
 * Generate 75 diverse 2-word seed phrases using GPT
 */
async function generatePhrases(subNiche: string): Promise<string[]> {
  const userPrompt = `Generate 75 diverse 2-word YouTube search phrases for the topic: "${subNiche}"

These are seed phrases that will be expanded into full video topics later.
Make them diverse across the subject - different angles, subtopics, and variations.

Example for "AI Tools":
- "ai thumbnails"
- "chatgpt scripts"  
- "midjourney prompts"
- "voice cloning"
- "video editing"

Return exactly 75 phrases as JSON.`;

  const completion = await openai.chat.completions.create({
    ...MODEL_CONFIG,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content);
  const phrases = parsed.phrases || [];

  // Validate and clean phrases
  const cleaned = phrases
    .filter((p: unknown): p is string => typeof p === "string")
    .map((p: string) => p.toLowerCase().trim())
    .filter((p: string) => {
      const words = p.split(/\s+/);
      return words.length >= 2 && words.length <= 3; // Allow 2-3 words
    })
    .slice(0, 75); // Ensure max 75

  return cleaned;
}
