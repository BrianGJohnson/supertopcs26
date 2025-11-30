/**
 * POST /api/sessions/[sessionId]/score-topic
 * 
 * Run Topic Strength scoring on all phrases in a session using GPT-5 Mini.
 * Scores are saved to the seed_analysis table.
 * 
 * @see /docs/topic-strength-scoring.md for full documentation
 */

import { NextRequest, NextResponse } from "next/server";

// Allow up to 5 minutes for large batch scoring (400+ phrases)
export const maxDuration = 300;
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import {
  MODEL_CONFIG,
  BATCH_CONFIG,
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseTopicScoreResponse,
  createBatches,
  calculateDistribution,
  sleep,
  type ScoringResult,
  type TopicScoreResult,
} from "@/lib/topic-scoring";

// =============================================================================
// TYPES
// =============================================================================

interface SeedRow {
  id: string;
  phrase: string;
}

// =============================================================================
// CLIENTS
// =============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse<ScoringResult | { error: string }>> {
  const startTime = Date.now();
  const { sessionId } = await params;
  
  try {
    // -------------------------------------------------------------------------
    // 0. Parse request body for optional seed IDs filter
    // -------------------------------------------------------------------------
    let seedIdsFilter: string[] | null = null;
    try {
      const body = await request.json();
      if (body.seedIds && Array.isArray(body.seedIds) && body.seedIds.length > 0) {
        seedIdsFilter = body.seedIds;
        console.log(`[TopicScoring] Filtering to ${body.seedIds.length} specific phrases`);
      }
    } catch {
      // No body or invalid JSON - that's fine, score all
    }
    
    // -------------------------------------------------------------------------
    // 1. Fetch seeds for the session (optionally filtered)
    // -------------------------------------------------------------------------
    // NOTE: When filtering by many IDs (400+), Supabase's .in() can fail with URL length issues
    // So if we have a large filter list, just fetch all and filter in memory
    let seeds: SeedRow[] = [];
    
    if (seedIdsFilter && seedIdsFilter.length > 100) {
      // Large filter - fetch all seeds and filter in memory
      console.log(`[TopicScoring] Large filter (${seedIdsFilter.length} IDs) - fetching all and filtering in memory`);
      const { data: allSeeds, error: seedsError } = await supabase
        .from("seeds")
        .select("id, phrase")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      
      if (seedsError) {
        console.error("Failed to fetch seeds:", seedsError);
        return NextResponse.json(
          { error: `Failed to fetch phrases: ${seedsError.message}` },
          { status: 500 }
        );
      }
      
      // Filter in memory
      const filterSet = new Set(seedIdsFilter);
      seeds = (allSeeds || []).filter(s => filterSet.has(s.id)) as SeedRow[];
    } else {
      // Small or no filter - use Supabase query
      let query = supabase
        .from("seeds")
        .select("id, phrase")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });
      
      if (seedIdsFilter) {
        query = query.in("id", seedIdsFilter);
      }
      
      const { data, error: seedsError } = await query;
      
      if (seedsError) {
        console.error("Failed to fetch seeds:", seedsError);
        return NextResponse.json(
          { error: `Failed to fetch phrases: ${seedsError.message}` },
          { status: 500 }
        );
      }
      
      seeds = (data || []) as SeedRow[];
    }
    
    if (!seeds || seeds.length === 0) {
      console.log(`[TopicScoring] No seeds found for session ${sessionId}, filter: ${seedIdsFilter?.length || 'all'}`);
      return NextResponse.json(
        { error: `No phrases found for session ${sessionId}` },
        { status: 404 }
      );
    }
    
    console.log(`[TopicScoring] Starting scoring for ${seeds.length} phrases`);
    
    // -------------------------------------------------------------------------
    // 2. Create batches
    // -------------------------------------------------------------------------
    const batches = createBatches(seeds as SeedRow[], BATCH_CONFIG.defaultBatchSize);
    console.log(`[TopicScoring] Created ${batches.length} batches`);
    
    // -------------------------------------------------------------------------
    // 3. Process each batch with retry logic
    // -------------------------------------------------------------------------
    const allResults: TopicScoreResult[] = [];
    const errors: string[] = [];
    const failedBatches: { batchIndex: number; batch: SeedRow[] }[] = [];
    
    // Helper function to process a single batch
    async function processBatch(
      batch: SeedRow[],
      batchLabel: string
    ): Promise<{ scores: (number | null)[]; success: boolean; error?: string }> {
      const phrases = batch.map(s => s.phrase);
      
      try {
        const userPrompt = buildUserPrompt(phrases);
        
        const completion = await openai.chat.completions.create({
          model: MODEL_CONFIG.model,
          temperature: MODEL_CONFIG.temperature,
          top_p: MODEL_CONFIG.top_p,
          max_completion_tokens: MODEL_CONFIG.max_completion_tokens,
          reasoning_effort: MODEL_CONFIG.reasoning_effort,
          response_format: MODEL_CONFIG.response_format,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        } as any);
        
        const content = completion.choices[0]?.message?.content;
        
        if (!content) {
          throw new Error("Empty response from GPT");
        }
        
        console.log(`[TopicScoring] ${batchLabel} raw response (first 300 chars):`, content.slice(0, 300));
        
        const scores = parseTopicScoreResponse(content, batch.length);
        const validCount = scores.filter(s => s !== null).length;
        console.log(`[TopicScoring] ${batchLabel} complete: ${validCount}/${batch.length} valid scores`);
        
        return { scores, success: true };
      } catch (error) {
        return { scores: [], success: false, error: String(error) };
      }
    }
    
    // First pass: process all batches
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchLabel = `Batch ${batchIndex + 1}/${batches.length}`;
      
      console.log(`[TopicScoring] Processing ${batchLabel} (${batch.length} phrases)`);
      
      const result = await processBatch(batch, batchLabel);
      
      if (result.success) {
        // Map scores to results (including nulls for missing)
        for (let i = 0; i < batch.length; i++) {
          if (result.scores[i] !== null) {
            allResults.push({
              seedId: batch[i].id,
              phrase: batch[i].phrase,
              score: result.scores[i] as number,
            });
          }
        }
      } else {
        console.warn(`[TopicScoring] ${batchLabel} failed, will retry: ${result.error}`);
        failedBatches.push({ batchIndex, batch });
      }
      
      // Inter-batch delay
      if (batchIndex < batches.length - 1) {
        await sleep(BATCH_CONFIG.interBatchDelayMs);
      }
    }
    
    // Retry pass: retry failed batches with smaller batch size
    if (failedBatches.length > 0) {
      console.log(`[TopicScoring] Retrying ${failedBatches.length} failed batches with smaller size...`);
      
      for (const { batchIndex, batch } of failedBatches) {
        // Split into smaller batches of 20
        const smallerBatches = createBatches(batch, 20);
        
        for (let subIdx = 0; subIdx < smallerBatches.length; subIdx++) {
          const subBatch = smallerBatches[subIdx];
          const retryLabel = `Retry Batch ${batchIndex + 1}.${subIdx + 1}`;
          
          console.log(`[TopicScoring] ${retryLabel} (${subBatch.length} phrases)`);
          
          const result = await processBatch(subBatch, retryLabel);
          
          if (result.success) {
            for (let i = 0; i < subBatch.length; i++) {
              if (result.scores[i] !== null) {
                allResults.push({
                  seedId: subBatch[i].id,
                  phrase: subBatch[i].phrase,
                  score: result.scores[i] as number,
                });
              }
            }
          } else {
            const errorMsg = `${retryLabel} failed: ${result.error}`;
            console.error(`[TopicScoring] ${errorMsg}`);
            errors.push(errorMsg);
          }
          
          await sleep(BATCH_CONFIG.interBatchDelayMs);
        }
      }
    }
    
    // Final pass: score any remaining unscored phrases individually
    const scoredIds = new Set(allResults.map(r => r.seedId));
    const stillUnscored = (seeds as SeedRow[]).filter(s => !scoredIds.has(s.id));
    
    if (stillUnscored.length > 0) {
      console.log(`[TopicScoring] Final pass: scoring ${stillUnscored.length} remaining phrases individually...`);
      
      for (const seed of stillUnscored) {
        const individualLabel = `Individual: "${seed.phrase.slice(0, 30)}..."`;
        console.log(`[TopicScoring] ${individualLabel}`);
        
        const result = await processBatch([seed], individualLabel);
        
        if (result.success && result.scores[0] !== null) {
          allResults.push({
            seedId: seed.id,
            phrase: seed.phrase,
            score: result.scores[0] as number,
          });
        } else {
          const errorMsg = `Individual scoring failed for "${seed.phrase}": ${result.error || 'null score'}`;
          console.error(`[TopicScoring] ${errorMsg}`);
          errors.push(errorMsg);
        }
        
        await sleep(50); // Shorter delay for individual requests
      }
    }
    
    // -------------------------------------------------------------------------
    // 4. Save scores to database (upsert into seed_analysis)
    // -------------------------------------------------------------------------
    console.log(`[TopicScoring] Saving ${allResults.length} scores to database`);
    
    // Use upsert for seed_analysis
    const upserts = allResults.map(r => ({
      seed_id: r.seedId,
      topic_strength: r.score,
    }));
    
    // Process in chunks to avoid payload limits
    const upsertChunkSize = 100;
    for (let i = 0; i < upserts.length; i += upsertChunkSize) {
      const chunk = upserts.slice(i, i + upsertChunkSize);
      
      const { error: upsertError } = await supabase
        .from("seed_analysis")
        .upsert(chunk, {
          onConflict: "seed_id",
          ignoreDuplicates: false,
        });
      
      if (upsertError) {
        console.error(`[TopicScoring] Upsert error for chunk ${i}:`, upsertError);
        errors.push(`Database save failed for chunk starting at ${i}: ${upsertError.message}`);
      }
    }
    
    // -------------------------------------------------------------------------
    // 5. Build response
    // -------------------------------------------------------------------------
    const scores = allResults.map(r => r.score);
    const distribution = calculateDistribution(scores);
    const duration = Date.now() - startTime;
    
    console.log(`[TopicScoring] Complete in ${duration}ms. Distribution:`, distribution);
    
    const result: ScoringResult = {
      success: errors.length === 0,
      totalScored: allResults.length,
      batchCount: batches.length,
      duration,
      results: allResults,
      distribution,
      errors: errors.length > 0 ? errors : undefined,
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("[TopicScoring] Fatal error:", error);
    return NextResponse.json(
      { error: `Scoring failed: ${error}` },
      { status: 500 }
    );
  }
}
