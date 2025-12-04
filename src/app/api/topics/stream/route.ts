import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAuthenticatedSupabase } from "@/lib/supabase-server";
import { toTitleCase } from "@/lib/utils";
import {
  normalizePhrase,
  getSignificantWords,
  isRelevantToSeed,
  hasOutdatedYear,
  hasSocialMediaSpam,
  fetchChildExpansion,
  SEMANTIC_PREFIXES,
} from "@/lib/topic-service";
import { fetchTopicBatch } from "@/lib/topic-expansion";

// Initialize Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// SMALL BATCH CONFIGURATION
// Split A-Z into 4 batches, Prefix into 2 batches
// This creates natural request patterns and incremental UI updates
// ============================================================================

const AZ_BATCHES = [
  'abcdefg'.split(''),   // A-G (7 letters)
  'hijklmn'.split(''),   // H-N (7 letters)
  'opqrstu'.split(''),   // O-U (7 letters)
  'vwxyz'.split(''),     // V-Z (5 letters)
];

// Type for SSE progress events
interface ProgressEvent {
  type: "progress" | "complete" | "error";
  method: string;
  current: number;
  total: number;
  added: number;
  totalAdded: number;
  query?: string;
}

/**
 * Random delay for respectful API usage (1.5-3 seconds between batches)
 */
function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Save phrases to database (deduped against existing, filtered for relevance and year)
 */
async function savePhrases(
  sessionId: string,
  phrases: string[],
  method: string,
  existingNormalized: Set<string>,
  seedSignificantWords: string[]
): Promise<number> {
  // Filter and dedupe
  const newPhrases: string[] = [];
  
  for (const phrase of phrases) {
    const normalized = normalizePhrase(phrase);
    if (!normalized || existingNormalized.has(normalized)) continue;
    
    // Filter 1: must contain at least one significant word from seed
    if (!isRelevantToSeed(phrase, seedSignificantWords)) {
      continue;
    }
    
    // Filter 2: remove phrases with outdated years
    if (hasOutdatedYear(phrase)) {
      continue;
    }
    
    // Filter 3: remove social media spam (hashtags, @mentions, 3+ emojis)
    if (hasSocialMediaSpam(phrase)) {
      continue;
    }
    
    existingNormalized.add(normalized);
    newPhrases.push(phrase);
  }

  if (newPhrases.length === 0) return 0;

  // Insert into database
  const inserts = newPhrases.map((phrase, index) => ({
    session_id: sessionId,
    phrase: toTitleCase(phrase),
    generation_method: method,
    position: index,
  }));

  const { error } = await supabase.from("seeds").insert(inserts);
  
  if (error) {
    console.error("Failed to save phrases:", error);
    return 0;
  }

  return newPhrases.length;
}

/**
 * Get existing phrases for a session (for deduplication)
 */
async function getExistingPhrases(sessionId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("seeds")
    .select("phrase")
    .eq("session_id", sessionId);

  const normalized = new Set<string>();
  if (data) {
    for (const row of data) {
      normalized.add(normalizePhrase(row.phrase));
    }
  }
  return normalized;
}

/**
 * POST /api/topics/stream
 * 
 * Streams topic results directly to the database.
 * Requires authentication.
 * Returns progress updates via Server-Sent Events (SSE) for real-time UI updates.
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await createAuthenticatedSupabase(request);
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { sessionId, seed, method, parentPhrases } = body;

    if (!sessionId || !seed || !method) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId, seed, or method" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE events
    const sendEvent = async (event: ProgressEvent) => {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      await writer.write(encoder.encode(data));
    };

    // Start the async processing
    (async () => {
      try {
        // Get existing phrases for deduplication
        const existingNormalized = await getExistingPhrases(sessionId);
        const seedNormalized = normalizePhrase(seed);
        existingNormalized.add(seedNormalized); // Don't include the seed itself
        
        // Extract significant words from seed for relevance filtering
        const seedSignificantWords = getSignificantWords(seed);

        let totalAdded = 0;

        switch (method) {
          case "child": {
            if (!parentPhrases || !Array.isArray(parentPhrases) || parentPhrases.length === 0) {
              await sendEvent({
                type: "error",
                method,
                current: 0,
                total: 0,
                added: 0,
                totalAdded: 0,
              });
              break;
            }

            // Use child expansion
            const total = parentPhrases.length * 3; // 3 calls per parent (direct + how to + what does)
            let current = 0;
            
            // Fetch child expansion and report progress manually
            const { expansions } = await fetchChildExpansion(parentPhrases);
            
            // Process each expansion for progress reporting
            for (const expansion of expansions) {
              // Direct expansion
              current++;
              const directAdded = await savePhrases(
                sessionId,
                expansion.directChildren,
                'child_phrase',
                existingNormalized,
                seedSignificantWords
              );
              totalAdded += directAdded;
              await sendEvent({
                type: "progress",
                method,
                current,
                total,
                added: directAdded,
                totalAdded,
                query: expansion.parentPhrase,
              });
              
              // how to expansion
              current++;
              const howToAdded = await savePhrases(
                sessionId,
                expansion.howToChildren,
                'child_prefix_how_to',
                existingNormalized,
                seedSignificantWords
              );
              totalAdded += howToAdded;
              await sendEvent({
                type: "progress",
                method,
                current,
                total,
                added: howToAdded,
                totalAdded,
                query: `how to ${expansion.parentPhrase}`,
              });
              
              // what does expansion
              current++;
              const whatDoesAdded = await savePhrases(
                sessionId,
                expansion.whatDoesChildren,
                'child_prefix_what_does',
                existingNormalized,
                seedSignificantWords
              );
              totalAdded += whatDoesAdded;
              await sendEvent({
                type: "progress",
                method,
                current,
                total,
                added: whatDoesAdded,
                totalAdded,
                query: `what does ${expansion.parentPhrase}`,
              });
            }
            break;
          }

          case "az": {
            // A-Z in 4 SMALL BATCHES with delays between each
            // This creates natural request patterns and incremental UI updates
            const totalBatches = AZ_BATCHES.length;
            
            for (let i = 0; i < AZ_BATCHES.length; i++) {
              const batch = AZ_BATCHES[i];
              const queries = batch.map(letter => `${seed} ${letter}`);
              const batchLabel = `${batch[0].toUpperCase()}-${batch[batch.length - 1].toUpperCase()}`;
              
              // Send "working" event before the service call
              await sendEvent({
                type: "progress",
                method,
                current: i,
                total: totalBatches,
                added: 0,
                totalAdded,
                query: `${seed} [${batchLabel}]...`,
              });
              
              // Fetch this batch
              const result = await fetchTopicBatch(queries);
              
              // Save phrases immediately so they appear in the table
              const added = await savePhrases(
                sessionId,
                result.suggestions,
                'az',
                existingNormalized,
                seedSignificantWords
              );
              totalAdded += added;
              
              // Send completion event for this batch
              await sendEvent({
                type: "progress",
                method,
                current: i + 1,
                total: totalBatches,
                added,
                totalAdded,
                query: `${seed} [${batchLabel}] +${added}`,
              });
              
              // Short delay between batches (not after the last one)
              if (i < AZ_BATCHES.length - 1) {
                await randomDelay(1500, 3000);
              }
            }
            break;
          }

          case "prefix": {
            // Prefix in 2 SMALL BATCHES (9 prefixes each) with delay between
            const prefixArray = [...SEMANTIC_PREFIXES];
            const batch1 = prefixArray.slice(0, 9);
            const batch2 = prefixArray.slice(9);
            const batches = [batch1, batch2].filter(b => b.length > 0);
            const totalBatches = batches.length;
            
            for (let i = 0; i < batches.length; i++) {
              const batch = batches[i];
              const queries = batch.map(prefix => `${prefix} ${seed}`);
              const batchNum = i + 1;
              
              // Send "working" event before the service call
              await sendEvent({
                type: "progress",
                method,
                current: i,
                total: totalBatches,
                added: 0,
                totalAdded,
                query: `Prefix batch ${batchNum}...`,
              });
              
              // Fetch this batch
              const result = await fetchTopicBatch(queries);
              
              // Save phrases immediately so they appear in the table
              const added = await savePhrases(
                sessionId,
                result.suggestions,
                'prefix',
                existingNormalized,
                seedSignificantWords
              );
              totalAdded += added;
              
              // Send completion event for this batch
              await sendEvent({
                type: "progress",
                method,
                current: i + 1,
                total: totalBatches,
                added,
                totalAdded,
                query: `Prefix batch ${batchNum} +${added}`,
              });
              
              // Short delay between batches (not after the last one)
              if (i < batches.length - 1) {
                await randomDelay(1500, 3000);
              }
            }
            break;
          }

          default:
            await sendEvent({
              type: "error",
              method,
              current: 0,
              total: 0,
              added: 0,
              totalAdded: 0,
            });
        }

        // Send completion event
        await sendEvent({
          type: "complete",
          method,
          current: 0,
          total: 0,
          added: 0,
          totalAdded,
        });

      } catch (error) {
        console.error("Stream processing error:", error);
        await sendEvent({
          type: "error",
          method,
          current: 0,
          total: 0,
          added: 0,
          totalAdded: 0,
        });
      } finally {
        await writer.close();
      }
    })();

    // Return the SSE response immediately
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Stream API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
