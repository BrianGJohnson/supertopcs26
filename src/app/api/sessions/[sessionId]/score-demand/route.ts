/**
 * POST /api/sessions/[sessionId]/score-demand
 * 
 * Run Demand scoring on phrases using YouTube autocomplete data.
 * Scores are saved to the seed_analysis table.
 * 
 * REQUIREMENTS:
 * - Maximum 75 phrases allowed (enforced by this endpoint)
 * - Phrases must be pre-filtered on the client
 * 
 * @see /docs/1-autocomplete-scoring-algorithm.md for full documentation
 */

import { NextRequest, NextResponse } from "next/server";

// Allow up to 3 minutes for batch scoring
export const maxDuration = 180;

import { createClient } from "@supabase/supabase-js";
import {
  scoreDemandBatch,
  BATCH_CONFIG,
  type DemandScoreResult,
} from "@/lib/demand-scoring";

// =============================================================================
// TYPES
// =============================================================================

interface SeedRow {
  id: string;
  phrase: string;
}

interface ScoringResult {
  success: boolean;
  totalScored: number;
  totalApiCalls: number;
  durationMs: number;
  estimatedCostUsd: number;
  distribution: {
    extreme: number;  // 85-100
    high: number;     // 65-84
    moderate: number; // 40-64
    low: number;      // 0-39
  };
  results: { seedId: string; score: number }[];
}

// =============================================================================
// CLIENTS
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate score distribution
 */
function calculateDistribution(results: DemandScoreResult[]): ScoringResult["distribution"] {
  const dist = { extreme: 0, high: 0, moderate: 0, low: 0 };
  
  for (const r of results) {
    if (r.demandScore >= 85) dist.extreme++;
    else if (r.demandScore >= 65) dist.high++;
    else if (r.demandScore >= 40) dist.moderate++;
    else dist.low++;
  }
  
  return dist;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse<ScoringResult | { error: string }>> {
  const { sessionId } = await params;
  
  try {
    // -------------------------------------------------------------------------
    // 1. Parse request body for seed IDs
    // -------------------------------------------------------------------------
    let seedIds: string[] = [];
    try {
      const body = await request.json();
      if (body.seedIds && Array.isArray(body.seedIds)) {
        seedIds = body.seedIds;
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Expected { seedIds: string[] }" },
        { status: 400 }
      );
    }
    
    if (seedIds.length === 0) {
      return NextResponse.json(
        { error: "No seed IDs provided" },
        { status: 400 }
      );
    }
    
    // -------------------------------------------------------------------------
    // 2. Validate 75 phrase limit
    // -------------------------------------------------------------------------
    if (seedIds.length > BATCH_CONFIG.maxPhrases) {
      return NextResponse.json(
        { 
          error: `Too many phrases: ${seedIds.length}. Please reduce to ${BATCH_CONFIG.maxPhrases} or fewer.`,
          currentCount: seedIds.length,
          maxAllowed: BATCH_CONFIG.maxPhrases,
        },
        { status: 400 }
      );
    }
    
    console.log(`[DemandScoring] Starting scoring for ${seedIds.length} phrases in session ${sessionId}`);
    
    // -------------------------------------------------------------------------
    // 3. Fetch seeds by IDs
    // -------------------------------------------------------------------------
    const { data: seeds, error: seedsError } = await supabase
      .from("seeds")
      .select("id, phrase")
      .eq("session_id", sessionId)
      .in("id", seedIds);
    
    if (seedsError) {
      console.error("Failed to fetch seeds:", seedsError);
      return NextResponse.json(
        { error: `Failed to fetch phrases: ${seedsError.message}` },
        { status: 500 }
      );
    }
    
    if (!seeds || seeds.length === 0) {
      return NextResponse.json(
        { error: "No matching phrases found" },
        { status: 404 }
      );
    }
    
    // -------------------------------------------------------------------------
    // 4. Get total session phrase count for size multiplier
    // -------------------------------------------------------------------------
    const { count: totalSessionPhrases } = await supabase
      .from("seeds")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    
    // -------------------------------------------------------------------------
    // 5. Run demand scoring
    // -------------------------------------------------------------------------
    const phrasesWithIds = seeds.map(s => ({
      id: s.id,
      phrase: s.phrase,
    })) as { id: string; phrase: string }[];
    
    const batchResult = await scoreDemandBatch(
      phrasesWithIds,
      totalSessionPhrases || seeds.length
    );
    
    // -------------------------------------------------------------------------
    // 6. Save scores to database (upsert into seed_analysis)
    // -------------------------------------------------------------------------
    const upsertData = batchResult.results.map(r => ({
      seed_id: r.seedId,
      demand: r.demandScore,
      demand_base: r.rawScore, // Store raw score before multiplier
      // Store detailed data in extra field
      extra: {
        demand_v2: {
          suggestionCount: r.suggestionCount,
          exactMatchCount: r.exactMatchCount,
          topicMatchCount: r.topicMatchCount,
          suggestionPoints: r.suggestionPoints,
          exactMatchPoints: r.exactMatchPoints,
          topicMatchPoints: r.topicMatchPoints,
          sizeMultiplier: r.sizeMultiplier,
          rawScore: r.rawScore,
          scoredAt: new Date().toISOString(),
        },
      },
    }));
    
    // Batch upsert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < upsertData.length; i += chunkSize) {
      const chunk = upsertData.slice(i, i + chunkSize);
      
      const { error: upsertError } = await supabase
        .from("seed_analysis")
        .upsert(chunk, {
          onConflict: "seed_id",
          ignoreDuplicates: false,
        });
      
      if (upsertError) {
        console.error(`[DemandScoring] Upsert error for chunk ${i / chunkSize + 1}:`, upsertError);
      }
    }
    
    console.log(`[DemandScoring] Saved ${batchResult.results.length} scores to database`);
    
    // -------------------------------------------------------------------------
    // 7. Return results
    // -------------------------------------------------------------------------
    const distribution = calculateDistribution(batchResult.results);
    
    console.log(`[DemandScoring] Distribution: Extreme=${distribution.extreme}, High=${distribution.high}, Moderate=${distribution.moderate}, Low=${distribution.low}`);
    
    return NextResponse.json({
      success: true,
      totalScored: batchResult.totalPhrases,
      totalApiCalls: batchResult.totalApiCalls,
      durationMs: batchResult.durationMs,
      estimatedCostUsd: batchResult.estimatedCostUsd,
      distribution,
      results: batchResult.results.map(r => ({
        seedId: r.seedId,
        score: r.demandScore,
      })),
    });
    
  } catch (error) {
    console.error("[DemandScoring] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
