/**
 * Audience Fit Scoring System
 * 
 * Uses GPT-5 Mini to evaluate how well each keyword phrase aligns with
 * the creator's specific audience, content style, and channel goals.
 * 
 * Unlike Topic Strength (universal quality), Audience Fit is channel-specific:
 * The same phrase can score differently for different creators.
 * 
 * @see /docs/audience-fit-scoring.md for full documentation
 */

// =============================================================================
// TYPES
// =============================================================================

export interface AudienceFitResult {
  seedId: string;
  phrase: string;
  score: number;
}

export interface AudienceFitScoringResult {
  success: boolean;
  totalScored: number;
  batchCount: number;
  duration: number;
  results: AudienceFitResult[];
  distribution: {
    "80-99": number; // Safe Zone - keep these
    "60-79": number; // Good Fit - solid options
    "40-59": number; // Gray Area - user judgment
    "20-39": number; // Questionable - likely off-brand
    "0-19": number;  // Off-Brand - suggest removal
  };
  errors?: string[];
}

export interface CreatorProfile {
  // Identity
  niche: string;
  
  // Content Style (The 7 Archetypes)
  contentStyleNumber: number;  // 1-7
  contentStyleName: string;    // "The Scholar", "The Teacher", etc.
  
  // What they make
  videoFormats: string[];      // ["tutorials", "reviews", "vlogs"]
  
  // Who they serve
  audienceWho: string;         // "Developers wanting to speed up coding"
  audienceStruggle: string;    // "Spending too much time on boilerplate"
  audienceGoal: string;        // "Ship projects faster"
  audienceExpertise: string;   // "beginner", "intermediate", "advanced"
  
  // Monetization (CRITICAL - specific data matters here)
  primaryMonetization: string; // "products", "affiliate", "adsense", "sponsorships"
  productsDescription?: string;  // EXACT description of what they sell
  affiliateProducts?: string;    // EXACT products they promote
  sponsorshipNiche?: string;     // Brands they want to work with
  
  // Content Pillars
  pillarStrategy?: {
    evergreen?: { subNiches?: Array<{ name: string }> };
    trending?: { subNiches?: Array<{ name: string }> };
    monetization?: { subNiches?: Array<{ name: string }> };
  };
  
  // Session context
  seedPhrase: string;  // Root topic for this session
}

// =============================================================================
// CONFIGURATION (LOCKED - Same as Topic Strength)
// =============================================================================

export const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 1500,
  reasoning_effort: "minimal" as const,
  response_format: { type: "json_object" as const },
} as const;

export const BATCH_CONFIG = {
  minBatchSize: 25,
  maxBatchSize: 40,
  defaultBatchSize: 40,
  interBatchDelayMs: 150,
} as const;

// =============================================================================
// CONTENT STYLE ARCHETYPES
// =============================================================================

const CONTENT_STYLE_MAP: Record<number, { name: string; traits: string; bestFit: string; poorFit: string }> = {
  1: {
    name: "The Scholar",
    traits: "Deep dives, research-heavy, academic style, comprehensive analysis",
    bestFit: "detailed analysis, deep dive, complete breakdown, research, explained in depth",
    poorFit: "quick tips, hot takes, drama, reaction, controversy, my thoughts",
  },
  2: {
    name: "The Teacher",
    traits: "Step-by-step tutorials, patient instruction, beginner-friendly",
    bestFit: "how to, tutorial, step by step, for beginners, guide, learn, basics",
    poorFit: "reaction, hot take, rant, drama, is X dead, my thoughts on",
  },
  3: {
    name: "The Guide",
    traits: "Practical advice, actionable tips, solutions-focused",
    bestFit: "tips, tricks, hacks, best practices, how to fix, ways to, mistakes to avoid",
    poorFit: "theory, philosophy, rant, drama, reaction to",
  },
  4: {
    name: "The Mentor",
    traits: "Balanced educational entertainment, relatable stories, wisdom sharing",
    bestFit: "why, lessons learned, what I wish I knew, journey, experience",
    poorFit: "pure entertainment, clickbait, drama, controversy",
  },
  5: {
    name: "The Storyteller",
    traits: "Narrative-driven, emotional journeys, experience sharing",
    bestFit: "my experience, story, journey, what happened when, behind the scenes",
    poorFit: "pure tutorial, technical guide, step by step, basics explained",
  },
  6: {
    name: "The Commentator",
    traits: "Opinions, analysis of current events, hot takes with substance",
    bestFit: "is X dead, the truth about, why X sucks, unpopular opinion, hot take",
    poorFit: "complete guide, tutorial for beginners, step by step, basics",
  },
  7: {
    name: "The Performer",
    traits: "Pure entertainment, personality-driven, spectacle and fun",
    bestFit: "challenge, trying, react, experiment, I tried, what happens if",
    poorFit: "tutorial, complete guide, step by step, technical explanation",
  },
};

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

export const SYSTEM_PROMPT = `You are scoring how well each keyword phrase fits a specific YouTube creator's channel and audience.
Return a JSON object with a "scores" key containing exactly N integers from 0-97.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL MINDSET
═══════════════════════════════════════════════════════════════════════════════
You are NOT scoring phrase quality (that's already done).
You are scoring: "Would THIS SPECIFIC creator's audience click on this?"

Every phrase starts at 50 (neutral). Adjust up or down based on FIT.
A perfectly generic phrase in their niche = 50.
A phrase that matches their exact content style AND niche = 80+.
A phrase completely off-brand = under 30.

BE GENEROUS with the safety net. Your job is to PROTECT congruent phrases.
If a phrase COULD work for this creator, score it 40+.
Only score below 40 if it's clearly wrong for their channel.

═══════════════════════════════════════════════════════════════════════════════
TARGET DISTRIBUTION (you MUST hit these targets)
═══════════════════════════════════════════════════════════════════════════════
• 10-18% should score 80-97 (Safe Zone - perfect fit, protect these)
• 22-28% should score 60-79 (Good Fit - solid options)
• 28-35% should score 40-59 (Gray Area - user decides)
• 15-22% should score 20-39 (Questionable - likely off-brand)
• 8-12% should score 0-19 (Off-Brand - suggest removal)

TOP 40% ARE THE SAFETY NET. These are keepers.
50% is the deletion guidance point - below this, user should consider removing.

═══════════════════════════════════════════════════════════════════════════════
THE 7 CONTENT ARCHETYPES
═══════════════════════════════════════════════════════════════════════════════
Creators sit on a spectrum from pure information to pure entertainment:

1 = THE SCHOLAR: Deep dives, research-heavy, academic style
2 = THE TEACHER: Step-by-step tutorials, patient instruction  
3 = THE GUIDE: Practical tips, actionable advice, solutions
4 = THE MENTOR: Balanced edutainment, relatable wisdom
5 = THE STORYTELLER: Narrative-driven, experience sharing
6 = THE COMMENTATOR: Opinions, hot takes, current event analysis
7 = THE PERFORMER: Pure entertainment, personality-driven

The creator's number tells you what content style phrases should match.
• Style 1-3: Boost instructional phrases ("how to", "tutorial", "guide")
• Style 5-7: Boost entertainment phrases ("is X dead", "my experience", "react")
• Style 4: Flexible - both can work

═══════════════════════════════════════════════════════════════════════════════
MONETIZATION MATCHING (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════
If creator sells products or does affiliate marketing, PAY ATTENTION to what they sell.

PROTECT AT ALL COSTS any phrase related to their specific products/affiliate niche.
Example: Creator sells "a tool that helps with topics, titles, and thumbnails"
→ ANY phrase about topics, titles, or thumbnails should score 85+
→ These are MONEY PHRASES for this creator

If they have specific monetization data:
• products_description → Extract the capabilities and BOOST related phrases massively
• affiliate_products → Extract the product types and BOOST related phrases massively
• sponsorship_niche → BOOST phrases that would attract those brands

═══════════════════════════════════════════════════════════════════════════════
PILLAR ALIGNMENT
═══════════════════════════════════════════════════════════════════════════════
If the creator has content pillars, check if the phrase fits:

• Evergreen pillars: Core topics they always cover → Strong boost (+15 to +25)
• Trending pillars: Timely topics they care about → Moderate boost (+10 to +15)  
• Monetization pillars: Topics tied to their revenue → MASSIVE boost (+20 to +30)

A phrase matching ANY pillar should score at least 55+.
A phrase matching their monetization pillar should score at least 75+.

═══════════════════════════════════════════════════════════════════════════════
NICHE MATCHING
═══════════════════════════════════════════════════════════════════════════════

CORE NICHE MATCH → +20 to +30
Phrase directly relates to their stated niche.

ADJACENT NICHE → +5 to +15
Related topic that overlaps with their audience.
Example: Tech review channel → Software tutorials (adjacent, audience overlap)

UNRELATED NICHE → -20 to -40
Completely different topic area.
Example: Gaming channel → Cooking recipes (wrong audience entirely)

═══════════════════════════════════════════════════════════════════════════════
AUDIENCE MATCHING
═══════════════════════════════════════════════════════════════════════════════

Match the phrase to WHO they serve:

• audience_who: Does this phrase appeal to that person? 
• audience_struggle: Does this phrase address that pain point?
• audience_goal: Does this phrase help achieve that goal?
• audience_expertise: Does this phrase match their level?

STRONG MATCH (phrase addresses their specific audience) → +15 to +25
MODERATE MATCH (general fit) → +5 to +10
MISMATCH (wrong audience level or need) → -10 to -25

═══════════════════════════════════════════════════════════════════════════════
SCORING FORMULA
═══════════════════════════════════════════════════════════════════════════════

BASE: 50 (neutral - could go either way)

BOOSTS:
• Niche match: +10 to +30
• Content style match: +10 to +20
• Audience match: +10 to +25
• Pillar match: +10 to +30 (monetization pillars get +30)
• Monetization phrase (matches their products/affiliates): +25 to +35

PENALTIES:
• Wrong content style: -15 to -25
• Unrelated niche: -20 to -40
• Wrong audience level: -10 to -20
• Off-brand tone: -10 to -20

Maximum score: 97 (never output 98, 99, or 100)
Minimum score: 0

═══════════════════════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

CREATOR: YouTube Growth channel, Teacher style (2), sells tool for topics/titles/thumbnails
Session seed: "youtube algorithm"

• "how to fix youtube algorithm" → 50 + 20(niche) + 15(teacher style) + 10(audience) = 95
• "youtube title optimization tips" → 50 + 20(niche) + 15(style) + 30(MONETIZATION!) = 97 (cap)
• "thumbnail design mistakes" → 50 + 15(related) + 15(style) + 30(MONETIZATION!) = 97 (cap)
• "youtube algorithm explained" → 50 + 20(niche) + 15(style) = 85
• "is youtube dead" → 50 + 15(niche) - 15(wrong style) = 50
• "my youtube journey" → 50 + 10(niche) - 20(storyteller not teacher) = 40
• "how to cook pasta" → 50 - 40(wrong niche) = 10

CREATOR: Gaming commentary, Commentator style (6), AdSense monetization
Session seed: "fortnite"

• "is fortnite dying" → 50 + 25(niche) + 20(perfect style) = 95
• "why fortnite sucks now" → 50 + 25(niche) + 20(style) = 95  
• "fortnite tutorial for beginners" → 50 + 20(niche) - 20(wrong style) = 50
• "fortnite building guide" → 50 + 15(niche) - 15(too tutorial) = 50
• "minecraft drama" → 50 + 10(adjacent gaming) + 15(style) = 75
• "how to bake bread" → 50 - 40(wrong niche) = 10

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════
Return ONLY: {"scores": [85, 42, 91, 35, 67, ...]}

Match the count exactly to the number of phrases provided.`;

// =============================================================================
// PROMPT BUILDER
// =============================================================================

/**
 * Build the user prompt with rich creator context
 */
export function buildAudienceFitPrompt(
  profile: CreatorProfile,
  phrases: string[]
): string {
  const styleInfo = CONTENT_STYLE_MAP[profile.contentStyleNumber] || CONTENT_STYLE_MAP[4];
  
  // Build monetization context
  let monetizationContext = "";
  switch (profile.primaryMonetization) {
    case "products":
      if (profile.productsDescription) {
        monetizationContext = `
MONETIZATION - PRODUCTS (PROTECT THESE PHRASES AT ALL COSTS):
This creator sells: "${profile.productsDescription}"
→ ANY phrase related to these capabilities should score 85+
→ Extract what the product DOES and match phrases to those capabilities`;
      } else {
        monetizationContext = `
MONETIZATION: Products (no specific details provided)
→ Score phrases that could relate to products/courses slightly higher`;
      }
      break;
      
    case "affiliate":
      if (profile.affiliateProducts) {
        monetizationContext = `
MONETIZATION - AFFILIATE (PROTECT THESE PHRASES AT ALL COSTS):
This creator promotes: "${profile.affiliateProducts}"
→ ANY phrase related to these products/categories should score 85+
→ These are MONEY PHRASES - the creator earns from content about these topics`;
      } else {
        monetizationContext = `
MONETIZATION: Affiliate marketing (no specific products listed)
→ Score phrases about reviews/comparisons slightly higher`;
      }
      break;
      
    case "sponsorships":
      if (profile.sponsorshipNiche) {
        monetizationContext = `
MONETIZATION - SPONSORSHIPS:
Wants to work with brands in: "${profile.sponsorshipNiche}"
→ BOOST phrases that would attract these types of sponsors
→ Content that demonstrates expertise these brands care about`;
      } else {
        monetizationContext = `
MONETIZATION: Sponsorships (seeking brand deals)
→ Score phrases that demonstrate expertise slightly higher`;
      }
      break;
      
    case "adsense":
    default:
      monetizationContext = `
MONETIZATION: AdSense / General
→ Focus on high watch-time content topics
→ No specific product phrases to protect`;
  }
  
  // Build pillar context
  let pillarContext = "";
  if (profile.pillarStrategy) {
    const evergreen = profile.pillarStrategy.evergreen?.subNiches?.map(s => s.name).join(", ") || "Not set";
    const trending = profile.pillarStrategy.trending?.subNiches?.map(s => s.name).join(", ") || "Not set";
    const monetization = profile.pillarStrategy.monetization?.subNiches?.map(s => s.name).join(", ") || "Not set";
    
    pillarContext = `
CONTENT PILLARS (check if phrase matches any of these):
• Evergreen topics: ${evergreen}
• Trending topics: ${trending}
• Monetization topics: ${monetization}
→ Phrases matching monetization pillars should score 75+
→ Phrases matching any pillar should score at least 55+`;
  }
  
  // Build audience context
  const audienceContext = `
THE AUDIENCE THEY SERVE:
• Who: ${profile.audienceWho || "Not specified"}
• Their struggle: ${profile.audienceStruggle || "Not specified"}
• Their goal: ${profile.audienceGoal || "Not specified"}
• Expertise level: ${profile.audienceExpertise || "Not specified"}`;
  
  // Build the numbered phrases
  const numberedPhrases = phrases
    .map((phrase, i) => `${i + 1}) ${phrase}`)
    .join('\n\n');
  
  return `═══════════════════════════════════════════════════════════════════════════════
CREATOR IDENTITY
═══════════════════════════════════════════════════════════════════════════════
Channel Niche: ${profile.niche}
Session Seed Topic: "${profile.seedPhrase}"

═══════════════════════════════════════════════════════════════════════════════
CONTENT STYLE: ${profile.contentStyleName} (${profile.contentStyleNumber}/7)
═══════════════════════════════════════════════════════════════════════════════
Style traits: ${styleInfo.traits}
Best-fit phrases: ${styleInfo.bestFit}
Poor-fit phrases: ${styleInfo.poorFit}

Video formats they create: ${profile.videoFormats?.join(", ") || "Not specified"}
${audienceContext}
${monetizationContext}
${pillarContext}

═══════════════════════════════════════════════════════════════════════════════
SCORING TASK
═══════════════════════════════════════════════════════════════════════════════
Score each phrase for AUDIENCE FIT only (0-97).
• 50 = neutral starting point
• Top 40% should be in the "safety net" (40+)
• Below 50 = suggest removal
• Protect monetization phrases at all costs (85+)

═══════════════════════════════════════════════════════════════════════════════
PHRASES TO SCORE (${phrases.length} total):
═══════════════════════════════════════════════════════════════════════════════
${numberedPhrases}

═══════════════════════════════════════════════════════════════════════════════
Return ONLY: {"scores": [N integers from 0-97]}`;
}

// =============================================================================
// HELPERS (Reused from topic-scoring.ts)
// =============================================================================

/**
 * Parse the GPT response and extract scores
 */
export function parseAudienceFitResponse(
  content: string,
  expectedCount: number
): (number | null)[] {
  try {
    const parsed = JSON.parse(content);
    
    let scores: unknown;
    
    if (Array.isArray(parsed)) {
      scores = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      scores = parsed.scores || parsed.results || parsed.values || parsed.data;
      
      if (!Array.isArray(scores)) {
        const arrayValue = Object.values(parsed).find(v => Array.isArray(v));
        if (arrayValue) {
          scores = arrayValue;
        }
      }
    }
    
    if (!Array.isArray(scores)) {
      console.error('[AudienceFit] Unexpected response format:', JSON.stringify(parsed).slice(0, 200));
      throw new Error('Response is not an array');
    }
    
    if (scores.length !== expectedCount) {
      console.warn(`[AudienceFit] Count mismatch: expected ${expectedCount}, got ${scores.length}`);
    }
    
    const validatedScores: (number | null)[] = [];
    for (let idx = 0; idx < expectedCount; idx++) {
      if (idx < scores.length) {
        const score = scores[idx];
        if (typeof score === 'number') {
          validatedScores.push(Math.max(0, Math.min(97, Math.round(score))));
        } else {
          console.warn(`[AudienceFit] Score at index ${idx} is not a number: ${score}`);
          validatedScores.push(null);
        }
      } else {
        validatedScores.push(null);
      }
    }
    
    return validatedScores;
  } catch (error) {
    const arrayMatch = content.match(/\[[\d,\s]+\]/);
    if (arrayMatch) {
      try {
        const scores = JSON.parse(arrayMatch[0]);
        if (Array.isArray(scores)) {
          const result: (number | null)[] = [];
          for (let idx = 0; idx < expectedCount; idx++) {
            if (idx < scores.length && typeof scores[idx] === 'number') {
              result.push(Math.max(0, Math.min(97, Math.round(scores[idx]))));
            } else {
              result.push(null);
            }
          }
          return result;
        }
      } catch {
        // Fall through
      }
    }
    throw new Error(`Failed to parse response: ${error}`);
  }
}

/**
 * Split array into batches
 */
export function createBatches<T>(
  items: T[],
  batchSize: number = BATCH_CONFIG.defaultBatchSize
): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Calculate distribution of scores
 */
export function calculateDistribution(scores: number[]): AudienceFitScoringResult["distribution"] {
  const distribution = {
    "80-99": 0,
    "60-79": 0,
    "40-59": 0,
    "20-39": 0,
    "0-19": 0,
  };
  
  for (const score of scores) {
    if (score >= 80) distribution["80-99"]++;
    else if (score >= 60) distribution["60-79"]++;
    else if (score >= 40) distribution["40-59"]++;
    else if (score >= 20) distribution["20-39"]++;
    else distribution["0-19"]++;
  }
  
  return distribution;
}

/**
 * Sleep helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
