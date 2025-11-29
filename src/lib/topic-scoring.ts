/**
 * Topic Strength Scoring System
 * 
 * Uses GPT-5 Mini to evaluate how specific, descriptive, and search-worthy 
 * each keyword phrase is. Scores are session-relative (not comparable across sessions).
 * 
 * @see /docs/topic-strength-scoring.md for full documentation
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TopicScoreResult {
  seedId: string;
  phrase: string;
  score: number;
}

export interface BatchResult {
  batchIndex: number;
  scores: number[];
  success: boolean;
  error?: string;
}

export interface ScoringResult {
  success: boolean;
  totalScored: number;
  batchCount: number;
  duration: number;
  results: TopicScoreResult[];
  distribution: {
    "90-98": number;
    "80-89": number;
    "60-79": number;
    "40-59": number;
    "20-39": number;
    "0-19": number;
  };
  errors?: string[];
}

// =============================================================================
// CONFIGURATION (LOCKED - Do not modify without extensive testing)
// =============================================================================

export const MODEL_CONFIG = {
  model: "gpt-4o-mini", // OpenAI's GPT-4o Mini (production name)
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 1500,
  response_format: { type: "json_object" as const },
} as const;

export const BATCH_CONFIG = {
  minBatchSize: 25,
  maxBatchSize: 40,
  defaultBatchSize: 40,
  interBatchDelayMs: 150,
} as const;

// =============================================================================
// PROMPTS
// =============================================================================

export const SYSTEM_PROMPT = `You are a precise evaluator of how specific and descriptive each keyword phrase is as a topic.
Your task is to score each phrase from 0–98 and return exactly N integers in a JSON object with a "scores" array.

───────────────────────────────
SCORING PHILOSOPHY
───────────────────────────────
Your goal is to create a LEFT-SKEWED distribution where most phrases score in the moderate-to-low range.
This helps users identify which phrases to DELETE.

Target Distribution:
• 8-9% score 90-98 (exceptional)
• 15-23% score 80-89 (strong)
• 30-39% score 60-79 (moderate)
• 20-25% score 40-59 (below average)
• 10-15% score 20-39 (weak)
• 3-5% score 0-19 (very weak)

───────────────────────────────
BASE SCORING CRITERIA
───────────────────────────────
Judge how descriptive, detailed, and information-rich each phrase is:
- How much does it reveal about what the viewer is interested in?
- Does it specify who, what, when, where, why, or how?
- Does it show viewer curiosity or problem-solving intent?

HIGH SCORES (80-98):
• Contains concrete details, analytical depth, or strong intent cues
• Explores insight, discovery, or cause/effect
• Natural question structures (who, what, when, where, why, how)
• Emotional triggers: frustration, curiosity, fear, desire
• Analytical language: what, why, how, reason, cause, impact, discover, reveal

MODERATE SCORES (60-79):
• Some specificity but missing depth
• Decent clarity but generic elements
• Common topic without unique angle

LOW SCORES (20-59):
• Vague or overly broad topics
• Missing actionable context
• Generic phrases anyone might search

VERY LOW SCORES (0-19):
• Extremely generic single words or short phrases
• Nonsensical or malformed
• No clear topic intent

───────────────────────────────
PENALTIES
───────────────────────────────
Apply these score reductions:
• Unnatural word order → -5 to -10
• Redundant/repeated words → -5 to -8
• 2+ connectors (and, with, plus, in, for, using) → -6
• Phrase length > 9 words → additional -4
• Both connector AND length penalties → -10 total (cap)

───────────────────────────────
GUIDELINES
───────────────────────────────
• NEVER output 99 or 100
• Maximum score is 98
• Be harsh on generic phrases - they should score 40-60, not 70+
• Reserve 90+ for truly exceptional, specific, analytical phrases
• Output JSON: { "scores": [90, 45, 72, 38, ...] }

───────────────────────────────
EXAMPLES
───────────────────────────────
• "Halloween costume" → 45 (generic)
• "Halloween candy-cane witch costume" → 85 (specific)
• "Why garden soil loses nutrients over time" → 92 (analytical, specific)
• "Fix broken sprinkler system in spring" → 78 (problem-solving but common)
• "youtube" → 12 (too generic)
• "content creation" → 38 (broad category)
• "content creation tips for beginners 2025" → 76 (decent specificity)
• "why my youtube videos get no views" → 88 (emotional, analytical, specific)

Example output for 5 phrases: { "scores": [45, 85, 92, 78, 12] }`;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Build user prompt for a batch of phrases
 */
export function buildUserPrompt(phrases: string[]): string {
  const numberedPhrases = phrases
    .map((phrase, i) => `${i + 1}) ${phrase}`)
    .join('\n\n');
  
  return `COUNT: There are ${phrases.length} phrases.

${numberedPhrases}`;
}

/**
 * Parse the GPT response and extract scores
 */
export function parseTopicScoreResponse(
  content: string,
  expectedCount: number
): number[] {
  try {
    const parsed = JSON.parse(content);
    
    // Handle { "scores": [...] } format
    const scores = parsed.scores || parsed;
    
    if (!Array.isArray(scores)) {
      throw new Error('Response is not an array');
    }
    
    if (scores.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} scores, got ${scores.length}`);
    }
    
    // Validate and clamp each score
    const validatedScores = scores.map((score, idx) => {
      if (typeof score !== 'number') {
        console.warn(`Score at index ${idx} is not a number: ${score}`);
        return 50; // Default to middle score
      }
      // Clamp to 0-98 (never 99 or 100)
      return Math.max(0, Math.min(98, Math.round(score)));
    });
    
    return validatedScores;
  } catch (error) {
    // Try to extract array from malformed response
    const arrayMatch = content.match(/\[[\d,\s]+\]/);
    if (arrayMatch) {
      const scores = JSON.parse(arrayMatch[0]);
      if (Array.isArray(scores) && scores.length === expectedCount) {
        return scores.map((s: number) => Math.max(0, Math.min(98, Math.round(s))));
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
export function calculateDistribution(scores: number[]): ScoringResult["distribution"] {
  const distribution = {
    "90-98": 0,
    "80-89": 0,
    "60-79": 0,
    "40-59": 0,
    "20-39": 0,
    "0-19": 0,
  };
  
  for (const score of scores) {
    if (score >= 90) distribution["90-98"]++;
    else if (score >= 80) distribution["80-89"]++;
    else if (score >= 60) distribution["60-79"]++;
    else if (score >= 40) distribution["40-59"]++;
    else if (score >= 20) distribution["20-39"]++;
    else distribution["0-19"]++;
  }
  
  return distribution;
}

/**
 * Sleep helper for inter-batch delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
