/**
 * POST /api/sessions/[sessionId]/score-audience-fit
 * 
 * Run Audience Fit scoring on all phrases in a session using GPT-5 Mini.
 * Scores are saved to the seed_analysis table.
 * 
 * Requires Topic Strength to be complete first.
 * 
 * @see /docs/audience-fit-scoring.md for full documentation
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
  buildAudienceFitPrompt,
  parseAudienceFitResponse,
  createBatches,
  calculateDistribution,
  sleep,
  type AudienceFitScoringResult,
  type AudienceFitResult,
  type CreatorProfile,
} from "@/lib/audience-fit-scoring";

// =============================================================================
// TYPES
// =============================================================================

interface SeedRow {
  id: string;
  phrase: string;
}

interface ChannelData {
  niche: string | null;
  content_style: number | null;
  content_style_name: string | null;
  video_formats: string[] | null;
  audience_who: string | null;
  audience_struggle: string | null;
  audience_goal: string | null;
  audience_expertise: string | null;
  primary_monetization: string | null;
  monetization_priority: string[] | null;
  monetization_methods: string[] | null;
  products_description: string | null;
  affiliate_products: string | null;
  sponsorship_niche: string | null;
  pillar_strategy: {
    evergreen?: { subNiches?: Array<{ name: string }> };
    trending?: { subNiches?: Array<{ name: string }> };
    monetization?: { subNiches?: Array<{ name: string }> };
  } | null;
}

interface SessionData {
  name: string;
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
): Promise<NextResponse<AudienceFitScoringResult | { error: string }>> {
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
        console.log(`[AudienceFit] Filtering to ${body.seedIds.length} specific phrases`);
      }
    } catch {
      // No body or invalid JSON - score all
    }
    
    // -------------------------------------------------------------------------
    // 1. Get session info (for seed phrase)
    // -------------------------------------------------------------------------
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("name, channel_id, user_id")
      .eq("id", sessionId)
      .single();
    
    if (sessionError || !session) {
      console.error("Failed to fetch session:", sessionError);
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      );
    }
    
    // -------------------------------------------------------------------------
    // 2. Get channel/creator profile
    // -------------------------------------------------------------------------
    // First try by channel_id, then fall back to user's default channel
    let channelQuery = supabase
      .from("channels")
      .select(`
        niche,
        content_style,
        content_style_name,
        video_formats,
        audience_who,
        audience_struggle,
        audience_goal,
        audience_expertise,
        primary_monetization,
        monetization_priority,
        monetization_methods,
        products_description,
        affiliate_products,
        sponsorship_niche,
        pillar_strategy
      `);
    
    // Use channel_id if available, otherwise find user's default channel
    if (session.channel_id) {
      channelQuery = channelQuery.eq("id", session.channel_id);
    } else {
      channelQuery = channelQuery.eq("user_id", session.user_id).eq("is_default", true);
    }
    
    const { data: channel, error: channelError } = await channelQuery.single();
    
    if (channelError || !channel) {
      console.error("Failed to fetch channel:", channelError);
      return NextResponse.json(
        { error: "Channel not found. Complete onboarding first." },
        { status: 400 }
      );
    }
    
    const channelData = channel as ChannelData;
    
    // Validate we have minimum required data
    if (!channelData.niche) {
      return NextResponse.json(
        { error: "Channel niche not set. Complete onboarding first." },
        { status: 400 }
      );
    }
    
    // Build creator profile
    const primaryMoney = channelData.primary_monetization || 
                         channelData.monetization_priority?.[0] || 
                         channelData.monetization_methods?.[0] || 
                         "adsense";
    
    const profile: CreatorProfile = {
      niche: channelData.niche,
      contentStyleNumber: channelData.content_style || 4, // Default to Mentor
      contentStyleName: channelData.content_style_name || "The Mentor",
      videoFormats: channelData.video_formats || [],
      audienceWho: channelData.audience_who || "",
      audienceStruggle: channelData.audience_struggle || "",
      audienceGoal: channelData.audience_goal || "",
      audienceExpertise: channelData.audience_expertise || "mixed",
      primaryMonetization: primaryMoney,
      productsDescription: channelData.products_description || undefined,
      affiliateProducts: channelData.affiliate_products || undefined,
      sponsorshipNiche: channelData.sponsorship_niche || undefined,
      pillarStrategy: channelData.pillar_strategy || undefined,
      seedPhrase: session.name,
    };
    
    console.log(`[AudienceFit] Creator profile:`, {
      niche: profile.niche,
      style: `${profile.contentStyleName} (${profile.contentStyleNumber}/7)`,
      monetization: profile.primaryMonetization,
      hasProducts: !!profile.productsDescription,
      hasAffiliates: !!profile.affiliateProducts,
      hasPillars: !!profile.pillarStrategy,
    });
    
    // -------------------------------------------------------------------------
    // 3. Fetch seeds for the session
    // -------------------------------------------------------------------------
    let seeds: SeedRow[] = [];
    
    if (seedIdsFilter && seedIdsFilter.length > 100) {
      // Large filter - fetch all and filter in memory
      console.log(`[AudienceFit] Large filter (${seedIdsFilter.length} IDs) - fetching all`);
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
      
      const filterSet = new Set(seedIdsFilter);
      seeds = (allSeeds || []).filter(s => filterSet.has(s.id)) as SeedRow[];
    } else {
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
      return NextResponse.json(
        { error: `No phrases found for session ${sessionId}` },
        { status: 404 }
      );
    }
    
    console.log(`[AudienceFit] Starting scoring for ${seeds.length} phrases`);
    
    // -------------------------------------------------------------------------
    // 4. Create batches
    // -------------------------------------------------------------------------
    const batches = createBatches(seeds, BATCH_CONFIG.defaultBatchSize);
    console.log(`[AudienceFit] Created ${batches.length} batches`);
    
    // -------------------------------------------------------------------------
    // 5. Process each batch
    // -------------------------------------------------------------------------
    const allResults: AudienceFitResult[] = [];
    const errors: string[] = [];
    const failedBatches: { batchIndex: number; batch: SeedRow[] }[] = [];
    
    async function processBatch(
      batch: SeedRow[],
      batchLabel: string
    ): Promise<{ scores: (number | null)[]; success: boolean; error?: string }> {
      const phrases = batch.map(s => s.phrase);
      
      try {
        const userPrompt = buildAudienceFitPrompt(profile, phrases);
        
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
        
        console.log(`[AudienceFit] ${batchLabel} raw response (first 300 chars):`, content.slice(0, 300));
        
        const scores = parseAudienceFitResponse(content, batch.length);
        const validCount = scores.filter(s => s !== null).length;
        console.log(`[AudienceFit] ${batchLabel} complete: ${validCount}/${batch.length} valid scores`);
        
        return { scores, success: true };
      } catch (error) {
        return { scores: [], success: false, error: String(error) };
      }
    }
    
    // First pass
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchLabel = `Batch ${batchIndex + 1}/${batches.length}`;
      
      console.log(`[AudienceFit] Processing ${batchLabel} (${batch.length} phrases)`);
      
      const result = await processBatch(batch, batchLabel);
      
      if (result.success) {
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
        console.warn(`[AudienceFit] ${batchLabel} failed, will retry: ${result.error}`);
        failedBatches.push({ batchIndex, batch });
      }
      
      if (batchIndex < batches.length - 1) {
        await sleep(BATCH_CONFIG.interBatchDelayMs);
      }
    }
    
    // Retry pass
    if (failedBatches.length > 0) {
      console.log(`[AudienceFit] Retrying ${failedBatches.length} failed batches...`);
      
      for (const { batchIndex, batch } of failedBatches) {
        const smallerBatches = createBatches(batch, 20);
        
        for (let subIdx = 0; subIdx < smallerBatches.length; subIdx++) {
          const subBatch = smallerBatches[subIdx];
          const retryLabel = `Retry Batch ${batchIndex + 1}.${subIdx + 1}`;
          
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
            errors.push(`${retryLabel} failed: ${result.error}`);
          }
          
          await sleep(BATCH_CONFIG.interBatchDelayMs);
        }
      }
    }
    
    // Final pass for stragglers
    const scoredIds = new Set(allResults.map(r => r.seedId));
    const stillUnscored = seeds.filter(s => !scoredIds.has(s.id));
    
    if (stillUnscored.length > 0) {
      console.log(`[AudienceFit] Final pass: ${stillUnscored.length} remaining phrases`);
      
      for (const seed of stillUnscored) {
        const result = await processBatch([seed], `Individual: "${seed.phrase.slice(0, 30)}..."`);
        
        if (result.success && result.scores[0] !== null) {
          allResults.push({
            seedId: seed.id,
            phrase: seed.phrase,
            score: result.scores[0] as number,
          });
        } else {
          errors.push(`Individual scoring failed for "${seed.phrase}"`);
        }
        
        await sleep(50);
      }
    }
    
    // -------------------------------------------------------------------------
    // 6. Save scores to database
    // -------------------------------------------------------------------------
    console.log(`[AudienceFit] Saving ${allResults.length} scores to database`);
    
    const upserts = allResults.map(r => ({
      seed_id: r.seedId,
      audience_fit: r.score,
    }));
    
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
        console.error(`[AudienceFit] Upsert error for chunk ${i}:`, upsertError);
        errors.push(`Database save failed for chunk starting at ${i}: ${upsertError.message}`);
      }
    }
    
    // -------------------------------------------------------------------------
    // 7. Build response
    // -------------------------------------------------------------------------
    const scores = allResults.map(r => r.score);
    const distribution = calculateDistribution(scores);
    const duration = Date.now() - startTime;
    
    console.log(`[AudienceFit] Complete in ${duration}ms. Distribution:`, distribution);
    
    const result: AudienceFitScoringResult = {
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
    console.error("[AudienceFit] Fatal error:", error);
    return NextResponse.json(
      { error: `Scoring failed: ${error}` },
      { status: 500 }
    );
  }
}
