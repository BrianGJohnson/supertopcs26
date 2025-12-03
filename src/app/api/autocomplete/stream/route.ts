import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toTitleCase } from "@/lib/utils";
import {
  normalizePhrase,
  getSignificantWords,
  isRelevantToSeed,
  hasOutdatedYear,
  hasSocialMediaSpam,
  fetchAZComplete,
  fetchPrefixComplete,
  fetchChildExpansion,
  SEMANTIC_PREFIXES,
} from "@/lib/youtube-autocomplete";

// Initialize Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
 * POST /api/autocomplete/stream
 * 
 * Streams autocomplete results directly to the database.
 * Returns progress updates via Server-Sent Events (SSE) for real-time UI updates.
 */
export async function POST(request: NextRequest) {
  try {
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

            // Use Apify child expansion
            const total = parentPhrases.length * 3; // 3 calls per parent (direct + how to + what does)
            let current = 0;
            
            // Fetch child expansion and report progress manually
            const { allPhrases: childPhrases, expansions } = await fetchChildExpansion(parentPhrases);
            
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
            // Use Apify bulk A-Z expansion (single call with use_suffix: true)
            await sendEvent({
              type: "progress",
              method,
              current: 1,
              total: 1,
              added: 0,
              totalAdded,
              query: `${seed} [a-z]`,
            });

            const { phrases: azPhrases } = await fetchAZComplete(seed);
            const phraseTexts = azPhrases.map(p => p.text);
            const added = await savePhrases(sessionId, phraseTexts, method, existingNormalized, seedSignificantWords);
            totalAdded += added;

            await sendEvent({
              type: "progress",
              method,
              current: 1,
              total: 1,
              added,
              totalAdded,
              query: `${seed} [a-z] complete`,
            });
            break;
          }

          case "prefix": {
            // Use Apify bulk prefix expansion (6 semantic prefixes)
            const total = SEMANTIC_PREFIXES.length;
            let current = 0;

            // Fetch all prefix completions
            const { phrases: prefixPhrases } = await fetchPrefixComplete(seed);
            
            // Save all phrases at once with the method tag
            const phraseTexts = prefixPhrases.map(p => p.text);
            const added = await savePhrases(sessionId, phraseTexts, method, existingNormalized, seedSignificantWords);
            totalAdded += added;

            // Report progress for each prefix (for UI consistency)
            for (const prefix of SEMANTIC_PREFIXES) {
              current++;
              await sendEvent({
                type: "progress",
                method,
                current,
                total,
                added: current === total ? added : 0, // Only report added on last event
                totalAdded,
                query: `${prefix} ${seed}`,
              });
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
