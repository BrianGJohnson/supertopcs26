/**
 * YouTube Autocomplete - APIFY INTEGRATION
 * 
 * This file provides autocomplete functionality via Apify.
 * The direct YouTube/Google API calls have been deprecated to avoid IP blocking.
 * 
 * MIGRATION: December 3, 2025
 * - Direct Google API calls → Apify proxy service
 * - Old code preserved in youtube-autocomplete.deprecated.ts
 * 
 * @see /docs/apify-integration-guide.md for full documentation
 */

// Re-export everything from apify-autocomplete for backward compatibility
export {
  // Core fetch function (drop-in replacement)
  fetchAutocompleteViaApify as fetchAutocomplete,
  
  // Hybrid expansion functions
  fetchTop10,
  fetchAZComplete,
  fetchPrefixComplete,
  fetchChildExpansion,
  runHybridExpansion,
  
  // Configuration
  SEMANTIC_PREFIXES,
  CHILD_PREFIXES,
  TAG_CONFIG,
  
  // Types
  type ApifyCallResult,
  type ApifyBulkCallResult,
  type TaggedPhrase,
  type ChildExpansionResult,
  type ExpansionReport,
} from "./apify-autocomplete";

// ============================================================================
// UTILITY FUNCTIONS (kept for backward compatibility)
// ============================================================================

/**
 * Random delay between min and max milliseconds
 * Note: Apify handles its own rate limiting, but this is kept for compatibility
 */
export function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Normalize phrase text for deduplication and comparison
 */
export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

// ============================================================================
// PHRASE FILTERING (used by stream route for database saves)
// ============================================================================

/**
 * Extract significant words from seed phrase
 */
export function getSignificantWords(seed: string): string[] {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare", "ought",
    "used", "it", "its", "this", "that", "these", "those", "i", "you", "he",
    "she", "we", "they", "what", "which", "who", "whom", "how", "why", "when",
    "where", "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "just", "also", "now", "here", "there", "then", "once"
  ]);

  const words = seed.toLowerCase().split(/\s+/);
  
  return words.filter(word => {
    if (/^\d+(\.\d+)?$/.test(word)) return true;
    return word.length >= 2 && !stopWords.has(word);
  });
}

/**
 * Check if a phrase contains at least one significant word from the seed
 */
export function isRelevantToSeed(phrase: string, significantWords: string[]): boolean {
  const normalizedPhrase = phrase.toLowerCase();
  return significantWords.some(word => normalizedPhrase.includes(word));
}

/**
 * Get allowed years for filtering
 */
export function getAllowedYears(): Set<string> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  const allowed = new Set<string>();
  allowed.add(String(currentYear));
  
  if (currentMonth >= 8) {
    allowed.add(String(currentYear + 1));
  }
  
  return allowed;
}

/**
 * Check if phrase contains an outdated year
 */
export function hasOutdatedYear(phrase: string): boolean {
  const allowedYears = getAllowedYears();
  const yearPattern = /\b(20[2-9]\d)\b/g;
  const matches = phrase.match(yearPattern);
  
  if (!matches) return false;
  
  for (const year of matches) {
    if (!allowedYears.has(year)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if phrase contains social media spam
 */
export function hasSocialMediaSpam(phrase: string): boolean {
  if (phrase.includes('#')) return true;
  if (/@\w+/.test(phrase)) return true;
  
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  const emojiMatches = phrase.match(emojiPattern);
  if (emojiMatches && emojiMatches.length >= 3) return true;
  
  return false;
}
