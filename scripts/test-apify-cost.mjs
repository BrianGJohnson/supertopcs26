#!/usr/bin/env node
/**
 * Quick cost test - measures cost for one hybrid expansion
 * Run: node scripts/test-apify-cost.mjs
 */

import 'dotenv/config';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR = 'scraper-mind~youtube-autocomplete-scraper';

if (!APIFY_TOKEN) {
  console.error('❌ Missing APIFY_API_TOKEN');
  process.exit(1);
}

async function fetchApify(query, options = {}) {
  const url = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  
  const input = {
    query,
    language: 'English',
    country: 'United States',
    ...options,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Apify error: ${response.status}`);
  }

  const data = await response.json();
  const item = data[0] || {};
  
  // Extract suggestions from suggestion_01, suggestion_02, etc.
  const suggestions = [];
  for (let i = 1; i <= 20; i++) {
    const key = `suggestion_${String(i).padStart(2, '0')}`;
    if (item[key]) {
      suggestions.push(item[key]);
    }
  }
  return suggestions;
}

async function main() {
  const seed = 'productivity apps';
  
  console.log('\n📊 APIFY COST TEST');
  console.log('==================');
  console.log(`Seed: "${seed}"`);
  console.log('\n⏱️  Starting hybrid expansion...\n');
  
  const startTime = Date.now();
  let callCount = 0;
  
  // Phase 1: Top-10 (1 call)
  console.log('Phase 1: Top-10...');
  const top10 = await fetchApify(seed);
  callCount++;
  console.log(`  ✓ ${top10.length} suggestions`);
  
  // Small delay between phases
  await new Promise(r => setTimeout(r, 2000));
  
  // Phase 2: Child expansion (30 calls: 10 parents × 3 queries each)
  console.log('Phase 2: Child expansion (10 parents × 3 each)...');
  const parents = top10.slice(0, 10);
  const childPrefixes = ['how to', 'what does'];
  let childTotal = 0;
  
  for (const parent of parents) {
    // Direct
    const direct = await fetchApify(parent);
    callCount++;
    childTotal += direct.length;
    
    // Prefixed
    for (const prefix of childPrefixes) {
      await new Promise(r => setTimeout(r, 2000)); // safety delay
      const prefixed = await fetchApify(`${prefix} ${parent}`);
      callCount++;
      childTotal += prefixed.length;
    }
    process.stdout.write('.');
  }
  console.log(`\n  ✓ ${childTotal} child suggestions`);
  
  // Small delay between phases
  await new Promise(r => setTimeout(r, 2000));
  
  // Phase 3: A-Z Complete (1 bulk call)
  console.log('Phase 3: A-Z bulk...');
  const az = await fetchApify(seed, { use_suffix: true });
  callCount++;
  console.log(`  ✓ ${az.length} A-Z suggestions`);
  
  // Small delay between phases
  await new Promise(r => setTimeout(r, 2000));
  
  // Phase 4: Prefix Complete (6 calls)
  console.log('Phase 4: Prefix (6 semantic)...');
  const prefixes = ['how to', 'what is', 'why', 'best', 'tips', 'fix'];
  let prefixTotal = 0;
  
  for (const prefix of prefixes) {
    const result = await fetchApify(`${prefix} ${seed}`);
    callCount++;
    prefixTotal += result.length;
    await new Promise(r => setTimeout(r, 2000)); // safety delay
  }
  console.log(`  ✓ ${prefixTotal} prefix suggestions`);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n==================');
  console.log('📊 RESULTS');
  console.log('==================');
  console.log(`Total API calls: ${callCount}`);
  console.log(`Elapsed time: ${elapsed}s`);
  console.log(`\n💰 COST ESTIMATION:`);
  console.log(`   Based on ~$0.22 for ~200 calls today`);
  console.log(`   Estimated: $${(0.22 / 200 * callCount).toFixed(4)} per run`);
  console.log(`   That's ~$${(0.22 / 200 * callCount * 100).toFixed(2)} per 100 runs`);
  
  console.log('\n📋 CALL BREAKDOWN:');
  console.log('   Top-10:  1 call');
  console.log('   Child:   30 calls (10 parents × 3)');
  console.log('   A-Z:     1 call (bulk)');
  console.log('   Prefix:  6 calls');
  console.log('   ─────────────────');
  console.log(`   Total:   ${callCount} calls`);
  
  console.log('\n📝 COMPARISON TO OLD SYSTEM:');
  console.log('   Old prefixes: 19 calls');
  console.log('   New prefixes: 6 calls');
  console.log('   Old A-Z: 26 calls (individual letters)');
  console.log('   New A-Z: 1 call (bulk with use_suffix)');
  console.log('   Savings: 38 fewer calls per run!');
}

main().catch(console.error);
