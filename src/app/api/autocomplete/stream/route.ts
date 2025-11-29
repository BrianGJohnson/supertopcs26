import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toTitleCase } from "@/lib/utils";
import {
  randomDelay,
  shuffle,
  normalizePhrase,
  fetchAutocomplete,
  getSignificantWords,
  isRelevantToSeed,
  hasOutdatedYear,
  hasSocialMediaSpam,
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

            const childPrefixes = ["how to", "what does"];
            const shuffledParents = shuffle(parentPhrases);
            const total = shuffledParents.length * (1 + childPrefixes.length); // Total queries
            let current = 0;

            for (let p = 0; p < shuffledParents.length; p++) {
              const parent = shuffledParents[p];

              // Direct expansion
              current++;
              const directResults = await fetchAutocomplete(parent);
              const directAdded = await savePhrases(sessionId, directResults, method, existingNormalized, seedSignificantWords);
              totalAdded += directAdded;
              
              await sendEvent({
                type: "progress",
                method,
                current,
                total,
                added: directAdded,
                totalAdded,
                query: parent,
              });
              
              await randomDelay(1200, 1800);

              // Prefix expansions
              for (let i = 0; i < childPrefixes.length; i++) {
                const prefix = childPrefixes[i];
                current++;
                const query = `${prefix} ${parent}`;
                const prefixResults = await fetchAutocomplete(query);
                const prefixAdded = await savePhrases(sessionId, prefixResults, method, existingNormalized, seedSignificantWords);
                totalAdded += prefixAdded;

                await sendEvent({
                  type: "progress",
                  method,
                  current,
                  total,
                  added: prefixAdded,
                  totalAdded,
                  query,
                });

                if (i < childPrefixes.length - 1 || p < shuffledParents.length - 1) {
                  await randomDelay(1200, 1800);
                }
              }

              // Occasional longer pause between parent phrases
              if (p < shuffledParents.length - 1 && p % 3 === 2) {
                await randomDelay(2500, 4000);
              }
            }
            break;
          }

          case "az": {
            const alphabet = shuffle("abcdefghijklmnopqrstuvwxyz".split(""));
            const total = alphabet.length;

            for (let i = 0; i < alphabet.length; i++) {
              const letter = alphabet[i];
              const current = i + 1;
              const query = `${seed} ${letter}`;

              const results = await fetchAutocomplete(query);
              const added = await savePhrases(sessionId, results, method, existingNormalized, seedSignificantWords);
              totalAdded += added;

              await sendEvent({
                type: "progress",
                method,
                current,
                total,
                added,
                totalAdded,
                query,
              });

              if (i < alphabet.length - 1) {
                await randomDelay(1500, 2000);
                if (i > 0 && i % (5 + Math.floor(Math.random() * 4)) === 0) {
                  await randomDelay(2000, 3500);
                }
              }
            }
            break;
          }

          case "prefix": {
            // Ordered by probability of generating quality results
            // Tier 1: Single words (highest probability)
            // Tier 2: Two-word phrases (strong patterns)
            // Tier 3: Action single words
            const prefixes = [
              // Tier 1: Single Words
              "how", "why", "what", "best", "when",
              "is", "does", "can", "will", "should",
              // Tier 2: Two-Word Phrases
              "how to", "how does", "what is", "what does", "why does",
              // Tier 3: Action Single Words
              "fix", "improve", "learn", "tips",
            ];
            const total = prefixes.length;

            for (let i = 0; i < prefixes.length; i++) {
              const prefix = prefixes[i];
              const current = i + 1;
              const query = `${prefix} ${seed}`;

              const results = await fetchAutocomplete(query);
              const added = await savePhrases(sessionId, results, method, existingNormalized, seedSignificantWords);
              totalAdded += added;

              await sendEvent({
                type: "progress",
                method,
                current,
                total,
                added,
                totalAdded,
                query,
              });

              if (i < prefixes.length - 1) {
                await randomDelay(1500, 2000);
                if (i > 0 && i % (5 + Math.floor(Math.random() * 4)) === 0) {
                  await randomDelay(2000, 3500);
                }
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
