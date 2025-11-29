/**
 * Data Intake - Pattern Extraction for P&C Scoring
 * 
 * Runs after Page 1 (Seed) expansion completes.
 * Extracts patterns from all generated phrases to enable
 * FREE Popularity & Competition scoring without external APIs.
 */

import type { IntakeStats } from '@/types/database';

/**
 * Extract all patterns from generated phrases
 * This is the core Data Intake algorithm
 */
export function runDataIntake(phrases: string[], seedPhrase: string): IntakeStats {
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
    suffixPercentiles,
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
