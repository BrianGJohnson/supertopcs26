/**
 * Topic Expansion Module (v3.0)
 * 
 * This module provides topic idea generation via our expansion service.
 * Service configured via environment variables.
 * 
 * KEY FEATURES:
 * - Custom service with full control
 * - Batch queries in single calls
 * - Up to 14 topics per query
 * - ~14s for full A-Z (26 queries)
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Response format from expansion service
 * Each topic is a separate object with seed and suggestion
 */
export interface TopicExpansionResponse {
  seed: string;
  suggestion: string;
}

export interface TopicCallResult {
  query: string;
  suggestions: string[];
  durationMs: number;
  success: boolean;
  error?: string;
  retryCount: number;
  rawData?: TopicExpansionResponse[];  // Optional: raw response for grouped parsing
}

export interface BulkTopicResult {
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
  demandSource: string;
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
  
  // Cost (estimated)
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
export const RETRY_CONFIG = {
  maxRetries: 2,
  baseBackoffMs: 1000,
  maxBackoffMs: 5000,
  retryableStatuses: [429, 500, 502, 503, 504] as number[],
};

/**
 * Timeout for each API call
 */
export const SERVICE_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Cost estimation per call (in USD)
 */
export const ESTIMATED_COST_PER_CALL_USD = 0.001;

/**
 * Semantic prefixes for Prefix Complete (18 optimized prefixes)
 * Ordered by value: singles first, then high-value phrases
 * No shuffle needed - batch mode sends all at once
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
    demandSource: 'simple_top10',
    tagDisplay: 'Top-15',
    tagSortPriority: 1,
  },
  child_phrase: {
    demandSource: 'child_phrase',
    tagDisplay: 'Child',
    tagSortPriority: 2,
  },
  child_prefix_how_to: {
    demandSource: 'child_prefix_how_to',
    tagDisplay: 'Child',
    tagSortPriority: 2,
  },
  child_prefix_what_does: {
    demandSource: 'child_prefix_what_does',
    tagDisplay: 'Child',
    tagSortPriority: 2,
  },
  a2z_complete: {
    demandSource: 'a2z_complete',
    tagDisplay: 'A-to-Z -',
    tagSortPriority: 3,
  },
  prefix_complete: {
    demandSource: 'prefix_complete',
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
  const backoff = RETRY_CONFIG.baseBackoffMs * Math.pow(2, retryCount);
  const jitter = Math.random() * 500; // Add 0-500ms jitter
  return Math.min(backoff + jitter, RETRY_CONFIG.maxBackoffMs);
}

// ============================================================================
// SERVICE API FUNCTIONS
// ============================================================================

/**
 * Get the expansion service endpoint URL
 * Must be configured via environment variables
 */
function getServiceEndpoint(): string {
  const actor = process.env.APIFY_AUTOCOMPLETE_ACTOR;
  const token = process.env.APIFY_API_TOKEN;
  
  if (!actor) {
    throw new Error('Service actor environment variable is not set');
  }
  
  if (!token) {
    throw new Error('Service token environment variable is not set');
  }
  
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
}

/**
 * Parse response into array of topic strings
 */
export function parseTopicResponse(data: TopicExpansionResponse[]): string[] {
  if (!data || data.length === 0) return [];
  
  // Extract all topics from the response
  return data
    .map(item => item.suggestion)
    .filter(s => typeof s === 'string' && s.trim());
}

/**
 * Parse response grouped by seed
 * Returns a Map of seed -> topics[]
 */
export function parseTopicResponseGrouped(data: TopicExpansionResponse[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  
  if (!data || data.length === 0) return grouped;
  
  for (const item of data) {
    if (!item.seed || !item.suggestion) continue;
    
    const topics = grouped.get(item.seed) || [];
    topics.push(item.suggestion);
    grouped.set(item.seed, topics);
  }
  
  return grouped;
}

/**
 * Parse bulk response into deduplicated array of topics
 * Used for batch queries (A-Z, prefix, child expansion)
 */
export function parseBulkTopicResponse(data: TopicExpansionResponse[]): string[] {
  if (!data || data.length === 0) return [];
  
  const allTopics = data
    .map(item => item.suggestion)
    .filter(s => typeof s === 'string' && s.trim());
  
  // Deduplicate while preserving order
  return [...new Set(allTopics)];
}

/**
 * Make a topic expansion API call with retry logic
 * Supports single query or batch queries
 * 
 * @param query - The seed query (or first query for display purposes)
 * @param options - Optional parameters including queries array for batch mode
 * @returns TopicCallResult with topics and metadata
 */
export async function fetchTopicExpansion(
  query: string,
  options: { queries?: string[] } = {}
): Promise<TopicCallResult> {
  const startTime = Date.now();
  let lastError: string | undefined;
  
  // Use queries array if provided, otherwise wrap single query
  const queries = options.queries || [query];
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);
      
      const response = await fetch(getServiceEndpoint(), {
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
        const shouldRetry = RETRY_CONFIG.retryableStatuses.includes(response.status);
        lastError = `HTTP ${response.status}: ${response.statusText}`;
        
        if (shouldRetry && attempt < RETRY_CONFIG.maxRetries) {
          const backoff = calculateBackoff(attempt);
          console.warn(`[TopicExpansion] Retryable error for "${query}": ${lastError}. Retrying in ${backoff}ms...`);
          await sleep(backoff);
          continue;
        }
        
        throw new Error(lastError);
      }
      
      const data: TopicExpansionResponse[] = await response.json();
      
      // Parse all topics
      const suggestions = parseTopicResponse(data);
      
      return {
        query,
        suggestions,
        durationMs: Date.now() - startTime,
        success: true,
        retryCount: attempt,
        rawData: data,  // Include raw data for grouped parsing
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
      
      if (attempt < RETRY_CONFIG.maxRetries) {
        const backoff = calculateBackoff(attempt);
        console.warn(`[TopicExpansion] Error for "${query}": ${lastError}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
    }
  }
  
  // All retries exhausted
  console.error(`[TopicExpansion] All retries failed for "${query}": ${lastError}`);
  return {
    query,
    suggestions: [],
    durationMs: Date.now() - startTime,
    success: false,
    error: lastError,
    retryCount: RETRY_CONFIG.maxRetries,
  };
}

/**
 * Fetch topics for multiple queries in a single batch call
 * Much faster than individual calls - all queries processed together
 * 
 * @param queries - Array of seed queries
 * @returns TopicCallResult with all topics combined
 */
export async function fetchTopicBatch(
  queries: string[]
): Promise<TopicCallResult> {
  if (queries.length === 0) {
    return {
      query: '',
      suggestions: [],
      durationMs: 0,
      success: true,
      retryCount: 0,
    };
  }
  
  return fetchTopicExpansion(queries[0], { queries });
}

// ============================================================================
// HIGH-LEVEL FETCH FUNCTION
// ============================================================================

/**
 * Fetch topic ideas
 * 
 * @param query - The seed query to get topics for
 * @returns Array of topic strings
 */
export async function fetchTopics(query: string): Promise<string[]> {
  const result = await fetchTopicExpansion(query);
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
  results: TopicCallResult[],
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
  result: TopicCallResult;
}> {
  const result = await fetchTopicExpansion(seed);
  
  const phrases: TaggedPhrase[] = result.suggestions.map(text => ({
    text,
    textNormalized: text.toLowerCase().trim(),
    demandSource: TAG_CONFIG.simple_top10.demandSource,
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
  result: TopicCallResult;
}> {
  // Generate all 26 A-Z queries
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const queries = alphabet.map(letter => `${seed} ${letter}`);
  
  // Single batch call for all 26 queries
  const result = await fetchTopicBatch(queries);
  
  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(result.suggestions)];
  
  const phrases: TaggedPhrase[] = uniqueSuggestions.map(text => ({
    text,
    textNormalized: text.toLowerCase().trim(),
    demandSource: TAG_CONFIG.a2z_complete.demandSource,
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
  results: TopicCallResult[];
  totalDelayMs: number;
}> {
  const queries = prefixes.map(prefix => `${prefix} ${seed}`);
  
  // Single batch call for all prefix queries
  const result = await fetchTopicBatch(queries);
  
  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(result.suggestions)];
  
  const phrases: TaggedPhrase[] = uniqueSuggestions.map(text => ({
    text,
    textNormalized: text.toLowerCase().trim(),
    demandSource: TAG_CONFIG.prefix_complete.demandSource,
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
 * IMPORTANT: ANY phrase returned when querying a Top-10 phrase
 * is a valid Child phrase. We do NOT filter by "startsWith" - topic expansion
 * can return related phrases that don't start with the parent.
 * 
 * @param parentPhrases - Array of parent phrases (typically Top-10 results)
 * @returns Child expansion results with tagged phrases
 */
export async function fetchChildExpansion(
  parentPhrases: string[]
): Promise<{
  expansions: ChildExpansionResult[];
  allPhrases: TaggedPhrase[];
  results: TopicCallResult[];
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
  const result = await fetchTopicBatch(parentPhrases);
  
  // Use grouped response to properly associate each suggestion with its parent
  const grouped = parseTopicResponseGrouped(result.rawData || []);
  
  // Build a case-insensitive lookup map for parent phrases
  const parentLookup = new Map<string, string>();
  for (const parent of parentPhrases) {
    parentLookup.set(parent.toLowerCase().trim(), parent);
  }
  
  const expansions: ChildExpansionResult[] = [];
  const allPhrases: TaggedPhrase[] = [];
  
  // Process each parent phrase and its suggestions
  for (const parent of parentPhrases) {
    const parentNormalized = parent.toLowerCase().trim();
    
    // Get all suggestions that came from querying this parent phrase
    // Try exact match first, then normalized match
    let parentSuggestions = grouped.get(parent) || [];
    
    // If exact match failed, try to find by iterating through grouped keys
    if (parentSuggestions.length === 0) {
      for (const [seed, suggestions] of grouped.entries()) {
        if (seed.toLowerCase().trim() === parentNormalized) {
          parentSuggestions = suggestions;
          break;
        }
      }
    }
    
    // Filter out only exact matches of the parent phrase itself
    const directChildren = parentSuggestions.filter(s => {
      const normalized = s.toLowerCase().trim();
      return normalized !== parentNormalized;
    });
    
    // Tag all children from this parent
    for (const text of directChildren) {
      // Avoid duplicates in allPhrases
      const textNormalized = text.toLowerCase().trim();
      if (!allPhrases.some(p => p.textNormalized === textNormalized)) {
        allPhrases.push({
          text,
          textNormalized,
          demandSource: TAG_CONFIG.child_phrase.demandSource,
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
  const allResults: TopicCallResult[] = [];
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
