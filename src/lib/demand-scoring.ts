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
  phrasesPerBatch: 6,   // 6 phrases per API call
  maxPhrases: 75,       // Maximum phrases to score
  estimatedCostPerCall: 0.001,  // ~$0.001 per batch call
  minDelayMs: 800,      // Minimum delay between batches
  maxDelayMs: 1500,     // Maximum delay between batches
  // Some batches get extra "thinking time" for varied patterns
  extraDelayChance: 0.1,  // 10% chance of extra delay
  extraDelayMs: 1000,     // Additional 1s when triggered
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
 * Ecosystem boost tiers based on suggestion count
 * Additive boosts that preserve natural score spread
 * More suggestions = phrase is in a stronger ecosystem = higher boost
 */
export const ECOSYSTEM_BOOSTS: { minSuggestions: number; boost: number }[] = [
  { minSuggestions: 7, boost: 30 },
  { minSuggestions: 5, boost: 25 },
  { minSuggestions: 3, boost: 20 },
  { minSuggestions: 1, boost: 15 },
];

/**
 * Get the ecosystem boost based on suggestion count and session size
 * Additive bonus that lifts scores while preserving natural spread
 */
export function getEcosystemBoost(suggestionCount: number, sessionSize: number): number {
  // Scale boost based on session size (full boost at 500+)
  const scale = Math.min(1.0, sessionSize / 500);
  
  for (const tier of ECOSYSTEM_BOOSTS) {
    if (suggestionCount >= tier.minSuggestions) {
      return Math.round(tier.boost * scale);
    }
  }
  return 0;
}

/**
 * Calculate demand score for a single phrase
 * 
 * Formula (matches Viewer Landscape Modal + Exact Match bonus):
 * - Suggestion Count: 0-40 points (foundation)
 * - Topic Match: 0-30 points (related interest)
 * - Exact Match: 0-30 points (proof of search volume)
 * - Session Size: 0.95-1.06x multiplier (final adjustment)
 * - Ecosystem Boost: additive bonus based on suggestions (preserves spread)
 * - Cap: seedScore - 3 (no phrase exceeds the seed)
 */
export function calculateDemandScore(
  analysis: PhraseAnalysis,
  sizeMultiplier: number = 1.0,
  seedScore: number = 99,
  sessionSize: number = 0
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
  
  // Apply ecosystem boost - lift all scores based on suggestion strength
  const boost = getEcosystemBoost(analysis.suggestionCount, sessionSize);
  finalScore += boost;
  
  // Cap at seedScore - 3 (clear hierarchy below the seed)
  const cap = seedScore - 3;
  return Math.min(cap, Math.max(0, finalScore));
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
  
  // Calculate seed score - this is the ceiling for all phrases
  const seedScore = calculateSeedDemand(totalSessionPhrases);
  console.log(`[DemandScoring] Session size: ${totalSessionPhrases}, Seed score: ${seedScore}`);
  
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
        const demandScore = calculateDemandScore(analysis, sizeMultiplier, seedScore, totalSessionPhrases);
        
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

// ============================================================================
// GEMINI DEMAND SCORING - Builder Module (Session-Based Batch Scoring)
// ============================================================================
// 
// This section implements the Gemini Three-Layer Demand Scoring approach
// for the Builder Module. It uses session size, autocomplete density,
// and Top 15 anchor matching to create better score distribution.
//
// IMPORTANT: This does NOT replace the Viewer Landscape Modal scoring.
// The modal uses hierarchical drilling (Layer 1 → 2 → 3) which remains unchanged.
//
// @see /docs/1-gemini-demand-scoring.md for full documentation
// ============================================================================

// ----------------------------------------------------------------------------
// GEMINI TYPES
// ----------------------------------------------------------------------------

export interface GeminiDemandResult {
  phrase: string;
  ecosystemScore: number;              // 0-30 points from session size
  autocompleteSuggestionsScore: number; // 0-40 points from autocomplete count
  relevancyScore: number;              // 0-29 points from Exact Match + Topic Match
  inheritanceBonus: number;            // 0-10 bonus from Top 15 parent
  rawScore: number;                    // Sum of all components
  finalScore: number;                  // After cap enforcement
  cap: number;                         // The ceiling for this phrase
  parentPhrase?: string;               // Which Top 15 phrase this inherits from
  matchStrength?: 'strong' | 'moderate' | 'weak' | 'none';
  // Backward compatibility alias
  densityScore?: number;
}

export interface Top15Phrase {
  phrase: string;
  position: number;            // 1-15 position in autocomplete results
  score: number;               // Calculated demand score
  wordSet: Set<string>;        // Significant words for matching
}

export interface GeminiScoringContext {
  sessionSize: number;
  ecosystemScore: number;
  seedScore: number;
  top15Phrases: Top15Phrase[];
}

// ----------------------------------------------------------------------------
// GEMINI CONSTANTS
// ----------------------------------------------------------------------------

/**
 * Ecosystem score thresholds based on session size
 * Larger sessions = more fertile topic = higher base score
 */
export const ECOSYSTEM_THRESHOLDS: { min: number; max: number; points: number }[] = [
  { min: 600, max: Infinity, points: 30 },  // Maximum ecosystem
  { min: 500, max: 599, points: 27 },       // Very high ecosystem
  { min: 400, max: 499, points: 24 },       // High ecosystem
  { min: 300, max: 399, points: 20 },       // Medium ecosystem
  { min: 200, max: 299, points: 15 },       // Low-medium ecosystem
  { min: 100, max: 199, points: 10 },       // Low ecosystem
  { min: 0, max: 99, points: 5 },           // Very low ecosystem
];

/**
 * Autocomplete Suggestions score based on suggestion count
 * More suggestions = stronger demand signal
 * 
 * Layer 2: How many friends show up when you type this phrase?
 */
export const AUTOCOMPLETE_SUGGESTIONS_POINTS: Record<number, number> = {
  14: 40,   // Maximum suggestions
  13: 38,
  12: 36,
  11: 34,
  10: 32,   // High suggestions
  9: 29,
  8: 26,
  7: 23,
  6: 20,    // Moderate suggestions
  5: 17,
  4: 14,
  3: 10,
  2: 6,
  1: 3,
  0: 0,     // Dead end
};

/**
 * SEED SCORE TABLE - CONFIRMED VALUES
 * 
 * This maps session size directly to seed demand score.
 * Larger sessions = more fertile ecosystem = higher seed score.
 * 
 * Examples:
 * - "Content Creation" (582 phrases) → 96
 * - "YouTube Algorithm" (~350 phrases) → 91
 * - "Legacy Planning" (~100-150 phrases) → 70-77
 */
export const SEED_SCORE_TABLE: { min: number; max: number; score: number }[] = [
  { min: 600, max: Infinity, score: 97 },  // Massive ecosystem
  { min: 550, max: 599, score: 96 },       // Very large ecosystem
  { min: 500, max: 549, score: 95 },       // Large ecosystem
  { min: 450, max: 499, score: 94 },       // Strong ecosystem
  { min: 400, max: 449, score: 93 },       // Good ecosystem
  { min: 350, max: 399, score: 91 },       // Solid ecosystem
  { min: 300, max: 349, score: 89 },       // Medium ecosystem
  { min: 250, max: 299, score: 86 },       // Low-medium ecosystem
  { min: 200, max: 249, score: 82 },       // Low ecosystem
  { min: 150, max: 199, score: 77 },       // Small ecosystem
  { min: 100, max: 149, score: 70 },       // Very small ecosystem
  { min: 0, max: 99, score: 60 },          // Minimal ecosystem
];

/**
 * Relevancy score based on exact/topic match patterns
 */
export const RELEVANCY_THRESHOLDS = {
  MOSTLY_EXACT: { minExactPct: 70, points: 29 },
  MIXED: { minExactPct: 40, points: 20 },
  MOSTLY_TOPIC: { minTopicPct: 70, points: 12 },
  LOW_MATCH: { points: 5 },
};

/**
 * Inheritance bonus based on match strength to Top 15
 * STRONGER bonuses for strong matches to lift scores
 * UPDATED: Boosted values to prevent too many low scores
 */
export const INHERITANCE_BONUS: Record<string, number> = {
  strong: 20,   // 3+ words overlap - strong inheritance (was 10)
  moderate: 12, // 2 words overlap (was 6)
  weak: 6,      // 1 word overlap (was 3)
  none: 0,      // No match
};

/**
 * Cap offsets relative to parent score
 * CLOSER to parent for strong matches
 */
export const CAP_OFFSETS: Record<string, number> = {
  strong: 2,    // Parent score - 2 (very close)
  moderate: 4,  // Parent score - 4
  weak: 7,      // Parent score - 7
  none: 15,     // Seed score - 15
};

// ----------------------------------------------------------------------------
// GEMINI SCORING FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Calculate ecosystem score based on session size
 * Layer 1 of the Gemini approach
 */
export function getEcosystemScore(sessionSize: number): number {
  for (const tier of ECOSYSTEM_THRESHOLDS) {
    if (sessionSize >= tier.min && sessionSize <= tier.max) {
      return tier.points;
    }
  }
  return 5; // Fallback to minimum
}

/**
 * Calculate Autocomplete Suggestions score based on suggestion count
 * Layer 2 of the Gemini approach
 * 
 * This is the direct demand signal - if YouTube returns many suggestions,
 * people are actively searching this topic.
 */
export function getAutocompleteSuggestionsScore(suggestionCount: number): number {
  if (suggestionCount >= 14) return AUTOCOMPLETE_SUGGESTIONS_POINTS[14];
  if (suggestionCount < 0) return 0;
  return AUTOCOMPLETE_SUGGESTIONS_POINTS[suggestionCount] ?? 0;
}

// Alias for backward compatibility
export const getDensityScore = getAutocompleteSuggestionsScore;

/**
 * Calculate relevancy score based on exact/topic match patterns
 * Layer 3 of the Gemini approach (for phrases with autocomplete data)
 */
export function getRelevancyScore(
  exactMatchPct: number,
  topicMatchPct: number
): number {
  // Mostly exact matches - highest relevancy
  if (exactMatchPct >= RELEVANCY_THRESHOLDS.MOSTLY_EXACT.minExactPct) {
    return RELEVANCY_THRESHOLDS.MOSTLY_EXACT.points;
  }
  
  // Mixed exact and topic
  if (exactMatchPct >= RELEVANCY_THRESHOLDS.MIXED.minExactPct) {
    return RELEVANCY_THRESHOLDS.MIXED.points;
  }
  
  // Mostly topic matches
  if (topicMatchPct >= RELEVANCY_THRESHOLDS.MOSTLY_TOPIC.minTopicPct) {
    return RELEVANCY_THRESHOLDS.MOSTLY_TOPIC.points;
  }
  
  // Low match - minimum points
  return RELEVANCY_THRESHOLDS.LOW_MATCH.points;
}

/**
 * Extract significant words from a phrase for matching
 * Used for Top 15 anchor matching
 */
export function getSignificantWords(phrase: string): Set<string> {
  const words = phrase.toLowerCase().split(/\s+/);
  const significant = new Set<string>();
  
  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    // Only include words 3+ chars that aren't stop words
    if (cleaned.length >= 3 && !STOP_WORDS.has(cleaned)) {
      significant.add(cleaned);
    }
  }
  
  return significant;
}

/**
 * Count word overlap between two phrases
 */
export function countWordOverlap(words1: Set<string>, words2: Set<string>): number {
  let count = 0;
  for (const word of words1) {
    if (words2.has(word)) {
      count++;
    }
  }
  return count;
}

/**
 * Categorize overlap strength
 */
export function categorizeOverlap(overlapCount: number): 'strong' | 'moderate' | 'weak' | 'none' {
  if (overlapCount >= 3) return 'strong';
  if (overlapCount === 2) return 'moderate';
  if (overlapCount === 1) return 'weak';
  return 'none';
}

/**
 * Find the best matching Top 15 phrase for inheritance
 */
export function findBestTop15Match(
  phrase: string,
  top15Phrases: Top15Phrase[]
): { bestMatch: Top15Phrase | null; matchStrength: 'strong' | 'moderate' | 'weak' | 'none' } {
  const phraseWords = getSignificantWords(phrase);
  let bestMatch: Top15Phrase | null = null;
  let bestOverlap = 0;
  
  for (const t15 of top15Phrases) {
    const overlap = countWordOverlap(phraseWords, t15.wordSet);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = t15;
    }
  }
  
  return {
    bestMatch,
    matchStrength: categorizeOverlap(bestOverlap),
  };
}

/**
 * Calculate seed demand score using direct session size mapping
 * 
 * CONFIRMED SEED SCORING TABLE:
 * - 600+ phrases → 97
 * - 550-599 → 96 (Content Creation 582 = 96)
 * - 500-549 → 95
 * - 450-499 → 94
 * - 400-449 → 93
 * - 350-399 → 91 (YouTube Algorithm ~350)
 * - 300-349 → 89
 * - 250-299 → 86
 * - 200-249 → 82
 * - 150-199 → 77
 * - 100-149 → 70 (Legacy Planning ~100-150)
 * - <100 → 60
 */
export function calculateSeedDemand(sessionSize: number): number {
  for (const tier of SEED_SCORE_TABLE) {
    if (sessionSize >= tier.min && sessionSize <= tier.max) {
      return tier.score;
    }
  }
  return 60; // Fallback to minimum
}

/**
 * Calculate Top 15 phrase demand score
 * Ecosystem + Density + Relevancy, capped at Seed - 2
 */
export function calculateTop15Demand(
  ecosystemScore: number,
  suggestionCount: number,
  exactMatchPct: number,
  topicMatchPct: number,
  seedScore: number
): number {
  const densityScore = getDensityScore(suggestionCount);
  const relevancyScore = getRelevancyScore(exactMatchPct, topicMatchPct);
  
  const rawScore = ecosystemScore + densityScore + relevancyScore;
  const cap = seedScore - 2;
  
  return Math.min(cap, Math.max(0, rawScore));
}

/**
 * Calculate expansion phrase (A-Z, Prefix) demand score
 * Uses Top 15 inheritance for anchoring
 */
export function calculateExpansionDemand(
  phrase: string,
  ecosystemScore: number,
  suggestionCount: number,
  top15Phrases: Top15Phrase[],
  seedScore: number
): GeminiDemandResult {
  const autocompleteSuggestionsScore = getAutocompleteSuggestionsScore(suggestionCount);
  const { bestMatch, matchStrength } = findBestTop15Match(phrase, top15Phrases);
  
  const inheritanceBonus = INHERITANCE_BONUS[matchStrength];
  const capOffset = CAP_OFFSETS[matchStrength];
  
  // Cap is relative to parent or seed
  const cap = bestMatch 
    ? bestMatch.score - capOffset 
    : seedScore - CAP_OFFSETS.none;
  
  const rawScore = ecosystemScore + autocompleteSuggestionsScore + inheritanceBonus;
  
  // Apply minimum floor: if phrase got any autocomplete suggestions, minimum score is 35
  const MINIMUM_FLOOR = 35;
  let finalScore = Math.min(cap, Math.max(0, rawScore));
  if (suggestionCount > 0 && finalScore < MINIMUM_FLOOR) {
    finalScore = MINIMUM_FLOOR;
  }
  
  return {
    phrase,
    ecosystemScore,
    autocompleteSuggestionsScore,
    densityScore: autocompleteSuggestionsScore, // Backward compat
    relevancyScore: 0, // Expansion phrases use inheritance instead
    inheritanceBonus,
    rawScore,
    finalScore,
    cap,
    parentPhrase: bestMatch?.phrase,
    matchStrength,
  };
}

/**
 * Create Gemini scoring context for a session
 * This should be called once at the start of batch scoring
 */
export function createGeminiContext(
  sessionSize: number,
  top15Data: { phrase: string; position: number; suggestionCount: number; exactMatchPct: number; topicMatchPct: number }[]
): GeminiScoringContext {
  const ecosystemScore = getEcosystemScore(sessionSize);
  // Seed score now comes directly from session size table
  const seedScore = calculateSeedDemand(sessionSize);
  
  // Score and prepare Top 15 phrases
  const top15Phrases: Top15Phrase[] = top15Data.map(t15 => {
    const score = calculateTop15Demand(
      ecosystemScore,
      t15.suggestionCount,
      t15.exactMatchPct,
      t15.topicMatchPct,
      seedScore
    );
    
    return {
      phrase: t15.phrase,
      position: t15.position,
      score,
      wordSet: getSignificantWords(t15.phrase),
    };
  });
  
  return {
    sessionSize,
    ecosystemScore,
    seedScore,
    top15Phrases,
  };
}

/**
 * Score a phrase using Gemini approach
 * Automatically determines if it's a Top 15 or expansion phrase
 */
export function scoreWithGemini(
  phrase: string,
  suggestionCount: number,
  exactMatchPct: number,
  topicMatchPct: number,
  context: GeminiScoringContext,
  isTop15: boolean = false
): GeminiDemandResult {
  const { ecosystemScore, seedScore, top15Phrases } = context;
  
  if (isTop15) {
    // Top 15 phrases get full Ecosystem + Autocomplete Suggestions + Relevancy (Exact Match + Topic Match)
    const autocompleteSuggestionsScore = getAutocompleteSuggestionsScore(suggestionCount);
    const relevancyScore = getRelevancyScore(exactMatchPct, topicMatchPct);
    const rawScore = ecosystemScore + autocompleteSuggestionsScore + relevancyScore;
    const cap = seedScore - 2;
    const finalScore = Math.min(cap, Math.max(0, rawScore));
    
    return {
      phrase,
      ecosystemScore,
      autocompleteSuggestionsScore,
      densityScore: autocompleteSuggestionsScore, // Backward compat
      relevancyScore,
      inheritanceBonus: 0,
      rawScore,
      finalScore,
      cap,
      matchStrength: 'none',
    };
  }
  
  // Expansion phrases use inheritance
  return calculateExpansionDemand(
    phrase,
    ecosystemScore,
    suggestionCount,
    top15Phrases,
    seedScore
  );
}

/**
 * Debug helper: Log Gemini scoring breakdown
 */
export function logGeminiBreakdown(result: GeminiDemandResult): void {
  console.log(`[GeminiDemand] ${result.phrase}`);
  console.log(`  Ecosystem: ${result.ecosystemScore} | Autocomplete Suggestions: ${result.autocompleteSuggestionsScore} | Relevancy: ${result.relevancyScore}`);
  console.log(`  Inheritance: ${result.inheritanceBonus} (${result.matchStrength}) from "${result.parentPhrase || 'none'}"`);
  console.log(`  Raw: ${result.rawScore} | Cap: ${result.cap} | Final: ${result.finalScore}`);
}
