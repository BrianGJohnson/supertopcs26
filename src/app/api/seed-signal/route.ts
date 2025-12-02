import { NextRequest, NextResponse } from "next/server";
import { fetchAutocomplete } from "@/lib/youtube-autocomplete";
import { calculateSeedSignal } from "@/lib/seed-signal";
import { analyzeViewerLandscape } from "@/lib/viewer-landscape";

/**
 * POST /api/seed-signal
 * 
 * Analyzes a seed phrase by checking YouTube autocomplete results.
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
  try {
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

    // Fetch autocomplete suggestions from YouTube
    const suggestions = await fetchAutocomplete(trimmedSeed);
    
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
    });
  } catch (error) {
    console.error("[seed-signal] Error:", error);
    return NextResponse.json(
      { error: "Failed to validate seed phrase" },
      { status: 500 }
    );
  }
}
