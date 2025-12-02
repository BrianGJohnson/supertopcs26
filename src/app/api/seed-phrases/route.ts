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

const SYSTEM_PROMPT = `You find YouTube search phrases for creators. Return 2-word phrases viewers actually type into YouTube.

RULES:
- Exactly 2 words per phrase
- No prefixes (how to, best, top, what is)
- Real searches people type, not corporate jargon
- Skip outdated tools or old versions
- Return JSON: { "strict": [...], "related": [...] }`;

/**
 * GET: Fetch cached phrases or generate new ones
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

    // Fetch user's channel data for context
    const { data: channel } = await supabase
      .from("channels")
      .select("niche, niche_summary, monetization_primary")
      .eq("user_id", userId)
      .single();

    // No cache - generate new phrases with user context
    const phrases = await generatePhrases(subNiche, {
      niche: channel?.niche || "",
      nicheSummary: channel?.niche_summary || "",
      monetization: channel?.monetization_primary || "",
    });

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
 * Generate up to 40 high-quality seed phrases using GPT
 * Up to 20 strict + up to 20 related (stops early if reaching)
 * Personalized with user context
 */
interface UserContext {
  niche: string;
  nicheSummary: string;
  monetization: string;
}

async function generatePhrases(subNiche: string, context: UserContext): Promise<string[]> {
  const userPrompt = `Topic: "${subNiche}"

CREATOR CONTEXT:
- This is a YouTuber, not a corporation
- Their channel niche: ${context.niche || "YouTube creator"}
- About them: ${context.nicheSummary || "A content creator making videos"}
- How they earn: ${context.monetization || "content creation"}

STEP 1: IDENTIFY ANCHOR WORDS
Based on the creator context above, identify 2-3 single-word ANCHORS that define this creator.
Examples for a YouTube thumbnail creator: "youtube", "thumbnail", "video"
Examples for a cooking channel: "recipe", "cooking", "food"
These are the core words that keep phrases relevant to the creator.

PART 1: STRICT (up to 20 phrases)
Generate the MOST POPULAR 2-word YouTube search phrases that contain words from "${subNiche}".
These should be phrases a YouTuber would actually search for.
Stop early if you're reaching for weak phrases. Quality over quantity.

PART 2: RELATED (up to 20 phrases)
Generate 2-word YouTube search phrases this creator would also search for.
IMPORTANT: Every phrase MUST contain at least one of your anchor words.
If the topic is "Thumbnail Design", don't return "Edge Blur" - return "Thumbnail Blur" or "YouTube Blur".
Keep it grounded to the creator's world with anchor words.

RULES:
- Exactly 2 words per phrase
- Only popular, high-volume searches
- Recent and trending (2024-2025)
- Skip old tool versions (use current names)
- No generic design/tech terms without an anchor word
- Stop early if quality drops

Return JSON: { "anchors": [...], "strict": [...], "related": [...] }`;

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
  
  // Combine strict and related phrases (handle both "broad" and "related" keys for compatibility)
  const strictPhrases = parsed.strict || [];
  const relatedPhrases = parsed.related || parsed.broad || [];
  const allPhrases = [...strictPhrases, ...relatedPhrases];

  // Validate and clean phrases
  const cleaned = allPhrases
    .filter((p: unknown): p is string => typeof p === "string")
    .map((p: string) => p.toLowerCase().trim())
    .filter((p: string) => {
      const words = p.split(/\s+/);
      
      // Must be 2-3 words
      if (words.length < 2 || words.length > 3) return false;
      
      // Filter out weird compound words (e.g., "facelesssafety", "channelsuccess")
      // Real phrases have spaces between words
      const hasWeirdCompound = words.some(word => 
        word.length > 12 && !word.includes("-")
      );
      if (hasWeirdCompound) return false;
      
      // Filter out repeated words (e.g., "faceless facelessness")
      const hasRepeatedRoot = words.length >= 2 && 
        words[0].length > 4 && 
        words[1].startsWith(words[0].slice(0, 5));
      if (hasRepeatedRoot) return false;
      
      return true;
    });

  // Remove duplicates (no max limit - let GPT decide quantity)
  const unique = [...new Set(cleaned)];

  return unique;
}
