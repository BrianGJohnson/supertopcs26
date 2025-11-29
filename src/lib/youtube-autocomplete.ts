/**
 * Shared utilities for YouTube autocomplete API routes
 * 
 * This file contains all the helper functions used by both:
 * - /api/autocomplete/route.ts (returns suggestions to client)
 * - /api/autocomplete/stream/route.ts (saves suggestions to database)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTOCOMPLETE_ENDPOINTS = [
  { url: "https://suggestqueries.google.com/complete/search", client: "youtube" },
  { url: "https://clients1.google.com/complete/search", client: "youtube" },
  { url: "https://suggestqueries.google.com/complete/search", client: "firefox" },
];

export const TIMEOUT_MS = 10000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Random delay between min and max milliseconds
 * Used to simulate human-like request patterns
 */
export function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 * Used to randomize query order for less predictable patterns
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
 * Converts to lowercase, trims, normalizes spaces, removes special chars
 */
export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

// ============================================================================
// AUTOCOMPLETE FETCHING
// ============================================================================

/**
 * Parse YouTube autocomplete response (handles JSON and JSONP formats)
 */
export function parseAutocompleteResponse(text: string): string[] {
  // Attempt 1: Parse as pure JSON
  try {
    const jsonData = JSON.parse(text);
    if (Array.isArray(jsonData) && jsonData.length > 1 && Array.isArray(jsonData[1])) {
      return jsonData[1];
    }
  } catch {
    // Not valid JSON, try JSONP extraction
  }

  // Attempt 2: Extract JSON from JSONP wrapper
  const match = text.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const jsonData = JSON.parse(`[${match[1]}]`);
      if (Array.isArray(jsonData) && jsonData.length > 1 && Array.isArray(jsonData[1])) {
        return jsonData[1];
      }
    } catch {
      // Parsing failed
    }
  }

  return [];
}

/**
 * Fetch autocomplete suggestions with timeout and fallback endpoints
 * Tries multiple Google endpoints until one succeeds
 */
export async function fetchAutocomplete(query: string): Promise<string[]> {
  for (const endpoint of AUTOCOMPLETE_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const url = `${endpoint.url}?client=${endpoint.client}&ds=yt&q=${encodeURIComponent(query)}&hl=en&gl=US`;

      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Endpoint ${endpoint.url} returned ${response.status}, trying next...`);
        continue;
      }

      const text = await response.text();
      const suggestions = parseAutocompleteResponse(text);

      if (suggestions.length > 0) {
        return suggestions;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn(`Timeout on ${endpoint.url}, trying next...`);
      } else {
        console.warn(`Error on ${endpoint.url}:`, error);
      }
      continue;
    }
  }

  return [];
}

// ============================================================================
// PHRASE FILTERING (used by stream route for database saves)
// ============================================================================

/**
 * Extract significant words from seed phrase (filters out common/short words)
 * Keeps numbers and version strings like "4.5"
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

  // Split by spaces but preserve version numbers like "4.5"
  const words = seed.toLowerCase().split(/\s+/);
  
  return words.filter(word => {
    // Keep numbers and version strings (e.g., "4.5", "2024")
    if (/^\d+(\.\d+)?$/.test(word)) return true;
    // Filter out stop words and very short words
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
 * Get allowed years for filtering (current year + next year if Sept-Dec)
 */
export function getAllowedYears(): Set<string> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  
  const allowed = new Set<string>();
  allowed.add(String(currentYear));
  
  // If September (8) through December (11), also allow next year
  if (currentMonth >= 8) {
    allowed.add(String(currentYear + 1));
  }
  
  return allowed;
}

/**
 * Check if phrase contains an outdated year (should be filtered out)
 * Returns true if phrase should be REMOVED
 */
export function hasOutdatedYear(phrase: string): boolean {
  const allowedYears = getAllowedYears();
  
  // Match 4-digit years (2020-2099 range to avoid matching other numbers)
  const yearPattern = /\b(20[2-9]\d)\b/g;
  const matches = phrase.match(yearPattern);
  
  if (!matches) return false; // No years found, keep the phrase
  
  // If any year in the phrase is NOT allowed, filter it out
  for (const year of matches) {
    if (!allowedYears.has(year)) {
      return true; // Has outdated year, should be removed
    }
  }
  
  return false; // All years are allowed
}

/**
 * Check if phrase contains social media spam artifacts
 * Returns true if phrase should be REMOVED
 */
export function hasSocialMediaSpam(phrase: string): boolean {
  // Filter 1: Contains hashtags (social media artifact)
  if (phrase.includes('#')) {
    return true;
  }
  
  // Filter 2: Contains @ mentions
  if (/@\w+/.test(phrase)) {
    return true;
  }
  
  // Filter 3: Has 3+ emojis (spam indicator)
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  const emojiMatches = phrase.match(emojiPattern);
  if (emojiMatches && emojiMatches.length >= 3) {
    return true;
  }
  
  return false;
}
