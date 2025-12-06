/**
 * Viewer Landscape Analysis
 * 
 * Dual Scoring System:
 * - DEMAND SCORE (0-100): How many people are searching for this?
 * - OPPORTUNITY SCORE (0-100): Is this a good phrase to target?
 * 
 * SuperTopic Qualification:
 * - Demand ≥ 50 AND Opportunity ≥ 90
 * 
 * Multipliers:
 * - Word count (sweet spot at 5-6 words)
 * - Intent anchors (how to, tutorial, best, review, etc.)
 * - Exact vs Topic match ratio
 * - Suggestion count adjusted by word count expectations
 * 
 * @see docs/viewer-landscape-analysis.md
 */

// =============================================================================
// TYPES
// =============================================================================

export type SignalLevel = 'go' | 'caution' | 'stop';

// Keep DemandLevel for backward compatibility but map to SignalLevel
export type DemandLevel = 
  | 'extreme' 
  | 'incredible' 
  | 'high' 
  | 'strong' 
  | 'solid' 
  | 'moderate' 
  | 'low' 
  | 'very-low';

export type VibeCategory = 
  | 'learning' 
  | 'frustrated' 
  | 'current' 
  | 'problem-solving' 
  | 'curious' 
  | 'action-ready'
  | 'comparing'
  | 'brand';

export interface RankedSuggestion {
  position: number;
  phrase: string;
  vibe: VibeCategory;
  vibeIcon: string;
  weight: number;
}

export interface VibeDistribution {
  learning: number;
  frustrated: number;
  current: number;
  problemSolving: number;
  curious: number;
  actionReady: number;
  comparing: number;
  brand: number;
}

// Intent anchor categories for scoring
export type IntentCategory = 'learning' | 'buyer' | 'problem' | 'discovery' | 'action' | 'current' | 'specific';

export interface IntentMatch {
  category: IntentCategory;
  anchor: string;
  boost: number;
}

export interface ViewerLandscape {
  seed: string;
  
  // NEW: Dual Scoring System
  demandScore: number;           // 0-100
  demandLabel: string;           // "Strong Demand", "High Demand", etc.
  opportunityScore: number;      // 0-100
  opportunityLabel: string;      // "Excellent Opportunity", etc.
  isSuperTopic: boolean;         // Demand ≥ 50 AND Opportunity ≥ 90
  
  // Intent anchors detected
  intentMatches: IntentMatch[];
  hasEvergreenIntent: boolean;
  
  // Traffic Light Signal (derived from combined scores)
  signal: SignalLevel;
  signalLabel: string;
  signalMessage: string;
  signalColor: string;
  signalIcon: string;
  signalScore: number;  // Legacy: maps to opportunity score
  
  // Legacy demand fields (mapped from new demandScore)
  demandLevel: DemandLevel;
  legacyDemandLabel: string;  // Old signal-based label
  demandColor: string;
  demandIcon: string;
  suggestionCount: number;
  
  // Competition signal (for low exact match + high suggestions)
  isLowCompetition: boolean;
  competitionLabel: string | null;
  
  // Exact Match - how many start with exact seed phrase
  exactMatchCount: number;
  exactMatchPercent: number;
  
  // Topic Match - how many are about the same topic (share key words)
  topicMatchCount: number;
  topicMatchPercent: number;
  
  // Is this an opportunity? (low exact + high topic)
  isOpportunity: boolean;
  
  // Ranked suggestions with vibes
  rankedSuggestions: RankedSuggestion[];
  topFive: RankedSuggestion[];
  topFourteen: RankedSuggestion[];  // For expanded Popular Topics display
  
  // Anchor words extracted from suggestions (sucks, broken, explained, etc.)
  anchorWords: string[];
  
  // Weighted vibe distribution (0-100 for each)
  vibeDistribution: VibeDistribution;
  dominantVibe: VibeCategory;
  dominantVibePercent: number;
  dominantVibeLabel: string;
  
  // Insight message
  insight: string;
  
  // YouTube search link
  youtubeSearchUrl: string;
  
  // Raw data
  suggestions: string[];
}

// =============================================================================
// POSITION WEIGHTS
// =============================================================================

// Position #1 gets ~10x the clicks of position #3
const POSITION_WEIGHTS: number[] = [
  1.0,   // #1
  0.5,   // #2
  0.25,  // #3
  0.15,  // #4
  0.10,  // #5
  0.08,  // #6
  0.06,  // #7
  0.05,  // #8
  0.04,  // #9
  0.03,  // #10+
];

function getPositionWeight(position: number): number {
  if (position <= 0) return 0;
  if (position <= POSITION_WEIGHTS.length) {
    return POSITION_WEIGHTS[position - 1];
  }
  return 0.03; // Default for 10+
}

// =============================================================================
// INTENT ANCHOR LIBRARY
// =============================================================================

/**
 * Comprehensive library of intent-signaling words and phrases.
 * These indicate evergreen topics, buyer intent, or high-value searches.
 */
const INTENT_ANCHORS: Record<IntentCategory, string[]> = {
  // LEARNING (Evergreen - people always want to learn)
  learning: [
    'how to', 'how do', 'how can', 'how does', 'how is',
    'tutorial', 'tutorials',
    'guide', 'guides', 
    'learn', 'learning',
    'beginner', 'beginners', "beginner's",
    'basics', 'basic',
    'introduction', 'intro', 'introduce',
    'explained', 'explanation', 'explaining',
    'tips', 'tip',
    'tricks', 'trick',
    'course', 'class',
    'lesson', 'lessons',
    'step by step', 'steps',
    'for beginners', 'for dummies',
    'made easy', 'made simple',
    'complete guide', 'ultimate guide',
    'everything you need',
    'masterclass', 'master',
    'training', 'train',
  ],

  // BUYER INTENT (High commercial value)
  buyer: [
    'best', 'top', 'top 10', 'top 5',
    'review', 'reviews', 'reviewed',
    'vs', 'versus', 'or',
    'comparison', 'compare', 'compared',
    'worth it', 'worth buying',
    'should i', 'should you',
    'buy', 'buying', 'purchase',
    'cheap', 'affordable', 'budget',
    'premium', 'professional', 'pro',
    'alternative', 'alternatives',
    'recommendation', 'recommendations', 'recommend',
    'honest', 'unbiased',
  ],

  // PROBLEM-SOLVING (High intent - they need help NOW)
  problem: [
    'fix', 'fixed', 'fixing',
    'solve', 'solved', 'solving', 'solution',
    'help', 'helping',
    'issue', 'issues',
    'problem', 'problems',
    'error', 'errors',
    'not working', "doesn't work", "won't work", "cant work",
    'broken', 'broke',
    'stuck', "can't",
    'trouble', 'troubleshoot', 'troubleshooting',
    'why is', 'why does', "why won't", "why can't",
    'stop', 'prevent', 'avoid',
  ],

  // DISCOVERY (Curious - exploring topics)
  discovery: [
    'what is', 'what are', 'what does',
    'meaning', 'definition', 'define',
    'difference between', 'difference',
    'why do', 'why does', 'why is',
    'who is', 'who are',
    'when to', 'when should',
    'where to', 'where can',
    'which', 'which is better',
    'explain', 'understand', 'understanding',
  ],

  // ACTION-READY (Ready to do something)
  action: [
    'start', 'starting', 'get started', 'getting started',
    'create', 'creating', 'creation',
    'make', 'making',
    'build', 'building',
    'setup', 'set up', 'setting up',
    'install', 'installing', 'installation',
    'download', 'downloading',
    'use', 'using', 'how to use',
    'grow', 'growing', 'growth',
    'improve', 'improving', 'improvement',
    'increase', 'boost', 'maximize',
    'optimize', 'optimizing',
  ],

  // CURRENT/TIMELY (Signals freshness interest)
  current: [
    'new', 'latest', 'newest',
    'update', 'updated', 'updates',
    '2024', '2025', '2026',
    'now', 'today',
    'still', 'anymore',
    'recently', 'recent',
  ],

  // SPECIFICITY (Long-tail signals - platform/context specific)
  specific: [
    'for youtube', 'on youtube', 'youtube',
    'for instagram', 'on instagram', 'instagram',
    'for tiktok', 'on tiktok', 'tiktok',
    'for facebook', 'on facebook',
    'for beginners', 'for experts', 'for pros',
    'at home', 'from home',
    'without', 'with no',
    'free', 'paid',
    'fast', 'quick', 'quickly',
    'easy', 'simple', 'easily', 'simply',
    'online', 'offline',
    'mobile', 'desktop',
    'first time', 'first',
  ],
};

// Boost values for each intent category
const INTENT_BOOSTS: Record<IntentCategory, number> = {
  learning: 8,    // Evergreen, high value
  buyer: 6,       // Commercial intent
  problem: 7,     // Urgent need
  discovery: 4,   // Curious but lower intent
  action: 6,      // Ready to act
  current: 3,     // Time-sensitive
  specific: 5,    // Long-tail specificity
};

/**
 * Detect intent anchors in a phrase
 */
function detectIntentAnchors(phrase: string): IntentMatch[] {
  const phraseLower = phrase.toLowerCase();
  const matches: IntentMatch[] = [];
  const seenCategories = new Set<IntentCategory>();
  
  for (const [category, anchors] of Object.entries(INTENT_ANCHORS) as [IntentCategory, string[]][]) {
    for (const anchor of anchors) {
      if (phraseLower.includes(anchor) && !seenCategories.has(category)) {
        matches.push({
          category,
          anchor,
          boost: INTENT_BOOSTS[category],
        });
        seenCategories.add(category);
        break; // Only one match per category
      }
    }
  }
  
  return matches;
}

/**
 * Check if phrase has evergreen intent (learning, problem-solving, discovery)
 */
function hasEvergreenIntent(intentMatches: IntentMatch[]): boolean {
  const evergreenCategories: IntentCategory[] = ['learning', 'problem', 'discovery', 'action'];
  return intentMatches.some(m => evergreenCategories.includes(m.category));
}

// =============================================================================
// WORD COUNT MULTIPLIER
// =============================================================================

/**
 * Get word count multiplier for scoring.
 * Sweet spot is 5-6 words. Shorter is easier to rank but more competitive.
 * Longer is less competitive but may have less search volume.
 */
function getWordCountMultiplier(wordCount: number): number {
  switch (wordCount) {
    case 1: return 0.7;
    case 2: return 0.8;
    case 3: return 0.9;
    case 4: return 1.0;
    case 5: return 1.1;  // Sweet spot
    case 6: return 1.1;  // Sweet spot
    case 7: return 1.0;
    case 8: return 0.95;
    default: return wordCount > 8 ? 0.9 : 0.7;
  }
}

/**
 * Get long-tail bonus for opportunity scoring.
 * Longer phrases have less competition.
 */
function getLongTailBonus(wordCount: number): number {
  switch (wordCount) {
    case 1: return 0;
    case 2: return 0;
    case 3: return 5;
    case 4: return 12;
    case 5: return 20;   // Sweet spot
    case 6: return 22;   // Sweet spot
    case 7: return 18;
    case 8: return 15;
    default: return wordCount > 8 ? 12 : 0;
  }
}

// =============================================================================
// DUAL SCORING SYSTEM
// =============================================================================

interface DemandScoreResult {
  score: number;
  label: string;
  breakdown: {
    suggestionBase: number;
    wordCountAdjusted: number;
    topicMatchBonus: number;
    exactMatchBonus: number;
    intentBonus: number;
  };
}

/**
 * Calculate DEMAND score (0-100)
 * "How many people are searching for this?"
 */
function calculateDemandScore(
  suggestionCount: number,
  exactMatchCount: number,
  topicMatchCount: number,
  wordCount: number,
  intentMatches: IntentMatch[]
): DemandScoreResult {
  // Suggestion Base (0-50 points)
  // Scale: 14 suggestions = 50 points, 7 = 25, 0 = 0
  const suggestionBase = Math.min(50, Math.round((suggestionCount / 14) * 50));
  
  // Word count multiplier (adjusts expectations)
  const wcMultiplier = getWordCountMultiplier(wordCount);
  const wordCountAdjusted = Math.round(suggestionBase * wcMultiplier);
  
  // Topic Match Bonus (0-15 points)
  // High topic match % means related searches exist
  const topicPercent = suggestionCount > 0 ? topicMatchCount / suggestionCount : 0;
  const topicMatchBonus = Math.min(15, Math.round(topicPercent * 15));
  
  // Exact Match Bonus (0-25 points)
  // Exact matches are direct evidence of demand
  // Multiplier increased from 2 to 3 to better reward high exact match counts
  const exactMatchBonus = Math.min(25, exactMatchCount * 3);
  
  // Intent Anchor Bonus (0-10 points)
  // Sum of detected intent boosts, capped
  const intentBonus = Math.min(10, intentMatches.reduce((sum, m) => sum + m.boost, 0));
  
  // Calculate total
  const rawScore = wordCountAdjusted + topicMatchBonus + exactMatchBonus + intentBonus;
  const score = Math.max(0, Math.min(100, rawScore));
  
  // Determine label (recalibrated to be more conservative)
  let label: string;
  if (score >= 95) label = 'Extreme Demand';
  else if (score >= 85) label = 'Very High Demand';
  else if (score >= 77) label = 'High Demand';
  else if (score >= 67) label = 'Strong Demand';
  else if (score >= 57) label = 'Good Demand';
  else if (score >= 47) label = 'Moderate Demand';
  else if (score >= 37) label = 'Some Interest';
  else label = 'Limited Interest';
  
  return {
    score,
    label,
    breakdown: {
      suggestionBase,
      wordCountAdjusted,
      topicMatchBonus,
      exactMatchBonus,
      intentBonus,
    },
  };
}

interface OpportunityScoreResult {
  score: number;
  label: string;
  isSuperTopic: boolean;
  breakdown: {
    lowCompSignal: number;
    longTailBonus: number;
    evergreenIntent: number;
    demandValidation: number;
  };
}

/**
 * Calculate OPPORTUNITY score (0-100)
 * "Is this a good phrase to target?"
 */
function calculateOpportunityScore(
  suggestionCount: number,
  exactMatchCount: number,
  exactMatchPercent: number,
  wordCount: number,
  intentMatches: IntentMatch[],
  demandScore: number
): OpportunityScoreResult {
  // Low Competition Signal (0-35 points)
  // Lower exact match % = less competition = higher opportunity
  let lowCompSignal: number;
  if (exactMatchPercent === 0) lowCompSignal = 35;
  else if (exactMatchPercent <= 15) lowCompSignal = 30;
  else if (exactMatchPercent <= 30) lowCompSignal = 22;
  else if (exactMatchPercent <= 50) lowCompSignal = 15;
  else if (exactMatchPercent <= 70) lowCompSignal = 8;
  else lowCompSignal = 3;
  
  // Long-Tail Bonus (0-22 points)
  const longTailBonus = getLongTailBonus(wordCount);
  
  // Evergreen Intent Bonus (0-25 points)
  // Phrases with learning/problem intent have long-term value
  let evergreenIntent = 0;
  for (const match of intentMatches) {
    if (match.category === 'learning') evergreenIntent += 14;
    else if (match.category === 'problem') evergreenIntent += 12;
    else if (match.category === 'action') evergreenIntent += 10;
    else if (match.category === 'discovery') evergreenIntent += 8;
    else if (match.category === 'specific') evergreenIntent += 6;
    else if (match.category === 'buyer') evergreenIntent += 5;
  }
  evergreenIntent = Math.min(25, evergreenIntent);
  
  // Demand Validation (0-15 points)
  // Only an opportunity if there's actual demand
  let demandValidation: number;
  if (suggestionCount >= 12) demandValidation = 15;
  else if (suggestionCount >= 10) demandValidation = 13;
  else if (suggestionCount >= 8) demandValidation = 11;
  else if (suggestionCount >= 6) demandValidation = 8;
  else if (suggestionCount >= 4) demandValidation = 5;
  else demandValidation = 2;
  
  // Calculate total
  const rawScore = lowCompSignal + longTailBonus + evergreenIntent + demandValidation;
  const score = Math.max(0, Math.min(100, rawScore));
  
  // SuperTopic: Demand ≥ 50 AND Opportunity ≥ 90
  const isSuperTopic = demandScore >= 50 && score >= 90;
  
  // Determine label
  let label: string;
  if (isSuperTopic) label = 'SuperTopic';
  else if (score >= 85) label = 'Excellent Opportunity';
  else if (score >= 75) label = 'Great Opportunity';
  else if (score >= 65) label = 'Good Opportunity';
  else if (score >= 55) label = 'Decent Opportunity';
  else if (score >= 45) label = 'Moderate Opportunity';
  else if (score >= 35) label = 'Limited Opportunity';
  else label = 'Weak Opportunity';
  
  return {
    score,
    label,
    isSuperTopic,
    breakdown: {
      lowCompSignal,
      longTailBonus,
      evergreenIntent,
      demandValidation,
    },
  };
}

// =============================================================================
// TRAFFIC LIGHT SIGNAL SYSTEM (derived from dual scores)
// =============================================================================

interface SignalConfig {
  label: string;
  color: string;
  icon: string;
}

const SIGNAL_CONFIG: Record<SignalLevel, SignalConfig> = {
  'go': { label: 'Go', color: '#2BD899', icon: '🟢' },
  'caution': { label: 'Caution', color: '#F59E0B', icon: '🟡' },
  'stop': { label: 'Stop', color: '#FF6B6B', icon: '🔴' },
};

/**
 * Derive signal from demand and opportunity scores
 * Viewer-focused language - no "rank" terminology
 */
function getSignalFromDualScores(demandScore: number, opportunityScore: number): { level: SignalLevel; message: string } {
  const avgScore = (demandScore + opportunityScore) / 2;

  if (opportunityScore >= 90 && demandScore >= 50) {
    return { level: 'go', message: 'SuperTopic detected! Strong demand with excellent opportunity. This phrase has long-term potential.' };
  } else if (avgScore >= 65) {
    return { level: 'go', message: 'Good signal. Solid viewer interest with room to grow. Worth pursuing.' };
  } else if (avgScore >= 45) {
    return { level: 'caution', message: 'Moderate signal. Some interest detected but verify on YouTube before committing.' };
  } else if (avgScore >= 30) {
    return { level: 'caution', message: 'Limited signal. Consider refining or drilling into more specific variations.' };
  } else {
    return { level: 'stop', message: 'Weak signal. Very limited demand or opportunity. Try a different angle.' };
  }
}

// Legacy function for backward compatibility
function calculateSignalScore(exactMatchCount: number, topicMatchCount: number, suggestionCount?: number): number {
  const total = suggestionCount ?? 0;
  if (total === 0) return 0;
  const topicOnlyCount = Math.max(0, topicMatchCount - exactMatchCount);
  const rawScore = (exactMatchCount * 3) + (topicOnlyCount * 1);
  const normalizedScore = Math.round((rawScore / 42) * 100);
  return Math.max(0, Math.min(100, normalizedScore));
}

// Legacy function - now derived from dual scores
function getSignalFromScore(score: number): { level: SignalLevel; message: string } {
  if (score >= 71) {
    return { level: 'go', message: 'Strong demand signal. Check competition on YouTube to confirm ranking potential.' };
  } else if (score >= 50) {
    return { level: 'go', message: 'Good demand signal. Solid viewer interest. Worth pursuing.' };
  } else if (score >= 29) {
    return { level: 'caution', message: 'Moderate interest. Check YouTube manually.' };
  } else if (score >= 14) {
    return { level: 'caution', message: 'Limited interest detected.' };
  } else {
    return { level: 'stop', message: 'Weak signal. Consider a different angle.' };
  }
}

// =============================================================================
// TEMPLATE-BASED MESSAGE SYSTEM
// =============================================================================

/**
 * Build a rich, contextual message by combining template sentences.
 * Uses BOTH demandScore AND opportunityScore to generate accurate messages.
 */
function buildSignalMessage(
  demandScore: number,
  opportunityScore: number,
  suggestionCount: number,
  wordCount: number,
  hasEvergreenIntent: boolean,
  isSuperTopic: boolean,
  exactMatchPercent: number,
  level?: number
): string {
  const sentences: string[] = [];

  // -----------------------------------------------------------------
  // SENTENCE 1: SuperTopic or Demand + Opportunity assessment
  // -----------------------------------------------------------------
  if (isSuperTopic) {
    sentences.push('SuperTopic detected! Viewers are actively looking for this content.');
  } else {
    // Demand sentence
    const demandSentence = getDemandSentence(demandScore);
    sentences.push(demandSentence);

    // Opportunity sentence (only add if different from demand assessment)
    const opportunitySentence = getOpportunitySentence(opportunityScore, demandScore);
    if (opportunitySentence) {
      sentences.push(opportunitySentence);
    }
  }

  // -----------------------------------------------------------------
  // SENTENCE 1.5: Parent inheritance context (Level 2+)
  // Viewer-focused: no "rank" language, focus on discovery
  // -----------------------------------------------------------------
  if (level && level >= 2) {
    if (level === 2) {
      sentences.push('This phrase builds on your parent topic—viewers searching broadly may discover this content too.');
    } else if (level >= 3) {
      sentences.push('This specific phrase connects to broader topics viewers are exploring.');
    }
  }

  // -----------------------------------------------------------------
  // SENTENCE 2: Word count insight (for sweet spot or notable lengths)
  // -----------------------------------------------------------------
  const wordCountSentence = getWordCountSentence(wordCount);
  if (wordCountSentence) {
    sentences.push(wordCountSentence);
  }

  // -----------------------------------------------------------------
  // SENTENCE 3: Suggestion count context (context-aware)
  // -----------------------------------------------------------------
  const suggestionSentence = getSuggestionCountSentence(suggestionCount, level, opportunityScore);
  if (suggestionSentence) {
    sentences.push(suggestionSentence);
  }

  // -----------------------------------------------------------------
  // SENTENCE 4: Long-term potential (evergreen topics)
  // -----------------------------------------------------------------
  if (hasEvergreenIntent && demandScore >= 47) {
    sentences.push('This topic has long-term view potential.');
  }

  // -----------------------------------------------------------------
  // SENTENCE 5: Competition/action recommendation
  // -----------------------------------------------------------------
  const actionSentence = getActionSentence(demandScore, opportunityScore, exactMatchPercent);
  if (actionSentence) {
    sentences.push(actionSentence);
  }

  return sentences.join(' ');
}

/**
 * Get demand assessment sentence based on demandScore (0-100)
 */
function getDemandSentence(demandScore: number): string {
  if (demandScore >= 95) {
    return 'Extreme viewer demand detected.';
  } else if (demandScore >= 85) {
    return 'Very high viewer demand for this topic.';
  } else if (demandScore >= 77) {
    return 'High viewer demand detected.';
  } else if (demandScore >= 67) {
    return 'Strong viewer interest in this topic.';
  } else if (demandScore >= 57) {
    return 'Good viewer demand detected.';
  } else if (demandScore >= 47) {
    return 'Moderate viewer interest.';
  } else if (demandScore >= 37) {
    return 'Some viewer interest detected.';
  } else {
    return 'Limited viewer interest for this phrase.';
  }
}

/**
 * Get opportunity assessment sentence based on opportunityScore (0-100)
 * Returns null if the opportunity aligns with demand (avoid redundancy)
 */
function getOpportunitySentence(opportunityScore: number, demandScore: number): string | null {
  // If opportunity is significantly better than demand suggests
  if (opportunityScore >= 85 && demandScore < 77) {
    return 'Excellent opportunity despite moderate demand.';
  } else if (opportunityScore >= 85) {
    return 'Excellent opportunity to reach viewers.';
  } else if (opportunityScore >= 75) {
    return 'Great opportunity for viewer discovery.';
  } else if (opportunityScore >= 65) {
    return 'Good opportunity to connect with viewers.';
  } else if (opportunityScore >= 55) {
    return 'Decent opportunity, but space may be crowded.';
  } else if (opportunityScore >= 45) {
    return 'Moderate opportunity—check YouTube for similar content.';
  } else {
    // Limited opportunity
    if (demandScore >= 67) {
      return 'High demand but crowded space—many creators covering this.';
    }
    return null; // Don't add redundant "limited" message if demand is also low
  }
}

/**
 * Get word count insight sentence
 * Viewer-focused language - no "rank" terminology
 */
function getWordCountSentence(wordCount: number): string | null {
  if (wordCount === 5 || wordCount === 6) {
    return `This ${wordCount}-word phrase hits the sweet spot for discoverability.`;
  } else if (wordCount >= 7) {
    return `This ${wordCount}-word phrase is highly specific—great for targeted viewers but may have lower volume.`;
  } else if (wordCount <= 2) {
    return `This ${wordCount}-word phrase is broad—high competition expected.`;
  }
  return null; // 3-4 words: no special mention needed
}

/**
 * Get suggestion count context sentence
 * Context-aware: skips "limited data" warning when:
 * - Level 2+ (drill-down context where low suggestions are expected)
 * - High opportunity score (data is meaningful despite low count)
 */
function getSuggestionCountSentence(
  suggestionCount: number,
  level?: number,
  opportunityScore?: number
): string | null {
  if (suggestionCount >= 12) {
    return `${suggestionCount} autocomplete suggestions is a strong signal of viewer interest.`;
  } else if (suggestionCount >= 10) {
    return `${suggestionCount} autocomplete suggestions indicates solid viewer interest.`;
  } else if (suggestionCount >= 8) {
    return `${suggestionCount} suggestions shows good interest.`;
  } else if (suggestionCount >= 5) {
    return `${suggestionCount} suggestions—moderate interest.`;
  } else if (suggestionCount >= 1) {
    // Skip "limited data" warning if:
    // 1. Drill-down context (level 2+) - specific phrases naturally have fewer suggestions
    // 2. Good opportunity (≥65) - the data is meaningful despite low count
    const isContextMeaningful = (level && level >= 2) || (opportunityScore && opportunityScore >= 65);
    if (isContextMeaningful) {
      return `${suggestionCount} suggestion${suggestionCount !== 1 ? 's' : ''} for this specific phrase.`;
    }
    return `Only ${suggestionCount} suggestions found—try a broader phrase for more data.`;
  }
  return null; // No suggestions: let other messages guide the user
}

/**
 * Get action/recommendation sentence
 */
function getActionSentence(demandScore: number, opportunityScore: number, exactMatchPercent: number): string | null {
  // SuperTopic-level: data-focused, not directive
  if (opportunityScore >= 90 && demandScore >= 50) {
    return 'Worth considering for browse and search.';
  }

  // High opportunity: viewers looking + space available
  if (opportunityScore >= 75 && demandScore >= 47) {
    return 'Good potential—check YouTube for similar content.';
  }

  // Low exact match = less crowded
  if (exactMatchPercent < 15 && demandScore >= 47) {
    return 'Low competition signal—good potential for discoverability.';
  }

  // High exact match = crowded space
  if (exactMatchPercent > 50) {
    return 'Crowded space—consider a more specific variation.';
  }

  // Moderate scenario
  if (demandScore >= 37 && opportunityScore >= 45) {
    return 'Check YouTube to see what creators are making.';
  }

  // Low scores: suggest refinement
  if (demandScore < 37 || opportunityScore < 45) {
    return 'Try a different angle or more specific phrase.';
  }

  return null;
}

// LEGACY: Old function kept for reference (now unused)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _legacyGetMessageFromDemandScore(demandScore: number, opportunityScore: number): string {
  if (demandScore >= 95) {
    return 'Extreme viewer demand detected. Excellent opportunity for discovery.';
  } else if (demandScore >= 85) {
    return 'Very high viewer demand. Strong potential for views.';
  } else if (demandScore >= 77) {
    return 'High viewer demand detected. Good opportunity to pursue.';
  } else if (demandScore >= 67) {
    return 'Strong viewer interest. Worth exploring further.';
  } else if (demandScore >= 57) {
    return 'Good viewer demand. Moderate opportunity.';
  } else if (demandScore >= 47) {
    return 'Moderate viewer interest. Check competition manually.';
  } else if (demandScore >= 37) {
    return 'Some viewer interest detected. Consider refining your phrase.';
  } else {
    return 'Limited viewer interest. Try a different angle or broader phrase.';
  }
}

// =============================================================================
// LEGACY DEMAND LEVELS (for backward compatibility)
// =============================================================================

interface DemandConfig {
  label: string;
  color: string;
  icon: string;
}

const DEMAND_LEVELS: Record<DemandLevel, DemandConfig> = {
  'extreme': { label: 'Go', color: '#2BD899', icon: '🟢' },
  'incredible': { label: 'Go', color: '#2BD899', icon: '🟢' },
  'high': { label: 'Go', color: '#2BD899', icon: '🟢' },
  'strong': { label: 'Caution', color: '#F59E0B', icon: '🟡' },
  'solid': { label: 'Caution', color: '#F59E0B', icon: '🟡' },
  'moderate': { label: 'Caution', color: '#F59E0B', icon: '🟡' },
  'low': { label: 'Stop', color: '#FF6B6B', icon: '🔴' },
  'very-low': { label: 'Stop', color: '#FF6B6B', icon: '🔴' },
};

/**
 * Map signal level to legacy demand level for backward compatibility
 * Updated for 0-100 scale (Low Comp Method)
 */
function signalToDemandLevel(signal: SignalLevel, score: number): DemandLevel {
  if (signal === 'go') {
    if (score >= 70) return 'extreme';
    if (score >= 50) return 'high';
    return 'strong';
  } else if (signal === 'caution') {
    if (score >= 35) return 'moderate';
    return 'low';
  }
  return 'very-low';
}

// =============================================================================
// VIBE DETECTION PATTERNS
// =============================================================================

// 🎓 Learning - Want to understand
const LEARNING_PATTERNS = [
  /\bexplained?\b/i,
  /\btutorial\b/i,
  /\bguide\b/i,
  /\bhow\s*to\b/i,
  /\blearn(ing)?\b/i,
  /\bunderstand(ing)?\b/i,
  /\bbasics?\b/i,
  /\b101\b/i,
  /\bfor\s*beginners?\b/i,
  /\bwalkthrough\b/i,
  /\bbreakdown\b/i,
  /\bwhat\s*is\b/i,
  /\bintro(duction)?\b/i,
  /\bcourse\b/i,
  /\bclass\b/i,
  /\bmaster(y|ing|class)?\b/i,
  /\bstep\s*by\s*step\b/i,
  /\bin\s*\d+\s*minutes?\b/i,
];

// 😤 Frustrated - Venting, upset
const FRUSTRATED_PATTERNS = [
  /\bsucks?\b/i,
  /\btrash\b/i,
  /\bgarbage\b/i,
  /\bworst\b/i,
  /\bhate[sd]?\b/i,
  /\bterrible\b/i,
  /\bhorrible\b/i,
  /\bawful\b/i,
  /\bridiculous\b/i,
  /\bstupid\b/i,
  /\bdumb\b/i,
  /\bis\s*(so\s*)?bad\b/i,
  /\bscam\b/i,
  /\bripoff\b/i,
  /\boverrated\b/i,
  /\bdisappoint(ing|ed|ment)?\b/i,
  /\bfrustra(ting|ted|tion)\b/i,
  /\bannoy(ing|ed)?\b/i,
  /\bboring\b/i,
  /\bdead\b/i,
  /\bdying\b/i,
  /\bruined?\b/i,
  /\bkill(ed|ing)?\b/i,
];

// ⏰ Current - Want latest/updated
const CURRENT_PATTERNS = [
  /\b202[4-9]\b/,  // Years 2024-2029
  /\bnew\b/i,
  /\blatest\b/i,
  /\bupdate[sd]?\b/i,
  /\bchange[sd]?\b/i,
  /\bcurrent(ly)?\b/i,
  /\btoday\b/i,
  /\brecent(ly)?\b/i,
  /\bthis\s*(week|month|year)\b/i,
  /\bnow\b/i,
];

// 🔧 Problem-Solving - Need help fixing something
const PROBLEM_PATTERNS = [
  /\bfix(ed|ing|es)?\b/i,
  /\bbroken?\b/i,
  /\bnot\s*working\b/i,
  /\bdoesn'?t\s*work\b/i,
  /\bwon'?t\s*work\b/i,
  /\bproblem[s]?\b/i,
  /\bissue[s]?\b/i,
  /\berror[s]?\b/i,
  /\bbug[s]?\b/i,
  /\bglitch(es|y)?\b/i,
  /\bcrash(ed|ing|es)?\b/i,
  /\bhelp\b/i,
  /\btroubleshoot(ing)?\b/i,
  /\bsolve[sd]?\b/i,
  /\bsolution[s]?\b/i,
];

// 🤔 Curious - Exploring, wondering
const CURIOUS_PATTERNS = [
  /\bwhy\b/i,
  /\bhow\s*does\b/i,
  /\bwhat\s*happens\b/i,
  /\bmeaning\b/i,
  /\bexplain\b/i,
  /\banomal(y|ies)\b/i,
  /\bweird\b/i,
  /\bstrange\b/i,
  /\bmystery\b/i,
  /\bsecret[s]?\b/i,
  /\bhidden\b/i,
  /\bunknown\b/i,
];

// 🎯 Action-Ready - Want to do something
const ACTION_PATTERNS = [
  /\btips?\b/i,
  /\btricks?\b/i,
  /\bhacks?\b/i,
  /\bstrateg(y|ies)\b/i,
  /\btechniques?\b/i,
  /\bways?\b/i,
  /\bstart(ing)?\b/i,
  /\bbegin(ning)?\b/i,
  /\bcreate\b/i,
  /\bbuild(ing)?\b/i,
  /\bmake\b/i,
  /\bgrow(th|ing)?\b/i,
  /\bimprove\b/i,
  /\bboost\b/i,
  /\boptimize\b/i,
  /\bsetup\b/i,
  /\bshorts\b/i,  // YouTube Shorts is action-oriented
];

// ⚖️ Comparing - Evaluating options
const COMPARING_PATTERNS = [
  /\bvs\.?\b/i,
  /\bversus\b/i,
  /\bcompare[sd]?\b/i,
  /\bcomparison\b/i,
  /\bdifference[s]?\b/i,
  /\bbetter\s*than\b/i,
  /\bworse\s*than\b/i,
  /\bor\b/i,
  /\balternative[s]?\b/i,
  /\binstead\b/i,
  /\bwhich\s*(is|one|should)\b/i,
];

// 🏢 Brand - Company/business (not viewer intent)
const BRAND_PATTERNS = [
  /\b(law\s*)?(group|firm|office)\b/i,
  /\blawyer\b/i,
  /\battorney\b/i,
  /\binsurance\b/i,
  /\bcompan(y|ies)\b/i,
  /\bcorp(oration)?\b/i,
  /\binc\b/i,
  /\bllc\b/i,
  /\bltd\b/i,
  /\bservices\b/i,
  /\bsolutions\b/i,
  /\bagency\b/i,
  /\bbank(ing)?\b/i,
  /\brealt(y|or)\b/i,
];

// =============================================================================
// VIBE ICONS & LABELS
// =============================================================================

const VIBE_CONFIG: Record<VibeCategory, { icon: string; label: string }> = {
  'learning': { icon: '✏️', label: 'Want to Learn' },
  'frustrated': { icon: '😤', label: 'Frustrated' },
  'current': { icon: '⏰', label: 'Want Latest' },
  'problem-solving': { icon: '🔧', label: 'Need Help' },
  'curious': { icon: '🤔', label: 'Curious' },
  'action-ready': { icon: '🎯', label: 'Ready to Act' },
  'comparing': { icon: '⚖️', label: 'Comparing' },
  'brand': { icon: '🏢', label: 'Business' },
};

// =============================================================================
// VIBE DETECTION
// =============================================================================

function detectVibe(phrase: string): VibeCategory {
  // Check in priority order (some overlap, so order matters)
  
  // Brand first (to filter out non-viewer intent)
  if (BRAND_PATTERNS.some(p => p.test(phrase))) return 'brand';
  
  // Frustrated is strong signal
  if (FRUSTRATED_PATTERNS.some(p => p.test(phrase))) return 'frustrated';
  
  // Problem-solving
  if (PROBLEM_PATTERNS.some(p => p.test(phrase))) return 'problem-solving';
  
  // Learning
  if (LEARNING_PATTERNS.some(p => p.test(phrase))) return 'learning';
  
  // Current/timely
  if (CURRENT_PATTERNS.some(p => p.test(phrase))) return 'current';
  
  // Curious
  if (CURIOUS_PATTERNS.some(p => p.test(phrase))) return 'curious';
  
  // Action-ready
  if (ACTION_PATTERNS.some(p => p.test(phrase))) return 'action-ready';
  
  // Comparing
  if (COMPARING_PATTERNS.some(p => p.test(phrase))) return 'comparing';
  
  // Default to learning (most common intent)
  return 'learning';
}

// =============================================================================
// INSIGHT MESSAGES
// =============================================================================

function generateInsightWithOpportunity(
  dominantVibe: VibeCategory, 
  dominantPercent: number,
  vibeDistribution: VibeDistribution,
  isOpportunity: boolean,
  exactMatchPercent: number,
  topicMatchPercent: number
): string {
  // OPPORTUNITY: Good weighted score with room to rank
  if (isOpportunity) {
    const vibeMessage = getSimpleVibeMessage(dominantVibe, vibeDistribution);
    return `Good demand with ranking potential. ${vibeMessage} Check competition on YouTube to confirm.`;
  }
  
  // Check for mixed learning + frustrated (common pattern)
  if (vibeDistribution.learning >= 30 && vibeDistribution.frustrated >= 5) {
    return "Most viewers want to learn, but many are frustrated. Consider an educational angle or lean into the frustration.";
  }
  
  // Check for high frustration
  if (vibeDistribution.frustrated >= 30) {
    return "Many viewers are frustrated with this topic. An empathetic approach could connect well.";
  }
  
  // Check for brand pollution
  if (vibeDistribution.brand >= 30) {
    return "Many results are businesses, not viewers. Consider a different angle or more specific phrase.";
  }
  
  // Based on dominant vibe - simple messages without percentages
  return getSimpleVibeMessage(dominantVibe, vibeDistribution);
}

function getSimpleVibeMessage(dominantVibe: VibeCategory, vibeDistribution: VibeDistribution): string {
  switch (dominantVibe) {
    case 'learning':
      return "Viewers want to learn about this topic. Educational content will resonate.";
    
    case 'frustrated':
      return "Viewers are frustrated. An empathetic approach could connect well.";
    
    case 'current':
      return "Viewers want the latest info. Fresh, timely content is key.";
    
    case 'problem-solving':
      return "Viewers need help solving problems. Solution-focused content will connect.";
    
    case 'curious':
      return "Viewers are exploring and wondering. Deep-dive content fits well.";
    
    case 'action-ready':
      return "Viewers are ready to take action. Practical how-to content will resonate.";
    
    case 'comparing':
      return "Viewers are evaluating options. Comparison or review content fits well.";
    
    default:
      return "Mixed viewer intent. You have flexibility in your approach.";
  }
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

// Stop words to filter out when extracting key content words
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
 */
function extractKeyWords(phrase: string): Set<string> {
  const words = phrase.toLowerCase().split(/\s+/);
  const keyWords = new Set<string>();
  
  for (const word of words) {
    // Clean the word (remove punctuation)
    const cleaned = word.replace(/[^a-z0-9]/g, '');
    if (cleaned.length >= 2 && !STOP_WORDS.has(cleaned)) {
      keyWords.add(cleaned);
    }
  }
  
  return keyWords;
}

/**
 * Check if a suggestion is a topic match (shares 2+ key words with seed)
 */
function isTopicMatch(seedKeyWords: Set<string>, suggestion: string): boolean {
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
 * Generate YouTube search URL for a phrase
 */
function getYouTubeSearchUrl(phrase: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(phrase)}`;
}

// Anchor words to extract from suggestions (signal words that reveal intent)
// Note: Years are handled dynamically to filter out past years
const ANCHOR_WORDS_BASE = [
  // Frustrated
  'sucks', 'trash', 'broken', 'dead', 'dying', 'worst', 'bad', 'terrible', 'awful', 'hate', 'ruined',
  // Learning
  'explained', 'tutorial', 'guide', 'how', 'learn', 'basics', 'beginners', 'course', 'tips',
  // Current (years handled separately)
  'new', 'latest', 'update', 'change', 'changed',
  // Problem
  'fix', 'problem', 'issue', 'error', 'help', 'not working',
  // Curious
  'why', 'what', 'how does', 'meaning', 'secret', 'hidden',
  // Action
  'start', 'create', 'make', 'build', 'grow', 'boost',
];

/**
 * Check if a word is a year and if it's current or future
 */
function isCurrentOrFutureYear(word: string): boolean {
  const yearMatch = word.match(/^(20\d{2})$/);
  if (!yearMatch) return false;
  const year = parseInt(yearMatch[1], 10);
  const currentYear = new Date().getFullYear();
  return year >= currentYear;
}

function extractAnchorWords(suggestions: string[], seed: string): string[] {
  const seedWords = seed.toLowerCase().split(/\s+/);
  const found = new Set<string>();
  
  for (const suggestion of suggestions) {
    const words = suggestion.toLowerCase().split(/\s+/);
    for (const word of words) {
      // Skip if it's part of the seed
      if (seedWords.includes(word)) continue;
      // Check if it's a current/future year
      if (isCurrentOrFutureYear(word)) {
        found.add(word);
        continue;
      }
      // Check if it's an anchor word
      if (ANCHOR_WORDS_BASE.includes(word)) {
        found.add(word);
      }
    }
  }
  
  return Array.from(found).slice(0, 8); // Max 8 anchor words
}

export function analyzeViewerLandscape(
  seed: string,
  suggestions: string[],
  parentDemandScore?: number,
  level?: number
): ViewerLandscape {
  const seedLower = seed.toLowerCase().trim();
  
  // IMPORTANT: Filter out the seed phrase itself from suggestions
  // Apify often returns the seed as suggestion #1, which inflates exact match count
  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().trim() !== seedLower
  );
  const count = filteredSuggestions.length;
  
  // Extract key words from seed for topic matching
  const seedKeyWords = extractKeyWords(seed);
  
  // Count exact matches: suggestions that START WITH the exact seed phrase
  // e.g., "video topics" → "video topics for youtube" ✓ but NOT "japan video topics" ✗
  let exactMatchCount = 0;
  for (const suggestion of filteredSuggestions) {
    if (suggestion.toLowerCase().startsWith(seedLower)) {
      exactMatchCount++;
    }
  }
  const exactMatchPercent = count > 0 ? Math.round((exactMatchCount / count) * 100) : 0;

  // Count topic matches (suggestions about the same topic - share key words)
  let topicMatchCount = 0;
  for (const suggestion of filteredSuggestions) {
    if (isTopicMatch(seedKeyWords, suggestion)) {
      topicMatchCount++;
    }
  }

  // Calculate topic-only matches (exclude exact matches to get complementary percentages)
  const topicOnlyCount = Math.max(0, topicMatchCount - exactMatchCount);
  // Topic Match % should show only non-exact matches, so exact + topic = 100% (or less)
  const topicMatchPercent = count > 0 ? Math.round((topicOnlyCount / count) * 100) : 0;
  const rawWeightedScore = (exactMatchCount * 3) + (topicOnlyCount * 1);
  
  // Is this an opportunity? 
  // Need: Good weighted score (18+ raw = decent demand) + room to rank (not all exact matches)
  // The "opportunity" is when there's demand but YOU can still rank for it
  const isOpportunity = rawWeightedScore >= 18 && exactMatchPercent < 50 && exactMatchPercent > 0 && count >= 8;
  
  // Low competition signal - valid when:
  // 1. Very low exact match (< 10%) with decent suggestions (8+) - IDEAL for ranking
  // 2. OR good weighted score (12+) with moderate exact match (< 40%) and decent suggestions (8+)
  const isLowCompetition = (count >= 8 && exactMatchPercent < 10) || (rawWeightedScore >= 12 && exactMatchPercent < 40 && count >= 8);
  const competitionLabel = isLowCompetition ? 'Low Competition Signal' : null;
  
  // Generate YouTube search URL
  const youtubeSearchUrl = getYouTubeSearchUrl(seed);
  
  // Extract anchor words (use filtered suggestions)
  const anchorWords = extractAnchorWords(filteredSuggestions, seed);
  
  // Analyze each suggestion with position weighting (use filtered suggestions)
  const rankedSuggestions: RankedSuggestion[] = filteredSuggestions.map((phrase, index) => {
    const position = index + 1;
    const vibe = detectVibe(phrase);
    return {
      position,
      phrase,
      vibe,
      vibeIcon: VIBE_CONFIG[vibe].icon,
      weight: getPositionWeight(position),
    };
  });
  
  // Calculate weighted vibe distribution
  const vibeDistribution: VibeDistribution = {
    learning: 0,
    frustrated: 0,
    current: 0,
    problemSolving: 0,
    curious: 0,
    actionReady: 0,
    comparing: 0,
    brand: 0,
  };
  
  let totalWeight = 0;
  for (const rs of rankedSuggestions) {
    totalWeight += rs.weight;
    switch (rs.vibe) {
      case 'learning': vibeDistribution.learning += rs.weight; break;
      case 'frustrated': vibeDistribution.frustrated += rs.weight; break;
      case 'current': vibeDistribution.current += rs.weight; break;
      case 'problem-solving': vibeDistribution.problemSolving += rs.weight; break;
      case 'curious': vibeDistribution.curious += rs.weight; break;
      case 'action-ready': vibeDistribution.actionReady += rs.weight; break;
      case 'comparing': vibeDistribution.comparing += rs.weight; break;
      case 'brand': vibeDistribution.brand += rs.weight; break;
    }
  }
  
  // Normalize to percentages
  if (totalWeight > 0) {
    vibeDistribution.learning = Math.round((vibeDistribution.learning / totalWeight) * 100);
    vibeDistribution.frustrated = Math.round((vibeDistribution.frustrated / totalWeight) * 100);
    vibeDistribution.current = Math.round((vibeDistribution.current / totalWeight) * 100);
    vibeDistribution.problemSolving = Math.round((vibeDistribution.problemSolving / totalWeight) * 100);
    vibeDistribution.curious = Math.round((vibeDistribution.curious / totalWeight) * 100);
    vibeDistribution.actionReady = Math.round((vibeDistribution.actionReady / totalWeight) * 100);
    vibeDistribution.comparing = Math.round((vibeDistribution.comparing / totalWeight) * 100);
    vibeDistribution.brand = Math.round((vibeDistribution.brand / totalWeight) * 100);
  }
  
  // Find dominant vibe
  let dominantVibe: VibeCategory = 'learning';
  let dominantVibePercent = 0;
  
  const vibeEntries: [VibeCategory, number][] = [
    ['learning', vibeDistribution.learning],
    ['frustrated', vibeDistribution.frustrated],
    ['current', vibeDistribution.current],
    ['problem-solving', vibeDistribution.problemSolving],
    ['curious', vibeDistribution.curious],
    ['action-ready', vibeDistribution.actionReady],
    ['comparing', vibeDistribution.comparing],
    ['brand', vibeDistribution.brand],
  ];
  
  for (const [vibe, percent] of vibeEntries) {
    if (percent > dominantVibePercent) {
      dominantVibe = vibe;
      dominantVibePercent = percent;
    }
  }
  
  // Calculate signal score using Low Comp Discovery Method (legacy)
  const signalScore = calculateSignalScore(exactMatchCount, topicMatchCount, count);
  const { level: signal, message: signalMessage } = getSignalFromScore(signalScore);
  const signalConfig = SIGNAL_CONFIG[signal];
  
  // Map signal to legacy demand level for backward compatibility
  const demandLevel = signalToDemandLevel(signal, signalScore);
  const demandConfig = DEMAND_LEVELS[demandLevel];
  
  // Build demand label (now uses signal label) - legacy
  const legacyDemandLabel = signalConfig.label;
  
  // =========================================================================
  // NEW DUAL SCORING SYSTEM
  // =========================================================================
  
  // Calculate word count for multipliers
  const wordCount = seed.split(/\s+/).filter(Boolean).length;
  
  // Detect intent anchors in the seed phrase
  const intentMatches = detectIntentAnchors(seed);
  const evergreenIntent = hasEvergreenIntent(intentMatches);
  
  // Calculate Demand Score (0-100) - based on suggestion count + word count multiplier
  const demandResult = calculateDemandScore(
    count,
    exactMatchCount,
    topicMatchCount,
    wordCount,
    intentMatches
  );
  let demandScore = demandResult.score;
  let demandLabel = demandResult.label;

  // PARENT DEMAND INHERITANCE (Level 2+)
  // Child phrases inherit some of their parent's demand potential
  // Rationale: If a video ranks for "youtube video editing tips and tricks" (Level 3),
  // it will also rank for "youtube video editing tips" (Level 2) and "youtube video editing" (Level 1)
  if (parentDemandScore !== undefined && level !== undefined && level >= 2) {
    // Inheritance multiplier: decreases with depth
    // Level 2: 20% of parent demand
    // Level 3: 15% of parent demand
    // Level 4+: 10% of parent demand
    let inheritanceMultiplier: number;
    if (level === 2) inheritanceMultiplier = 0.20;
    else if (level === 3) inheritanceMultiplier = 0.15;
    else inheritanceMultiplier = 0.10;

    const inheritedBonus = Math.round(parentDemandScore * inheritanceMultiplier);
    const oldScore = demandScore;
    demandScore = Math.min(100, demandScore + inheritedBonus);

    console.log(`[Demand Inheritance] Level ${level}: Base ${oldScore} + Inherited ${inheritedBonus} (${Math.round(inheritanceMultiplier * 100)}% of parent ${parentDemandScore}) = ${demandScore}`);

    // Update label based on new score
    if (demandScore >= 95) demandLabel = 'Extreme Demand';
    else if (demandScore >= 85) demandLabel = 'Very High Demand';
    else if (demandScore >= 77) demandLabel = 'High Demand';
    else if (demandScore >= 67) demandLabel = 'Strong Demand';
    else if (demandScore >= 57) demandLabel = 'Good Demand';
    else if (demandScore >= 47) demandLabel = 'Moderate Demand';
    else if (demandScore >= 37) demandLabel = 'Some Interest';
    else demandLabel = 'Limited Interest';
  }
  
  // Calculate Opportunity Score (0-100) - combines low comp + long-tail + intent signals
  const opportunityResult = calculateOpportunityScore(
    count,
    exactMatchCount,
    exactMatchPercent,
    wordCount,
    intentMatches,
    demandScore
  );
  const opportunityScore = opportunityResult.score;
  const opportunityLabel = opportunityResult.label;
  const isSuperTopic = opportunityResult.isSuperTopic;

  // Generate NEW message using template-based system (replaces legacy signalMessage)
  const newSignalMessage = buildSignalMessage(
    demandScore,
    opportunityScore,
    count,
    wordCount,
    evergreenIntent,
    isSuperTopic,
    exactMatchPercent,
    level // Pass level for depth-aware messaging
  );

  // Generate insight - now considers opportunity
  const insight = generateInsightWithOpportunity(
    dominantVibe,
    dominantVibePercent,
    vibeDistribution,
    isOpportunity,
    exactMatchPercent,
    topicMatchPercent
  );

  return {
    seed,

    // =========================================================================
    // NEW DUAL SCORING SYSTEM (Primary Display)
    // =========================================================================
    demandScore,
    demandLabel,
    opportunityScore,
    opportunityLabel,
    isSuperTopic,

    // Intent anchors detected in seed phrase
    intentMatches,
    hasEvergreenIntent: evergreenIntent,

    // Traffic Light Signal (legacy system)
    signal,
    signalLabel: signalConfig.label,
    signalMessage: newSignalMessage,
    signalColor: signalConfig.color,
    signalIcon: signalConfig.icon,
    signalScore,
    
    // Legacy demand fields (mapped from signal)
    demandLevel,
    legacyDemandLabel,
    demandColor: signalConfig.color,
    demandIcon: signalConfig.icon,
    suggestionCount: count,
    
    // Competition
    isLowCompetition,
    competitionLabel,
    
    // Exact Match
    exactMatchCount,
    exactMatchPercent,
    
    // Topic Match
    topicMatchCount,
    topicMatchPercent,
    
    // Opportunity flag
    isOpportunity,
    
    // Ranked suggestions - all of them and top 14 for display
    rankedSuggestions,
    topFive: rankedSuggestions.slice(0, 5),
    topFourteen: rankedSuggestions.slice(0, 14),
    
    // Anchor words
    anchorWords,
    
    // Vibe distribution
    vibeDistribution,
    dominantVibe,
    dominantVibePercent,
    dominantVibeLabel: VIBE_CONFIG[dominantVibe].label,
    
    // Insight
    insight,
    
    // YouTube search URL
    youtubeSearchUrl,
    
    // Raw data (filtered - excludes the seed phrase itself)
    suggestions: filteredSuggestions,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function getVibeIcon(vibe: VibeCategory): string {
  return VIBE_CONFIG[vibe].icon;
}

export function getVibeLabel(vibe: VibeCategory): string {
  return VIBE_CONFIG[vibe].label;
}

// Signal-based color classes (new system)
export function getSignalColorClass(signal: SignalLevel): string {
  switch (signal) {
    case 'go':
      return 'text-[#2BD899]';
    case 'caution':
      return 'text-[#F59E0B]';
    case 'stop':
      return 'text-[#FF6B6B]';
  }
}

export function getSignalBgClass(signal: SignalLevel): string {
  switch (signal) {
    case 'go':
      return 'bg-[#2BD899]/10 border-[#2BD899]/30';
    case 'caution':
      return 'bg-[#F59E0B]/10 border-[#F59E0B]/30';
    case 'stop':
      return 'bg-[#FF6B6B]/10 border-[#FF6B6B]/30';
  }
}

// Legacy demand-based classes (for backward compatibility)
export function getDemandColorClass(level: DemandLevel): string {
  switch (level) {
    case 'extreme':
    case 'incredible':
    case 'high':
    case 'strong':
      return 'text-[#2BD899]';
    case 'solid':
    case 'moderate':
      return 'text-[#F59E0B]';
    case 'low':
    case 'very-low':
      return 'text-[#FF6B6B]';
  }
}

export function getDemandBgClass(level: DemandLevel): string {
  switch (level) {
    case 'extreme':
    case 'incredible':
    case 'high':
    case 'strong':
      return 'bg-[#2BD899]/10 border-[#2BD899]/30';
    case 'solid':
    case 'moderate':
      return 'bg-[#F59E0B]/10 border-[#F59E0B]/30';
    case 'low':
    case 'very-low':
      return 'bg-[#FF6B6B]/10 border-[#FF6B6B]/30';
  }
}

export function getVibeColorClass(vibe: VibeCategory): string {
  switch (vibe) {
    case 'learning':
      return 'text-[#6B9BD1]';
    case 'frustrated':
      return 'text-[#F59E0B]';
    case 'current':
      return 'text-[#2BD899]';
    case 'problem-solving':
      return 'text-[#FF8A3D]';
    case 'curious':
      return 'text-[#9B7DFF]';
    case 'action-ready':
      return 'text-[#2BD899]';
    case 'comparing':
      return 'text-[#6B9BD1]';
    case 'brand':
      return 'text-[#A6B0C2]';
  }
}

export function getVibeBgClass(vibe: VibeCategory): string {
  switch (vibe) {
    case 'learning':
      return 'bg-[#6B9BD1]';  // Solid color for progress bars
    case 'frustrated':
      return 'bg-[#F59E0B]';
    case 'current':
      return 'bg-[#2BD899]';
    case 'problem-solving':
      return 'bg-[#FF8A3D]';
    case 'curious':
      return 'bg-[#9B7DFF]';
    case 'action-ready':
      return 'bg-[#2BD899]';
    case 'comparing':
      return 'bg-[#6B9BD1]';
    case 'brand':
      return 'bg-[#A6B0C2]';
  }
}
