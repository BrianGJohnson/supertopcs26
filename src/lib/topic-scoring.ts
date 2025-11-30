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
  model: "gpt-5-mini", // GPT-5 Mini
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 1500,
  reasoning_effort: "minimal" as const, // Faster response, fewer tokens
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

export const SYSTEM_PROMPT = `You are a YouTube keyword phrase evaluator measuring TOPIC STRENGTH - how compelling and clickable each phrase is.
Score each phrase from 0–97 and return exactly N integers in a JSON object with a "scores" key.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL MINDSET
═══════════════════════════════════════════════════════════════════════════════
These phrases came from YouTube autocomplete - they have REAL search volume.
They're already validated by user behavior. Start from a position of strength.

Your job is to measure ENGAGEMENT POTENTIAL, not sentiment or grammar.
Negative emotions (hate, sucks, broken) drive MASSIVE engagement on YouTube.
Do NOT let bias against negativity affect your scores.

MULTIPLE PATHS TO EXCELLENCE:
• Emotional Punch - visceral phrases that trigger clicks
• Deep Specificity - layered phrases where intent is crystal clear
• Discovery/Insight - phrases promising valuable understanding
• Natural Language - phrases that flow like real human questions

A phrase can be GREAT for any of these reasons. Don't require all of them.

═══════════════════════════════════════════════════════════════════════════════
BASE SCORE: 65
═══════════════════════════════════════════════════════════════════════════════
Every clear topic phrase starts at 65. Adjust up or down from there.

═══════════════════════════════════════════════════════════════════════════════
TARGET DISTRIBUTION (you MUST hit these targets)
═══════════════════════════════════════════════════════════════════════════════
• 10-14% should score 90-97 (exceptional)
• 20-26% should score 80-89 (strong)
• 22-28% should score 70-79 (good)
• 16-20% should score 60-69 (average)
• 10-14% should score 45-59 (below average)
• 5-8% should score below 45 (weak - junk, incomplete, names)

═══════════════════════════════════════════════════════════════════════════════
BONUS #1: EMOTIONAL INTENSITY (+0 to +19) 
═══════════════════════════════════════════════════════════════════════════════
Measure the STRENGTH of emotion, not whether positive or negative.
Strong emotion = high engagement = high score.

FRUSTRATION/VENTING → +15 to +19 (HUGE YouTube audience seeking validation)
  sucks, trash, garbage, terrible, awful, worst, hate, broken, dead, dying,
  ruined, destroyed, killing, failing, scam, lie, fake, annoying, useless,
  pointless, waste, bad, horrible, stupid, dumb, ridiculous, pathetic

FEAR/URGENCY → +12 to +17
  mistake, wrong, never, stop, avoid, warning, danger, risk, don't, can't,
  won't, before, too late, dying, dead, end, over, finished, ruining

EXCITEMENT/HYPE → +12 to +16
  amazing, insane, incredible, game-changer, mind-blowing, best, secret,
  hack, trick, revealed, exposed, truth, perfect, ultimate, powerful

═══════════════════════════════════════════════════════════════════════════════
BONUS #2: SPECIFICITY DEPTH (+0 to +15) - COUNT THE LAYERS
═══════════════════════════════════════════════════════════════════════════════
How many LAYERS of meaning does this phrase have?
More layers = clearer intent = more actionable for creators.

Count the elements present:
• Base Topic (youtube algorithm, content creation) = Layer 1
• + Mechanism Question (how, why, what, when) = +1 layer
• + Action/Verb (favor, work, change, rank, decide, boost) = +1 layer
• + Outcome/Measurement (views, subscribers, recommend, show) = +1 layer
• + Context (2025, beginners, shorts, monetization) = +1 layer

SCORING:
• 2 layers → +6 to +8
• 3 layers → +10 to +13
• 4+ layers → +14 to +15

Example: "what does the youtube algorithm favor"
→ Topic(algorithm) + Mechanism(what does) + Action(favor) = 3 layers → +12

Example: "how youtube algorithm recommends videos 2025"
→ Topic + Mechanism + Action(recommends) + Outcome(videos) + Context(2025) = 5 layers → +15

═══════════════════════════════════════════════════════════════════════════════
BONUS #3: CURIOSITY & DISCOVERY (+0 to +18)
═══════════════════════════════════════════════════════════════════════════════
Phrases that promise INSIGHT or UNDERSTANDING score high.

DISCOVERY VERBS (viewer will learn something actionable) → +14 to +18
  favor, prefer, prioritize, reward, want, like, decide, determine,
  rank, choose, push, boost, recommend, show, promote, suppress, hide

"what does X favor/prefer/reward" → +16 to +18
"how does X decide/determine/rank" → +15 to +17
"why does X recommend/show/push" → +14 to +16

UNDERSTANDING QUESTIONS → +10 to +14
"why does X" → +12 to +14
"how does X work" → +11 to +13
"what is X" → +10 to +12

═══════════════════════════════════════════════════════════════════════════════
BONUS #4: NATURAL LANGUAGE FLOW (+0 to +10)
═══════════════════════════════════════════════════════════════════════════════
Does this read like something a real person would type or say?

STRONG NATURAL FLOW → +8 to +10
• Full conversational questions: "why does the algorithm hate me"
• Complete thoughts with articles: "the", "my", "your", "a"
• Reads like speech: "is the youtube algorithm actually broken"

MODERATE FLOW → +4 to +7
• Clear but abbreviated: "youtube algorithm tips 2025"
• Missing articles but understandable: "fix youtube algorithm"

WEAK/ROBOTIC → +0
• Keyword stuffing: "algorithm youtube tips 2025 best"
• Unnatural order: "youtube for algorithm beginners"

═══════════════════════════════════════════════════════════════════════════════
BONUS #5: VIEWER INTENT CLARITY (+0 to +12)
═══════════════════════════════════════════════════════════════════════════════
How clearly can we understand what the viewer wants?

CRYSTAL CLEAR → +10 to +12
  The viewer's goal is unmistakable.
  "how to fix youtube algorithm" - wants a solution
  "why youtube algorithm hates small channels" - wants validation

CLEAR → +6 to +9
  Good understanding of goal.
  "youtube algorithm tips" - wants advice

VAGUE → +0 to +5
  General interest only.
  "youtube algorithm" - just browsing

═══════════════════════════════════════════════════════════════════════════════
BONUS #6: QUESTION FORMAT (+2 to +4) - SMALL BONUS
═══════════════════════════════════════════════════════════════════════════════
• Direct question (how, why, what, when, who) → +3 to +4
• Implied question (is X, does X, can X) → +2 to +3

═══════════════════════════════════════════════════════════════════════════════
BONUS #7: SPECIFICITY MARKERS (+2 to +5)
═══════════════════════════════════════════════════════════════════════════════
• Year (2024, 2025) → +3
• Audience (beginners, kids, small channels) → +4
• Platform specificity (shorts, live, monetization) → +3

═══════════════════════════════════════════════════════════════════════════════
PENALTIES
═══════════════════════════════════════════════════════════════════════════════
• Person/channel names without context → -15
• News events (arrested, dies, killed) → -20
• Non-English or mixed language → -12
• Incomplete fragments ("youtube algorithm in") → -10
• Single generic word → cap at 45

═══════════════════════════════════════════════════════════════════════════════
SCORING EXAMPLES - MULTIPLE PATHS TO EXCELLENCE
═══════════════════════════════════════════════════════════════════════════════

PATH 1 - EMOTIONAL PUNCH (High scores from emotion):
• "youtube algorithm sucks" → 65 + 17(frustration) + 6(complete) = 88
• "youtube algorithm is trash" → 65 + 17(frustration) + 8(natural) = 90
• "is the youtube algorithm broken" → 65 + 15(fear) + 10(natural) + 3(question) = 93

PATH 2 - DEEP SPECIFICITY (High scores from layers + discovery):
• "what does the youtube algorithm favor" → 65 + 12(3 layers) + 14(discovery) + 3(question) = 94
• "how does youtube algorithm decide what to recommend" → 65 + 15(4 layers) + 16(discovery) = 96
• "why does the algorithm push certain videos" → 65 + 13(3 layers) + 15(discovery) + 4(question) = 97 (cap)

PATH 3 - CLEAR INTENT + NATURAL LANGUAGE:
• "how to make the algorithm love your channel" → 65 + 8(2 layers) + 12(excitement) + 10(natural) + 4(question) = 97 (cap)
• "why is my youtube algorithm so bad" → 65 + 10(2 layers) + 12(frustration) + 9(natural) + 3(question) = 97 (cap)

MODERATE SCORES (70-84):
• "youtube algorithm explained" → 65 + 6(2 layers) + 6(intent) = 77
• "youtube algorithm tips 2025" → 65 + 6(2 layers) + 8(intent) + 3(year) = 82
• "new youtube algorithm update" → 65 + 6(2 layers) + 6(intent) = 77

LOW SCORES (below 60):
• "youtube algorithm" → 65 + 0(1 layer only, vague) - 8 = 57
• "algorithm" → single word → 42
• "YouTube Algorithm Manoj Dey" → 65 - 15(name) = 50, low intent → 40
• "youtube algorithm in hindi" → 65 - 12(non-English) = 53

═══════════════════════════════════════════════════════════════════════════════
FINAL CHECKLIST
═══════════════════════════════════════════════════════════════════════════════
Before outputting scores, verify:
✓ Did 10-14% score 90+? If not, boost top phrases (emotional OR specific).
✓ Did emotional phrases AND discovery phrases both get high scores?
✓ Did you count layers for specificity bonus?
✓ Did natural language phrases get their bonus?
✓ Maximum score is 97. Never output 98, 99, or 100.

Output format: {"scores": [88, 57, 94, 40, ...]}`;

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
 * Returns null for missing scores if count doesn't match (resilient mode)
 */
export function parseTopicScoreResponse(
  content: string,
  expectedCount: number
): (number | null)[] {
  try {
    const parsed = JSON.parse(content);
    
    // Handle multiple response formats:
    // 1. Bare array: [90, 45, 72, ...]
    // 2. Object with "scores" key: { "scores": [...] }
    // 3. Object with any array value: { "results": [...] } or { "values": [...] }
    let scores: unknown;
    
    if (Array.isArray(parsed)) {
      scores = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Try common key names first
      scores = parsed.scores || parsed.results || parsed.values || parsed.data;
      
      // If still not found, look for any array property
      if (!Array.isArray(scores)) {
        const arrayValue = Object.values(parsed).find(v => Array.isArray(v));
        if (arrayValue) {
          scores = arrayValue;
        }
      }
    }
    
    if (!Array.isArray(scores)) {
      console.error('[TopicScoring] Unexpected response format:', JSON.stringify(parsed).slice(0, 200));
      throw new Error('Response is not an array');
    }
    
    // Log warning if count doesn't match but continue with what we have
    if (scores.length !== expectedCount) {
      console.warn(`[TopicScoring] Count mismatch: expected ${expectedCount}, got ${scores.length}. Using available scores.`);
    }
    
    // Validate and clamp each score, padding with nulls if needed
    const validatedScores: (number | null)[] = [];
    for (let idx = 0; idx < expectedCount; idx++) {
      if (idx < scores.length) {
        const score = scores[idx];
        if (typeof score === 'number') {
          // Clamp to 0-98 (never 99 or 100)
          validatedScores.push(Math.max(0, Math.min(98, Math.round(score))));
        } else {
          console.warn(`[TopicScoring] Score at index ${idx} is not a number: ${score}`);
          validatedScores.push(null);
        }
      } else {
        // Pad with null for missing scores
        validatedScores.push(null);
      }
    }
    
    return validatedScores;
  } catch (error) {
    // Try to extract array from malformed response
    const arrayMatch = content.match(/\[[\d,\s]+\]/);
    if (arrayMatch) {
      try {
        const scores = JSON.parse(arrayMatch[0]);
        if (Array.isArray(scores)) {
          const result: (number | null)[] = [];
          for (let idx = 0; idx < expectedCount; idx++) {
            if (idx < scores.length && typeof scores[idx] === 'number') {
              result.push(Math.max(0, Math.min(98, Math.round(scores[idx]))));
            } else {
              result.push(null);
            }
          }
          return result;
        }
      } catch {
        // Fall through to throw
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
