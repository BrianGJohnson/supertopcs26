import { NextRequest, NextResponse } from "next/server";
import {
  normalizePhrase,
  fetchTop10,
  fetchAZComplete,
  fetchPrefixComplete,
  fetchChildExpansion,
  SEMANTIC_PREFIXES,
} from "@/lib/youtube-autocomplete";

/**
 * POST /api/autocomplete
 * 
 * Fetches autocomplete suggestions via Apify (no direct YouTube API calls).
 * 
 * Methods (using forward_flight~my-actor with batch mode):
 * - top10: Single query, returns ~14 suggestions (~3.5s)
 * - az: Batch 26 A-Z queries in one call (~14s)
 * - prefix: Batch 6 semantic prefixes in one call (~5s)
 * - child: Batch all parent phrases in one call (~10s)
 * 
 * MIGRATION: Uses custom Apify actor with batch support.
 * @see /docs/apify-integration-guide.md
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
        // Top-10: Single Apify call (~3s)
        const { phrases } = await fetchTop10(seed);
        suggestions = phrases.map(p => p.text);
        break;
      }

      case "az": {
        // A-Z: Bulk Apify call with use_suffix (~6s for all 26 letters!)
        const { phrases } = await fetchAZComplete(seed);
        suggestions = phrases.map(p => p.text);
        break;
      }

      case "prefix": {
        // Prefix: Reduced semantic prefixes (6 calls, ~18s)
        const { phrases } = await fetchPrefixComplete(seed, SEMANTIC_PREFIXES);
        suggestions = phrases.map(p => p.text);
        break;
      }

      case "child": {
        // Child expansion: 30 calls (~75s)
        if (!parentPhrases || !Array.isArray(parentPhrases)) {
          return NextResponse.json(
            { error: "Child method requires parentPhrases array" },
            { status: 400 }
          );
        }

        const { allPhrases } = await fetchChildExpansion(parentPhrases);
        suggestions = allPhrases.map(p => p.text);
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
      source: "apify", // Indicate we're using Apify
    });
  } catch (error) {
    console.error("Autocomplete API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
