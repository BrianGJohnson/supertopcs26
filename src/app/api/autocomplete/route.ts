import { NextRequest, NextResponse } from "next/server";

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
 * Normalize phrase text for consistency
 */
function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

/**
 * POST /api/autocomplete
 * 
 * Fetches autocomplete suggestions from YouTube based on the method:
 * - top10: Single query, returns ~10 suggestions
 * - az: 26 queries (seed + a, seed + b, ..., seed + z)
 * - prefix: 25 queries with common prefixes
 * - child: Expands parent phrases (requires parentPhrases in body)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seed, method = "top10", parentPhrases } = body;

    if (!seed || typeof seed !== "string") {
      return NextResponse.json({ error: "Missing or invalid seed phrase" }, { status: 400 });
    }

    let suggestions: string[] = [];

    switch (method) {
      case "top10": {
        // Simple search - single query
        suggestions = await fetchAutocomplete(seed);
        break;
      }

      case "az": {
        // A-Z expansion - 26 queries, shuffled, ~40-48 seconds total
        const alphabet = shuffle("abcdefghijklmnopqrstuvwxyz".split(""));
        const allSuggestions: string[] = [];

        // Sequential with human-like delays (1.5-2s per request = ~40-48s total)
        for (let i = 0; i < alphabet.length; i++) {
          const letter = alphabet[i];
          const results = await fetchAutocomplete(`${seed} ${letter}`);
          allSuggestions.push(...results);

          // Random delay between requests (1500-2000ms)
          if (i < alphabet.length - 1) {
            await randomDelay(1500, 2000);
            
            // Occasional longer pause every 5-8 requests (simulates human distraction)
            if (i > 0 && i % (5 + Math.floor(Math.random() * 4)) === 0) {
              await randomDelay(2000, 3500);
            }
          }
        }

        suggestions = allSuggestions;
        break;
      }

      case "prefix": {
        // Prefix expansion - 25 common prefixes, shuffled, ~40-45 seconds total
        const prefixes = shuffle([
          "what", "what does", "why", "how", "how to",
          "does", "can", "is", "will", "why does",
          "problems", "tip", "how does", "understand", "explain",
          "change", "update", "fix", "guide to", "learn",
          "broken", "improve", "help with", "strategy", "plan for",
        ]);
        const allSuggestions: string[] = [];

        // Sequential with human-like delays (1.5-2s per request = ~40-45s total)
        for (let i = 0; i < prefixes.length; i++) {
          const prefix = prefixes[i];
          const results = await fetchAutocomplete(`${prefix} ${seed}`);
          allSuggestions.push(...results);

          // Random delay between requests (1500-2000ms)
          if (i < prefixes.length - 1) {
            await randomDelay(1500, 2000);
            
            // Occasional longer pause every 5-8 requests
            if (i > 0 && i % (5 + Math.floor(Math.random() * 4)) === 0) {
              await randomDelay(2000, 3500);
            }
          }
        }

        suggestions = allSuggestions;
        break;
      }

      case "child": {
        // Child expansion - expand each parent phrase, ~30-60 seconds depending on parent count
        if (!parentPhrases || !Array.isArray(parentPhrases)) {
          return NextResponse.json(
            { error: "Child method requires parentPhrases array" },
            { status: 400 }
          );
        }

        const allSuggestions: string[] = [];
        const childPrefixes = ["how to", "what does"];

        // Shuffle parent phrases for less predictable pattern
        const shuffledParents = shuffle(parentPhrases);

        for (let p = 0; p < shuffledParents.length; p++) {
          const parent = shuffledParents[p];
          
          // Direct expansion
          const directResults = await fetchAutocomplete(parent);
          allSuggestions.push(...directResults);
          await randomDelay(1200, 1800);

          // Prefix expansions
          for (let i = 0; i < childPrefixes.length; i++) {
            const prefix = childPrefixes[i];
            const prefixResults = await fetchAutocomplete(`${prefix} ${parent}`);
            allSuggestions.push(...prefixResults);
            
            if (i < childPrefixes.length - 1 || p < shuffledParents.length - 1) {
              await randomDelay(1200, 1800);
            }
          }

          // Occasional longer pause between parent phrases
          if (p < shuffledParents.length - 1 && p % 3 === 2) {
            await randomDelay(2500, 4000);
          }
        }

        suggestions = allSuggestions;
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 });
    }

    // Normalize and deduplicate
    const seen = new Set<string>();
    const uniqueSuggestions = suggestions
      .map((s) => ({
        original: s,
        normalized: normalizePhrase(s),
      }))
      .filter(({ normalized }) => {
        // Skip empty, skip if same as seed
        if (!normalized || normalized === normalizePhrase(seed)) return false;
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .map(({ original }) => original);

    return NextResponse.json({
      seed,
      method,
      count: uniqueSuggestions.length,
      suggestions: uniqueSuggestions,
    });
  } catch (error) {
    console.error("Autocomplete API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
