import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Same config as refine page - gpt-5-mini with minimal reasoning
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 2500,
  reasoning_effort: "minimal" as const,
  response_format: { type: "json_object" as const },
} as const;

const SYSTEM_PROMPT = `You are a YouTube strategy advisor. Your job:
1. Score the niche (4-10)
2. Write exactly 2 sentences based on score AND motivation (~30 words total)
3. Generate SUB-NICHES (not keywords!) for each content pillar

=== CONTENT HIERARCHY (understand this!) ===
NICHE (top level)     → "YouTube Growth" - what they told us
SUB-NICHES (this step) → "AI Tools", "Faceless Content", "Analytics" - broad topic areas
TOPICS (later)        → "Best AI thumbnail tools", "How to script faceless videos"
KEYWORDS (bottom)     → "title optimization", "CTR tips" - too granular for now

YOU ARE GENERATING SUB-NICHES. Each sub-niche should contain dozens of potential video topics.

=== STEP 1: SCORE THE NICHE ===
4-6 = Moderate (competitive, needs focus)
7-8 = Strong (proven demand)
9-10 = Outstanding (high demand, great timing)

=== STEP 2: WRITE THE SUMMARY (exactly 2 sentences, ~30 words total) ===

SENTENCE 1 - [NICHE] (~15 words)
Based on your score:

If score 9-10:
- "[Niche] is an outstanding niche with massive demand from viewers who want real results."
- "This is one of the strongest niches on YouTube right now, and timing is perfect."

If score 7-8:
- "[Niche] is a proven niche with consistent viewer demand and room to grow."
- "This is a solid niche with real opportunity for creators who show up consistently."

If score 4-6:
- "This niche can absolutely work, but you'll need a clear angle to stand out."
- "[Niche] is competitive, but focused content from the right creator breaks through."

SENTENCE 2 - [GOAL] (~15 words)
Based on their motivation:

If motivation = money:
- "Your audience actively buys tools, courses, and software—so the right content leads directly to revenue."
- "Viewers in this niche spend money on solutions, which means your content can drive real income."

If motivation = audience:
- "Viewers here actively subscribe and return for more, making it perfect for building a loyal following."
- "People in this space are hungry for consistent creators, so growth comes naturally when you show up."

If motivation = brand:
- "Creators who teach in this space become trusted experts, which opens doors beyond YouTube."
- "Consistent content here builds real credibility—the kind that leads to speaking gigs, partnerships, and more."

=== STEP 3: GENERATE SUB-NICHES ===

EVERGREEN PILLAR (5-8 sub-niches):
Purpose: Foundational content for steady channel growth
Generate BROAD SUB-NICHES within their niche that will get views forever.
Each sub-niche should be 1-3 words and contain DOZENS of potential video ideas.

EXAMPLES for "YouTube Growth" niche:
✅ GOOD: "AI Tools", "Faceless YouTube", "Channel Analytics", "Video Editing", "Content Strategy"
❌ BAD: "thumbnail design tips", "title optimization", "hook writing" (too specific - these are TOPICS, not sub-niches)

EXAMPLES for "Personal Finance" niche:
✅ GOOD: "Budgeting Basics", "Investing 101", "Side Hustles", "Debt Freedom", "Credit Building"
❌ BAD: "how to budget", "best budgeting apps", "Dave Ramsey method" (too specific)

TRENDING PILLAR (4-6 trending themes):
Purpose: Capture timely opportunities in their space
Generate CURRENT TRENDING THEMES or topics getting attention NOW in their niche.
These are broader trends, not specific news items.

EXAMPLES for "YouTube Growth" niche:
✅ GOOD: "AI Video Tools", "Shorts Strategy", "YouTube Algorithm 2024", "Community Tab Growth"
❌ BAD: "new youtube feature" (too vague), "how MrBeast uses thumbnails" (too specific)

MONETIZATION PILLAR (5-6 content themes):
This pillar depends on their monetization choice:

=== IF THEY SELL PRODUCTS OR DO AFFILIATE ===
Their job is to tell us WHAT they sell/promote. YOUR job is to parse it and create content themes.
- Read their product/affiliate description LITERALLY
- Extract the EXACT capabilities or product categories they mention
- Each capability = one content theme (1-3 words)
- Example: "helps with topics, titles, and thumbnails" → "Topic Research", "Title Strategy", "Thumbnail Design"
- Example: "I promote camera gear and lighting" → "Camera Reviews", "Lighting Setup", "Gear Comparisons"
- NO generic filler like "Channel Growth" or "Creator Tips"
- Max 5-6 themes, ALL directly from what they told us

=== IF THEY'RE NOT SURE / STILL EXPLORING ===
Help them discover their path with exploratory content themes:
- "Product Reviews" - builds affiliate potential
- "Deep Tutorials" - positions them to sell courses
- "Behind the Scenes" - attracts sponsorships
- "Tool Comparisons" - attracts buyers researching
- Pick 4-5 that fit their niche
- Teaching moment should encourage exploration

=== IF ADSENSE ONLY ===
Focus on high-value, long-form content themes that generate watch time and attract premium advertisers.

=== IF SPONSORSHIPS ===
Focus on content themes that demonstrate expertise brands want to associate with.

=== RULES ===
- Evergreen: 5-8 sub-niches (1-3 words each, BROAD topic areas)
- Trending: 4-6 themes (1-3 words each, current/timely)
- Monetization: 5-6 content themes (1-3 words each, DIRECTLY from their product capabilities - NO filler)
- Each sub-niche should contain 50+ potential video topics
- NO granular keywords like "title tips" or "hook writing"
- Think: "What broad topic areas should this creator focus on?"
- Sentence 1 MUST be about the niche strength
- Sentence 2 MUST be about their primary motivation
- Total summary ~30 words
- No jargon (no CPMs, CTR, algorithm)
- Minimum score is 4
- Be encouraging but honest

Return JSON.`;

interface OnboardingData {
  // Step 2
  motivations?: string[];
  primary_motivation?: string;
  // Step 3
  monetization_methods?: string[];
  monetization_priority?: string[];
  products_description?: string;
  affiliate_products?: string;
  adsense_status?: string;
  sponsorship_niche?: string;
  has_channel?: boolean;
  // Step 4
  niche?: string;
  topic_ideas?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Get current user from auth header
    const { supabase, userId } = await createAuthenticatedSupabase(request);
    if (!userId || !supabase) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's channel with all onboarding data
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "No channel found. Please complete earlier onboarding steps." },
        { status: 400 }
      );
    }

    const data: OnboardingData = channel;

    // Validate we have enough data
    if (!data.niche) {
      return NextResponse.json(
        { error: "Niche not found. Please complete Step 4 first." },
        { status: 400 }
      );
    }

    // Build monetization context for GPT
    let monetizationContext = "";
    const primaryMoney = data.monetization_priority?.[0] || data.monetization_methods?.[0];
    
    if (primaryMoney === "products" && data.products_description) {
      monetizationContext = `PRIMARY REVENUE: Selling their own products/services
PRODUCT DETAILS: "${data.products_description}"

CRITICAL FOR MONETIZATION PILLAR - READ CAREFULLY:
1. Parse the EXACT capabilities/features mentioned in their product description
2. Each capability becomes a content theme (1-3 words max)
3. If they mention "topics, titles, thumbnails" → create themes: "Topic Research", "Title Strategy", "Thumbnail Design"
4. If they mention "editing, color grading, effects" → create themes: "Video Editing", "Color Grading", "Visual Effects"
5. DO NOT add generic filler like "Channel Growth" or "Content Strategy" unless specifically mentioned
6. Stick to what THEY said their product does - be literal and specific
7. Max 5-6 themes, each directly tied to a product capability`;
    } else if (primaryMoney === "affiliate" && data.affiliate_products) {
      monetizationContext = `PRIMARY REVENUE: Affiliate marketing
PRODUCTS THEY PROMOTE: "${data.affiliate_products}"

CRITICAL FOR MONETIZATION PILLAR - READ CAREFULLY:
1. Parse the EXACT products/categories they mentioned promoting
2. Each product category becomes a content theme around USING that type of product
3. If they promote "camera gear" → create themes: "Camera Reviews", "Filming Setup", "Gear Comparisons"
4. If they promote "editing software" → create themes: "Editing Tutorials", "Software Workflows", "Post-Production"
5. DO NOT add generic filler - stick to what products they actually promote
6. Max 5-6 themes, each tied to a product category they mentioned`;
    } else if (primaryMoney === "adsense") {
      monetizationContext = `PRIMARY REVENUE: YouTube AdSense
ADSENSE STATUS: ${data.adsense_status || "Unknown"}

FOR MONETIZATION PILLAR:
Focus on high-value content themes in their niche that:
1. Generate strong watch time (longer videos, series content)
2. Attract premium advertisers (business topics, how-tos, tutorials)
3. Create themes around in-depth educational content in their niche`;
    } else if (primaryMoney === "sponsorships" && data.sponsorship_niche) {
      monetizationContext = `PRIMARY REVENUE: Brand sponsorships
BRANDS/PRODUCTS THAT ALIGN: "${data.sponsorship_niche}"

CRITICAL FOR MONETIZATION PILLAR:
1. Parse the types of brands/products they want to work with
2. Create content themes that would attract those brands as sponsors
3. Focus on themes that demonstrate expertise those brands care about`;
    } else {
      // NOT SURE / UNDECIDED - Give them helpful exploration themes
      monetizationContext = `PRIMARY REVENUE: Still exploring options

IMPORTANT: They haven't decided on monetization yet. This is an opportunity to HELP them think through it.

FOR MONETIZATION PILLAR - CREATE EXPLORATORY THEMES:
Generate content themes that help them discover their monetization path:
1. "Product Reviews" - Testing and reviewing products builds affiliate potential
2. "Behind the Scenes" - Showing process attracts sponsorship opportunities  
3. "Deep Tutorials" - In-depth teaching positions them to sell courses/coaching
4. "Tool Comparisons" - Comparing solutions attracts buyers researching purchases
5. Pick 4-5 themes from this list that fit their niche

These themes help them build an audience while figuring out their monetization strategy.`;
    }

    // Build the user prompt with all context
    const topicIdeasText = data.topic_ideas && data.topic_ideas.length > 0
      ? `- Topics they want to cover: ${data.topic_ideas.filter(t => t && t.trim()).join(", ")}`
      : "";

    const userPrompt = `CREATOR PROFILE:
- Niche: ${data.niche}
- Primary motivation: ${data.primary_motivation || "Not specified"}
- Has existing channel: ${data.has_channel ? "Yes" : "No"}
${topicIdeasText}

IMPORTANT: If they provided specific topics they want to cover, your sub-niches should INCLUDE and REFLECT those topics. Don't ignore what they told you!

MONETIZATION:
${monetizationContext}

INSTRUCTIONS:
1. Score this niche (4-10)
2. Write exactly 2 sentences (~30 words total) following the templates
3. Generate SUB-NICHES (broad topic areas, NOT keywords!)

Remember: Sub-niches are BROAD. "AI Tools" is a sub-niche containing hundreds of videos. "Best AI tools for thumbnails" is a topic (too specific).

IMPORTANT: For each sub-niche, you MUST provide a demand score (1-10) indicating search demand and view potential.
- 8-10: High demand, proven audience interest, likely to drive significant views
- 5-7: Moderate demand, solid interest, reliable view potential  
- 1-4: Lower demand, niche audience, may require more effort to get views

Return JSON:
{
  "nicheValidation": {
    "nicheName": "2-3 word niche name",
    "demandScore": 8,
    "demandLabel": "Strong",
    "summary": "Exactly 2 sentences following the templates.",
    "topChannels": ["Channel 1", "Channel 2", "Channel 3"]
  },
  "pillars": {
    "evergreen": {
      "label": "Evergreen Growth",
      "teachingMoment": "1-2 sentences on why foundational content matters",
      "subNiches": [
        { "name": "Sub Niche 1", "demand": 8 },
        { "name": "Sub Niche 2", "demand": 7 },
        { "name": "Sub Niche 3", "demand": 6 }
      ]
    },
    "trending": {
      "label": "Trending Now", 
      "teachingMoment": "1-2 sentences on why timely content matters",
      "subNiches": [
        { "name": "Trend Theme 1", "demand": 9 },
        { "name": "Trend Theme 2", "demand": 7 }
      ]
    },
    "monetization": {
      "label": "Based on their monetization choice",
      "teachingMoment": "Explain how this content helps them.",
      "subNiches": [
        { "name": "Theme 1", "demand": 7 },
        { "name": "Theme 2", "demand": 6 }
      ]
    }
  }
}`;

    const completion = await openai.chat.completions.create({
      model: MODEL_CONFIG.model,
      temperature: MODEL_CONFIG.temperature,
      top_p: MODEL_CONFIG.top_p,
      max_completion_tokens: MODEL_CONFIG.max_completion_tokens,
      reasoning_effort: MODEL_CONFIG.reasoning_effort,
      response_format: MODEL_CONFIG.response_format,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    // Parse JSON from response
    let pillarsData;
    try {
      pillarsData = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error("Failed to parse GPT response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Take first 2 sentences from GPT, then append our hardcoded sentence 3
    const HARDCODED_SENTENCE_3 = "As we move forward, I'll help you spot incredible opportunities by finding not just topics, but SuperTopics.";
    
    const formatSummary = (text: string): string => {
      if (!text) return `This niche has potential. You're ready to grow. ${HARDCODED_SENTENCE_3}`;
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const firstTwo = sentences.slice(0, 2).join(' ').trim();
      return `${firstTwo} ${HARDCODED_SENTENCE_3}`;
    };

    // Helper to normalize sub-niches (handles both old string format and new object format)
    const normalizeSubNiches = (subNiches: unknown[]): { name: string; demand: number }[] => {
      if (!Array.isArray(subNiches)) return [];
      return subNiches.map((item) => {
        if (typeof item === 'string') {
          // Old format: just a string - assign a default demand score
          return { name: item, demand: 6 };
        } else if (typeof item === 'object' && item !== null) {
          // New format: { name, demand }
          const obj = item as { name?: string; demand?: number };
          return {
            name: obj.name || 'Unknown',
            demand: Math.min(10, Math.max(1, Math.round(obj.demand || 6))),
          };
        }
        return { name: 'Unknown', demand: 6 };
      });
    };

    // Validate and normalize the response
    const normalizedResponse = {
      nicheValidation: {
        nicheName: pillarsData.nicheValidation?.nicheName || data.niche,
        demandScore: Math.min(10, Math.max(4, Math.round(pillarsData.nicheValidation?.demandScore || 5))),
        demandLabel: pillarsData.nicheValidation?.demandLabel || "Moderate",
        summary: formatSummary(pillarsData.nicheValidation?.summary),
        topChannels: pillarsData.nicheValidation?.topChannels || [],
      },
      pillars: {
        evergreen: {
          label: pillarsData.pillars?.evergreen?.label || "Evergreen Growth",
          teachingMoment: pillarsData.pillars?.evergreen?.teachingMoment || "Evergreen content gets views for years and builds your foundation.",
          subNiches: normalizeSubNiches(pillarsData.pillars?.evergreen?.subNiches || pillarsData.pillars?.evergreen?.seeds || []).slice(0, 8),
        },
        trending: {
          label: pillarsData.pillars?.trending?.label || "Trending Now",
          teachingMoment: pillarsData.pillars?.trending?.teachingMoment || "Trending content helps you get discovered by new viewers.",
          subNiches: normalizeSubNiches(pillarsData.pillars?.trending?.subNiches || pillarsData.pillars?.trending?.seeds || []).slice(0, 6),
        },
        monetization: {
          label: pillarsData.pillars?.monetization?.label || "Product-Adjacent Content",
          teachingMoment: pillarsData.pillars?.monetization?.teachingMoment || "Create valuable content around topics where you can naturally mention your product or service. Value first—always.",
          subNiches: normalizeSubNiches(pillarsData.pillars?.monetization?.subNiches || pillarsData.pillars?.monetization?.seeds || []).slice(0, 6),
        },
      },
    };

    // Save GPT response to database immediately
    const { error: saveError } = await supabase
      .from("channels")
      .update({
        pillar_strategy: normalizedResponse,
        niche_demand_score: normalizedResponse.nicheValidation.demandScore,
        niche_validated: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("is_default", true);

    if (saveError) {
      console.error("Failed to save pillar strategy:", saveError);
      // Don't fail the request, just log the error - user can still see the data
    }

    return NextResponse.json(normalizedResponse);
  } catch (error) {
    console.error("Generate pillars error:", error);
    return NextResponse.json(
      { error: "Failed to generate pillars" },
      { status: 500 }
    );
  }
}
