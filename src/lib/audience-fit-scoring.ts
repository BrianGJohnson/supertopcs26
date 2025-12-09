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
  topicIdeas: string[];        // ["YouTube algorithm", "AI tools", "YouTube updates"] - from onboarding

  // Who they serve
  audienceWho: string;         // "Developers wanting to speed up coding"
  audienceStruggle: string;    // "Spending too much time on boilerplate"
  audienceGoal: string;        // "Ship projects faster"
  audienceExpertise: string;   // "beginner", "intermediate", "advanced"

  // Monetization (CRITICAL - specific data matters here)
  primaryMonetization: string; // "products", "affiliate", "adsense", "sponsorships"
  monetizationMethods: string[]; // All methods in priority order
  productsDescription?: string;  // EXACT description of what they sell
  affiliateProducts?: string;    // EXACT products they promote
  sponsorshipNiche?: string;     // Brands they want to work with

  // Content Pillars - supports both flat and nested structure
  pillarStrategy?: {
    pillars?: {
      evergreen?: { subNiches?: Array<{ name: string }>; selectedSubNiches?: string[] };
      trending?: { subNiches?: Array<{ name: string }> };
      monetization?: { subNiches?: Array<{ name: string }>; selectedSubNiches?: string[] };
    };
    // Also support flat structure for backwards compatibility
    evergreen?: { subNiches?: Array<{ name: string }>; selectedSubNiches?: string[] };
    trending?: { subNiches?: Array<{ name: string }> };
    monetization?: { subNiches?: Array<{ name: string }>; selectedSubNiches?: string[] };
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
// SYSTEM PROMPT - Focus on user's actual data, no artificial distribution
// =============================================================================

export const SYSTEM_PROMPT = `You are scoring how well each phrase fits a specific YouTube creator's channel.
Return a JSON object with a "scores" key containing exactly N integers from 0-97.

YOUR JOB: Score each phrase based on whether THIS SPECIFIC CREATOR'S AUDIENCE would want this content.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: AUDIENCE FIT = DOES THIS MATCH THE CHANNEL?
═══════════════════════════════════════════════════════════════════════════════
Audience Fit measures ONE thing: Does this phrase match what this creator's channel is about?

If the channel is about "YouTube Growth" and the phrase is about "No Code Apps":
→ Score LOW (20-40) because the audience came for YouTube tips, not app building.

If the channel is about "YouTube Growth" and the phrase is about "Algorithm Tips":
→ Score HIGH (80-97) because the audience wants exactly this.

The NICHE and AUDIENCE are what matter. Not what session the user is in.

═══════════════════════════════════════════════════════════════════════════════
SCORING RULES (IN ORDER OF PRIORITY)
═══════════════════════════════════════════════════════════════════════════════

1. PHRASES MATCHING THEIR EXPLICIT TOPIC IDEAS → Score 80-97
   If they listed "YouTube algorithm" as a topic, phrases about algorithms fit perfectly.

2. PHRASES MATCHING THEIR PRODUCTS → Score 85-97
   If they sell something, phrases about that capability = money phrases.

3. PHRASES MATCHING MONETIZATION PILLARS → Score 80-95
   These drive their revenue.

4. PHRASES MATCHING EVERGREEN/TRENDING PILLARS → Score 65-85
   Core content they regularly make.

5. PHRASES IN THEIR NICHE → Score 55-75
   Generally on-brand for their channel.

6. PHRASES LOOSELY RELATED TO NICHE → Score 35-55
   Tangentially connected, audience might be interested.

7. PHRASES OUTSIDE THEIR NICHE → Score 15-35
   Different topic area. Their audience didn't subscribe for this.

8. PHRASES COMPLETELY UNRELATED → Score 0-15
   Wrong audience entirely. Would confuse subscribers.

═══════════════════════════════════════════════════════════════════════════════
KEY PRINCIPLE: NICHE MISMATCH = LOW SCORE
═══════════════════════════════════════════════════════════════════════════════
If the phrase topic is NOT what their channel covers, score it LOW.

Examples for a "YouTube Growth" channel:
- "How to get more views" → 90 (perfect fit)
- "Thumbnail design tips" → 85 (core topic)
- "Best camera for YouTube" → 70 (related equipment)
- "Vlog editing software" → 55 (somewhat related)
- "No code app builder" → 25 (different topic entirely)
- "Best cooking recipes" → 10 (completely unrelated)

═══════════════════════════════════════════════════════════════════════════════
SEMANTIC MATCHING IS CRITICAL
═══════════════════════════════════════════════════════════════════════════════
Don't just look for exact keyword matches. Use semantic understanding:

- "YouTube algorithm" topic → matches "how algorithm works", "algorithm explained"
- "Thumbnail Design" pillar → matches "thumbnail mistakes", "best thumbnails"
- "Topic Research" product → matches "find video ideas", "what to make videos about"

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════
NEVER output 98, 99, or 100. Maximum is 97.
Return ONLY: {"scores": [85, 42, 91, 35, 67, ...]}`;

// =============================================================================
// PROMPT BUILDER
// =============================================================================

/**
 * Build the user prompt with ALL creator context from onboarding
 * 
 * PHILOSOPHY: Send everything the user told us during onboarding.
 * More context = better scoring. GPT-5 mini can handle it.
 */
export function buildAudienceFitPrompt(
  profile: CreatorProfile,
  phrases: string[]
): string {
  // -------------------------------------------------------------------------
  // Extract pillar data (handle both nested and flat structure)
  // -------------------------------------------------------------------------
  const pillars = profile.pillarStrategy?.pillars || profile.pillarStrategy;

  const evergreenPillar = pillars?.evergreen;
  const trendingPillar = pillars?.trending;
  const monetizationPillar = pillars?.monetization;

  // Get selected sub-niches (what user actually picked) or fall back to all
  const evergreenTopics = evergreenPillar?.selectedSubNiches?.length
    ? evergreenPillar.selectedSubNiches
    : evergreenPillar?.subNiches?.map(s => s.name) || [];

  const trendingTopics = trendingPillar?.subNiches?.map(s => s.name) || [];

  const monetizationTopics = monetizationPillar?.selectedSubNiches?.length
    ? monetizationPillar.selectedSubNiches
    : monetizationPillar?.subNiches?.map(s => s.name) || [];

  // -------------------------------------------------------------------------
  // Build monetization context - USE ALL METHODS, not just primary
  // -------------------------------------------------------------------------
  let monetizationContext = "";

  // Always include products description if they sell products
  if (profile.productsDescription) {
    monetizationContext += `
PRODUCTS THEY SELL (PROTECT THESE PHRASES - SCORE 85+):
"${profile.productsDescription}"
→ ANY phrase related to what this product does should score 85+
→ These are MONEY PHRASES - they lead directly to sales`;
  }

  // Always include affiliate info if they do affiliate
  if (profile.affiliateProducts) {
    monetizationContext += `

AFFILIATE PRODUCTS THEY PROMOTE (PROTECT THESE PHRASES - SCORE 85+):
"${profile.affiliateProducts}"
→ ANY phrase related to these products should score 85+
→ Content about these topics earns them money`;
  }

  // Include sponsorship info
  if (profile.sponsorshipNiche) {
    monetizationContext += `

SPONSORSHIP BRANDS THEY WANT:
"${profile.sponsorshipNiche}"
→ BOOST phrases that would attract these types of sponsors`;
  }

  // If no specific monetization data, note the methods they use
  if (!monetizationContext && profile.monetizationMethods?.length) {
    monetizationContext = `
MONETIZATION METHODS: ${profile.monetizationMethods.join(", ")}
→ Score phrases that support these revenue methods higher`;
  }

  if (!monetizationContext) {
    monetizationContext = `
MONETIZATION: Not specified
→ Focus on topics that match their niche and audience`;
  }

  // -------------------------------------------------------------------------
  // Build pillar context - INCLUDE ALL PILLARS
  // -------------------------------------------------------------------------
  let pillarContext = "";

  if (evergreenTopics.length || trendingTopics.length || monetizationTopics.length) {
    pillarContext = `
CONTENT PILLARS (from their onboarding - phrases matching these should score HIGH):`;

    if (evergreenTopics.length) {
      pillarContext += `
• EVERGREEN TOPICS: ${evergreenTopics.join(", ")}
  → These are their core, always-relevant topics. Score 65+ if phrase matches.`;
    }

    if (trendingTopics.length) {
      pillarContext += `
• TRENDING TOPICS: ${trendingTopics.join(", ")}
  → These are timely topics they care about. Score 60+ if phrase matches.`;
    }

    if (monetizationTopics.length) {
      pillarContext += `
• MONETIZATION TOPICS: ${monetizationTopics.join(", ")}
  → These drive revenue. Score 80+ if phrase matches.`;
    }
  }

  // -------------------------------------------------------------------------
  // Build topic ideas context - THIS IS CRITICAL AND WAS MISSING
  // -------------------------------------------------------------------------
  let topicIdeasContext = "";
  if (profile.topicIdeas?.length) {
    topicIdeasContext = `

TOPICS THEY EXPLICITLY SAID THEY WANT TO COVER (SCORE 80+ IF PHRASE MATCHES):
${profile.topicIdeas.map(t => `• "${t}"`).join("\n")}
→ The creator specifically listed these during onboarding
→ ANY phrase related to these topics should score 80+`;
  }

  // -------------------------------------------------------------------------
  // Build the numbered phrases
  // -------------------------------------------------------------------------
  const numberedPhrases = phrases
    .map((phrase, i) => `${i + 1}) ${phrase}`)
    .join('\n\n');

  // -------------------------------------------------------------------------
  // BUILD THE FULL PROMPT - CHANNEL FIT ONLY (NO SEED TOPIC)
  // -------------------------------------------------------------------------
  return `═══════════════════════════════════════════════════════════════════════════════
CREATOR'S CHANNEL PROFILE
═══════════════════════════════════════════════════════════════════════════════
CHANNEL NICHE: ${profile.niche}
CONTENT STYLE: ${profile.contentStyleName} (#${profile.contentStyleNumber})
VIDEO FORMATS: ${profile.videoFormats?.join(", ") || "Not specified"}
${topicIdeasContext}

═══════════════════════════════════════════════════════════════════════════════
THEIR AUDIENCE
═══════════════════════════════════════════════════════════════════════════════
• WHO: ${profile.audienceWho || "Not specified"}
• STRUGGLE: ${profile.audienceStruggle || "Not specified"}
• GOAL: ${profile.audienceGoal || "Not specified"}
• EXPERTISE: ${profile.audienceExpertise || "Not specified"}

═══════════════════════════════════════════════════════════════════════════════
MONETIZATION & PILLARS
═══════════════════════════════════════════════════════════════════════════════
${monetizationContext}
${pillarContext}

═══════════════════════════════════════════════════════════════════════════════
SCORING PRIORITY (in order)
═══════════════════════════════════════════════════════════════════════════════
1. Matches their topic ideas → 80-97  
2. Matches their products/monetization → 85-97
3. Matches their pillars → 65-85
4. In their niche → 55-75
5. Loosely related to niche → 35-55
6. Outside their niche → 15-35
7. Completely unrelated → 0-15

KEY: If the phrase topic doesn't match what their CHANNEL is about, score LOW.
Maximum score is 97 (never 98-100).

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
