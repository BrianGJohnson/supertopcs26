import { NextRequest, NextResponse } from "next/server";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";
import { fetchAutocomplete } from "@/lib/topic-service";
import { calculateSeedSignal } from "@/lib/seed-signal";
import { analyzeViewerLandscape } from "@/lib/viewer-landscape";

// ============================================================================
// IN-MEMORY CACHE FOR AUTOCOMPLETE RESULTS
// ============================================================================

interface CacheEntry {
  suggestions: string[];
  timestamp: number;
}

// Cache autocomplete results for 30 minutes (Apify cold starts are expensive)
const CACHE_TTL_MS = 30 * 60 * 1000;
const autocompleteCache = new Map<string, CacheEntry>();

/**
 * Get cached suggestions or null if expired/missing
 */
function getCachedSuggestions(seed: string): string[] | null {
  const entry = autocompleteCache.get(seed.toLowerCase());
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    autocompleteCache.delete(seed.toLowerCase());
    return null;
  }
  
  return entry.suggestions;
}

/**
 * Cache suggestions for a seed phrase
 */
function cacheSuggestions(seed: string, suggestions: string[]): void {
  // Limit cache size to prevent memory bloat
  if (autocompleteCache.size > 1000) {
    // Delete oldest 100 entries
    const entries = Array.from(autocompleteCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100);
    for (const [key] of entries) {
      autocompleteCache.delete(key);
    }
  }
  
  autocompleteCache.set(seed.toLowerCase(), {
    suggestions,
    timestamp: Date.now(),
  });
}

/**
 * POST /api/seed-signal
 * 
 * Analyzes a seed phrase and returns viewer landscape analysis.
 * Requires authentication.
 * 
 * Returns comprehensive viewer landscape analysis including:
 * - Demand level (8 tiers)
 * - Seed strength (exact match ratio)
 * - Viewer vibe distribution (weighted by position)
 * - Top 3 searches with vibe icons
 * - Insight message
 * 
 * Request body:
 * {
 *   "seed": "youtube algorithm"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Require authentication
    const { userId } = await createAuthenticatedSupabase(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { seed } = body;

    if (!seed || typeof seed !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'seed' in request body" },
        { status: 400 }
      );
    }

    const trimmedSeed = seed.trim();
    
    if (trimmedSeed.length < 2) {
      return NextResponse.json(
        { error: "Seed phrase must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Check cache first
    let suggestions = getCachedSuggestions(trimmedSeed);
    let cacheHit = false;
    
    if (suggestions) {
      cacheHit = true;
      console.log(`[seed-signal] Cache HIT for "${trimmedSeed}" (${suggestions.length} suggestions)`);
    } else {
      // Fetch from Apify (expensive!)
      console.log(`[seed-signal] Cache MISS for "${trimmedSeed}" - fetching from Apify...`);
      suggestions = await fetchAutocomplete(trimmedSeed);
      
      // Cache the result
      cacheSuggestions(trimmedSeed, suggestions);
      console.log(`[seed-signal] Fetched ${suggestions.length} suggestions in ${Date.now() - startTime}ms`);
    }
    
    // Calculate legacy signal (for backward compatibility)
    const signal = calculateSeedSignal(trimmedSeed, suggestions);
    
    // Calculate new viewer landscape analysis
    const landscape = analyzeViewerLandscape(trimmedSeed, suggestions);

    // Return combined response (landscape is the new primary data)
    return NextResponse.json({
      // Legacy fields for backward compatibility
      ...signal,
      
      // New viewer landscape fields
      landscape,
      
      // Debug info (can be removed in production)
      _meta: {
        cacheHit,
        durationMs: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("[seed-signal] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate seed phrase" },
      { status: 500 }
    );
  }
}
