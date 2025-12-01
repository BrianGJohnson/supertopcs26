import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT-5-mini config for seed phrase generation
// Matches working config from topic-scoring.ts
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 2500,
  reasoning_effort: "minimal" as const,
  response_format: { type: "json_object" as const },
} as const;

const SYSTEM_PROMPT = `You find YouTube search phrases. Return 2-word phrases viewers actually type into YouTube.

RULES:
- Exactly 2 words per phrase
- No prefixes (how to, best, top, what is)
- Real searches people type, not academic concepts
- Return JSON: { "strict": [...], "broad": [...] }`;

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
 * Generate up to 100 diverse 2-word seed phrases using GPT
 * ~50 strict (honor both words) + ~50 broad (popular related concepts)
 * With safety rails: stop early if quality drops
 */
async function generatePhrases(subNiche: string): Promise<string[]> {
  const userPrompt = `Topic: "${subNiche}"

PART 1: STRICT (aim for 50, minimum 20)
Branch "${subNiche}" into 4-7 directions.
Each direction must honor BOTH words in the topic.
Find 7-12 phrases per branch.

IMPORTANT: Stop adding phrases when you start reaching for obscure topics.
If the niche is narrow, 20-30 strong phrases beats 50 weak ones.
Only include phrases viewers actually search on YouTube.

PART 2: BROAD (aim for 50, minimum 20)
Find the most popular related concepts and searches.
These can drift from the exact words but should be relevant.
Focus on high-volume, trending, or evergreen searches.

IMPORTANT: Stop if concepts become too tangential or unpopular.
Quality matters more than hitting 50.

Return JSON: { "strict": [...], "broad": [...] }
Minimum 20 per category. Maximum 50 per category.`;

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
  
  // Combine strict and broad phrases
  const strictPhrases = parsed.strict || [];
  const broadPhrases = parsed.broad || [];
  const allPhrases = [...strictPhrases, ...broadPhrases];

  // Validate and clean phrases
  const cleaned = allPhrases
    .filter((p: unknown): p is string => typeof p === "string")
    .map((p: string) => p.toLowerCase().trim())
    .filter((p: string) => {
      const words = p.split(/\s+/);
      return words.length >= 2 && words.length <= 3; // Allow 2-3 words
    });

  // Remove duplicates (no max limit - let GPT decide quantity)
  const unique = [...new Set(cleaned)];

  return unique;
}
