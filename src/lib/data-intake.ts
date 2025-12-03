/**
 * Data Intake - Pattern Extraction for P&C Scoring
 * 
 * Runs after Page 1 (Seed) expansion completes.
 * Extracts patterns from all generated phrases to enable
 * FREE Popularity & Competition scoring without external APIs.
 * 
 * NEW: Position-weighted demand scores based on autocomplete hierarchy.
 */

import type { IntakeStats } from '@/types/database';

// ============================================================
// POSITION WEIGHTS FOR TOP 9 DEMAND SCORING
// ============================================================

/**
 * Position weights for Top 9 autocomplete results
 * Position 1 = highest search volume, Position 9 = lowest
 * These create natural score differentiation within Top 10
 */
const POSITION_WEIGHTS = [
  1.00,  // Position 1 - Top result, highest demand
  0.92,  // Position 2 - Very close to #1
  0.85,  // Position 3 
  0.78,  // Position 4
  0.72,  // Position 5
  0.66,  // Position 6
  0.61,  // Position 7
  0.56,  // Position 8
  0.52,  // Position 9
];

/**
 * Child phrases inherit this percentage of their parent's score
 * Per the old system: 97-98% inheritance
 */
const CHILD_INHERITANCE_RATE = 0.97;

/**
 * Bonus for anchor words appearing multiple times in Top 9
 * "2025" appearing 3x = strong demand signal
 */
const ANCHOR_REPEAT_BONUS = 3; // +3 points per additional occurrence

/**
 * Bonus points per anchor occurrence in Top 9
 * "2025" appearing 2x = +6 points, 3x = +9 points
 */
const ANCHOR_FREQUENCY_BONUS = 3;

/**
 * Legacy: Multiplier for "contains" matches in raw scoring
 */
const CONTAINS_MULTIPLIER = 0.80;

/**
 * Weight for session-wide bigram frequency bonus
 */
const BIGRAM_FREQUENCY_WEIGHT = 0.12;

/**
 * Weight for session-wide single word frequency bonus  
 */
const WORD_FREQUENCY_WEIGHT = 0.08;

/**
 * Generate deterministic micro-variation from phrase content
 * Creates natural-looking scores (-2 to +2)
 */
function getPhraseVariation(phrase: string): number {
  let hash = 0;
  for (let i = 0; i < phrase.length; i++) {
    hash = ((hash << 5) - hash) + phrase.charCodeAt(i);
    hash = hash & hash;
  }
  return (Math.abs(hash) % 5) - 2; // -2 to +2
}

/**
 * Calculate seed phrase base score based on session size
 * Larger sessions = more phrases generated = stronger seed
 */
function getSeedBaseScore(totalPhrases: number): number {
  if (totalPhrases < 100) return 90;
  if (totalPhrases < 150) return 91 + (totalPhrases - 100) / 50; // 91-92
  if (totalPhrases < 200) return 93 + (totalPhrases - 150) / 100; // 93-93.5
  if (totalPhrases < 250) return 94 + (totalPhrases - 200) / 100; // 94-94.5
  if (totalPhrases < 300) return 95 + (totalPhrases - 250) / 100; // 95-95.5
  if (totalPhrases < 400) return 96 + (totalPhrases - 300) / 200; // 96-96.5
  return Math.min(99, 97 + (totalPhrases - 400) / 300); // 97-99
}

// ============================================================
// STRING NORMALIZATION (CRITICAL FOR RELIABLE MATCHING)
// ============================================================

/**
 * Normalize a string for reliable comparison
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple spaces to single space
 * - Remove special characters except spaces
 */
function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // Collapse multiple spaces
    .replace(/[^\w\s]/g, '');        // Remove special chars (keep letters, numbers, spaces)
}

/**
 * Check if targetPhrase contains searchPhrase as a substring
 * Uses normalized strings for reliable matching
 * 
 * CRITICAL: This is the core matching function. It must work reliably.
 * 
 * @param targetPhrase - The phrase to search within (e.g., "How To Master YouTube Algorithm 2025")
 * @param searchPhrase - The phrase to find (e.g., "YouTube Algorithm 2025")
 * @returns true if targetPhrase contains searchPhrase
 */
function phraseContains(targetPhrase: string, searchPhrase: string): boolean {
  const normalizedTarget = normalizeForMatching(targetPhrase);
  const normalizedSearch = normalizeForMatching(searchPhrase);
  
  // Simple includes check - reliable and battle-tested
  return normalizedTarget.includes(normalizedSearch);
}

/**
 * Check if targetPhrase starts with searchPhrase
 * Uses normalized strings for reliable matching
 */
function phraseStartsWith(targetPhrase: string, searchPhrase: string): boolean {
  const normalizedTarget = normalizeForMatching(targetPhrase);
  const normalizedSearch = normalizeForMatching(searchPhrase);
  
  return normalizedTarget.startsWith(normalizedSearch);
}

/**
 * Extract single-word anchors from a phrase (excluding seed words and common fillers)
 */
function extractAnchors(phrase: string, seedWords: Set<string>): string[] {
  const FILLER_WORDS = new Set([
    'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
    'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs'
  ]);
  
  const words = normalizeForMatching(phrase).split(' ');
  return words.filter(w => 
    w.length >= 2 && 
    !seedWords.has(w) && 
    !FILLER_WORDS.has(w)
  );
}

// ============================================================
// TOP 9 DEMAND SCORING
// ============================================================

interface Top9Phrase {
  phrase: string;
  position: number;
}

interface Top9DemandData {
  phrases: string[];
  positionWeights: number[];
  anchorBonuses: Record<string, number>;
  phraseScores: Record<string, number>;
  // Session-wide frequency data for demand scoring
  bigramPercentiles: Record<string, number>;
  wordPercentiles: Record<string, number>;
  // Starter frequency tracking (excluding seed starters)
  twoWordStarters: Record<string, number>;  // "how to" -> 22
  oneWordStarters: Record<string, number>;  // "how" -> 38
  maxTwoWordFreq: number;
  maxOneWordFreq: number;
}

/**
 * Calculate demand scores for all phrases based on Top 9 position matching
 * AND session-wide frequency patterns
 * 
 * How it works:
 * 1. Each Top 9 phrase has a position weight (1.0 for #1, 0.22 for #9)
 * 2. For each phrase in the session:
 *    - Check if it STARTS WITH any Top 9 phrase → full position weight
 *    - Check if it CONTAINS any Top 9 phrase → 80% of position weight
 *    - Check if it contains anchor words that appear multiple times in Top 9 → bonus
 * 3. Add session-wide bigram frequency bonus (high-frequency bigrams = demand signal)
 * 4. Add session-wide word frequency bonus (excluding seed words)
 * 5. Sum all bonuses and normalize to 0-100 scale
 */
function calculateTop9Demand(
  allPhrases: string[],
  top9Phrases: Top9Phrase[],
  seedPhrase: string,
  bigramFrequency: Record<string, number>,
  wordFrequency: Record<string, number>
): Top9DemandData {
  const seedWords = new Set(normalizeForMatching(seedPhrase).split(' '));
  
  // Common filler words to exclude from word frequency scoring
  const FILLER_WORDS = new Set([
    'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
    'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs'
  ]);
  
  // Calculate bigram percentiles (excluding seed-only bigrams)
  const bigramPercentiles = computeFilteredPercentiles(bigramFrequency, (bigram) => {
    const words = bigram.split(' ');
    // Exclude bigrams that are just seed words
    return !words.every(w => seedWords.has(w));
  });
  
  // Calculate word percentiles (excluding seed words and fillers)
  const wordPercentiles = computeFilteredPercentiles(wordFrequency, (word) => {
    return !seedWords.has(word) && !FILLER_WORDS.has(word) && word.length >= 3;
  });
  
  // If no Top 9 data, return with just frequency data
  if (!top9Phrases || top9Phrases.length === 0) {
    return {
      phrases: [],
      positionWeights: POSITION_WEIGHTS,
      anchorBonuses: {},
      phraseScores: {},
      bigramPercentiles,
      wordPercentiles,
      twoWordStarters: {},
      oneWordStarters: {},
      maxTwoWordFreq: 0,
      maxOneWordFreq: 0,
    };
  }
  
  // Sort Top 9 by position and extract phrases
  const sortedTop9 = [...top9Phrases].sort((a, b) => a.position - b.position);
  const top9PhraseList = sortedTop9.map(p => p.phrase);
  
  // Step 1: Calculate anchor frequency bonuses from Top 9
  // Count how many times each anchor word appears across all Top 9 phrases
  const anchorCounts: Record<string, number> = {};
  
  for (const top9 of top9PhraseList) {
    const anchors = extractAnchors(top9, seedWords);
    for (const anchor of anchors) {
      anchorCounts[anchor] = (anchorCounts[anchor] || 0) + 1;
    }
  }
  
  // Only anchors appearing 2+ times get a bonus
  const anchorBonuses: Record<string, number> = {};
  for (const [anchor, count] of Object.entries(anchorCounts)) {
    if (count >= 2) {
      // Each occurrence beyond 1 adds ANCHOR_FREQUENCY_BONUS
      anchorBonuses[anchor] = (count - 1) * ANCHOR_FREQUENCY_BONUS;
    }
  }
  
  console.log(`[DataIntake] Top 9 anchor bonuses:`, anchorBonuses);
  
  // Step 1b: Track STARTER frequency across ALL phrases
  // Starters are the first word(s) of a phrase, EXCLUDING phrases that start with seed
  const seedNormalized = normalizeForMatching(seedPhrase);
  const twoWordStarters: Record<string, number> = {};
  const oneWordStarters: Record<string, number> = {};
  
  for (const phrase of allPhrases) {
    const lowerPhrase = phrase.toLowerCase().trim();
    const words = lowerPhrase.split(/\s+/);
    
    // Skip phrases that start with the seed (they would dominate)
    if (lowerPhrase.startsWith(seedNormalized)) {
      continue;
    }
    
    // Track single-word starter
    if (words[0] && words[0].length >= 2) {
      oneWordStarters[words[0]] = (oneWordStarters[words[0]] || 0) + 1;
    }
    
    // Track two-word starter
    if (words.length >= 2) {
      const twoWord = `${words[0]} ${words[1]}`;
      twoWordStarters[twoWord] = (twoWordStarters[twoWord] || 0) + 1;
    }
  }
  
  const maxTwoWordFreq = Math.max(...Object.values(twoWordStarters), 1);
  const maxOneWordFreq = Math.max(...Object.values(oneWordStarters), 1);
  
  console.log(`[DataIntake] Two-word starters (top 5):`, 
    Object.entries(twoWordStarters).sort((a,b) => b[1] - a[1]).slice(0, 5));
  console.log(`[DataIntake] Single-word starters (top 5):`, 
    Object.entries(oneWordStarters).sort((a,b) => b[1] - a[1]).slice(0, 5));
  console.log(`[DataIntake] Max two-word freq: ${maxTwoWordFreq}, Max one-word freq: ${maxOneWordFreq}`);
  console.log(`[DataIntake] Bigram percentiles count: ${Object.keys(bigramPercentiles).length}`);
  console.log(`[DataIntake] Word percentiles count: ${Object.keys(wordPercentiles).length}`);
  
  // Step 2: Score each phrase
  const phraseScores: Record<string, number> = {};
  let maxRawScore = 0;
  
  // First pass: calculate raw scores
  const rawScores: Map<string, number> = new Map();
  
  for (const phrase of allPhrases) {
    let rawScore = 0;
    const normalizedPhrase = normalizeForMatching(phrase);
    const words = normalizedPhrase.split(' ');
    
    // 2a. Check against each Top 9 phrase for position-weighted matches
    for (let i = 0; i < top9PhraseList.length && i < POSITION_WEIGHTS.length; i++) {
      const top9Phrase = top9PhraseList[i];
      const weight = POSITION_WEIGHTS[i];
      
      // Priority 1: Starts with Top 9 phrase (full weight)
      if (phraseStartsWith(phrase, top9Phrase)) {
        rawScore += weight;
      }
      // Priority 2: Contains Top 9 phrase (80% weight)
      else if (phraseContains(phrase, top9Phrase)) {
        rawScore += weight * CONTAINS_MULTIPLIER;
      }
    }
    
    // 2b. Add anchor bonuses from Top 9 frequency
    for (const [anchor, bonus] of Object.entries(anchorBonuses)) {
      if (normalizedPhrase.includes(anchor)) {
        rawScore += bonus;
      }
    }
    
    // 2c. Add session-wide bigram frequency bonus
    // Extract bigrams and find highest percentile
    let maxBigramPercentile = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      const percentile = bigramPercentiles[bigram] ?? 0;
      if (percentile > maxBigramPercentile) {
        maxBigramPercentile = percentile;
      }
    }
    rawScore += (maxBigramPercentile / 100) * BIGRAM_FREQUENCY_WEIGHT;
    
    // 2d. Add session-wide word frequency bonus (average of non-seed words)
    let wordPercentileSum = 0;
    let wordCount = 0;
    for (const word of words) {
      if (!seedWords.has(word) && wordPercentiles[word]) {
        wordPercentileSum += wordPercentiles[word];
        wordCount++;
      }
    }
    if (wordCount > 0) {
      const avgWordPercentile = wordPercentileSum / wordCount;
      rawScore += (avgWordPercentile / 100) * WORD_FREQUENCY_WEIGHT;
    }
    
    rawScores.set(phrase, rawScore);
    if (rawScore > maxRawScore) {
      maxRawScore = rawScore;
    }
  }
  
  // Second pass: normalize to 0-100 scale
  for (const [phrase, rawScore] of rawScores) {
    if (maxRawScore > 0) {
      // Normalize and round to integer
      phraseScores[normalizeForMatching(phrase)] = Math.round((rawScore / maxRawScore) * 100);
    } else {
      phraseScores[normalizeForMatching(phrase)] = 0;
    }
  }
  
  // Log some stats
  const scoredCount = Object.values(phraseScores).filter(s => s > 0).length;
  console.log(`[DataIntake] Top 9 demand scoring: ${scoredCount}/${allPhrases.length} phrases have demand > 0`);
  
  return {
    phrases: top9PhraseList,
    positionWeights: POSITION_WEIGHTS,
    anchorBonuses,
    phraseScores,
    bigramPercentiles,
    wordPercentiles,
    twoWordStarters,
    oneWordStarters,
    maxTwoWordFreq,
    maxOneWordFreq,
  };
}

/**
 * Compute percentiles with a filter function to exclude certain entries
 */
function computeFilteredPercentiles(
  freqMap: Record<string, number>,
  filter: (key: string) => boolean
): Record<string, number> {
  const filtered = Object.entries(freqMap).filter(([key]) => filter(key));
  
  if (filtered.length === 0) {
    return {};
  }
  
  if (filtered.length === 1) {
    return { [filtered[0][0]]: 50 };
  }
  
  // Sort by frequency ascending
  const sorted = filtered.sort((a, b) => a[1] - b[1]);
  const total = sorted.length;
  
  const percentiles: Record<string, number> = {};
  sorted.forEach(([key], index) => {
    percentiles[key] = Math.round((index / (total - 1)) * 100);
  });
  
  return percentiles;
}

// ============================================================
// MAIN DATA INTAKE FUNCTION
// ============================================================

/**
 * Extract all patterns from generated phrases
 * This is the core Data Intake algorithm
 * 
 * @param phrases - All phrases in the session
 * @param seedPhrase - The original seed phrase
 * @param top9Phrases - Top 9 autocomplete results with positions (optional, for demand scoring)
 */
export function runDataIntake(
  phrases: string[], 
  seedPhrase: string,
  top9Phrases?: Top9Phrase[]
): IntakeStats {
  const seedLower = seedPhrase.toLowerCase();
  const seedWords = seedLower.split(' ');
  
  // Initialize frequency maps
  const wordFrequency: Record<string, number> = {};
  const bigramFrequency: Record<string, number> = {};
  const trigramFrequency: Record<string, number> = {};
  const seedPlus1: Record<string, number> = {};
  const seedPlus2: Record<string, number> = {};
  const prefixes: Record<string, number> = {};
  const suffixes: Record<string, number> = {};
  
  for (const phrase of phrases) {
    const phraseLower = phrase.toLowerCase();
    const words = phraseLower.split(/\s+/).filter(w => w.length > 0);
    
    // 1. Word frequency
    for (const word of words) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
    
    // 2. Bigrams (2-word combinations)
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigramFrequency[bigram] = (bigramFrequency[bigram] || 0) + 1;
    }
    
    // 3. Trigrams (3-word combinations)
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      trigramFrequency[trigram] = (trigramFrequency[trigram] || 0) + 1;
    }
    
    // 4. Find seed position and extract seed+1, seed+2, prefix, suffix
    const seedIndex = phraseLower.indexOf(seedLower);
    
    if (seedIndex !== -1) {
      // Extract prefix (everything before seed)
      if (seedIndex > 0) {
        const prefix = phraseLower.substring(0, seedIndex).trim();
        if (prefix) {
          prefixes[prefix] = (prefixes[prefix] || 0) + 1;
        }
      }
      
      // Extract words after seed
      const afterSeed = phraseLower.substring(seedIndex + seedLower.length).trim();
      const afterWords = afterSeed.split(/\s+/).filter(w => w.length > 0);
      
      // Seed+1: first word after seed
      if (afterWords[0]) {
        seedPlus1[afterWords[0]] = (seedPlus1[afterWords[0]] || 0) + 1;
      }
      
      // Seed+2: second word after seed
      if (afterWords[1]) {
        seedPlus2[afterWords[1]] = (seedPlus2[afterWords[1]] || 0) + 1;
      }
      
      // Full suffix (everything after seed)
      if (afterSeed) {
        suffixes[afterSeed] = (suffixes[afterSeed] || 0) + 1;
      }
    }
  }
  
  // 5. Compute percentiles for fast scoring
  const seedPlus1Percentiles = computePercentiles(seedPlus1);
  const seedPlus2Percentiles = computePercentiles(seedPlus2);
  const prefixPercentiles = computePercentiles(prefixes);
  const suffixPercentiles = computePercentiles(suffixes);
  
  // 6. Calculate Top 9 demand scores (if Top 9 data provided)
  // Now includes session-wide bigram and word frequency analysis
  const top9Demand = calculateTop9Demand(
    phrases, 
    top9Phrases || [], 
    seedPhrase, 
    bigramFrequency, 
    wordFrequency
  );
  
  if (top9Demand.phrases.length > 0) {
    console.log(`[DataIntake] Top 9 demand data included: ${top9Demand.phrases.length} Top 9 phrases`);
  }
  
  return {
    wordFrequency,
    bigramFrequency,
    trigramFrequency,
    seedPlus1,
    seedPlus2,
    prefixes,
    suffixes,
    seedPlus1Percentiles,
    seedPlus2Percentiles,
    prefixPercentiles,
    seedPhrase,
    suffixPercentiles,
    top9Demand,
    totalPhrases: phrases.length,
    uniqueWords: Object.keys(wordFrequency).length,
    processedAt: new Date().toISOString(),
  };
}

/**
 * Compute percentile ranking for each item in a frequency map
 * Higher frequency = higher percentile (0-100)
 */
function computePercentiles(freqMap: Record<string, number>): Record<string, number> {
  const entries = Object.entries(freqMap);
  
  if (entries.length === 0) {
    return {};
  }
  
  if (entries.length === 1) {
    return { [entries[0][0]]: 50 }; // Single item gets middle percentile
  }
  
  // Sort by frequency ascending (low frequency = low percentile)
  const sorted = entries.sort((a, b) => a[1] - b[1]);
  const total = sorted.length;
  
  const percentiles: Record<string, number> = {};
  sorted.forEach(([word], index) => {
    // Percentile = position / (total - 1) * 100
    percentiles[word] = Math.round((index / (total - 1)) * 100);
  });
  
  return percentiles;
}

// ============================================================
// DEMAND SCORE LOOKUP AND CALCULATION
// ============================================================

/**
 * Get the raw Top 9 demand score for a specific phrase from IntakeStats
 * Returns 0-100 score, or 0 if phrase not found
 */
export function getDemandScore(phrase: string, stats: IntakeStats): number {
  if (!stats.top9Demand?.phraseScores) {
    return 0;
  }
  
  const normalizedPhrase = normalizeForMatching(phrase);
  return stats.top9Demand.phraseScores[normalizedPhrase] ?? 0;
}

/**
 * Calculate the FULL demand/popularity score for a phrase
 * 
 * Hierarchy-based scoring:
 * 1. SEED: Base score from session size (90-99)
 * 2. TOP 10: Inherit from seed with position-based decay
 * 3. CHILD: Inherit 97% from their parent Top 10 phrase
 * 4. A-Z/PREFIX: Lower baseline with frequency bonuses
 * 
 * Additional bonuses:
 * - Anchor words appearing multiple times in Top 9
 * - Session-wide bigram/word frequency
 * - Micro-variation for natural numbers
 * 
 * @param phrase - The phrase to score
 * @param source - The source type (seed, top10, child, az, prefix)
 * @param stats - The IntakeStats containing demand data
 * @returns Final demand score 0-100
 */
/**
 * POPULARITY SCORING CONSTANTS
 * 
 * Philosophy: "Could this phrase be popular with YOUR viewers?"
 * 
 * HIERARCHY (from popularity-algorithm-v2.md):
 * - SEED: Ceiling based on session size (91-97)
 * - TOP_10: Position 1 = 87, decays to 79 for position 9. Only anchor bonus applies.
 * - T10_CHILD: To be defined
 * - T10_RELATED: Gets position-based boost (+12 for #1, +4 for #9)
 * - NO_TAG: Base 55, needs bonuses to climb
 */
const TAG_BASE_SCORES = {
  TOP_10_POSITION_1: 87,  // Position 1 base score
  TOP_10_DECAY: 1,        // Decay per position (87, 86, 85... 79)
  T10_CHILD: 70,          // Child phrases - to be refined
  T10_RELATED: 55,        // Base before position-based boost
  NO_TAG: 55,             // A-Z, Prefix, unrelated
};

/**
 * T10_RELATED position-based boost
 * If phrase CONTAINS a Top 10 phrase, boost based on which position
 */
const T10_RELATED_POSITION_BOOST: Record<number, number> = {
  0: 12,  // Contains #1 -> +12
  1: 11,  // Contains #2 -> +11
  2: 10,  // Contains #3 -> +10
  3: 9,   // Contains #4 -> +9
  4: 8,   // Contains #5 -> +8
  5: 7,   // Contains #6 -> +7
  6: 6,   // Contains #7 -> +6
  7: 5,   // Contains #8 -> +5
  8: 4,   // Contains #9 -> +4
};

/**
 * TOP_10 anchor bonus (the ONLY boost for TOP_10)
 * If an anchor word appears multiple times across Top 9 phrases
 */
const TOP_10_ANCHOR_BONUS = {
  TWO_TIMES: 3,   // Anchor appears 2x in Top 9 -> +3
  THREE_PLUS: 5,  // Anchor appears 3+ times -> +5 (max)
};

/**
 * Length adjustment curve
 */
function getLengthAdjustment(phrase: string): number {
  const wordCount = phrase.trim().split(/\s+/).length;
  
  if (wordCount <= 2) return 0;   // No adjustment for short phrases
  if (wordCount === 3) return 5;  // Sweet spot - specific but concise
  if (wordCount === 4) return 4;  // Still great
  if (wordCount === 5) return 2;  // Good specificity
  if (wordCount === 6) return 0;  // Neutral
  if (wordCount === 7) return -2; // Getting long
  if (wordCount === 8) return -3; // Too wordy
  return -4;                      // 9+ words: too verbose
}

/**
 * Get starter boost based on PERCENTAGE of session (NOT stacking)
 * 
 * Uses first word frequency as percentage of total phrases.
 * ONE boost only, max +12.
 * 
 * | % of Session | Boost |
 * |--------------|-------|
 * | 15%+         | +12   |
 * | 10-14%       | +10   |
 * | 7-9%         | +8    |
 * | 4-6%         | +5    |
 * | 2-3%         | +3    |
 * | <2%          | +0    |
 */
function getStarterBoost(
  phrase: string,
  oneWordStarters?: Record<string, number>,
  totalPhrases?: number
): number {
  if (!oneWordStarters || !totalPhrases || totalPhrases === 0) {
    return 0;
  }
  
  const lowerPhrase = phrase.toLowerCase().trim();
  const words = lowerPhrase.split(/\s+/);
  
  if (!words[0]) return 0;
  
  const freq = oneWordStarters[words[0]] || 0;
  if (freq === 0) return 0;
  
  // Calculate percentage of session
  const percentage = (freq / totalPhrases) * 100;
  
  // Apply boost based on percentage thresholds
  if (percentage >= 15) return 12;
  if (percentage >= 10) return 10;
  if (percentage >= 7) return 8;
  if (percentage >= 4) return 5;
  if (percentage >= 2) return 3;
  return 0;
}

/**
 * Get DEMAND ANCHOR boost based on session-wide word frequency
 * 
 * Philosophy: If a meaningful word appears frequently across ALL phrases
 * in this session (e.g., "shorts" 22x, "monetization" 15x), it represents
 * genuine viewer demand in this niche.
 * 
 * Uses ABSOLUTE thresholds because:
 * - 20+ occurrences = genuinely high demand
 * - 10-19 = good demand  
 * - 5-9 = moderate demand
 * - 1-4 = too rare to matter
 * 
 * Excludes: seed words, filler words (how, to, what, is, etc.)
 * 
 * @returns Boost from 0 to +12 based on best anchor match
 */
function getDemandAnchorBoost(
  phrase: string,
  wordFrequency: Record<string, number>,
  seedPhrase: string
): number {
  // Split seed into words to exclude
  const seedWords = new Set(seedPhrase.toLowerCase().split(/\s+/));
  
  // Common filler words to exclude
  const FILLER_WORDS = new Set([
    'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
    'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of',
    'vs', 'your', 'you', 'my', 'i', 'it', 'be', 'do', 'are', 'this', 'that',
    'from', 'by', 'not', 'if', 'but', 'about', 'get', 'make', 'like', 'just'
  ]);
  
  const phraseWords = phrase.toLowerCase().split(/\s+/);
  
  let bestBoost = 0;
  
  for (const word of phraseWords) {
    // Skip short words, seed words, and fillers
    if (word.length < 3) continue;
    if (seedWords.has(word)) continue;
    if (FILLER_WORDS.has(word)) continue;
    
    const frequency = wordFrequency[word] || 0;
    
    // Absolute threshold-based boost
    let boost = 0;
    if (frequency >= 20) {
      boost = 12;  // High demand anchor
    } else if (frequency >= 15) {
      boost = 10;  // Strong demand
    } else if (frequency >= 10) {
      boost = 7;   // Good demand
    } else if (frequency >= 6) {
      boost = 4;   // Moderate demand
    } else if (frequency >= 3) {
      boost = 2;   // Weak signal
    }
    // frequency < 3 = no boost
    
    // Take the best anchor boost (don't stack multiple anchors)
    if (boost > bestBoost) {
      bestBoost = boost;
    }
  }
  
  return bestBoost;
}

/**
 * NATURAL LANGUAGE QUALITY DETECTION
 * Penalizes non-English, gibberish, and low-quality phrases
 * Returns a penalty (negative number) or bonus (positive)
 */

// Foreign language indicators
const FOREIGN_LANGUAGE_PATTERNS = [
  // Indian languages
  /\b(hindi|tamil|telugu|malayalam|kannada|bengali|marathi|gujarati|punjabi)\b/i,
  /\b(हिंदी|தமிழ்|తెలుగు|മലയാളം|ಕನ್ನಡ|বাংলা|मराठी|ગુજરાતી|ਪੰਜਾਬੀ)\b/,
  // Other languages
  /\b(uzbek|uzbek tilida|amharic|bangla|urdu|arabic|español|portuguese|français|deutsch|russian|indonesia|filipino|tagalog|vietnamese|thai|korean|japanese|chinese|mandarin)\b/i,
  // Common non-English phrases
  /\b(en español|em português|auf deutsch|по русски|dalam bahasa|kaise kare|ka tarika|in telugu|in tamil|in hindi)\b/i,
];

// YouTuber/Channel name patterns (likely garbage phrases)
const YOUTUBER_NAME_PATTERNS: RegExp[] = [
  // REMOVED: YouTuber name patterns - not scalable
];

// Month names for past-month detection
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

/**
 * Check if phrase contains a PAST month (current year).
 * Past months get -20 penalty. Current/future months are fine.
 */
function containsPastMonth(phrase: string): boolean {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (Dec = 11)
  const currentYear = now.getFullYear();
  const lowerPhrase = phrase.toLowerCase();
  
  for (let i = 0; i < MONTH_NAMES.length; i++) {
    if (lowerPhrase.includes(MONTH_NAMES[i])) {
      // Check if this month is in the past for current year
      // If phrase contains current year and month is before current month
      if (lowerPhrase.includes(currentYear.toString()) && i < currentMonth) {
        return true;
      }
      // If phrase has no year, assume current year - past month = penalty
      if (!lowerPhrase.match(/20\d{2}/)) {
        if (i < currentMonth) {
          return true;
        }
      }
    }
  }
  return false;
}

// Gibberish/Low quality patterns
const LOW_QUALITY_PATTERNS = [
  /\b(be like|meme|reaction|cringe|rant|exposed|drama|beef)\b/i, // Low-value content types
  /(.)\1{3,}/, // Repeated characters (aaaa)
];

// High quality/engaging patterns (bonus)
const HIGH_QUALITY_PATTERNS = [
  /\b(secret|hack|trick|tip|strategy|guide|tutorial|explained|update|2024|2025)\b/i,
  /\b(fix|solve|beat|crack|master|improve|boost|grow|monetize)\b/i,
  /\b(new|latest|complete|ultimate|beginner|advanced|pro)\b/i,
];

/**
 * Natural Language Adjustment: -12 to +10
 * IMPORTANT: Penalties are NOT offset by bonuses. 
 * If a phrase gets penalized, it does NOT get high quality bonuses.
 */
function getNaturalLanguageAdjustment(phrase: string): number {
  let penalty = 0;
  
  // Check for foreign language (-12 penalty)
  for (const pattern of FOREIGN_LANGUAGE_PATTERNS) {
    if (pattern.test(phrase)) {
      penalty = -12;
      break;
    }
  }
  
  // Check for YouTuber/channel names (-8 penalty)
  if (penalty === 0) {
    for (const pattern of YOUTUBER_NAME_PATTERNS) {
      if (pattern.test(phrase)) {
        penalty = -8;
        break;
      }
    }
  }
  
  // Check for PAST months only (-20 penalty)
  // Current/future months are fine for seasonal content
  if (penalty === 0) {
    if (containsPastMonth(phrase)) {
      penalty = -20;
    }
  }
  
  // Check for low quality patterns (-5 penalty)
  if (penalty === 0) {
    for (const pattern of LOW_QUALITY_PATTERNS) {
      if (pattern.test(phrase)) {
        penalty = -5;
        break;
      }
    }
  }
  
  // Only give high quality bonus if NO penalty was applied
  if (penalty < 0) {
    return penalty;
  }
  
  // Check for high quality patterns (+5 bonus, max +10)
  let qualityBonus = 0;
  for (const pattern of HIGH_QUALITY_PATTERNS) {
    if (pattern.test(phrase)) {
      qualityBonus += 5;
      if (qualityBonus >= 10) break;
    }
  }
  return Math.min(qualityBonus, 10);
}

/**
 * Calculate POPULARITY score
 * 
 * Philosophy: "Could this phrase be popular with YOUR viewers?"
 * 
 * Formula:
 *   popularityScore = baseFromTag + variation + openerBoost + lengthPoints + nlAdjustment
 * 
 * Tags are determined by relationship to Top 10 autocomplete results:
 *   - TOP_10: Is one of the Top 9 autocomplete results (base 90)
 *   - T10_CHILD: Starts with a Top 10 phrase (base 78)
 *   - T10_RELATED: Contains a Top 10 phrase (base 70)
 *   - NO_TAG: No relationship to Top 10 (base 62)
 */
export function calculateFullDemandScore(
  phrase: string,
  source: 'seed' | 'top10' | 'child' | 'az' | 'prefix',
  stats: IntakeStats
): number {
  const variation = getPhraseVariation(phrase); // -2 to +2
  const normalizedPhrase = normalizeForMatching(phrase);
  
  // Get Top 9 phrases for tag determination
  const top9Phrases = stats.top9Demand?.phrases || [];
  const top9Normalized = top9Phrases.map(p => normalizeForMatching(p));
  
  // ===========================================
  // SPECIAL CASE: Seed phrase always gets highest score
  // The seed is what the user entered - it should always be #1
  // ===========================================
  if (source === 'seed') {
    const seedScore = getSeedBaseScore(stats.totalPhrases || 100);
    return Math.round(seedScore);
  }
  
  // ===========================================
  // STEP 1: Determine TAG (not source!)
  // Tags are based on relationship to Top 9, NOT source
  // ===========================================
  let tag: 'TOP_10' | 'T10_CHILD' | 'T10_RELATED' | 'NO_TAG' = 'NO_TAG';
  let positionIndex = -1;
  
  // Check if this IS a Top 10 phrase (exact match)
  positionIndex = top9Normalized.indexOf(normalizedPhrase);
  if (positionIndex >= 0) {
    tag = 'TOP_10';
  } else {
    // Check if it STARTS WITH a Top 10 phrase (T10-Child)
    for (let i = 0; i < top9Phrases.length; i++) {
      if (phraseStartsWith(phrase, top9Phrases[i])) {
        tag = 'T10_CHILD';
        positionIndex = i;
        break;
      }
    }
    
    // If not a child, check if it CONTAINS a Top 10 phrase (T10-Related)
    if (tag === 'NO_TAG') {
      for (let i = 0; i < top9Phrases.length; i++) {
        if (phraseContains(phrase, top9Phrases[i])) {
          tag = 'T10_RELATED';
          positionIndex = i;
          break;
        }
      }
    }
  }
  
  // ===========================================
  // STEP 2: Calculate base score from tag
  // Per popularity-algorithm-v2.md
  // ===========================================
  let baseScore: number;
  let anchorBonus = 0;
  
  switch (tag) {
    case 'TOP_10':
      // Position 1 = 87, decay by 1 per position down to 79 for position 9
      if (positionIndex >= 0 && positionIndex < 9) {
        baseScore = TAG_BASE_SCORES.TOP_10_POSITION_1 - (positionIndex * TAG_BASE_SCORES.TOP_10_DECAY);
      } else {
        baseScore = TAG_BASE_SCORES.TOP_10_POSITION_1;
      }
      
      // TOP_10 ONLY gets anchor bonus (the ONLY boost for TOP_10)
      // Check if any anchor word appears multiple times in Top 9
      if (stats.top9Demand?.anchorBonuses) {
        const phraseWords = normalizedPhrase.split(' ');
        for (const word of phraseWords) {
          const anchorCount = stats.top9Demand.anchorBonuses[word];
          if (anchorCount) {
            // anchorBonuses stores (count - 1) * 3, so we need to reverse engineer
            // If count was 2, bonus is 3. If count was 3+, bonus is 6+
            // We want: 2x = +3, 3+ = +5
            if (anchorCount >= 6) {
              anchorBonus = Math.max(anchorBonus, TOP_10_ANCHOR_BONUS.THREE_PLUS);
            } else if (anchorCount >= 3) {
              anchorBonus = Math.max(anchorBonus, TOP_10_ANCHOR_BONUS.TWO_TIMES);
            }
          }
        }
      }
      baseScore += anchorBonus;
      break;
      
    case 'T10_CHILD':
      // Child phrases: base 70, plus position influence
      baseScore = TAG_BASE_SCORES.T10_CHILD;
      // Position-based boost same as T10_RELATED
      if (positionIndex >= 0 && positionIndex < 9) {
        baseScore += T10_RELATED_POSITION_BOOST[positionIndex] || 0;
      }
      break;
      
    case 'T10_RELATED':
      // Base 55 + position-based boost (+12 for #1, +4 for #9)
      baseScore = TAG_BASE_SCORES.T10_RELATED;
      if (positionIndex >= 0 && positionIndex < 9) {
        baseScore += T10_RELATED_POSITION_BOOST[positionIndex] || 0;
      }
      break;
      
    case 'NO_TAG':
    default:
      baseScore = TAG_BASE_SCORES.NO_TAG;
      break;
  }
  
  // ===========================================
  // STEP 3: Add bonuses and adjustments
  // IMPORTANT: TOP_10 does NOT get these bonuses (only anchor bonus above)
  // ===========================================
  
  let starterBoost = 0;
  let lengthAdjustment = 0;
  let nlAdjustment = 0;
  let demandAnchorBoost = 0;
  
  // Only apply bonuses to non-TOP_10 phrases
  if (tag !== 'TOP_10') {
    // Starter boost: ONE boost based on percentage of session (max +12)
    starterBoost = getStarterBoost(
      phrase,
      stats.top9Demand?.oneWordStarters,
      stats.totalPhrases
    );
    
    // Length adjustment: -15 to +4 based on word count
    lengthAdjustment = getLengthAdjustment(phrase);
    
    // Natural language quality adjustment: -12 to +10
    nlAdjustment = getNaturalLanguageAdjustment(phrase);
    
    // DEMAND ANCHOR boost: meaningful words that appear frequently across session
    demandAnchorBoost = getDemandAnchorBoost(
      phrase,
      stats.wordFrequency,
      stats.seedPhrase || ''
    );
  }
  
  // ===========================================
  // STEP 4: Calculate final score with CAPS, then apply penalties
  // ===========================================
  
  // Separate positive bonuses from negative penalties
  const nlPenalty = Math.min(0, nlAdjustment);  // Only negatives
  const nlBonus = Math.max(0, nlAdjustment);    // Only positives
  
  // First: base + positive bonuses + NL bonus
  let finalScore = baseScore + variation + starterBoost + lengthAdjustment + nlBonus + demandAnchorBoost;
  
  // Apply caps based on tag to maintain hierarchy
  let cap = 99;
  if (tag === 'TOP_10') {
    // Cap at 92 (seed - 2 for medium session)
    cap = 92;
  } else if (tag === 'T10_CHILD') {
    // Cap at parent TOP_10 score - 1
    const parentScore = TAG_BASE_SCORES.TOP_10_POSITION_1 - (positionIndex * TAG_BASE_SCORES.TOP_10_DECAY);
    cap = parentScore - 1;
  } else if (tag === 'T10_RELATED') {
    // Cap at matching TOP_10 score - 2
    const matchingScore = TAG_BASE_SCORES.TOP_10_POSITION_1 - (positionIndex * TAG_BASE_SCORES.TOP_10_DECAY);
    cap = matchingScore - 2;
  } else {
    // NO_TAG cap at 85 (allows good A_TO_Z and PREFIX phrases to score high)
    cap = 85;
  }
  
  finalScore = Math.min(finalScore, cap);
  
  // THEN apply NL penalties (so bad phrases drop below cap)
  finalScore += nlPenalty;
  
  // Clamp to valid range (max 99, never 100)
  return Math.round(Math.max(0, Math.min(99, finalScore)));
}

/**
 * Check if a phrase matches any Top 9 phrase (starts with or contains)
 * Returns the best matching Top 9 phrase and its position, or null if no match
 */
export function getTop9Match(phrase: string, stats: IntakeStats): {
  top9Phrase: string;
  position: number;
  matchType: 'starts_with' | 'contains';
} | null {
  if (!stats.top9Demand?.phrases) {
    return null;
  }
  
  const top9Phrases = stats.top9Demand.phrases;
  
  // First check for "starts with" matches (higher priority)
  for (let i = 0; i < top9Phrases.length; i++) {
    if (phraseStartsWith(phrase, top9Phrases[i])) {
      return {
        top9Phrase: top9Phrases[i],
        position: i + 1, // 1-indexed
        matchType: 'starts_with',
      };
    }
  }
  
  // Then check for "contains" matches
  for (let i = 0; i < top9Phrases.length; i++) {
    if (phraseContains(phrase, top9Phrases[i])) {
      return {
        top9Phrase: top9Phrases[i],
        position: i + 1, // 1-indexed
        matchType: 'contains',
      };
    }
  }
  
  return null;
}

// ============================================================
// PHRASE COMPONENT EXTRACTION
// ============================================================

/**
 * Extract phrase components relative to seed
 */
export function extractPhraseComponents(phrase: string, seedPhrase: string): {
  prefix: string;
  seedPlus1: string;
  seedPlus2: string;
  suffix: string;
} {
  const phraseLower = phrase.toLowerCase();
  const seedLower = seedPhrase.toLowerCase();
  const seedIndex = phraseLower.indexOf(seedLower);
  
  if (seedIndex === -1) {
    // Seed not found in phrase - return empty components
    return { prefix: '', seedPlus1: '', seedPlus2: '', suffix: '' };
  }
  
  // Extract prefix
  const prefix = phraseLower.substring(0, seedIndex).trim();
  
  // Extract words after seed
  const afterSeed = phraseLower.substring(seedIndex + seedLower.length).trim();
  const afterWords = afterSeed.split(/\s+/).filter(w => w.length > 0);
  
  return {
    prefix,
    seedPlus1: afterWords[0] || '',
    seedPlus2: afterWords[1] || '',
    suffix: afterSeed,
  };
}

/**
 * Calculate Popularity score for a phrase (0-100)
 * High popularity = phrase uses common patterns
 */
export function calculatePopularity(phrase: string, seedPhrase: string, stats: IntakeStats): number {
  const { prefix, seedPlus1, seedPlus2, suffix } = extractPhraseComponents(phrase, seedPhrase);
  
  // Get percentiles (high percentile = common = high popularity)
  // Default to 50 if pattern not found (neutral)
  const prefixPct = prefix ? (stats.prefixPercentiles[prefix] ?? 50) : 50;
  const seedPlus1Pct = seedPlus1 ? (stats.seedPlus1Percentiles[seedPlus1] ?? 50) : 50;
  const seedPlus2Pct = seedPlus2 ? (stats.seedPlus2Percentiles[seedPlus2] ?? 50) : 50;
  const suffixPct = suffix ? (stats.suffixPercentiles[suffix] ?? 50) : 50;
  
  // Weighted average
  // Seed+1 and Seed+2 matter most (30% each)
  // Prefix and suffix matter less (20% each)
  const popularity = Math.round(
    prefixPct * 0.20 +
    seedPlus1Pct * 0.30 +
    seedPlus2Pct * 0.30 +
    suffixPct * 0.20
  );
  
  return Math.max(0, Math.min(100, popularity));
}

/**
 * Calculate Competition score for a phrase (0-100)
 * High competition = phrase uses common patterns (same data, different interpretation)
 * 
 * Note: Competition uses equal weighting because ALL components
 * contribute equally to how "competitive" a phrase is
 */
export function calculateCompetition(phrase: string, seedPhrase: string, stats: IntakeStats): number {
  const { prefix, seedPlus1, seedPlus2, suffix } = extractPhraseComponents(phrase, seedPhrase);
  
  // Get percentiles (high percentile = common = high competition)
  const prefixPct = prefix ? (stats.prefixPercentiles[prefix] ?? 50) : 50;
  const seedPlus1Pct = seedPlus1 ? (stats.seedPlus1Percentiles[seedPlus1] ?? 50) : 50;
  const seedPlus2Pct = seedPlus2 ? (stats.seedPlus2Percentiles[seedPlus2] ?? 50) : 50;
  const suffixPct = suffix ? (stats.suffixPercentiles[suffix] ?? 50) : 50;
  
  // Equal weighting for competition
  const competition = Math.round(
    prefixPct * 0.25 +
    seedPlus1Pct * 0.25 +
    seedPlus2Pct * 0.25 +
    suffixPct * 0.25
  );
  
  return Math.max(0, Math.min(100, competition));
}

/**
 * Calculate P&C scores for a phrase and return breakdown
 */
export function calculatePCScores(phrase: string, seedPhrase: string, stats: IntakeStats): {
  popularity: number;
  competition: number;
  spread: number;
  breakdown: {
    prefixScore: number;
    seedPlus1Score: number;
    seedPlus2Score: number;
    suffixScore: number;
    prefix: string;
    seedPlus1: string;
    seedPlus2: string;
    suffix: string;
  };
} {
  const { prefix, seedPlus1, seedPlus2, suffix } = extractPhraseComponents(phrase, seedPhrase);
  
  const prefixScore = prefix ? (stats.prefixPercentiles[prefix] ?? 50) : 50;
  const seedPlus1Score = seedPlus1 ? (stats.seedPlus1Percentiles[seedPlus1] ?? 50) : 50;
  const seedPlus2Score = seedPlus2 ? (stats.seedPlus2Percentiles[seedPlus2] ?? 50) : 50;
  const suffixScore = suffix ? (stats.suffixPercentiles[suffix] ?? 50) : 50;
  
  const popularity = Math.round(
    prefixScore * 0.20 +
    seedPlus1Score * 0.30 +
    seedPlus2Score * 0.30 +
    suffixScore * 0.20
  );
  
  const competition = Math.round(
    prefixScore * 0.25 +
    seedPlus1Score * 0.25 +
    seedPlus2Score * 0.25 +
    suffixScore * 0.25
  );
  
  return {
    popularity: Math.max(0, Math.min(100, popularity)),
    competition: Math.max(0, Math.min(100, competition)),
    spread: popularity - competition,
    breakdown: {
      prefixScore,
      seedPlus1Score,
      seedPlus2Score,
      suffixScore,
      prefix,
      seedPlus1,
      seedPlus2,
      suffix,
    },
  };
}

/**
 * Batch calculate P&C scores for all phrases
 */
export function calculateAllPCScores(
  phrases: string[],
  seedPhrase: string,
  stats: IntakeStats
): Array<{
  phrase: string;
  popularity: number;
  competition: number;
  spread: number;
}> {
  return phrases.map(phrase => {
    const { popularity, competition, spread } = calculatePCScores(phrase, seedPhrase, stats);
    return { phrase, popularity, competition, spread };
  });
}

// ============================================================
// LTV (LONG-TERM VIEWS) SCORING
// Measures alignment with Top 10 autocomplete results
// ============================================================

/**
 * LTV Anchor Types extracted from Top 10 phrases
 */
export interface LTVAnchors {
  singleAnchors: Map<string, number>; // word -> frequency in Top 10
  bigramAnchors: Map<string, number>; // "word word" -> frequency
  fullAnchors: Map<string, string>;   // anchor text -> source Top 10 phrase
  top10Phrases: string[];             // Original Top 10 phrases
  seedWords: Set<string>;             // Words from the seed phrase
}

/**
 * LTV calculation result
 */
export interface LTVResult {
  score: number;                      // 0-100
  strategy: 'FULL_TOP10' | 'FULL_ANCHOR' | 'BIGRAM' | 'SINGLE' | null;
  match: string | null;               // The text that matched
}

// Common filler words to exclude from anchor extraction
const FILLER_WORDS = new Set([
  'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
  'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs'
]);

/**
 * Extract anchors from Top 10 phrases for LTV scoring
 * Call this once per session after phrase generation
 */
export function extractLTVAnchors(top10Phrases: string[], seedPhrase: string): LTVAnchors {
  const seedWords = new Set(seedPhrase.toLowerCase().split(/\s+/));
  const singleAnchors = new Map<string, number>();
  const bigramAnchors = new Map<string, number>();
  const fullAnchors = new Map<string, string>();
  
  for (const phrase of top10Phrases) {
    const words = phrase.toLowerCase().split(/\s+/);
    
    // Extract single word anchors (non-seed, non-filler, 3+ chars)
    for (const word of words) {
      if (!seedWords.has(word) && !FILLER_WORDS.has(word) && word.length >= 3) {
        singleAnchors.set(word, (singleAnchors.get(word) || 0) + 1);
      }
    }
    
    // Extract bigrams (at least one non-seed, non-filler word)
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      const word1IsMeaningful = !seedWords.has(words[i]) || !FILLER_WORDS.has(words[i]);
      const word2IsMeaningful = !seedWords.has(words[i + 1]) || !FILLER_WORDS.has(words[i + 1]);
      
      if (word1IsMeaningful || word2IsMeaningful) {
        bigramAnchors.set(bigram, (bigramAnchors.get(bigram) || 0) + 1);
      }
    }
    
    // Extract full anchor (everything after the seed phrase)
    const seedIdx = words.findIndex((w, i) => 
      seedWords.has(w) && seedWords.has(words[i + 1])
    );
    if (seedIdx !== -1 && seedIdx + 2 < words.length) {
      const fullAnchor = words.slice(seedIdx + 2).join(' ');
      if (fullAnchor.length > 0) {
        fullAnchors.set(fullAnchor, phrase);
      }
    }
  }
  
  return {
    singleAnchors,
    bigramAnchors,
    fullAnchors,
    top10Phrases,
    seedWords
  };
}

/**
 * Generate a consistent hash from a phrase for variation
 * This ensures the same phrase always gets the same variation
 */
function phraseHash(phrase: string): number {
  return phrase.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

/**
 * Calculate LTV score for a single phrase
 * 
 * Priority system:
 * 1. FULL_TOP10: Entire Top 10 phrase found in target (70-95)
 * 2. FULL_ANCHOR: Non-seed portion of Top 10 found (55-69)
 * 3. BIGRAM: Two-word anchor from Top 10 found (40-54)
 * 4. SINGLE: Single meaningful word from Top 10 found (20-39)
 * 5. No match = 0
 */
export function calculateLTV(phrase: string, anchors: LTVAnchors): LTVResult {
  const phraseLower = phrase.toLowerCase();
  const phraseWords = phraseLower.split(/\s+/);
  const hash = phraseHash(phrase);
  const variation = (hash % 7) - 3; // -3 to +3 for organic scores
  
  // Priority 1: Full Top 10 match (70-95)
  for (const top10 of anchors.top10Phrases) {
    if (phraseLower.includes(top10.toLowerCase())) {
      const top10Words = top10.split(/\s+/).length;
      const density = top10Words / phraseWords.length;
      const position = phraseLower.indexOf(top10.toLowerCase());
      const posBonus = position === 0 ? 15 : position < 10 ? 10 : 5;
      
      const score = Math.round(Math.min(95, 70 + (density * 20) + posBonus + variation));
      return { score, strategy: 'FULL_TOP10', match: top10 };
    }
  }
  
  // Priority 2: Full anchor match (55-69)
  for (const [anchor, source] of anchors.fullAnchors.entries()) {
    if (phraseLower.includes(anchor)) {
      const position = phraseLower.indexOf(anchor);
      const posBonus = position < 20 ? 8 : position < 40 ? 4 : 0;
      
      const score = Math.round(Math.min(69, 55 + posBonus + variation));
      return { score, strategy: 'FULL_ANCHOR', match: anchor };
    }
  }
  
  // Priority 3: Bigram anchor match (40-54)
  for (const [bigram, freq] of anchors.bigramAnchors.entries()) {
    // Skip if bigram is just seed words
    const bigramWords = bigram.split(' ');
    if (bigramWords.every(w => anchors.seedWords.has(w))) continue;
    
    if (phraseLower.includes(bigram)) {
      const freqBonus = freq * 3;
      const score = Math.round(Math.min(54, 40 + freqBonus + variation));
      return { score, strategy: 'BIGRAM', match: bigram };
    }
  }
  
  // Priority 4: Single anchor match (20-39)
  let bestSingleScore = 0;
  let bestSingleMatch: string | null = null;
  
  for (const [anchor, freq] of anchors.singleAnchors.entries()) {
    if (phraseWords.includes(anchor)) {
      const freqBonus = freq * 4;
      const posIdx = phraseWords.indexOf(anchor);
      const posBonus = posIdx <= 2 ? 8 : posIdx <= 4 ? 4 : 0;
      
      const score = 20 + freqBonus + posBonus;
      if (score > bestSingleScore) {
        bestSingleScore = score;
        bestSingleMatch = anchor;
      }
    }
  }
  
  if (bestSingleScore > 0) {
    const score = Math.round(Math.min(39, bestSingleScore + variation));
    return { score, strategy: 'SINGLE', match: bestSingleMatch };
  }
  
  // No match
  return { score: 0, strategy: null, match: null };
}

/**
 * Get Popularity boost based on LTV score
 * 
 * | LTV Score | Popularity Boost |
 * |-----------|------------------|
 * | 0-19      | +0               |
 * | 20-29     | +3               |
 * | 30-39     | +5               |
 * | 40-49     | +8               |
 * | 50+       | +10              |
 */
export function getLTVBoost(ltvScore: number): number {
  if (ltvScore >= 50) return 10;
  if (ltvScore >= 40) return 8;
  if (ltvScore >= 30) return 5;
  if (ltvScore >= 20) return 3;
  return 0;
}

/**
 * Check if phrase qualifies for LTV badge on Page 3
 */
export function shouldShowLTVBadge(ltvScore: number): boolean {
  return ltvScore >= 50;
}

/**
 * Calculate Popularity with LTV boost applied
 */
export function calculatePopularityWithLTV(
  phrase: string, 
  seedPhrase: string, 
  stats: IntakeStats, 
  ltvScore: number
): number {
  const basePopularity = calculatePopularity(phrase, seedPhrase, stats);
  const boost = getLTVBoost(ltvScore);
  return Math.min(100, basePopularity + boost);
}

/**
 * Batch calculate LTV scores for all phrases
 */
export function calculateAllLTVScores(
  phrases: string[],
  anchors: LTVAnchors
): Array<{
  phrase: string;
  ltv: number;
  strategy: LTVResult['strategy'];
  match: string | null;
  boost: number;
  badgeEligible: boolean;
}> {
  return phrases.map(phrase => {
    const result = calculateLTV(phrase, anchors);
    return {
      phrase,
      ltv: result.score,
      strategy: result.strategy,
      match: result.match,
      boost: getLTVBoost(result.score),
      badgeEligible: shouldShowLTVBadge(result.score)
    };
  });
}

/**
 * Calculate all scores for a phrase including LTV-boosted Popularity
 */
export function calculateAllScores(
  phrase: string,
  seedPhrase: string,
  stats: IntakeStats,
  anchors: LTVAnchors
): {
  popularity: number;
  popularityBase: number;
  competition: number;
  spread: number;
  ltvScore: number;
  ltvBoost: number;
  ltvBadgeEligible: boolean;
  ltvStrategy: LTVResult['strategy'];
  ltvMatch: string | null;
} {
  // Calculate LTV first
  const ltvResult = calculateLTV(phrase, anchors);
  const ltvBoost = getLTVBoost(ltvResult.score);
  
  // Calculate base P&C
  const { popularity: popularityBase, competition, spread: baseSpread } = calculatePCScores(phrase, seedPhrase, stats);
  
  // Apply LTV boost to Popularity
  const popularity = Math.min(100, popularityBase + ltvBoost);
  const spread = popularity - competition;
  
  return {
    popularity,
    popularityBase,
    competition,
    spread,
    ltvScore: ltvResult.score,
    ltvBoost,
    ltvBadgeEligible: shouldShowLTVBadge(ltvResult.score),
    ltvStrategy: ltvResult.strategy,
    ltvMatch: ltvResult.match
  };
}
