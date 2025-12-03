#!/usr/bin/env node

/**
 * Test Apify YouTube Autocomplete with use_prefix and use_suffix
 * This tests the optimized single-call expansion strategy
 */

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR = 'scraper-mind~youtube-autocomplete-scraper';
const BASE_URL = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items`;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN not set');
  process.exit(1);
}

async function fullExpansionTest() {
  const url = `${BASE_URL}?token=${APIFY_TOKEN}`;
  
  const body = {
    query: 'content creation',
    language: 'English',
    country: 'United States',
    use_prefix: true,
    use_suffix: true
  };
  
  console.log('🚀 FULL EXPANSION TEST');
  console.log('Query: "content creation"');
  console.log('Options: use_prefix=true, use_suffix=true');
  console.log('');
  
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const elapsed = Date.now() - start;
  const data = await res.json();
  
  console.log('⏱️  Total time:', elapsed + 'ms');
  console.log('');
  
  if (Array.isArray(data)) {
    const queries = [...new Set(data.map(d => d.query))];
    
    // Group queries by type
    const baseQuery = queries.filter(q => q === 'content creation');
    const prefixVariations = queries.filter(q => /^[a-z0-9*] content creation$/i.test(q));
    const suffixVariations = queries.filter(q => /^content creation [a-z0-9*]$/i.test(q));
    
    console.log('📋 QUERY BREAKDOWN:');
    console.log(`   Base query: ${baseQuery.length}`);
    console.log(`   Prefix variations (e.g., "a content creation"): ${prefixVariations.length}`);
    console.log(`   Suffix variations (e.g., "content creation a"): ${suffixVariations.length}`);
    console.log('');
    
    // Show sample suffix results (what we actually need for seed expansion)
    console.log('📝 SAMPLE SUFFIX RESULTS (A-Z expansion):');
    const suffixSamples = data.filter(d => /^content creation [a-c]$/i.test(d.query));
    suffixSamples.forEach(d => {
      console.log(`   [${d.query}]`);
      console.log(`      → ${d.suggestion_01}`);
      console.log(`      → ${d.suggestion_02}`);
      console.log(`      → ${d.suggestion_03}`);
    });
    
    // Count all unique suggestions
    const allSuggestions = new Set();
    data.forEach(d => {
      for (let i = 1; i <= 10; i++) {
        const key = `suggestion_${i < 10 ? '0' + i : i}`;
        if (d[key]) allSuggestions.add(d[key]);
      }
    });
    
    console.log('');
    console.log('📊 TOTALS:');
    console.log(`   Total query variations: ${queries.length}`);
    console.log(`   Total suggestions returned: ${data.reduce((sum, d) => {
      let count = 0;
      for (let i = 1; i <= 10; i++) {
        const key = `suggestion_${i < 10 ? '0' + i : i}`;
        if (d[key]) count++;
      }
      return sum + count;
    }, 0)}`);
    console.log(`   Unique suggestions: ${allSuggestions.size}`);
    console.log('');
    console.log('💰 COST ANALYSIS:');
    console.log('   Old approach: ~75 API calls × $0.001 = $0.075 per session');
    console.log('   New approach: 1 API call × $0.001 = $0.001 per session');
    console.log('   Savings: 75x cheaper!');
    console.log('');
    console.log('⚡ SPEED ANALYSIS:');
    console.log('   Old approach: ~75 calls × 2.7s = ~200 seconds (3.4 min)');
    console.log(`   New approach: 1 call × ${(elapsed/1000).toFixed(1)}s = ~${(elapsed/1000).toFixed(1)} seconds`);
    console.log(`   Speedup: ${Math.round(200000 / elapsed)}x faster!`);
  } else {
    console.log('❌ Unexpected response:', JSON.stringify(data, null, 2));
  }
}

fullExpansionTest();
