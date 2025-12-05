/**
 * Opportunity Scoring Module for Builder Module
 * 
 * Calculates opportunity score based on session context data.
 * No API calls - uses pre-collected autocomplete data.
 * 
 * @see /docs/1-opportunity-scoring.md for documentation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface OpportunityInput {
  phrase: string;
  demand: number | null;
  suggestionCount: number;
  exactMatchCount: number;
  topicMatchCount: number;
  generationMethod: string | null; // seed, top10, child_phrase, az, prefix
}

export interface SessionContext {
  allPhrases: Array<{
    phrase: string;
    demand: number | null;
  }>;
  hotAnchors: Map<string, { count: number; avgDemand: number }>;
  seedPhrase: string;
}

export interface OpportunityBreakdown {
  demandBase: number;
  lowCompSignal: number;
  longTermViews: number;
  hotAnchor: number;
  relatedPhrase: number;
}

export interface OpportunityResult {
  score: number;
  breakdown: OpportunityBreakdown;
  warnings: string[];
  insights: string[];
  relatedPhrases: {
    shorter: Array<{ phrase: string; demand: number | null }>;
    longer: Array<{ phrase: string; demand: number | null }>;
  };
  matchedAnchors: Array<{ word: string; count: number; avgDemand: number }>;
  hasLowCompSignal: boolean;
  hasLongTermPotential: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Stop words to exclude from anchor matching
const STOP_WORDS = new Set([
  'how', 'to', 'the', 'a', 'an', 'in', 'on', 'for', 'is', 'are', 'and', 'or',
  'what', 'why', 'when', 'where', 'who', 'which', 'your', 'my', 'with', 'from',
  'at', 'by', 'about', 'into', 'of', 'do', 'does', 'did', 'be', 'been', 'being',
  'have', 'has', 'had', 'can', 'could', 'will', 'would', 'should', 'may', 'might',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'me', 'us', 'them', 'this', 'that',
  'best', 'top', 'free', 'new', 'first', 'get', 'make', 'start', 'use', 'using'
]);

// Evergreen patterns that indicate long-term potential
const EVERGREEN_PREFIXES = [
  'how to', 'how do', 'how does', 'how can',
  'what is', 'what are', 'what does',
  'why is', 'why are', 'why do',
  'learn', 'guide to', 'ways to', 'steps to',
];

const EVERGREEN_SUFFIXES = [
  'tutorial', 'tutorials', 'guide', 'guides',
  'course', 'beginner', 'beginners', 'basics',
  'tips', 'tricks', 'step by step', 'explained',
  'for beginners', 'introduction', 'fundamentals',
];

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate Demand Base score (0-30)
 * Based on suggestion count from autocomplete
 */
function calculateDemandBase(suggestionCount: number): number {
  if (suggestionCount >= 12) return 30;
  if (suggestionCount >= 10) return 25;
  if (suggestionCount >= 7) return 18;
  if (suggestionCount >= 5) return 12;
  if (suggestionCount >= 3) return 5;
  return 0;
}

/**
 * Calculate Low Comp Signal score (0-25)
 * Low exact match + high topic match = opportunity
 */
function calculateLowCompSignal(
  exactMatchCount: number,
  topicMatchCount: number,
  suggestionCount: number
): { score: number; hasSignal: boolean } {
  if (suggestionCount < 3) {
    return { score: 0, hasSignal: false };
  }
  
  const exactPct = (exactMatchCount / suggestionCount) * 100;
  const topicPct = (topicMatchCount / suggestionCount) * 100;
  
  // Strong low comp signal
  if (exactPct <= 20 && topicPct >= 80) {
    return { score: 25, hasSignal: true };
  }
  if (exactPct <= 30 && topicPct >= 60) {
    return { score: 20, hasSignal: true };
  }
  if (exactPct <= 40 && topicPct >= 50) {
    return { score: 12, hasSignal: true };
  }
  if (exactPct <= 50 && topicPct >= 40) {
    return { score: 5, hasSignal: true };
  }
  
  return { score: 0, hasSignal: false };
}

/**
 * Calculate Long-Term Views score (0-25)
 * Based on word count + evergreen patterns
 */
function calculateLongTermViews(phrase: string): { score: number; hasPotential: boolean } {
  const phraseLower = phrase.toLowerCase();
  const wordCount = phrase.split(/\s+/).length;
  
  // Check for evergreen patterns
  const hasEvergreenPrefix = EVERGREEN_PREFIXES.some(p => phraseLower.startsWith(p));
  const hasEvergreenSuffix = EVERGREEN_SUFFIXES.some(s => phraseLower.includes(s));
  const hasEvergreen = hasEvergreenPrefix || hasEvergreenSuffix;
  
  let score = 0;
  
  // Word count base
  if (wordCount >= 6) {
    score = 15; // Long-tail = easier to rank
  } else if (wordCount === 5) {
    score = 12;
  } else if (wordCount === 4) {
    score = 8;
  } else if (wordCount === 3) {
    score = 4;
  }
  
  // Evergreen bonus
  if (hasEvergreen) {
    score += 10;
  }
  
  return {
    score: Math.min(25, score),
    hasPotential: score >= 15
  };
}

/**
 * Calculate Hot Anchor score (0-15)
 * Phrases containing popular session anchors get a boost
 */
function calculateHotAnchor(
  phrase: string,
  hotAnchors: Map<string, { count: number; avgDemand: number }>
): { score: number; matchedAnchors: Array<{ word: string; count: number; avgDemand: number }> } {
  const words = phrase.toLowerCase().split(/\s+/);
  const matched: Array<{ word: string; count: number; avgDemand: number }> = [];
  
  for (const word of words) {
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length < 2 || STOP_WORDS.has(cleaned)) continue;
    
    const anchorData = hotAnchors.get(cleaned);
    if (anchorData && anchorData.avgDemand >= 60) {
      matched.push({ word: cleaned, ...anchorData });
    }
  }
  
  // Score based on best matching anchor
  if (matched.length === 0) return { score: 0, matchedAnchors: [] };
  
  // Sort by avgDemand descending
  matched.sort((a, b) => b.avgDemand - a.avgDemand);
  
  const bestAnchor = matched[0];
  let score = 0;
  
  if (bestAnchor.avgDemand >= 75) {
    score = 15;
  } else if (bestAnchor.avgDemand >= 70) {
    score = 12;
  } else if (bestAnchor.avgDemand >= 65) {
    score = 8;
  } else {
    score = 5;
  }
  
  return { score, matchedAnchors: matched };
}

/**
 * Calculate Related Phrase score (0-15)
 * Having shorter variants (ranking ladder) or longer variants (drill-down potential)
 */
function calculateRelatedPhrase(
  phrase: string,
  allPhrases: Array<{ phrase: string; demand: number | null }>
): { score: number; shorter: Array<{ phrase: string; demand: number | null }>; longer: Array<{ phrase: string; demand: number | null }> } {
  const phraseLower = phrase.toLowerCase();
  
  // Find shorter variants (this phrase contains them)
  const shorter = allPhrases.filter(p => {
    const other = p.phrase.toLowerCase();
    return other !== phraseLower && 
           phraseLower.includes(other) && 
           other.split(/\s+/).length >= 2;
  });
  
  // Find longer variants (they contain this phrase)
  const longer = allPhrases.filter(p => {
    const other = p.phrase.toLowerCase();
    return other !== phraseLower && other.includes(phraseLower);
  });
  
  let score = 0;
  
  // Shorter variant with high demand = ranking ladder potential
  const bestShorter = shorter
    .filter(p => p.demand !== null)
    .sort((a, b) => (b.demand ?? 0) - (a.demand ?? 0))[0];
  
  if (bestShorter && bestShorter.demand !== null && bestShorter.demand >= 80) {
    score += 10; // Strong ranking ladder
  } else if (bestShorter && bestShorter.demand !== null && bestShorter.demand >= 60) {
    score += 6;
  }
  
  // Multiple longer variants = topic depth
  if (longer.length >= 5) {
    score += 5;
  } else if (longer.length >= 2) {
    score += 3;
  }
  
  return {
    score: Math.min(15, score),
    shorter: shorter.slice(0, 5), // Limit for display
    longer: longer.slice(0, 10)
  };
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Calculate opportunity score for a phrase
 */
export function calculateOpportunityScore(
  input: OpportunityInput,
  context: SessionContext
): OpportunityResult {
  const warnings: string[] = [];
  const insights: string[] = [];
  
  // 1. Demand Base (0-30)
  const demandBase = calculateDemandBase(input.suggestionCount);
  
  // 2. Low Comp Signal (0-25)
  const lowComp = calculateLowCompSignal(
    input.exactMatchCount,
    input.topicMatchCount,
    input.suggestionCount
  );
  
  // 3. Long-Term Views (0-25)
  const longTerm = calculateLongTermViews(input.phrase);
  
  // 4. Hot Anchor (0-15)
  const hotAnchor = calculateHotAnchor(input.phrase, context.hotAnchors);
  
  // 5. Related Phrase (0-15)
  const related = calculateRelatedPhrase(input.phrase, context.allPhrases);
  
  // Calculate total (max ~100)
  const totalScore = Math.min(100, 
    demandBase + 
    lowComp.score + 
    longTerm.score + 
    hotAnchor.score + 
    related.score
  );
  
  // Generate warnings
  const wordCount = input.phrase.split(/\s+/).length;
  if (wordCount <= 4 && input.demand !== null && input.demand >= 80) {
    warnings.push(`${wordCount} words with high demand may face competition. Consider drilling deeper for long-term potential.`);
  }
  
  // Generate insights
  if (lowComp.hasSignal) {
    insights.push("Low comp signal detected - high topic match with low exact match.");
  }
  if (longTerm.hasPotential) {
    insights.push("Long-term views potential - evergreen topic pattern detected.");
  }
  if (hotAnchor.matchedAnchors.length > 0) {
    const anchorList = hotAnchor.matchedAnchors.map(a => `"${a.word}"`).join(', ');
    insights.push(`Contains hot anchor${hotAnchor.matchedAnchors.length > 1 ? 's' : ''}: ${anchorList}`);
  }
  if (related.shorter.length > 0) {
    insights.push("Has shorter variant - ranking ladder potential.");
  }
  if (related.longer.length >= 3) {
    insights.push(`${related.longer.length} drill-down opportunities available.`);
  }
  
  return {
    score: totalScore,
    breakdown: {
      demandBase,
      lowCompSignal: lowComp.score,
      longTermViews: longTerm.score,
      hotAnchor: hotAnchor.score,
      relatedPhrase: related.score,
    },
    warnings,
    insights,
    relatedPhrases: {
      shorter: related.shorter,
      longer: related.longer,
    },
    matchedAnchors: hotAnchor.matchedAnchors,
    hasLowCompSignal: lowComp.hasSignal,
    hasLongTermPotential: longTerm.hasPotential,
  };
}

/**
 * Build hot anchors map from session phrases
 */
export function buildHotAnchors(
  phrases: Array<{ phrase: string; demand: number | null }>
): Map<string, { count: number; avgDemand: number }> {
  const anchorStats: Record<string, { count: number; demands: number[] }> = {};
  
  for (const p of phrases) {
    const words = p.phrase.toLowerCase().split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-z0-9]/g, '');
      if (cleaned.length < 2 || STOP_WORDS.has(cleaned)) continue;
      
      if (!anchorStats[cleaned]) {
        anchorStats[cleaned] = { count: 0, demands: [] };
      }
      anchorStats[cleaned].count++;
      if (p.demand !== null) {
        anchorStats[cleaned].demands.push(p.demand);
      }
    }
  }
  
  const hotAnchors = new Map<string, { count: number; avgDemand: number }>();
  
  for (const [word, stats] of Object.entries(anchorStats)) {
    // Only include anchors that appear 5+ times and have demand data
    if (stats.count >= 5 && stats.demands.length >= 3) {
      const avgDemand = Math.round(
        stats.demands.reduce((a, b) => a + b, 0) / stats.demands.length
      );
      hotAnchors.set(word, { count: stats.count, avgDemand });
    }
  }
  
  return hotAnchors;
}

/**
 * Get opportunity tier label
 */
export function getOpportunityTier(score: number): {
  label: string;
  color: string;
} {
  if (score >= 75) return { label: 'Excellent', color: '#4DD68A' };
  if (score >= 60) return { label: 'Strong', color: '#A3E635' };
  if (score >= 45) return { label: 'Good', color: '#CDDC39' };
  if (score >= 30) return { label: 'Moderate', color: '#FB923C' };
  return { label: 'Limited', color: '#F87171' };
}
