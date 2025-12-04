import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";
import {
  normalizePhrase,
  fetchTop10,
  fetchAZComplete,
  fetchPrefixComplete,
  fetchChildExpansion,
  SEMANTIC_PREFIXES,
} from "@/lib/topic-service";

/**
 * POST /api/topics
 * 
 * Fetches topic ideas for expansion.
 * Requires authentication.
 * 
 * Methods:
 * - top10: Single query, returns ~14 topics (~3.5s)
 * - az: Batch 26 A-Z queries in one call (~14s)
 * - prefix: Batch 6 semantic prefixes in one call (~5s)
 * - child: Batch all parent phrases in one call (~10s)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await createAuthenticatedSupabase(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { seed, method = "top10", parentPhrases } = body;

    if (!seed || typeof seed !== "string") {
      return NextResponse.json({ error: "Missing or invalid seed phrase" }, { status: 400 });
    }

    let suggestions: string[] = [];

    switch (method) {
      case "top10": {
        // Top-10: Single call (~3s)
        const { phrases } = await fetchTop10(seed);
        suggestions = phrases.map(p => p.text);
        break;
      }

      case "az": {
        // A-Z: Bulk call (~6s for all 26 letters)
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
    });
  } catch (error) {
    console.error("Topics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
