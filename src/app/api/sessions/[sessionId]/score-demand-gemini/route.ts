/**
 * POST /api/sessions/[sessionId]/score-demand-gemini
 * 
 * Run Gemini-based Demand scoring on phrases using YouTube autocomplete data.
 * Uses the three-layer approach: Ecosystem + Density + Relevancy
 * 
 * This is separate from the original score-demand endpoint so we can compare results.
 * 
 * @see /docs/1-gemini-demand-scoring.md for full documentation
 */

import { NextRequest, NextResponse } from "next/server";

// Allow up to 3 minutes for batch scoring
export const maxDuration = 180;

import { createClient } from "@supabase/supabase-js";
import {
  fetchAutocompleteBatch,
  groupResultsBySeed,
  analyzePhrase,
  createBatches,
  BATCH_CONFIG,
  // Gemini functions
  getEcosystemScore,
  createGeminiContext,
  scoreWithGemini,
  type GeminiDemandResult,
} from "@/lib/demand-scoring";

// =============================================================================
// TYPES
// =============================================================================

interface SeedRow {
  id: string;
  phrase: string;
  source?: string;
}

interface GeminiScoringResult {
  success: boolean;
  totalScored: number;
  totalApiCalls: number;
  durationMs: number;
  estimatedCostUsd: number;
  sessionSize: number;
  ecosystemScore: number;
  seedScore: number;
  distribution: {
    extreme: number;  // 85-99
    high: number;     // 65-84
    moderate: number; // 40-64
    low: number;      // 20-39
    veryLow: number;  // 0-19
  };
  results: { 
    seedId: string; 
    score: number;
    ecosystemScore: number;
    autocompleteSuggestionsScore: number;
    relevancyScore: number;
    inheritanceBonus: number;
    matchStrength?: string;
    parentPhrase?: string;
  }[];
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
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a random delay with jitter for natural pacing
 */
function getRandomDelay(): number {
  const minDelay = 1500;
  const maxDelay = 3500;
  let delay = minDelay + Math.random() * (maxDelay - minDelay);
  
  // 30% chance of extra delay
  if (Math.random() < 0.3) {
    delay += 2000;
  }
  
  return delay;
}

/**
 * Calculate score distribution for Gemini results
 */
function calculateDistribution(results: GeminiDemandResult[]): GeminiScoringResult["distribution"] {
  const dist = { extreme: 0, high: 0, moderate: 0, low: 0, veryLow: 0 };
  
  for (const r of results) {
    if (r.finalScore >= 85) dist.extreme++;
    else if (r.finalScore >= 65) dist.high++;
    else if (r.finalScore >= 40) dist.moderate++;
    else if (r.finalScore >= 20) dist.low++;
    else dist.veryLow++;
  }
  
  return dist;
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse<GeminiScoringResult | { error: string }>> {
  const { sessionId } = await params;
  const startTime = Date.now();
  
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
        },
        { status: 400 }
      );
    }
    
    console.log(`[GeminiDemand] Starting scoring for ${seedIds.length} phrases in session ${sessionId}`);
    
    // -------------------------------------------------------------------------
    // 3. Fetch seeds by IDs (including generation_method to identify Top 15)
    // -------------------------------------------------------------------------
    const { data: seeds, error: seedsError } = await supabase
      .from("seeds")
      .select("id, phrase, generation_method")
      .eq("session_id", sessionId)
      .in("id", seedIds);
    
    if (seedsError || !seeds || seeds.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch phrases" },
        { status: 500 }
      );
    }
    
    // -------------------------------------------------------------------------
    // 4. Get total session phrase count for ecosystem score
    // -------------------------------------------------------------------------
    const { count: sessionSize } = await supabase
      .from("seeds")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    
    const totalPhrases = sessionSize || seeds.length;
    const ecosystemScore = getEcosystemScore(totalPhrases);
    
    console.log(`[GeminiDemand] Session size: ${totalPhrases}, Ecosystem score: ${ecosystemScore}`);
    
    // -------------------------------------------------------------------------
    // 5. Identify Top 15 phrases (generation_method = 'top10')
    // -------------------------------------------------------------------------
    const top15Seeds = seeds.filter(s => s.generation_method === 'top10').slice(0, 15);
    const expansionSeeds = seeds.filter(s => s.generation_method !== 'top10' && s.generation_method !== 'seed');
    const seedPhrase = seeds.find(s => s.generation_method === 'seed');
    
    console.log(`[GeminiDemand] Found ${top15Seeds.length} Top 15 phrases, ${expansionSeeds.length} expansion phrases`);
    
    // -------------------------------------------------------------------------
    // 6. Fetch autocomplete data for Top 15 first
    // -------------------------------------------------------------------------
    let totalApiCalls = 0;
    const top15Data: { 
      id: string;
      phrase: string; 
      position: number; 
      suggestionCount: number; 
      exactMatchPct: number; 
      topicMatchPct: number;
    }[] = [];
    
    if (top15Seeds.length > 0) {
      const top15Batches = createBatches(top15Seeds, BATCH_CONFIG.phrasesPerBatch);
      
      for (let i = 0; i < top15Batches.length; i++) {
        const batch = top15Batches[i];
        const phrases = batch.map(s => s.phrase);
        
        if (i > 0) {
          await sleep(getRandomDelay());
        }
        
        console.log(`[GeminiDemand] Top 15 batch ${i + 1}/${top15Batches.length}`);
        
        try {
          const rawResults = await fetchAutocompleteBatch(phrases);
          totalApiCalls++;
          
          const grouped = groupResultsBySeed(rawResults);
          
          for (let j = 0; j < batch.length; j++) {
            const seed = batch[j];
            const suggestions = grouped.get(seed.phrase) || [];
            const analysis = analyzePhrase(seed.phrase, suggestions);
            
            top15Data.push({
              id: seed.id,
              phrase: seed.phrase,
              position: top15Seeds.indexOf(seed) + 1,
              suggestionCount: analysis.suggestionCount,
              exactMatchPct: analysis.exactMatchPct,
              topicMatchPct: analysis.topicMatchPct,
            });
          }
        } catch (error) {
          console.error(`[GeminiDemand] Top 15 batch ${i + 1} failed:`, error);
          // Add with 0 values
          for (const seed of batch) {
            top15Data.push({
              id: seed.id,
              phrase: seed.phrase,
              position: top15Seeds.indexOf(seed) + 1,
              suggestionCount: 0,
              exactMatchPct: 0,
              topicMatchPct: 0,
            });
          }
        }
      }
    }
    
    // -------------------------------------------------------------------------
    // 7. Create Gemini context with Top 15 anchors
    // -------------------------------------------------------------------------
    const geminiContext = createGeminiContext(totalPhrases, top15Data);
    
    console.log(`[GeminiDemand] Context created - Seed score: ${geminiContext.seedScore}`);
    
    // -------------------------------------------------------------------------
    // 8. Score Top 15 phrases
    // -------------------------------------------------------------------------
    const allResults: (GeminiDemandResult & { seedId: string })[] = [];
    
    for (const t15 of top15Data) {
      const result = scoreWithGemini(
        t15.phrase,
        t15.suggestionCount,
        t15.exactMatchPct,
        t15.topicMatchPct,
        geminiContext,
        true // isTop15
      );
      
      allResults.push({
        ...result,
        seedId: t15.id,
      });
    }
    
    // -------------------------------------------------------------------------
    // 9. Fetch autocomplete and score expansion phrases
    // -------------------------------------------------------------------------
    if (expansionSeeds.length > 0) {
      const expansionBatches = createBatches(expansionSeeds, BATCH_CONFIG.phrasesPerBatch);
      
      for (let i = 0; i < expansionBatches.length; i++) {
        const batch = expansionBatches[i];
        const phrases = batch.map(s => s.phrase);
        
        await sleep(getRandomDelay());
        
        console.log(`[GeminiDemand] Expansion batch ${i + 1}/${expansionBatches.length}`);
        
        try {
          const rawResults = await fetchAutocompleteBatch(phrases);
          totalApiCalls++;
          
          const grouped = groupResultsBySeed(rawResults);
          
          for (const seed of batch) {
            const suggestions = grouped.get(seed.phrase) || [];
            const analysis = analyzePhrase(seed.phrase, suggestions);
            
            const result = scoreWithGemini(
              seed.phrase,
              analysis.suggestionCount,
              analysis.exactMatchPct,
              analysis.topicMatchPct,
              geminiContext,
              false // not Top 15
            );
            
            allResults.push({
              ...result,
              seedId: seed.id,
            });
          }
        } catch (error) {
          console.error(`[GeminiDemand] Expansion batch ${i + 1} failed:`, error);
          
          for (const seed of batch) {
            allResults.push({
              phrase: seed.phrase,
              ecosystemScore,
              autocompleteSuggestionsScore: 0,
              relevancyScore: 0,
              inheritanceBonus: 0,
              rawScore: ecosystemScore,
              finalScore: Math.min(ecosystemScore, geminiContext.seedScore - 15),
              cap: geminiContext.seedScore - 15,
              matchStrength: 'none',
              seedId: seed.id,
            });
          }
        }
      }
    }
    
    // -------------------------------------------------------------------------
    // 10. Add seed phrase score if included
    // -------------------------------------------------------------------------
    if (seedPhrase) {
      allResults.push({
        phrase: seedPhrase.phrase,
        ecosystemScore,
        autocompleteSuggestionsScore: 0,
        relevancyScore: 0,
        inheritanceBonus: 0,
        rawScore: geminiContext.seedScore,
        finalScore: geminiContext.seedScore,
        cap: 92,
        matchStrength: 'none',
        seedId: seedPhrase.id,
      });
    }
    
    // -------------------------------------------------------------------------
    // 11. Save scores to database
    // -------------------------------------------------------------------------
    const upsertData = allResults.map(r => ({
      seed_id: r.seedId,
      demand: r.finalScore,
      demand_base: r.rawScore,
      extra: {
        gemini_v1: {
          ecosystemScore: r.ecosystemScore,
          autocompleteSuggestionsScore: r.autocompleteSuggestionsScore,
          relevancyScore: r.relevancyScore,
          inheritanceBonus: r.inheritanceBonus,
          matchStrength: r.matchStrength,
          parentPhrase: r.parentPhrase,
          cap: r.cap,
          rawScore: r.rawScore,
          finalScore: r.finalScore,
          sessionSize: totalPhrases,
          scoredAt: new Date().toISOString(),
        },
      },
    }));
    
    // Batch upsert
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
        console.error(`[GeminiDemand] Upsert error:`, upsertError);
      }
    }
    
    // -------------------------------------------------------------------------
    // 12. Return results
    // -------------------------------------------------------------------------
    const durationMs = Date.now() - startTime;
    const distribution = calculateDistribution(allResults);
    const estimatedCostUsd = totalApiCalls * BATCH_CONFIG.estimatedCostPerCall;
    
    console.log(`[GeminiDemand] Complete: ${allResults.length} phrases, ${totalApiCalls} API calls, ${durationMs}ms`);
    console.log(`[GeminiDemand] Distribution: Extreme=${distribution.extreme}, High=${distribution.high}, Moderate=${distribution.moderate}, Low=${distribution.low}, VeryLow=${distribution.veryLow}`);
    
    return NextResponse.json({
      success: true,
      totalScored: allResults.length,
      totalApiCalls,
      durationMs,
      estimatedCostUsd,
      sessionSize: totalPhrases,
      ecosystemScore,
      seedScore: geminiContext.seedScore,
      distribution,
      results: allResults.map(r => ({
        seedId: r.seedId,
        score: r.finalScore,
        ecosystemScore: r.ecosystemScore,
        autocompleteSuggestionsScore: r.autocompleteSuggestionsScore,
        relevancyScore: r.relevancyScore,
        inheritanceBonus: r.inheritanceBonus,
        matchStrength: r.matchStrength,
        parentPhrase: r.parentPhrase,
      })),
    });
    
  } catch (error) {
    console.error("[GeminiDemand] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
