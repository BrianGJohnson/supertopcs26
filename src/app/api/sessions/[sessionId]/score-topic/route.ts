/**
 * POST /api/sessions/[sessionId]/score-topic
 * 
 * Run Topic Strength scoring on all phrases in a session using GPT-4o Mini.
 * Scores are saved to the seed_analysis table.
 * 
 * @see /docs/topic-strength-scoring.md for full documentation
 */

import { NextRequest, NextResponse } from "next/server";
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
    // 1. Fetch all seeds for the session
    // -------------------------------------------------------------------------
    const { data: seeds, error: seedsError } = await supabase
      .from("seeds")
      .select("id, phrase")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    
    if (seedsError) {
      console.error("Failed to fetch seeds:", seedsError);
      return NextResponse.json(
        { error: "Failed to fetch phrases" },
        { status: 500 }
      );
    }
    
    if (!seeds || seeds.length === 0) {
      return NextResponse.json(
        { error: "No phrases found for this session" },
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
    // 3. Process each batch
    // -------------------------------------------------------------------------
    const allResults: TopicScoreResult[] = [];
    const errors: string[] = [];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const phrases = batch.map(s => s.phrase);
      
      console.log(`[TopicScoring] Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} phrases)`);
      
      try {
        // Build prompt
        const userPrompt = buildUserPrompt(phrases);
        
        // Call OpenAI
        const completion = await openai.chat.completions.create({
          model: MODEL_CONFIG.model,
          temperature: MODEL_CONFIG.temperature,
          top_p: MODEL_CONFIG.top_p,
          max_completion_tokens: MODEL_CONFIG.max_completion_tokens,
          response_format: MODEL_CONFIG.response_format,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        });
        
        const content = completion.choices[0]?.message?.content;
        
        if (!content) {
          throw new Error("Empty response from GPT");
        }
        
        // Parse scores
        const scores = parseTopicScoreResponse(content, batch.length);
        
        // Map scores to results
        for (let i = 0; i < batch.length; i++) {
          allResults.push({
            seedId: batch[i].id,
            phrase: batch[i].phrase,
            score: scores[i],
          });
        }
        
        console.log(`[TopicScoring] Batch ${batchIndex + 1} complete: scores=${scores.slice(0, 5).join(',')}...`);
        
      } catch (batchError) {
        const errorMsg = `Batch ${batchIndex + 1} failed: ${batchError}`;
        console.error(`[TopicScoring] ${errorMsg}`);
        errors.push(errorMsg);
        
        // Assign default scores for failed batch
        for (const seed of batch) {
          allResults.push({
            seedId: seed.id,
            phrase: seed.phrase,
            score: 50, // Default middle score
          });
        }
      }
      
      // Inter-batch delay (except for last batch)
      if (batchIndex < batches.length - 1) {
        await sleep(BATCH_CONFIG.interBatchDelayMs);
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
