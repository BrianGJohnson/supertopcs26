/**
 * Demand Scoring Module
 * 
 * Uses YouTube autocomplete data to calculate demand scores for phrases.
 * Based on the SuperTopics Demand Framework v2.0
 * 
 * @see /docs/1-autocomplete-scoring-algorithm.md for full documentation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface AutocompleteResult {
  seed: string;
  suggestion: string;
}

export interface PhraseAnalysis {
  phrase: string;
  suggestionCount: number;
  exactMatches: number;
  topicMatches: number;
  exactMatchPct: number;
  topicMatchPct: number;
}

export interface DemandScoreResult {
  seedId: string;
  phrase: string;
  demandScore: number;
  suggestionCount: number;
  exactMatchCount: number;
  topicMatchCount: number;
  suggestionPoints: number;
  exactMatchPoints: number;
  topicMatchPoints: number;
  sizeMultiplier: number;
  rawScore: number;
}

export interface BatchDemandResult {
  results: DemandScoreResult[];
  totalPhrases: number;
  totalApiCalls: number;
  durationMs: number;
  estimatedCostUsd: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Suggestion count → points mapping (max 40 points)
 * Matches Viewer Landscape Modal for consistency
 * YouTube returns 0-14 suggestions, we map to 0-40 points
 */
export const SUGGESTION_POINTS: Record<number, number> = {
  14: 40,
  13: 37,
  12: 34,
  11: 31,
  10: 29,
  9: 26,
  8: 23,
  7: 20,
  6: 17,
  5: 14,
  4: 11,
  3: 9,
  2: 6,
  1: 3,
  0: 0,
};

/**
 * Topic match → points mapping (max 30 points)
 * Matches Viewer Landscape Modal for consistency
 */
export const TOPIC_MATCH_POINTS: Record<number, number> = {
  14: 30,
  13: 28,
  12: 26,
  11: 24,
  10: 21,
  9: 19,
  8: 17,
  7: 15,
  6: 13,
  5: 11,
  4: 9,
  3: 6,
  2: 4,
  1: 2,
  0: 0,
};

/**
 * Exact match → points mapping (max 30 points)
 * Rewards proof of actual search volume
 */
export const EXACT_MATCH_POINTS: Record<number, number> = {
  14: 30,
  13: 28,
  12: 26,
  11: 24,
  10: 21,
  9: 19,
  8: 17,
  7: 15,
  6: 13,
  5: 11,
  4: 9,
  3: 6,
  2: 4,
  1: 2,
  0: 0,
};

/**
 * Maximum points per signal
 * Total max = 40 + 30 + 30 = 100 (before session multiplier)
 */
export const MAX_POINTS = {
  SUGGESTIONS: 40,
  TOPIC_MATCH: 30,
  EXACT_MATCH: 30,
};

/**
 * Session size multipliers
 * Larger sessions = harder to maintain quality = slight boost
 */
export const SIZE_MULTIPLIERS: { min: number; max: number; multiplier: number }[] = [
  { min: 550, max: Infinity, multiplier: 1.06 },
  { min: 450, max: 549, multiplier: 1.04 },
  { min: 350, max: 449, multiplier: 1.02 },
  { min: 275, max: 349, multiplier: 1.00 },
  { min: 200, max: 274, multiplier: 0.98 },
  { min: 0, max: 199, multiplier: 0.95 },
];

/**
 * Batch processing configuration
 */
export const BATCH_CONFIG = {
  phrasesPerBatch: 6,   // 6 phrases per API call (smaller batches = more natural)
  maxPhrases: 75,       // Maximum phrases to score
  estimatedCostPerCall: 0.001,  // ~$0.001 per batch call
  minDelayMs: 1500,     // Minimum delay between batches (1.5s)
  maxDelayMs: 3500,     // Maximum delay between batches (3.5s)
  // Some batches get extra "thinking time" for varied patterns
  extraDelayChance: 0.3,  // 30% chance of extra delay
  extraDelayMs: 2000,     // Additional 2s when triggered
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a random delay with jitter for natural pacing
 * Some batches get extra "thinking time" for varied patterns
 */
function getRandomDelay(): number {
  let delay = BATCH_CONFIG.minDelayMs + 
    Math.random() * (BATCH_CONFIG.maxDelayMs - BATCH_CONFIG.minDelayMs);
  
  // 30% chance of extra delay for varied patterns
  if (Math.random() < BATCH_CONFIG.extraDelayChance) {
    delay += BATCH_CONFIG.extraDelayMs;
    console.log(`[DemandScoring] Extra thinking time added`);
  }
  
  return delay;
}

/**
 * Get points for a suggestion count (max 40)
 */
export function getSuggestionPoints(count: number): number {
  if (count >= 14) return SUGGESTION_POINTS[14];
  if (count < 0) return 0;
  return SUGGESTION_POINTS[count] ?? 0;
}

/**
 * Get points for topic match count (max 30)
 */
export function getTopicMatchPoints(count: number): number {
  if (count >= 14) return TOPIC_MATCH_POINTS[14];
  if (count < 0) return 0;
  return TOPIC_MATCH_POINTS[count] ?? 0;
}

/**
 * Get points for exact match count (max 30)
 */
export function getExactMatchPoints(count: number): number {
  if (count >= 14) return EXACT_MATCH_POINTS[14];
  if (count < 0) return 0;
  return EXACT_MATCH_POINTS[count] ?? 0;
}

/**
 * Get size multiplier based on total session phrase count
 */
export function getSizeMultiplier(totalPhrases: number): number {
  for (const tier of SIZE_MULTIPLIERS) {
    if (totalPhrases >= tier.min && totalPhrases <= tier.max) {
      return tier.multiplier;
    }
  }
  return 1.0;
}

/**
 * Check if a suggestion is an exact match
 * Exact = suggestion starts with the phrase (phrase is prefix of suggestion)
 */
export function isExactMatch(phrase: string, suggestion: string): boolean {
  const phraseLower = phrase.toLowerCase().trim();
  const suggestionLower = suggestion.toLowerCase().trim();
  return suggestionLower.startsWith(phraseLower);
}

// Stop words to filter out when extracting key content words
// Matches viewer-landscape.ts for consistency
const STOP_WORDS = new Set([
  'how', 'to', 'the', 'a', 'an', 'in', 'on', 'for', 'is', 'are', 'and', 'or',
  'what', 'why', 'when', 'where', 'who', 'which', 'your', 'my', 'myself',
  'yourself', 'this', 'that', 'with', 'from', 'at', 'by', 'about', 'into',
  'of', 'do', 'does', 'did', 'be', 'been', 'being', 'have', 'has', 'had',
  'can', 'could', 'will', 'would', 'should', 'may', 'might', 'must',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'me', 'us', 'them',
]);

/**
 * Extract key content words from a phrase (excluding stop words)
 * Matches viewer-landscape.ts for consistency
 */
function extractKeyWords(phrase: string): Set<string> {
  const words = phrase.toLowerCase().split(/\s+/);
  const keyWords = new Set<string>();
  
  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned)) {
      keyWords.add(cleaned);
    }
  }
  
  return keyWords;
}

/**
 * Check if a suggestion is a topic match
 * Topic = shares 2+ key words with the phrase (excluding stop words)
 * Matches viewer-landscape.ts logic for consistency
 */
export function isTopicMatch(phrase: string, suggestion: string): boolean {
  const seedKeyWords = extractKeyWords(phrase);
  const suggestionWords = suggestion.toLowerCase().split(/\s+/);
  
  let matchCount = 0;
  for (const word of suggestionWords) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (seedKeyWords.has(cleaned)) {
      matchCount++;
    }
  }
  
  // Need at least 2 matching key words to be a topic match
  // OR if seed only has 1-2 key words, need at least 1 match
  const threshold = seedKeyWords.size <= 2 ? 1 : 2;
  return matchCount >= threshold;
}

/**
 * Analyze autocomplete results for a phrase
 */
export function analyzePhrase(
  phrase: string,
  suggestions: string[]
): PhraseAnalysis {
  const exactMatches = suggestions.filter(s => isExactMatch(phrase, s)).length;
  const topicMatches = suggestions.filter(s => isTopicMatch(phrase, s)).length;
  const count = suggestions.length;
  
  return {
    phrase,
    suggestionCount: count,
    exactMatches,
    topicMatches,
    exactMatchPct: count > 0 ? Math.round((exactMatches / count) * 100) : 0,
    topicMatchPct: count > 0 ? Math.round((topicMatches / count) * 100) : 0,
  };
}

/**
 * Calculate demand score for a single phrase
 * 
 * Formula (matches Viewer Landscape Modal + Exact Match bonus):
 * - Suggestion Count: 0-40 points (foundation)
 * - Topic Match: 0-30 points (related interest)
 * - Exact Match: 0-30 points (proof of search volume)
 * - Session Size: 0.95-1.06x multiplier (final adjustment)
 * - Cap: 99 (so nothing hits exactly 100)
 * 
 * Max raw = 40 + 30 + 30 = 100
 * Max with multiplier = 100 × 1.06 = 106 → capped at 99
 */
export function calculateDemandScore(
  analysis: PhraseAnalysis,
  sizeMultiplier: number = 1.0
): number {
  // Suggestion points (0-40) - foundation, matches Modal
  const suggestionPoints = getSuggestionPoints(analysis.suggestionCount);
  
  // Topic match points (0-30) - related interest, matches Modal
  const topicPoints = getTopicMatchPoints(analysis.topicMatches);
  
  // Exact match points (0-30) - proof of actual search volume
  const exactPoints = getExactMatchPoints(analysis.exactMatches);
  
  // Raw score before multiplier (max 100)
  const rawScore = suggestionPoints + topicPoints + exactPoints;
  
  // Apply size multiplier
  let finalScore = Math.round(rawScore * sizeMultiplier);
  
  // Cap at 99 (never hit exactly 100)
  return Math.min(99, Math.max(0, finalScore));
}

/**
 * Create batches of phrases for API calls
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

// ============================================================================
// APIFY SERVICE
// ============================================================================

/**
 * Get the Apify endpoint URL
 */
function getApifyEndpoint(): string {
  const actor = process.env.APIFY_AUTOCOMPLETE_ACTOR;
  const token = process.env.APIFY_API_TOKEN;
  
  if (!actor) {
    throw new Error('APIFY_AUTOCOMPLETE_ACTOR environment variable is not set');
  }
  
  if (!token) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }
  
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
}

/**
 * Fetch autocomplete suggestions for a batch of phrases
 */
export async function fetchAutocompleteBatch(
  phrases: string[]
): Promise<AutocompleteResult[]> {
  if (phrases.length === 0) return [];
  
  const endpoint = getApifyEndpoint();
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queries: phrases,
      language: 'en',
      country: 'US',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Apify API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Group autocomplete results by seed phrase
 */
export function groupResultsBySeed(
  results: AutocompleteResult[]
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  
  for (const item of results) {
    if (!item.seed || !item.suggestion) continue;
    
    const suggestions = grouped.get(item.seed) || [];
    suggestions.push(item.suggestion);
    grouped.set(item.seed, suggestions);
  }
  
  return grouped;
}

/**
 * Score demand for a batch of phrases
 * This is the main entry point for batch scoring
 */
export async function scoreDemandBatch(
  phrasesWithIds: { id: string; phrase: string }[],
  totalSessionPhrases: number
): Promise<BatchDemandResult> {
  const startTime = Date.now();
  
  // Validate max phrases
  if (phrasesWithIds.length > BATCH_CONFIG.maxPhrases) {
    throw new Error(`Too many phrases: ${phrasesWithIds.length}. Maximum is ${BATCH_CONFIG.maxPhrases}`);
  }
  
  // Get size multiplier
  const sizeMultiplier = getSizeMultiplier(totalSessionPhrases);
  
  // Create batches
  const batches = createBatches(phrasesWithIds, BATCH_CONFIG.phrasesPerBatch);
  
  console.log(`[DemandScoring] Scoring ${phrasesWithIds.length} phrases in ${batches.length} batches (size multiplier: ${sizeMultiplier})`);
  
  const allResults: DemandScoreResult[] = [];
  let totalApiCalls = 0;
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const phrases = batch.map(p => p.phrase);
    
    // Add delay between batches for natural pacing (skip first batch)
    if (i > 0) {
      const delay = getRandomDelay();
      console.log(`[DemandScoring] Waiting ${Math.round(delay)}ms before batch ${i + 1}...`);
      await sleep(delay);
    }
    
    console.log(`[DemandScoring] Batch ${i + 1}/${batches.length}: ${phrases.length} phrases`);
    
    try {
      // Fetch autocomplete for this batch
      const rawResults = await fetchAutocompleteBatch(phrases);
      totalApiCalls++;
      
      // Group by seed
      const grouped = groupResultsBySeed(rawResults);
      
      // Score each phrase in batch
      for (const item of batch) {
        const suggestions = grouped.get(item.phrase) || [];
        const analysis = analyzePhrase(item.phrase, suggestions);
        const demandScore = calculateDemandScore(analysis, sizeMultiplier);
        
        // Calculate individual points for transparency
        const suggestionPts = getSuggestionPoints(analysis.suggestionCount);
        const exactPts = getExactMatchPoints(analysis.exactMatches);
        const topicPts = getTopicMatchPoints(analysis.topicMatches);
        const rawScore = suggestionPts + exactPts + topicPts;
        
        allResults.push({
          seedId: item.id,
          phrase: item.phrase,
          demandScore,
          suggestionCount: analysis.suggestionCount,
          exactMatchCount: analysis.exactMatches,
          topicMatchCount: analysis.topicMatches,
          suggestionPoints: suggestionPts,
          exactMatchPoints: exactPts,
          topicMatchPoints: topicPts,
          sizeMultiplier,
          rawScore,
        });
      }
      
    } catch (error) {
      console.error(`[DemandScoring] Batch ${i + 1} failed:`, error);
      
      // Add failed results with 0 scores
      for (const item of batch) {
        allResults.push({
          seedId: item.id,
          phrase: item.phrase,
          demandScore: 0,
          suggestionCount: 0,
          exactMatchCount: 0,
          topicMatchCount: 0,
          suggestionPoints: 0,
          exactMatchPoints: 0,
          topicMatchPoints: 0,
          sizeMultiplier,
          rawScore: 0,
        });
      }
    }
  }
  
  const durationMs = Date.now() - startTime;
  const estimatedCostUsd = totalApiCalls * BATCH_CONFIG.estimatedCostPerCall;
  
  console.log(`[DemandScoring] Complete: ${allResults.length} phrases, ${totalApiCalls} API calls, ${durationMs}ms, ~$${estimatedCostUsd.toFixed(3)}`);
  
  return {
    results: allResults,
    totalPhrases: allResults.length,
    totalApiCalls,
    durationMs,
    estimatedCostUsd,
  };
}
