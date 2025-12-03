#!/usr/bin/env node
/**
 * Test Hybrid Expansion (Option C)
 * 
 * This script tests the full hybrid expansion flow:
 * 1. Top-10: 1 call (~3s)
 * 2. Child: 30 calls (~75s)
 * 3. A-Z: 1 bulk call (~6s)
 * 4. Prefix: 6 calls (~18s)
 * 
 * Expected: ~40 calls, ~100s (~1.5 min)
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR = 'scraper-mind~youtube-autocomplete-scraper';
const ENDPOINT = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN not set in .env.local');
  process.exit(1);
}

// Semantic prefixes (reduced set)
const SEMANTIC_PREFIXES = [
  'how to',
  'what is',
  'why',
  'best',
  'tips',
  'fix',
];

// Tag configuration
const TAG_CONFIG = {
  simple_top10: { popularitySource: 'simple_top10', tagDisplay: 'Top-10', priority: 1 },
  child_phrase: { popularitySource: 'child_phrase', tagDisplay: 'Child', priority: 2 },
  child_prefix_how_to: { popularitySource: 'child_prefix_how_to', tagDisplay: 'Child', priority: 2 },
  child_prefix_what_does: { popularitySource: 'child_prefix_what_does', tagDisplay: 'Child', priority: 2 },
  a2z_complete: { popularitySource: 'a2z_complete', tagDisplay: 'A-to-Z -', priority: 3 },
  prefix_complete: { popularitySource: 'prefix_complete', tagDisplay: 'Prefix -', priority: 4 },
};

async function fetchApify(query, options = {}) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        language: 'English',
        country: 'United States',
        use_prefix: options.use_prefix || false,
        use_suffix: options.use_suffix || false,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const durationMs = Date.now() - startTime;
    
    // Parse suggestions
    const suggestions = [];
    if (options.use_suffix || options.use_prefix) {
      // Bulk mode - multiple results
      for (const result of data) {
        for (let i = 1; i <= 10; i++) {
          const key = `suggestion_${i.toString().padStart(2, '0')}`;
          if (result[key]) suggestions.push(result[key]);
        }
      }
    } else {
      // Single mode
      if (data && data.length > 0) {
        const result = data[0];
        for (let i = 1; i <= 10; i++) {
          const key = `suggestion_${i.toString().padStart(2, '0')}`;
          if (result[key]) suggestions.push(result[key]);
        }
      }
    }
    
    return { 
      query, 
      suggestions: [...new Set(suggestions)], // Dedupe
      durationMs, 
      success: true,
      queryCount: data?.length || 1
    };
  } catch (error) {
    return { query, suggestions: [], durationMs: Date.now() - startTime, success: false, error: error.message };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const seedPhrase = process.argv[2] || 'content creation';
  const startTime = Date.now();
  let totalCalls = 0;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('         HYBRID EXPANSION TEST (Option C)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\nSeed Phrase: "${seedPhrase}"`);
  console.log();
  
  const allPhrases = [];
  const phaseTimings = {};
  
  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1: Top-10
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📍 PHASE 1: Top-10 (1 call)');
  console.log('─'.repeat(60));
  
  const phase1Start = Date.now();
  const top10Result = await fetchApify(seedPhrase);
  totalCalls++;
  
  const top10Phrases = top10Result.suggestions.map(text => ({
    text,
    tag: TAG_CONFIG.simple_top10,
  }));
  allPhrases.push(...top10Phrases);
  
  phaseTimings.top10 = Date.now() - phase1Start;
  console.log(`✅ Got ${top10Phrases.length} phrases in ${top10Result.durationMs}ms`);
  top10Phrases.forEach((p, i) => console.log(`  ${i + 1}. ${p.text}`));
  console.log();
  
  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2: Child Expansion
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📍 PHASE 2: Child Expansion (~30 calls)');
  console.log('─'.repeat(60));
  console.log('For each Top-10: direct + "how to" + "what does"');
  console.log();
  
  const phase2Start = Date.now();
  const childPhrases = [];
  
  for (let i = 0; i < top10Phrases.length; i++) {
    const parent = top10Phrases[i].text;
    const parentNorm = parent.toLowerCase();
    
    process.stdout.write(`  [${i + 1}/${top10Phrases.length}] ${parent.substring(0, 40).padEnd(40)} `);
    
    // Direct expansion
    const directResult = await fetchApify(parent);
    totalCalls++;
    const directChildren = directResult.suggestions.filter(s => 
      s.toLowerCase().startsWith(parentNorm) && s.toLowerCase() !== parentNorm
    );
    
    await sleep(200);
    
    // "how to" expansion
    const howToResult = await fetchApify(`how to ${parent}`);
    totalCalls++;
    
    await sleep(200);
    
    // "what does" expansion
    const whatDoesResult = await fetchApify(`what does ${parent}`);
    totalCalls++;
    
    // Collect phrases
    for (const text of directChildren) {
      childPhrases.push({ text, tag: TAG_CONFIG.child_phrase, parent });
    }
    for (const text of howToResult.suggestions) {
      childPhrases.push({ text, tag: TAG_CONFIG.child_prefix_how_to, parent });
    }
    for (const text of whatDoesResult.suggestions) {
      childPhrases.push({ text, tag: TAG_CONFIG.child_prefix_what_does, parent });
    }
    
    console.log(`→ ${directChildren.length + howToResult.suggestions.length + whatDoesResult.suggestions.length} children`);
    
    if (i < top10Phrases.length - 1) {
      await sleep(200);
    }
  }
  
  allPhrases.push(...childPhrases);
  phaseTimings.child = Date.now() - phase2Start;
  console.log(`\n✅ Total child phrases: ${childPhrases.length} in ${(phaseTimings.child / 1000).toFixed(1)}s`);
  console.log();
  
  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 3: A-Z Complete (Bulk)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📍 PHASE 3: A-Z Complete (1 bulk call with use_suffix)');
  console.log('─'.repeat(60));
  
  const phase3Start = Date.now();
  await sleep(200);
  
  const azResult = await fetchApify(seedPhrase, { use_suffix: true });
  totalCalls++;
  
  const azPhrases = azResult.suggestions.map(text => ({
    text,
    tag: TAG_CONFIG.a2z_complete,
  }));
  allPhrases.push(...azPhrases);
  
  phaseTimings.az = Date.now() - phase3Start;
  console.log(`✅ Got ${azPhrases.length} unique phrases from ${azResult.queryCount} query variations in ${azResult.durationMs}ms`);
  console.log(`   Sample: ${azPhrases.slice(0, 5).map(p => p.text).join(', ')}...`);
  console.log();
  
  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 4: Prefix Complete (Reduced)
  // ─────────────────────────────────────────────────────────────────────────
  console.log(`📍 PHASE 4: Prefix Complete (${SEMANTIC_PREFIXES.length} calls)`);
  console.log('─'.repeat(60));
  console.log(`Prefixes: ${SEMANTIC_PREFIXES.join(', ')}`);
  console.log();
  
  const phase4Start = Date.now();
  const prefixPhrases = [];
  
  for (const prefix of SEMANTIC_PREFIXES) {
    await sleep(200);
    
    const query = `${prefix} ${seedPhrase}`;
    const result = await fetchApify(query);
    totalCalls++;
    
    for (const text of result.suggestions) {
      prefixPhrases.push({ text, tag: TAG_CONFIG.prefix_complete });
    }
    
    console.log(`  "${prefix}" → ${result.suggestions.length} phrases`);
  }
  
  allPhrases.push(...prefixPhrases);
  phaseTimings.prefix = Date.now() - phase4Start;
  console.log(`\n✅ Total prefix phrases: ${prefixPhrases.length} in ${(phaseTimings.prefix / 1000).toFixed(1)}s`);
  console.log();
  
  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  const totalTime = Date.now() - startTime;
  
  // Deduplicate
  const seen = new Set();
  const uniquePhrases = allPhrases.filter(p => {
    const norm = p.text.toLowerCase().trim();
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                         SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log(`Seed Phrase:       "${seedPhrase}"`);
  console.log();
  console.log('TIMING:');
  console.log(`  Phase 1 (Top-10):  ${(phaseTimings.top10 / 1000).toFixed(1)}s`);
  console.log(`  Phase 2 (Child):   ${(phaseTimings.child / 1000).toFixed(1)}s`);
  console.log(`  Phase 3 (A-Z):     ${(phaseTimings.az / 1000).toFixed(1)}s`);
  console.log(`  Phase 4 (Prefix):  ${(phaseTimings.prefix / 1000).toFixed(1)}s`);
  console.log(`  ─────────────────────────`);
  console.log(`  TOTAL:             ${(totalTime / 1000).toFixed(1)}s (${(totalTime / 60000).toFixed(2)} min)`);
  console.log();
  console.log('CALLS:');
  console.log(`  Total API Calls:   ${totalCalls}`);
  console.log(`  Avg per Call:      ${(totalTime / totalCalls).toFixed(0)}ms`);
  console.log();
  console.log('PHRASES:');
  console.log(`  Top-10:            ${top10Phrases.length}`);
  console.log(`  Child:             ${childPhrases.length}`);
  console.log(`  A-Z:               ${azPhrases.length}`);
  console.log(`  Prefix:            ${prefixPhrases.length}`);
  console.log(`  ─────────────────────────`);
  console.log(`  Total (raw):       ${allPhrases.length}`);
  console.log(`  Unique:            ${uniquePhrases.length}`);
  console.log();
  console.log('TAG BREAKDOWN:');
  const tagCounts = {};
  for (const p of uniquePhrases) {
    const tag = p.tag.tagDisplay;
    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }
  for (const [tag, count] of Object.entries(tagCounts).sort((a, b) => a[1] - b[1])) {
    console.log(`  ${tag.padEnd(12)}: ${count}`);
  }
  console.log();
  console.log('COST ESTIMATE:');
  console.log(`  ~$${(totalCalls * 0.001).toFixed(4)}/session`);
  console.log();
  
  // Validation
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                       VALIDATION');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  
  const expectedCalls = 1 + (top10Phrases.length * 3) + 1 + SEMANTIC_PREFIXES.length;
  const expectedTime = 100; // ~100 seconds
  
  console.log(`Expected calls: ~${expectedCalls}, Actual: ${totalCalls} ${totalCalls <= expectedCalls + 5 ? '✅' : '⚠️'}`);
  console.log(`Expected time: ~${expectedTime}s, Actual: ${(totalTime / 1000).toFixed(0)}s ${totalTime / 1000 < expectedTime * 1.5 ? '✅' : '⚠️'}`);
  console.log(`Unique phrases: ${uniquePhrases.length} ${uniquePhrases.length > 200 ? '✅' : '⚠️'}`);
  console.log();
}

main().catch(console.error);
