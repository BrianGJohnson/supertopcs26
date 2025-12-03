#!/usr/bin/env node
/**
 * Test script for Apify YouTube Autocomplete integration
 * 
 * Run with: node scripts/test-apify-autocomplete.mjs
 * 
 * This script tests the Apify integration with safety delays
 * and generates a comprehensive report.
 */

import 'dotenv/config';

// ============================================================================
// CONFIGURATION (mirrors src/lib/apify-autocomplete.ts)
// ============================================================================

const APIFY_DELAY_CONFIG = {
  baseDelayMin: 120,
  baseDelayMax: 180,
  jitterMin: 80,
  jitterMax: 250,
};

const APIFY_TIMEOUT_MS = 30000;
const ESTIMATED_COST_PER_CALL_USD = 0.001;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateDelay() {
  const baseDelay = randomBetween(APIFY_DELAY_CONFIG.baseDelayMin, APIFY_DELAY_CONFIG.baseDelayMax);
  const jitter = randomBetween(APIFY_DELAY_CONFIG.jitterMin, APIFY_DELAY_CONFIG.jitterMax);
  return baseDelay + jitter;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// APIFY API FUNCTIONS
// ============================================================================

function getApifyEndpoint() {
  const actor = process.env.APIFY_AUTOCOMPLETE_ACTOR || 'scraper-mind~youtube-autocomplete-scraper';
  const token = process.env.APIFY_API_TOKEN;
  
  if (!token) {
    throw new Error('APIFY_API_TOKEN environment variable is not set');
  }
  
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
}

function parseApifyResponse(data) {
  if (!data || data.length === 0) return [];
  
  const result = data[0];
  const suggestions = [];
  
  for (let i = 1; i <= 10; i++) {
    const key = `suggestion_${i.toString().padStart(2, '0')}`;
    if (result[key]) {
      suggestions.push(result[key]);
    }
  }
  
  return suggestions;
}

async function fetchApifyAutocomplete(query) {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APIFY_TIMEOUT_MS);
    
    const response = await fetch(getApifyEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        language: 'English',
        country: 'United States',
        usePrefix: false,
        useSuffix: false,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const suggestions = parseApifyResponse(data);
    
    return {
      query,
      suggestions,
      durationMs: Date.now() - startTime,
      success: true,
    };
    
  } catch (error) {
    return {
      query,
      suggestions: [],
      durationMs: Date.now() - startTime,
      success: false,
      error: error.message,
    };
  }
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTest() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         APIFY AUTOCOMPLETE INTEGRATION TEST                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Test configuration
  const seed = 'content creation';
  const testModes = {
    top10: [seed],
    az: 'abcdefghijklmnopqrstuvwxyz'.split('').map(l => `${seed} ${l}`),
    prefix: ['how', 'why', 'what', 'best', 'is', 'does', 'can', 'how to', 'what is', 'tips']
      .map(p => `${p} ${seed}`),
  };
  
  // Combine all queries
  const allQueries = [
    ...testModes.top10,
    ...testModes.az,
    ...testModes.prefix,
  ];
  
  console.log(`Seed phrase: "${seed}"`);
  console.log(`Total queries to run: ${allQueries.length}`);
  console.log(`Expected time: ${(allQueries.length * 0.3).toFixed(0)}-${(allQueries.length * 0.45).toFixed(0)} seconds`);
  console.log('');
  console.log('Starting expansion...');
  console.log('─'.repeat(64));
  
  const startTime = new Date();
  const results = [];
  const delays = [];
  
  for (let i = 0; i < allQueries.length; i++) {
    const query = allQueries[i];
    
    // Fetch autocomplete
    const result = await fetchApifyAutocomplete(query);
    results.push(result);
    
    // Progress indicator
    const status = result.success ? '✓' : '✗';
    const count = result.suggestions.length;
    process.stdout.write(`\r[${i + 1}/${allQueries.length}] ${status} "${query.substring(0, 30)}..." → ${count} suggestions`);
    
    // Apply safety delay (except after last query)
    if (i < allQueries.length - 1) {
      const delay = calculateDelay();
      delays.push(delay);
      await sleep(delay);
    }
  }
  
  const endTime = new Date();
  const totalDurationMs = endTime.getTime() - startTime.getTime();
  
  console.log('\n');
  console.log('─'.repeat(64));
  console.log('');
  
  // Generate report
  const successfulCalls = results.filter(r => r.success).length;
  const failedCalls = results.filter(r => !r.success).length;
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  const uniqueSuggestions = new Set(results.flatMap(r => r.suggestions.map(s => s.toLowerCase()))).size;
  const avgDelay = delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
  const avgCallDuration = results.reduce((sum, r) => sum + r.durationMs, 0) / results.length;
  
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    EXPANSION REPORT                          ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║ Start Time:        ${startTime.toISOString().padEnd(40)}║`);
  console.log(`║ End Time:          ${endTime.toISOString().padEnd(40)}║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ TIMING                                                       ║');
  console.log(`║ Total Duration:    ${(totalDurationMs / 1000).toFixed(2).padEnd(8)} seconds${' '.repeat(29)}║`);
  console.log(`║ Avg Delay:         ${avgDelay.toFixed(0).padEnd(8)} ms${' '.repeat(33)}║`);
  console.log(`║ Avg Call Duration: ${avgCallDuration.toFixed(0).padEnd(8)} ms${' '.repeat(33)}║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ CALLS                                                        ║');
  console.log(`║ Total Calls:       ${results.length.toString().padEnd(40)}║`);
  console.log(`║ Successful:        ${successfulCalls.toString().padEnd(40)}║`);
  console.log(`║ Failed:            ${failedCalls.toString().padEnd(40)}║`);
  console.log(`║ Success Rate:      ${((successfulCalls / results.length) * 100).toFixed(1).padEnd(7)}%${' '.repeat(32)}║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ RESULTS                                                      ║');
  console.log(`║ Total Suggestions: ${totalSuggestions.toString().padEnd(40)}║`);
  console.log(`║ Unique:            ${uniqueSuggestions.toString().padEnd(40)}║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ COST                                                         ║');
  console.log(`║ Estimated:         $${(results.length * ESTIMATED_COST_PER_CALL_USD).toFixed(4).padEnd(39)}║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ MODES EXECUTED                                               ║');
  console.log(`║ top10, az, prefix${' '.repeat(44)}║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Sample results
  console.log('');
  console.log('SAMPLE SUGGESTIONS (first 10 unique):');
  const sampleSuggestions = [...new Set(results.flatMap(r => r.suggestions))].slice(0, 10);
  sampleSuggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  
  // Failed queries (if any)
  const failedQueries = results.filter(r => !r.success);
  if (failedQueries.length > 0) {
    console.log('');
    console.log('FAILED QUERIES:');
    failedQueries.forEach(r => console.log(`  ✗ "${r.query}": ${r.error}`));
  }
  
  console.log('');
  console.log('Test complete!');
  
  // Return exit code based on success rate
  const successRate = successfulCalls / results.length;
  if (successRate < 0.9) {
    console.log('⚠️  Warning: Success rate below 90%');
    process.exit(1);
  }
  
  if (totalDurationMs > 45000) {
    console.log('⚠️  Warning: Total duration exceeded 45 seconds');
    process.exit(1);
  }
  
  console.log('✓ All checks passed!');
  process.exit(0);
}

// Run the test
runTest().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
