import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AUTOCOMPLETE_ENDPOINTS = [
  { url: "https://suggestqueries.google.com/complete/search", client: "youtube" },
  { url: "https://clients1.google.com/complete/search", client: "youtube" },
  { url: "https://suggestqueries.google.com/complete/search", client: "firefox" },
];

const TIMEOUT_MS = 10000;

/**
 * Random delay between min and max milliseconds
 */
function randomDelay(min: number, max: number): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Convert to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Parse YouTube autocomplete response (handles JSON and JSONP formats)
 */
function parseAutocompleteResponse(text: string): string[] {
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
 */
async function fetchAutocomplete(query: string): Promise<string[]> {
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

/**
 * Normalize phrase text for deduplication
 */
function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

/**
 * Extract significant words from seed phrase (filters out common/short words)
 * Keeps numbers and version strings like "4.5"
 */
function getSignificantWords(seed: string): string[] {
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
function isRelevantToSeed(phrase: string, significantWords: string[]): boolean {
  const normalizedPhrase = phrase.toLowerCase();
  return significantWords.some(word => normalizedPhrase.includes(word));
}

/**
 * Get allowed years for filtering (current year + next year if Sept-Dec)
 */
function getAllowedYears(): Set<string> {
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
function hasOutdatedYear(phrase: string): boolean {
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
function hasSocialMediaSpam(phrase: string): boolean {
  // Filter 1: Contains hashtags (social media artifact)
  if (phrase.includes('#')) {
    return true;
  }
  
  // Filter 2: Contains @ mentions
  if (/@\w+/.test(phrase)) {
    return true;
  }
  
  // Filter 3: Has 3+ emojis (spam indicator)
  // Match emoji unicode ranges
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu;
  const emojiMatches = phrase.match(emojiPattern);
  if (emojiMatches && emojiMatches.length >= 3) {
    return true;
  }
  
  return false;
}

/**
 * Save phrases to database (deduped against existing, filtered for relevance and year)
 */
async function savePhrases(
  sessionId: string,
  phrases: string[],
  method: string,
  existingNormalized: Set<string>,
  seedSignificantWords: string[]
): Promise<number> {
  // Filter and dedupe
  const newPhrases: string[] = [];
  
  for (const phrase of phrases) {
    const normalized = normalizePhrase(phrase);
    if (!normalized || existingNormalized.has(normalized)) continue;
    
    // Filter 1: must contain at least one significant word from seed
    if (!isRelevantToSeed(phrase, seedSignificantWords)) {
      continue;
    }
    
    // Filter 2: remove phrases with outdated years
    if (hasOutdatedYear(phrase)) {
      continue;
    }
    
    // Filter 3: remove social media spam (hashtags, @mentions, 3+ emojis)
    if (hasSocialMediaSpam(phrase)) {
      continue;
    }
    
    existingNormalized.add(normalized);
    newPhrases.push(phrase);
  }

  if (newPhrases.length === 0) return 0;

  // Insert into database
  const inserts = newPhrases.map((phrase, index) => ({
    session_id: sessionId,
    phrase: toTitleCase(phrase),
    generation_method: method,
    position: index,
  }));

  const { error } = await supabase.from("seeds").insert(inserts);
  
  if (error) {
    console.error("Failed to save phrases:", error);
    return 0;
  }

  return newPhrases.length;
}

/**
 * Get existing phrases for a session (for deduplication)
 */
async function getExistingPhrases(sessionId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("seeds")
    .select("phrase")
    .eq("session_id", sessionId);

  const normalized = new Set<string>();
  if (data) {
    for (const row of data) {
      normalized.add(normalizePhrase(row.phrase));
    }
  }
  return normalized;
}

/**
 * POST /api/autocomplete/stream
 * 
 * Streams autocomplete results directly to the database.
 * Returns progress updates via Server-Sent Events.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, seed, method, parentPhrases } = body;

    if (!sessionId || !seed || !method) {
      return NextResponse.json(
        { error: "Missing sessionId, seed, or method" },
        { status: 400 }
      );
    }

    // Get existing phrases for deduplication
    const existingNormalized = await getExistingPhrases(sessionId);
    const seedNormalized = normalizePhrase(seed);
    existingNormalized.add(seedNormalized); // Don't include the seed itself
    
    // Extract significant words from seed for relevance filtering
    const seedSignificantWords = getSignificantWords(seed);

    let totalAdded = 0;
    let progress = { current: 0, total: 0 };

    switch (method) {
      case "child": {
        if (!parentPhrases || !Array.isArray(parentPhrases) || parentPhrases.length === 0) {
          return NextResponse.json(
            { error: "Child method requires parentPhrases array" },
            { status: 400 }
          );
        }

        const childPrefixes = ["how to", "what does"];
        const shuffledParents = shuffle(parentPhrases);
        progress.total = shuffledParents.length;

        for (let p = 0; p < shuffledParents.length; p++) {
          const parent = shuffledParents[p];
          progress.current = p + 1;

          // Direct expansion
          const directResults = await fetchAutocomplete(parent);
          const directAdded = await savePhrases(sessionId, directResults, method, existingNormalized, seedSignificantWords);
          totalAdded += directAdded;
          await randomDelay(1200, 1800);

          // Prefix expansions
          for (let i = 0; i < childPrefixes.length; i++) {
            const prefix = childPrefixes[i];
            const prefixResults = await fetchAutocomplete(`${prefix} ${parent}`);
            const prefixAdded = await savePhrases(sessionId, prefixResults, method, existingNormalized, seedSignificantWords);
            totalAdded += prefixAdded;

            if (i < childPrefixes.length - 1 || p < shuffledParents.length - 1) {
              await randomDelay(1200, 1800);
            }
          }

          // Occasional longer pause between parent phrases
          if (p < shuffledParents.length - 1 && p % 3 === 2) {
            await randomDelay(2500, 4000);
          }
        }
        break;
      }

      case "az": {
        const alphabet = shuffle("abcdefghijklmnopqrstuvwxyz".split(""));
        progress.total = alphabet.length;

        for (let i = 0; i < alphabet.length; i++) {
          const letter = alphabet[i];
          progress.current = i + 1;

          const results = await fetchAutocomplete(`${seed} ${letter}`);
          const added = await savePhrases(sessionId, results, method, existingNormalized, seedSignificantWords);
          totalAdded += added;

          if (i < alphabet.length - 1) {
            await randomDelay(1500, 2000);
            if (i > 0 && i % (5 + Math.floor(Math.random() * 4)) === 0) {
              await randomDelay(2000, 3500);
            }
          }
        }
        break;
      }

      case "prefix": {
        const prefixes = shuffle([
          "what", "what does", "why", "how", "how to",
          "does", "can", "is", "will", "why does",
          "problems", "tip", "how does", "understand", "explain",
          "change", "update", "fix", "guide to", "learn",
          "broken", "improve", "help with", "strategy", "plan for",
        ]);
        progress.total = prefixes.length;

        for (let i = 0; i < prefixes.length; i++) {
          const prefix = prefixes[i];
          progress.current = i + 1;

          const results = await fetchAutocomplete(`${prefix} ${seed}`);
          const added = await savePhrases(sessionId, results, method, existingNormalized, seedSignificantWords);
          totalAdded += added;

          if (i < prefixes.length - 1) {
            await randomDelay(1500, 2000);
            if (i > 0 && i % (5 + Math.floor(Math.random() * 4)) === 0) {
              await randomDelay(2000, 3500);
            }
          }
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      method,
      totalAdded,
      progress,
    });
  } catch (error) {
    console.error("Stream API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
