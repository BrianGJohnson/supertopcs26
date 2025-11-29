import { NextRequest, NextResponse } from "next/server";
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
 * Returns progress updates via Server-Sent Events.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, seed, method, parentPhrases } = body;

    if (!sessionId || !seed || !method) {
      return NextResponse.json(
        { error: "Missing sessionId, seed, or method" },
        { status: 400 }
      );
    }

    // Get existing phrases for deduplication
    const existingNormalized = await getExistingPhrases(sessionId);
    const seedNormalized = normalizePhrase(seed);
    existingNormalized.add(seedNormalized); // Don't include the seed itself
    
    // Extract significant words from seed for relevance filtering
    const seedSignificantWords = getSignificantWords(seed);

    let totalAdded = 0;
    let progress = { current: 0, total: 0 };

    switch (method) {
      case "child": {
        if (!parentPhrases || !Array.isArray(parentPhrases) || parentPhrases.length === 0) {
          return NextResponse.json(
            { error: "Child method requires parentPhrases array" },
            { status: 400 }
          );
        }

        const childPrefixes = ["how to", "what does"];
        const shuffledParents = shuffle(parentPhrases);
        progress.total = shuffledParents.length;

        for (let p = 0; p < shuffledParents.length; p++) {
          const parent = shuffledParents[p];
          progress.current = p + 1;

          // Direct expansion
          const directResults = await fetchAutocomplete(parent);
          const directAdded = await savePhrases(sessionId, directResults, method, existingNormalized, seedSignificantWords);
          totalAdded += directAdded;
          await randomDelay(1200, 1800);

          // Prefix expansions
          for (let i = 0; i < childPrefixes.length; i++) {
            const prefix = childPrefixes[i];
            const prefixResults = await fetchAutocomplete(`${prefix} ${parent}`);
            const prefixAdded = await savePhrases(sessionId, prefixResults, method, existingNormalized, seedSignificantWords);
            totalAdded += prefixAdded;

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
        progress.total = alphabet.length;

        for (let i = 0; i < alphabet.length; i++) {
          const letter = alphabet[i];
          progress.current = i + 1;

          const results = await fetchAutocomplete(`${seed} ${letter}`);
          const added = await savePhrases(sessionId, results, method, existingNormalized, seedSignificantWords);
          totalAdded += added;

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
        const prefixes = shuffle([
          "what", "what does", "why", "how", "how to",
          "does", "can", "is", "will", "why does",
          "problems", "tip", "how does", "understand", "explain",
          "change", "update", "fix", "guide to", "learn",
          "broken", "improve", "help with", "strategy", "plan for",
        ]);
        progress.total = prefixes.length;

        for (let i = 0; i < prefixes.length; i++) {
          const prefix = prefixes[i];
          progress.current = i + 1;

          const results = await fetchAutocomplete(`${prefix} ${seed}`);
          const added = await savePhrases(sessionId, results, method, existingNormalized, seedSignificantWords);
          totalAdded += added;

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
        return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      method,
      totalAdded,
      progress,
    });
  } catch (error) {
    console.error("Stream API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
