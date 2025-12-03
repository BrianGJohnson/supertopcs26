#!/usr/bin/env node
/**
 * Zero-delay Apify test - measures raw Apify actor speed
 */

const APIFY_TIMEOUT_MS = 30000;

function getApifyEndpoint() {
  const actor = process.env.APIFY_AUTOCOMPLETE_ACTOR || 'scraper-mind~youtube-autocomplete-scraper';
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error('APIFY_API_TOKEN not set');
  return `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}`;
}

function parseResponse(data) {
  if (!data || data.length === 0) return [];
  const result = data[0];
  const suggestions = [];
  for (let i = 1; i <= 10; i++) {
    const key = `suggestion_${i.toString().padStart(2, '0')}`;
    if (result[key]) suggestions.push(result[key]);
  }
  return suggestions;
}

async function fetchApify(query) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APIFY_TIMEOUT_MS);
    
    const response = await fetch(getApifyEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language: 'English', country: 'United States' }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return { query, suggestions: parseResponse(data), ms: Date.now() - start, success: true };
  } catch (e) {
    return { query, suggestions: [], ms: Date.now() - start, success: false, error: e.message };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         ZERO-DELAY APIFY SPEED TEST                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const seed = 'content creation';
  
  // Smaller test: just 10 queries to get quick timing data
  const queries = [
    seed,
    `${seed} a`, `${seed} b`, `${seed} c`, `${seed} d`, `${seed} e`,
    `how ${seed}`, `why ${seed}`, `best ${seed}`, `tips ${seed}`
  ];

  console.log(`Testing ${queries.length} queries with ZERO delays...\n`);
  
  const startTime = Date.now();
  const results = [];
  
  for (let i = 0; i < queries.length; i++) {
    const result = await fetchApify(queries[i]);
    results.push(result);
    const status = result.success ? '✓' : '✗';
    console.log(`[${i + 1}/${queries.length}] ${status} "${queries[i]}" → ${result.suggestions.length} results (${result.ms}ms)`);
    // NO DELAY - immediately next call
  }
  
  const totalMs = Date.now() - startTime;
  const avgCallMs = results.reduce((sum, r) => sum + r.ms, 0) / results.length;
  const successful = results.filter(r => r.success).length;
  const totalSuggestions = results.reduce((sum, r) => sum + r.suggestions.length, 0);
  
  console.log('\n' + '─'.repeat(64));
  console.log('\n📊 RESULTS:\n');
  console.log(`  Total Time:        ${(totalMs / 1000).toFixed(2)} seconds`);
  console.log(`  Avg Call Time:     ${avgCallMs.toFixed(0)}ms`);
  console.log(`  Success Rate:      ${successful}/${queries.length} (${((successful/queries.length)*100).toFixed(0)}%)`);
  console.log(`  Total Suggestions: ${totalSuggestions}`);
  console.log(`  Est. Cost:         $${(queries.length * 0.001).toFixed(4)}`);
  
  console.log('\n📈 PROJECTIONS (at this speed):\n');
  const timeFor75 = (avgCallMs * 75) / 1000;
  const timeFor80 = (avgCallMs * 80) / 1000;
  console.log(`  75 calls: ~${timeFor75.toFixed(0)} seconds (${(timeFor75/60).toFixed(1)} min)`);
  console.log(`  80 calls: ~${timeFor80.toFixed(0)} seconds (${(timeFor80/60).toFixed(1)} min)`);
  
  console.log('\n✅ Test complete!');
}

main().catch(console.error);
