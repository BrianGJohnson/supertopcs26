import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Match topic-scoring.ts configuration exactly
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 2500, // Increased for two paragraphs
  reasoning_effort: "minimal" as const,
  response_format: { type: "json_object" as const },
} as const;

const SYSTEM_PROMPT = `You're sitting on a porch with a YouTube creator, having a casual conversation about their channel. You're their friend who happens to know a lot about what works on YouTube.

Your job is to give them honest, friendly advice about their niche — like you're chatting over coffee, not writing a textbook. Keep it simple, encouraging, and real. Write at about a 6th-8th grade reading level.

IMPORTANT CONCEPTS TO WEAVE IN NATURALLY:
1. **Trending Topics** - Can they tap into what's hot right now? What trending angles fit their niche?
2. **Long-Term Views (Evergreen)** - What topics will keep getting views for months or years because people search for them?
3. **Videos They Want To Make** - The best creators find the overlap between what viewers want and what they're excited to create.

Remember: Most creators miss out by only chasing trends OR only making evergreen content. The magic is finding both. And the #1 mistake? Making videos about things viewers aren't actually searching for.

You MUST return valid JSON in this exact format:
{
  "nicheScore": <integer 1-10>,
  "nicheAnalysis": "<friendly 2-3 sentence paragraph about their niche opportunity>",
  "nicheAdvice": "<another 2-3 sentence paragraph with specific advice based on their goals>",
  "suggestedNiche": <string or null if their niche is fine>,
  "suggestedNicheScore": <integer 1-10 or null>,
  "relatedTopics": [
    { "topic": "<2-4 words>", "score": <integer 1-10> }
  ]
}

SCORING (be honest but encouraging):
- 8-10: High viewer interest, proven YouTube audience — great pick!
- 6-7: Solid niche with engaged viewers, good opportunity
- 4-5: Narrower audience, but can work with the right angle
- 1-3: Very specialized — might need to broaden or find a better angle

For relatedTopics:
- Return exactly 8 topics, sorted by score descending
- Each topic should be 2-4 words, specific content angles
- Mix of high (7-10), medium (5-6), and a couple lower (3-4) demand topics
- Think: tutorials, comparisons, news, tips, mistakes, case studies, tools, trends`;

export async function POST(request: NextRequest) {
  try {
    const { niche, topics, primaryMonetization, secondaryGoals, monetizationDetails } = await request.json();

    if (!niche || typeof niche !== "string") {
      return NextResponse.json(
        { error: "Niche is required" },
        { status: 400 }
      );
    }

    // Build context from monetization method
    let monetizationContext = "";
    if (primaryMonetization) {
      const monetizationDescriptions: Record<string, string> = {
        sell_products: `sell their own products/services${monetizationDetails?.productsDescription ? ` (${monetizationDetails.productsDescription})` : ""}`,
        affiliate: `earn affiliate commissions${monetizationDetails?.affiliateProducts ? ` promoting ${monetizationDetails.affiliateProducts}` : ""}`,
        adsense: "earn YouTube AdSense revenue from views",
        sponsorships: `land brand sponsorships${monetizationDetails?.sponsorshipNiche ? ` in ${monetizationDetails.sponsorshipNiche}` : ""}`,
        not_sure: "figure out monetization as they grow",
      };
      
      monetizationContext = `\n\nTheir primary money goal: ${monetizationDescriptions[primaryMonetization] || primaryMonetization}.`;
    }

    // Build context from secondary goals
    let goalsContext = "";
    if (secondaryGoals && secondaryGoals.length > 0) {
      const goalDescriptions: string[] = [];
      
      if (secondaryGoals.includes("growth")) {
        goalDescriptions.push("grow their audience");
      }
      if (secondaryGoals.includes("authority")) {
        goalDescriptions.push("build authority as an expert");
      }
      if (secondaryGoals.includes("community")) {
        goalDescriptions.push("build an engaged community");
      }
      
      if (goalDescriptions.length > 0) {
        goalsContext = `\nThey also want to: ${goalDescriptions.join(" and ")}.`;
      }
    }

    const topicsContext = topics?.length > 0 
      ? `\nTopics they're interested in: ${topics.join(", ")}.` 
      : "";

    const userPrompt = `Hey, this creator wants your take on their YouTube channel idea.

Niche: "${niche}"${topicsContext}${monetizationContext}${goalsContext}

Give them the real talk — what's the opportunity here? Can they tap into trending topics? What about evergreen content that'll keep getting views? How can they stand out?

Remember to mention Long-Term Views if there's good search potential, and help them understand how to balance trending content with evergreen topics.

Return your friendly analysis as JSON.`;

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.model,
      temperature: MODEL_CONFIG.temperature,
      top_p: MODEL_CONFIG.top_p,
      max_completion_tokens: MODEL_CONFIG.max_completion_tokens,
      reasoning_effort: MODEL_CONFIG.reasoning_effort,
      response_format: MODEL_CONFIG.response_format,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // Parse JSON from response
    let analysis;
    try {
      analysis = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error("Failed to parse GPT response:", responseText);
      // Return fallback response
      return NextResponse.json({
        nicheScore: 6,
        nicheAnalysis: "This niche has solid potential! There's definitely an audience out there looking for this kind of content.",
        nicheAdvice: "Focus on mixing trending topics with evergreen content that'll keep getting views over time. That's where the magic happens.",
        suggestedNiche: null,
        suggestedNicheScore: null,
        relatedTopics: [
          { topic: "Getting Started Guide", score: 8 },
          { topic: "Tips & Tricks", score: 7 },
          { topic: "Common Mistakes", score: 7 },
          { topic: "Tool Reviews", score: 6 },
          { topic: "Case Studies", score: 6 },
          { topic: "Industry News", score: 5 },
          { topic: "Expert Insights", score: 5 },
          { topic: "Behind the Scenes", score: 4 },
        ],
      });
    }

    // Validate and normalize response
    const normalizedResponse = {
      nicheScore: Math.min(10, Math.max(1, Math.round(analysis.nicheScore || 5))),
      nicheAnalysis: analysis.nicheAnalysis || "This looks like an interesting niche with real potential.",
      nicheAdvice: analysis.nicheAdvice || "Keep creating content viewers are searching for, and you'll build momentum over time.",
      suggestedNiche: analysis.suggestedNiche || null,
      suggestedNicheScore: analysis.suggestedNicheScore ? Math.min(10, Math.max(1, Math.round(analysis.suggestedNicheScore))) : null,
      relatedTopics: (analysis.relatedTopics || [])
        .slice(0, 8)
        .map((t: { topic: string; score: number }) => ({
          topic: t.topic || "Content Topic",
          score: Math.min(10, Math.max(1, Math.round(t.score || 5))),
        }))
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score),
    };

    return NextResponse.json(normalizedResponse);
  } catch (error) {
    console.error("Niche analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze niche" },
      { status: 500 }
    );
  }
}
