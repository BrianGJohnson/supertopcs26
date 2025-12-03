/**
 * Apify YouTube Autocomplete Module (v3.0)
 * 
 * This module provides YouTube autocomplete suggestions via our custom Apify actor.
 * Uses forward_flight~my-actor for reliable, scalable autocomplete access.
 * 
 * KEY FEATURES:
 * - Custom actor with full control
 * - Batch queries in single calls
 * - Up to 14 suggestions per query
 * - ~14s for full A-Z (26 queries)
 * 
 * @see /docs/apify-integration-guide.md for full documentation
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Response format from our custom Apify actor (forward_flight~my-actor)
 * Each suggestion is a separate object with seed and suggestion
 */
export interface ApifyAutocompleteResponse {
  seed: string;
  suggestion: string;
}

export interface ApifyCallResult {
  query: string;
  suggestions: string[];
  durationMs: number;
  success: boolean;
  error?: string;
  retryCount: number;
}

export interface ApifyBulkCallResult {
  queries: string[];
  suggestions: string[];
  durationMs: number;
  success: boolean;
  error?: string;
  retryCount: number;
  queryCount: number;
}

export interface TaggedPhrase {
  text: string;
  textNormalized: string;
  popularitySource: string;
  tagDisplay: string;
  tagSortPriority: number;
  sources: string[];
  parentPhraseText?: string;
}

export interface ChildExpansionResult {
  parentPhrase: string;
  directChildren: string[];
  howToChildren: string[];
  whatDoesChildren: string[];
  allChildren: string[];
}

export interface ExpansionReport {
  sessionId: string;
  startTime: Date;
  endTime: Date;
  
  // Timing
  totalDurationMs: number;
  averageDelayMs: number;
  averageCallDurationMs: number;
  
  // Calls
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  
  // Results
  totalSuggestions: number;
  uniqueSuggestions: number;
  
  // Cost (estimated based on Apify pricing)
  estimatedCostUsd: number;
  
  // Modes used
  modesExecuted: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Retry configuration for failed requests
 */
export const APIFY_RETRY_CONFIG = {
  maxRetries: 2,
  baseBackoffMs: 1000,
  maxBackoffMs: 5000,
  retryableStatuses: [429, 500, 502, 503, 504] as number[],
};

/**
 * Timeout for each Apify API call
 */
export const APIFY_TIMEOUT_MS = 30000; // 30 seconds (Apify runs can take time)

/**
 * Cost estimation per call (in USD)
 * Based on Apify's compute unit pricing
 */
export const ESTIMATED_COST_PER_CALL_USD = 0.001;

/**
 * Semantic prefixes for Prefix Complete (18 optimized prefixes)
 * Ordered by value: singles first, then high-value phrases
 * No shuffle needed - batch mode sends all at once
 * 
 * @see /docs/apify-expansion-methods.md for full documentation
 */
export const SEMANTIC_PREFIXES = [
  // === HIGH VALUE SINGLES (1-6) ===
  'how',         // General how questions
  'what',        // Definitions
  'why',         // Reasoning/motivation
  'best',        // Comparisons
  'tips',        // Actionable advice
  'can',         // Possibilities
  
  // === HIGH VALUE PHRASES (7-9) ===
  'how to',      // #1 tutorial intent
  'what is',     // Definitions
  'what does',   // Explanations
  
  // === SECONDARY SINGLES (10-12) ===
  'fix',         // Problem-solving
  'learn',       // Education
  'improve',     // Enhancement
  
  // === SECONDARY PHRASES (13-18) ===
  'why does',    // Deep understanding
  'how does',    // Mechanics
  'is it',       // Verification
  'can you',     // Capability
  'guide to',    // Walkthroughs
  'should I',    // Decision-making
] as const;

/**
 * Child expansion prefixes
 */
export const CHILD_PREFIXES = ['how to', 'what does'] as const;

/**
 * Tag configuration for each expansion mode
 * CRITICAL: These must not change - they are the backbone of scoring
 */
export const TAG_CONFIG = {
  simple_top10: {
    popularitySource: 'simple_top10',
    tagDisplay: 'Top-10',
    tagSortPriority: 1,
  },
  child_phrase: {
    popularitySource: 'child_phrase',
    tagDisplay: 'Child',
    tagSortPriority: 2,
  },
  child_prefix_how_to: {
    popularitySource: 'child_prefix_how_to',
    tagDisplay: 'Child',
    tagSortPriority: 2,
  },
  child_prefix_what_does: {
    popularitySource: 'child_prefix_what_does',
    tagDisplay: 'Child',
    tagSortPriority: 2,
  },
  a2z_complete: {
    popularitySource: 'a2z_complete',
    tagDisplay: 'A-to-Z -',
    tagSortPriority: 3,
  },
  prefix_complete: {
    popularitySource: 'prefix_complete',
    tagDisplay: 'Prefix -',
    tagSortPriority: 4,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep for the specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff for retries
 */
function calculateBackoff(retryCount: number): number {
  const backoff = APIFY_RETRY_CONFIG.baseBackoffMs * Math.pow(2, retryCount);
  const jitter = Math.random() * 500; // Add 0-500ms jitter
  return Math.min(backoff + jitter, APIFY_RETRY_CONFIG.maxBackoffMs);
}

// ============================================================================
// APIFY API FUNCTIONS
// ============================================================================

/**
 * Get the Apify API endpoint URL
 * Uses our custom actor: forward_flight~my-actor
 */
function getApifyEndpoint(): string {
  const actor = process.env.APIFY_AUTOCOMPLETE_ACTOR || 'forward_flight~my-actor';
  const token = process.env.APIFY_API_TOKEN;
  
  if (!token) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }
  
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
}

/**
 * Parse Apify response into array of suggestion strings
 * New format: array of { seed, suggestion } objects
 */
export function parseApifyResponse(data: ApifyAutocompleteResponse[]): string[] {
  if (!data || data.length === 0) return [];
  
  // Extract all suggestions from the response
  return data
    .map(item => item.suggestion)
    .filter(s => typeof s === 'string' && s.trim());
}

/**
 * Parse Apify response grouped by seed
 * Returns a Map of seed -> suggestions[]
 */
export function parseApifyResponseGrouped(data: ApifyAutocompleteResponse[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  
  if (!data || data.length === 0) return grouped;
  
  for (const item of data) {
    if (!item.seed || !item.suggestion) continue;
    
    const suggestions = grouped.get(item.seed) || [];
    suggestions.push(item.suggestion);
    grouped.set(item.seed, suggestions);
  }
  
  return grouped;
}

/**
 * Parse Apify bulk response into deduplicated array of suggestions
 * Used for batch queries (A-Z, prefix, child expansion)
 */
export function parseApifyBulkResponse(data: ApifyAutocompleteResponse[]): string[] {
  if (!data || data.length === 0) return [];
  
  const allSuggestions = data
    .map(item => item.suggestion)
    .filter(s => typeof s === 'string' && s.trim());
  
  // Deduplicate while preserving order
  return [...new Set(allSuggestions)];
}

/**
 * Make an Apify autocomplete API call with retry logic
 * Supports single query or batch queries
 * 
 * @param query - The search query (or first query for display purposes)
 * @param options - Optional parameters including queries array for batch mode
 * @returns ApifyCallResult with suggestions and metadata
 */
export async function fetchApifyAutocomplete(
  query: string,
  options: { queries?: string[] } = {}
): Promise<ApifyCallResult> {
  const startTime = Date.now();
  let lastError: string | undefined;
  
  // Use queries array if provided, otherwise wrap single query
  const queries = options.queries || [query];
  
  for (let attempt = 0; attempt <= APIFY_RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APIFY_TIMEOUT_MS);
      
      const response = await fetch(getApifyEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries,
          language: 'en',
          country: 'US',
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const shouldRetry = APIFY_RETRY_CONFIG.retryableStatuses.includes(response.status);
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        
        if (shouldRetry && attempt < APIFY_RETRY_CONFIG.maxRetries) {
          const backoff = calculateBackoff(attempt);
          console.warn(`[Apify] Retryable error for "${query}": ${lastError}. Retrying in ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }
        
        throw new Error(lastError);
      }
      
      const data: ApifyAutocompleteResponse[] = await response.json();
      
      // Parse all suggestions (our actor returns flat array of {seed, suggestion})
      const suggestions = parseApifyResponse(data);
      
      return {
        query,
        suggestions,
        durationMs: Date.now() - startTime,
        success: true,
        retryCount: attempt,
      };
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = 'Request timeout';
        } else {
          lastError = error.message;
        }
      } else {
        lastError = 'Unknown error';
      }
      
      if (attempt < APIFY_RETRY_CONFIG.maxRetries) {
        const backoff = calculateBackoff(attempt);
        console.warn(`[Apify] Error for "${query}": ${lastError}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
    }
  }
  
  // All retries exhausted
  console.error(`[Apify] All retries failed for "${query}": ${lastError}`);
  return {
    query,
    suggestions: [],
    durationMs: Date.now() - startTime,
    success: false,
    error: lastError,
    retryCount: APIFY_RETRY_CONFIG.maxRetries,
  };
}

/**
 * Fetch autocomplete for multiple queries in a single batch call
 * Much faster than individual calls - all queries processed together
 * 
 * @param queries - Array of search queries
 * @returns ApifyCallResult with all suggestions combined
 */
export async function fetchApifyAutocompleteBatch(
  queries: string[]
): Promise<ApifyCallResult> {
  if (queries.length === 0) {
    return {
      query: '',
      suggestions: [],
      durationMs: 0,
      success: true,
      retryCount: 0,
    };
  }
  
  return fetchApifyAutocomplete(queries[0], { queries });
}

// ============================================================================
// HIGH-LEVEL FETCH FUNCTION (Drop-in replacement)
// ============================================================================

/**
 * Fetch autocomplete suggestions via Apify
 * 
 * This is a drop-in replacement for the direct fetchAutocomplete() function.
 * It uses Apify's proxy service to avoid IP blocking issues.
 * 
 * @param query - The search query to get suggestions for
 * @returns Array of suggestion strings
 */
export async function fetchAutocompleteViaApify(query: string): Promise<string[]> {
  const result = await fetchApifyAutocomplete(query);
  return result.suggestions;
}

// ============================================================================
// EXPANSION REPORT GENERATION
// ============================================================================

/**
 * Generate a comprehensive expansion report
 */
export function generateExpansionReport(
  sessionId: string,
  startTime: Date,
  results: ApifyCallResult[],
  totalDelayMs: number,
  modesExecuted: string[]
): ExpansionReport {
  const endTime = new Date();
  const totalDurationMs = endTime.getTime() - startTime.getTime();
  
  const successfulCalls = results.filter(r => r.success).length;
  const failedCalls = results.filter(r => !r.success).length;
  const totalCalls = results.length;
  
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  
  // Deduplicate suggestions for unique count
  const uniqueSuggestions = new Set(
    results.flatMap(r => r.suggestions.map(s => s.toLowerCase().trim()))
  ).size;
  
  const totalCallDurationMs = results.reduce((sum, r) => sum + r.durationMs, 0);
  
  return {
    sessionId,
    startTime,
    endTime,
    totalDurationMs,
    averageDelayMs: totalCalls > 1 ? totalDelayMs / (totalCalls - 1) : 0,
    averageCallDurationMs: totalCalls > 0 ? totalCallDurationMs / totalCalls : 0,
    totalCalls,
    successfulCalls,
    failedCalls,
    successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
    totalSuggestions,
    uniqueSuggestions,
    estimatedCostUsd: totalCalls * ESTIMATED_COST_PER_CALL_USD,
    modesExecuted,
  };
}

/**
 * Format expansion report as a readable string
 */
export function formatExpansionReport(report: ExpansionReport): string {
  return `
╔══════════════════════════════════════════════════════════════╗
║                    EXPANSION REPORT                          ║
╠══════════════════════════════════════════════════════════════╣
║ Session ID:        ${report.sessionId.padEnd(40)}║
║ Start Time:        ${report.startTime.toISOString().padEnd(40)}║
║ End Time:          ${report.endTime.toISOString().padEnd(40)}║
╠══════════════════════════════════════════════════════════════╣
║ TIMING                                                       ║
║ Total Duration:    ${(report.totalDurationMs / 1000).toFixed(2).padEnd(8)}seconds${' '.repeat(29)}║
║ Avg Delay:         ${report.averageDelayMs.toFixed(0).padEnd(8)}ms${' '.repeat(33)}║
║ Avg Call Duration: ${report.averageCallDurationMs.toFixed(0).padEnd(8)}ms${' '.repeat(33)}║
╠══════════════════════════════════════════════════════════════╣
║ CALLS                                                        ║
║ Total Calls:       ${report.totalCalls.toString().padEnd(40)}║
║ Successful:        ${report.successfulCalls.toString().padEnd(40)}║
║ Failed:            ${report.failedCalls.toString().padEnd(40)}║
║ Success Rate:      ${report.successRate.toFixed(1).padEnd(7)}%${' '.repeat(32)}║
╠══════════════════════════════════════════════════════════════╣
║ RESULTS                                                      ║
║ Total Suggestions: ${report.totalSuggestions.toString().padEnd(40)}║
║ Unique:            ${report.uniqueSuggestions.toString().padEnd(40)}║
╠══════════════════════════════════════════════════════════════╣
║ COST                                                         ║
║ Estimated:         $${report.estimatedCostUsd.toFixed(4).padEnd(39)}║
╠══════════════════════════════════════════════════════════════╣
║ MODES EXECUTED                                               ║
║ ${report.modesExecuted.join(', ').padEnd(60)}║
╚══════════════════════════════════════════════════════════════╝
`.trim();
}

// ============================================================================
// HYBRID EXPANSION FUNCTIONS
// ============================================================================

/**
 * Fetch Top-10 suggestions for a seed phrase
 * Tag: simple_top10
 * 
 * @param seed - The seed phrase to get suggestions for
 * @returns Tagged phrases with Top-10 tag
 */
export async function fetchTop10(seed: string): Promise<{
  phrases: TaggedPhrase[];
  result: ApifyCallResult;
}> {
  const result = await fetchApifyAutocomplete(seed);
  
  const phrases: TaggedPhrase[] = result.suggestions.map(text => ({
    text,
    textNormalized: text.toLowerCase().trim(),
    popularitySource: TAG_CONFIG.simple_top10.popularitySource,
    tagDisplay: TAG_CONFIG.simple_top10.tagDisplay,
    tagSortPriority: TAG_CONFIG.simple_top10.tagSortPriority,
    sources: ['simple_top10'],
  }));
  
  return { phrases, result };
}

/**
 * Fetch A-Z Complete suggestions using batch mode
 * Sends all 26 letter variations in ONE call
 * Tag: a2z_complete
 * 
 * @param seed - The seed phrase to expand
 * @returns Tagged phrases with A-Z tag
 */
export async function fetchAZComplete(seed: string): Promise<{
  phrases: TaggedPhrase[];
  result: ApifyCallResult;
}> {
  // Generate all 26 A-Z queries
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const queries = alphabet.map(letter => `${seed} ${letter}`);
  
  // Single batch call for all 26 queries
  const result = await fetchApifyAutocompleteBatch(queries);
  
  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(result.suggestions)];
  
  const phrases: TaggedPhrase[] = uniqueSuggestions.map(text => ({
    text,
    textNormalized: text.toLowerCase().trim(),
    popularitySource: TAG_CONFIG.a2z_complete.popularitySource,
    tagDisplay: TAG_CONFIG.a2z_complete.tagDisplay,
    tagSortPriority: TAG_CONFIG.a2z_complete.tagSortPriority,
    sources: ['a2z_complete'],
  }));
  
  return { phrases, result };
}

/**
 * Fetch Prefix Complete suggestions using batch mode
 * All prefix queries sent in ONE call
 * Tag: prefix_complete
 * 
 * @param seed - The seed phrase to expand
 * @param prefixes - Optional custom prefix list (defaults to SEMANTIC_PREFIXES)
 * @returns Tagged phrases with Prefix tag
 */
export async function fetchPrefixComplete(
  seed: string,
  prefixes: readonly string[] = SEMANTIC_PREFIXES
): Promise<{
  phrases: TaggedPhrase[];
  results: ApifyCallResult[];
  totalDelayMs: number;
}> {
  const queries = prefixes.map(prefix => `${prefix} ${seed}`);
  
  // Single batch call for all prefix queries
  const result = await fetchApifyAutocompleteBatch(queries);
  
  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(result.suggestions)];
  
  const phrases: TaggedPhrase[] = uniqueSuggestions.map(text => ({
    text,
    textNormalized: text.toLowerCase().trim(),
    popularitySource: TAG_CONFIG.prefix_complete.popularitySource,
    tagDisplay: TAG_CONFIG.prefix_complete.tagDisplay,
    tagSortPriority: TAG_CONFIG.prefix_complete.tagSortPriority,
    sources: ['prefix_complete'],
  }));
  
  return { phrases, results: [result], totalDelayMs: 0 };
}

/**
 * Fetch Child phrases for a list of parent phrases using batch mode
 * All parent phrases expanded in ONE call
 * Tag: child_phrase
 * 
 * @param parentPhrases - Array of parent phrases (typically Top-10 results)
 * @returns Child expansion results with tagged phrases
 */
export async function fetchChildExpansion(
  parentPhrases: string[]
): Promise<{
  expansions: ChildExpansionResult[];
  allPhrases: TaggedPhrase[];
  results: ApifyCallResult[];
  totalDelayMs: number;
}> {
  if (parentPhrases.length === 0) {
    return {
      expansions: [],
      allPhrases: [],
      results: [],
      totalDelayMs: 0,
    };
  }
  
  // Single batch call for all parent phrases
  const result = await fetchApifyAutocompleteBatch(parentPhrases);
  
  // Group results by parent phrase for child filtering
  const expansions: ChildExpansionResult[] = [];
  const allPhrases: TaggedPhrase[] = [];
  
  // Process each suggestion to find children
  for (const parent of parentPhrases) {
    const parentNormalized = parent.toLowerCase().trim();
    
    // Filter suggestions that are children of this parent
    const directChildren = result.suggestions.filter(s => {
      const normalized = s.toLowerCase().trim();
      return normalized.startsWith(parentNormalized) && normalized !== parentNormalized;
    });
    
    // Tag direct children
    for (const text of directChildren) {
      // Avoid duplicates in allPhrases
      const textNormalized = text.toLowerCase().trim();
      if (!allPhrases.some(p => p.textNormalized === textNormalized)) {
        allPhrases.push({
          text,
          textNormalized,
          popularitySource: TAG_CONFIG.child_phrase.popularitySource,
          tagDisplay: TAG_CONFIG.child_phrase.tagDisplay,
          tagSortPriority: TAG_CONFIG.child_phrase.tagSortPriority,
          sources: ['child_phrase'],
          parentPhraseText: parent,
        });
      }
    }
    
    expansions.push({
      parentPhrase: parent,
      directChildren,
      howToChildren: [],
      whatDoesChildren: [],
      allChildren: directChildren,
    });
  }
  
  return {
    expansions,
    allPhrases,
    results: [result],
    totalDelayMs: 0,
  };
}

/**
 * Run full hybrid expansion using batch mode
 * 
 * Phases (all using batch calls for speed):
 * 1. Top-10: 1 query (~3.5s)
 * 2. Child: batch all parents (~10s)
 * 3. A-Z: batch 26 queries (~14s)
 * 4. Prefix: batch 6 queries (~5s)
 * 
 * Total: ~4 batch calls, ~30-35s
 * 
 * @param seed - The seed phrase to expand
 * @param options - Optional configuration
 * @returns All tagged phrases and expansion report
 */
export async function runHybridExpansion(
  seed: string,
  options: {
    sessionId?: string;
    skipChild?: boolean;
    skipAZ?: boolean;
    skipPrefix?: boolean;
    customPrefixes?: string[];
    onPhaseComplete?: (phase: string, phrases: TaggedPhrase[]) => void;
  } = {}
): Promise<{
  allPhrases: TaggedPhrase[];
  uniquePhrases: TaggedPhrase[];
  top10Phrases: TaggedPhrase[];
  childPhrases: TaggedPhrase[];
  azPhrases: TaggedPhrase[];
  prefixPhrases: TaggedPhrase[];
  report: ExpansionReport;
}> {
  const startTime = new Date();
  const sessionId = options.sessionId || `session_${Date.now()}`;
  const allResults: ApifyCallResult[] = [];
  const totalDelayMs = 0; // No delays needed with batch mode
  const modesExecuted: string[] = [];
  
  // Phase 1: Top-10
  console.log('[Hybrid] Phase 1: Top-10...');
  const { phrases: top10Phrases, result: top10Result } = await fetchTop10(seed);
  allResults.push(top10Result);
  modesExecuted.push('Top-10');
  options.onPhaseComplete?.('top10', top10Phrases);
  
  // Phase 2: Child Expansion (batch mode)
  let childPhrases: TaggedPhrase[] = [];
  if (!options.skipChild && top10Phrases.length > 0) {
    console.log('[Hybrid] Phase 2: Child Expansion (batch)...');
    
    const parentTexts = top10Phrases.map(p => p.text);
    const { allPhrases: children, results: childResults } = 
      await fetchChildExpansion(parentTexts);
    
    childPhrases = children;
    allResults.push(...childResults);
    modesExecuted.push('Child');
    options.onPhaseComplete?.('child', childPhrases);
  }
  
  // Phase 3: A-Z Complete (batch mode)
  let azPhrases: TaggedPhrase[] = [];
  if (!options.skipAZ) {
    console.log('[Hybrid] Phase 3: A-Z Complete (batch)...');
    
    const { phrases: az, result: azResult } = await fetchAZComplete(seed);
    azPhrases = az;
    allResults.push(azResult);
    modesExecuted.push('A-Z');
    options.onPhaseComplete?.('az', azPhrases);
  }
  
  // Phase 4: Prefix Complete (batch mode)
  let prefixPhrases: TaggedPhrase[] = [];
  if (!options.skipPrefix) {
    console.log('[Hybrid] Phase 4: Prefix Complete (batch)...');
    
    const prefixes = options.customPrefixes || SEMANTIC_PREFIXES;
    const { phrases: prefix, results: prefixResults } = 
      await fetchPrefixComplete(seed, prefixes);
    
    prefixPhrases = prefix;
    allResults.push(...prefixResults);
    modesExecuted.push('Prefix');
    options.onPhaseComplete?.('prefix', prefixPhrases);
  }
  
  // Combine all phrases
  const allPhrases = [...top10Phrases, ...childPhrases, ...azPhrases, ...prefixPhrases];
  
  // Deduplicate by normalized text, keeping first occurrence (preserves tag priority)
  const seenNormalized = new Set<string>();
  const uniquePhrases = allPhrases.filter(phrase => {
    if (seenNormalized.has(phrase.textNormalized)) {
      return false;
    }
    seenNormalized.add(phrase.textNormalized);
    return true;
  });
  
  // Generate report
  const report = generateExpansionReport(sessionId, startTime, allResults, totalDelayMs, modesExecuted);
  
  console.log(`[Hybrid] Complete! ${uniquePhrases.length} unique phrases in ${(report.totalDurationMs / 1000).toFixed(1)}s`);
  
  return {
    allPhrases,
    uniquePhrases,
    top10Phrases,
    childPhrases,
    azPhrases,
    prefixPhrases,
    report,
  };
}
