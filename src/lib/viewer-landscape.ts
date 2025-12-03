/**
 * Viewer Landscape Analysis
 * 
 * Provides comprehensive analysis of a seed phrase including:
 * - Traffic Light Signal (Go/Caution/Stop based on point system)
 * - Seed Strength (how many match the exact seed)
 * - Viewer Vibe (emotional landscape weighted by position)
 * 
 * Point System:
 * - Exact Match: 2 points each
 * - Topic Match: 1 point each
 * - Max score: 42 points (14×2 + 14×1)
 * 
 * Position weighting for vibes: #1 gets 10x the searches of #3
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

export interface ViewerLandscape {
  seed: string;
  
  // Traffic Light Signal (new system)
  signal: SignalLevel;
  signalLabel: string;
  signalMessage: string;
  signalColor: string;
  signalIcon: string;
  signalScore: number;  // 0-42 points
  
  // Legacy demand fields (mapped from signal for backward compatibility)
  demandLevel: DemandLevel;
  demandLabel: string;
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
// TRAFFIC LIGHT SIGNAL SYSTEM
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
 * Calculate signal score: (exactMatch × 2) + (topicMatch × 1)
 * Max score = 42 (14×2 + 14×1)
 */
function calculateSignalScore(exactMatchCount: number, topicMatchCount: number): number {
  return (exactMatchCount * 2) + topicMatchCount;
}

/**
 * Get signal level and message based on score
 */
function getSignalFromScore(score: number): { level: SignalLevel; message: string } {
  if (score >= 35) {
    return { level: 'go', message: 'Outstanding. Viewers are highly interested in this topic.' };
  } else if (score >= 28) {
    return { level: 'go', message: 'Strong topic with solid viewer interest.' };
  } else if (score >= 20) {
    return { level: 'go', message: 'Good topic. Viewers are interested.' };
  } else if (score >= 12) {
    return { level: 'caution', message: 'Some interest exists. Consider refining your angle.' };
  } else if (score >= 5) {
    return { level: 'caution', message: 'Limited interest. This may be too niche.' };
  } else {
    return { level: 'stop', message: 'Very low interest. Reconsider this topic.' };
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
 */
function signalToDemandLevel(signal: SignalLevel, score: number): DemandLevel {
  if (signal === 'go') {
    if (score >= 35) return 'extreme';
    if (score >= 28) return 'high';
    return 'strong';
  } else if (signal === 'caution') {
    if (score >= 12) return 'moderate';
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
  // OPPORTUNITY: Low exact match + high topic match
  if (isOpportunity) {
    const vibeMessage = getSimpleVibeMessage(dominantVibe, vibeDistribution);
    return `This could be an excellent opportunity. High topic interest with low phrase competition. ${vibeMessage} Check competition to confirm.`;
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
  suggestions: string[]
): ViewerLandscape {
  const seedLower = seed.toLowerCase().trim();
  const count = suggestions.length;
  
  // Extract key words from seed for topic matching
  const seedKeyWords = extractKeyWords(seed);
  
  // Count exact matches (suggestions that start with exact seed)
  let exactMatchCount = 0;
  for (const suggestion of suggestions) {
    if (suggestion.toLowerCase().startsWith(seedLower)) {
      exactMatchCount++;
    }
  }
  const exactMatchPercent = count > 0 ? Math.round((exactMatchCount / count) * 100) : 0;
  
  // Count topic matches (suggestions about the same topic)
  let topicMatchCount = 0;
  for (const suggestion of suggestions) {
    if (isTopicMatch(seedKeyWords, suggestion)) {
      topicMatchCount++;
    }
  }
  const topicMatchPercent = count > 0 ? Math.round((topicMatchCount / count) * 100) : 0;
  
  // Is this an opportunity? Low exact match + high topic match
  const isOpportunity = exactMatchPercent < 30 && topicMatchPercent >= 60 && count >= 5;
  
  // Competition signal
  const isLowCompetition = exactMatchPercent < 30 && count >= 5;
  const competitionLabel = isLowCompetition ? 'Potential Low Competition' : null;
  
  // Generate YouTube search URL
  const youtubeSearchUrl = getYouTubeSearchUrl(seed);
  
  // Extract anchor words
  const anchorWords = extractAnchorWords(suggestions, seed);
  
  // Analyze each suggestion with position weighting
  const rankedSuggestions: RankedSuggestion[] = suggestions.map((phrase, index) => {
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
  
  // Calculate signal score using point system
  const signalScore = calculateSignalScore(exactMatchCount, topicMatchCount);
  const { level: signal, message: signalMessage } = getSignalFromScore(signalScore);
  const signalConfig = SIGNAL_CONFIG[signal];
  
  // Map signal to legacy demand level for backward compatibility
  const demandLevel = signalToDemandLevel(signal, signalScore);
  const demandConfig = DEMAND_LEVELS[demandLevel];
  
  // Build demand label (now uses signal label)
  const demandLabel = signalConfig.label;
  
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
    
    // Traffic Light Signal (new system)
    signal,
    signalLabel: signalConfig.label,
    signalMessage,
    signalColor: signalConfig.color,
    signalIcon: signalConfig.icon,
    signalScore,
    
    // Legacy demand fields (mapped from signal)
    demandLevel,
    demandLabel,
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
    
    // Ranked suggestions - top 5
    rankedSuggestions,
    topFive: rankedSuggestions.slice(0, 5),
    
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
    
    // Raw data
    suggestions,
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
