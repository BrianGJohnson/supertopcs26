/**
 * Seed Signal Validator
 * 
 * Provides instant validation of seed phrase popularity by checking
 * YouTube autocomplete response volume AND quality.
 * 
 * The insight: Not all suggestions are equal. We need to distinguish:
 * - Topic suggestions (viewer intent): "legacy planning tips", "how to legacy plan"
 * - Brand/company pollution: "legacy planning law group", "legacy insurance"
 * 
 * A seed with 10 suggestions but 8 are companies = WEAK signal
 * A seed with 6 suggestions but all are topics = STRONG signal
 * 
 * @see docs/seed-signal-validation.md for full documentation
 */

// =============================================================================
// TYPES
// =============================================================================

export type SignalStrength = 'strong' | 'moderate' | 'weak' | 'very-weak';

export interface SeedSignal {
  seed: string;
  suggestionCount: number;
  exactMatchCount: number;
  topicMatchCount: number;     // NEW: suggestions that look like video topics
  brandMatchCount: number;     // NEW: suggestions that look like companies/brands
  signalStrength: SignalStrength;
  message: string;
  explanation: string;
  suggestions: string[];
}

export interface SeedSignalThresholds {
  strong: { minTopicMatches: number };
  moderate: { minTopicMatches: number };
  weak: { minTopicMatches: number };
}

// =============================================================================
// CONFIGURATION
// =============================================================================

// Patterns that indicate BRAND/COMPANY (discount these)
const BRAND_PATTERNS = [
  /\b(law\s*(group|firm|office)|lawyer|attorney)\b/i,
  /\b(insurance|insur)\b/i,
  /\b(company|companies|corp|inc|llc|ltd|group|services|solutions|agency)\b/i,
  /\b(bank|banking|financial\s*services)\b/i,
  /\b(store|shop|mart|outlet)\b/i,
  /\b(realty|real\s*estate\s*(group|company))\b/i,
];

// Patterns that indicate TOPIC/VIEWER INTENT (these are valuable)
const TOPIC_PATTERNS = [
  /\b(how\s*to|what\s*is|why|when|where|who)\b/i,
  /\b(guide|tutorial|tips|tricks|basics|101|explained|for\s*beginners)\b/i,
  /\b(best|top|worst|vs|versus|compared|review)\b/i,
  /\b(ideas|examples|strategies|steps|ways)\b/i,
  /\b(mistakes|problems|issues|challenges)\b/i,
  /\b(2024|2025|new|latest|updated)\b/i,
];

// Note: We now score based on TOPIC matches, not raw suggestion count
export const SIGNAL_THRESHOLDS: SeedSignalThresholds = {
  strong: { minTopicMatches: 5 },   // 5+ genuine topic suggestions
  moderate: { minTopicMatches: 3 }, // 3-4 genuine topic suggestions  
  weak: { minTopicMatches: 1 },     // 1-2 genuine topic suggestions
  // 0 = very-weak
};

export const SIGNAL_MESSAGES: Record<SignalStrength, { message: string; explanation: string }> = {
  'strong': {
    message: 'Strong Viewer Demand',
    explanation: 'Viewers are actively searching for this topic. Great seed to explore!',
  },
  'moderate': {
    message: 'Good Viewer Demand',
    explanation: "There's genuine interest in this topic. You'll find opportunities here.",
  },
  'weak': {
    message: 'Limited Demand',
    explanation: 'Most results are brands or companies, not viewer searches. Consider broadening.',
  },
  'very-weak': {
    message: 'Very Niche Topic',
    explanation: 'Few viewers are searching for this. Consider a broader or different angle.',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a suggestion looks like a brand/company name
 */
function isBrandSuggestion(suggestion: string): boolean {
  return BRAND_PATTERNS.some(pattern => pattern.test(suggestion));
}

/**
 * Check if a suggestion looks like a genuine topic/viewer intent
 */
function isTopicSuggestion(suggestion: string, seed: string): boolean {
  // First check if it has explicit topic patterns
  if (TOPIC_PATTERNS.some(pattern => pattern.test(suggestion))) {
    return true;
  }
  
  // If it starts with the seed and adds meaningful words (not brand words)
  const seedLower = seed.toLowerCase().trim();
  const suggestionLower = suggestion.toLowerCase();
  
  if (suggestionLower.startsWith(seedLower)) {
    // It's an extension of the seed - check it's not a brand
    return !isBrandSuggestion(suggestion);
  }
  
  // Contains the seed words in any order and isn't a brand
  const seedWords = seedLower.split(/\s+/);
  const hasAllSeedWords = seedWords.every(word => suggestionLower.includes(word));
  
  if (hasAllSeedWords && !isBrandSuggestion(suggestion)) {
    return true;
  }
  
  return false;
}

// =============================================================================
// SIGNAL CALCULATION
// =============================================================================

/**
 * Calculate the seed signal based on autocomplete results
 * Now analyzes QUALITY of suggestions, not just quantity
 */
export function calculateSeedSignal(
  seed: string,
  autocompleteResults: string[]
): SeedSignal {
  const count = autocompleteResults.length;
  const seedLower = seed.toLowerCase().trim();
  
  // Analyze each suggestion
  let topicMatches = 0;
  let brandMatches = 0;
  let exactMatches = 0;
  
  for (const suggestion of autocompleteResults) {
    const suggestionLower = suggestion.toLowerCase();
    
    // Count exact matches (starts with seed)
    if (suggestionLower.startsWith(seedLower)) {
      exactMatches++;
    }
    
    // Categorize the suggestion
    if (isBrandSuggestion(suggestion)) {
      brandMatches++;
    } else if (isTopicSuggestion(suggestion, seed)) {
      topicMatches++;
    }
  }
  
  // Determine signal strength based on TOPIC matches (genuine viewer interest)
  let signalStrength: SignalStrength;
  
  if (topicMatches >= SIGNAL_THRESHOLDS.strong.minTopicMatches) {
    signalStrength = 'strong';
  } else if (topicMatches >= SIGNAL_THRESHOLDS.moderate.minTopicMatches) {
    signalStrength = 'moderate';
  } else if (topicMatches >= SIGNAL_THRESHOLDS.weak.minTopicMatches) {
    signalStrength = 'weak';
  } else {
    signalStrength = 'very-weak';
  }
  
  // Special case: If we have lots of brands polluting, downgrade
  if (brandMatches > topicMatches && signalStrength !== 'very-weak') {
    // More brands than topics = downgrade by one level
    if (signalStrength === 'strong') signalStrength = 'moderate';
    else if (signalStrength === 'moderate') signalStrength = 'weak';
  }
  
  const { message, explanation } = SIGNAL_MESSAGES[signalStrength];
  
  return {
    seed,
    suggestionCount: count,
    exactMatchCount: exactMatches,
    topicMatchCount: topicMatches,
    brandMatchCount: brandMatches,
    signalStrength,
    message,
    explanation,
    suggestions: autocompleteResults,
  };
}

/**
 * Get the appropriate icon/color class for a signal strength
 */
export function getSignalColor(strength: SignalStrength): string {
  switch (strength) {
    case 'strong':
      return 'text-[#4DD68A]'; // Green
    case 'moderate':
      return 'text-[#6B9BD1]'; // Blue
    case 'weak':
      return 'text-[#FF8A3D]'; // Orange
    case 'very-weak':
      return 'text-[#FF6B6B]'; // Red
  }
}

export function getSignalBgColor(strength: SignalStrength): string {
  switch (strength) {
    case 'strong':
      return 'bg-[#4DD68A]/10 border-[#4DD68A]/30';
    case 'moderate':
      return 'bg-[#6B9BD1]/10 border-[#6B9BD1]/30';
    case 'weak':
      return 'bg-[#FF8A3D]/10 border-[#FF8A3D]/30';
    case 'very-weak':
      return 'bg-[#FF6B6B]/10 border-[#FF6B6B]/30';
  }
}

export function getSignalIcon(strength: SignalStrength): string {
  switch (strength) {
    case 'strong':
      return '🟢';
    case 'moderate':
      return '🔵';
    case 'weak':
      return '🟠';
    case 'very-weak':
      return '🔴';
  }
}
