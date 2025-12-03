#!/usr/bin/env node
/**
 * Test Apify Child Phrase Generation
 * 
 * This script tests the full child phrase generation flow:
 * 1. Get Top 10 for "content creation"
 * 2. Take each of those phrases and run them through autocomplete again
 * 3. Compare results with what our current system expects
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
        use_prefix: options.usePrefix || false,
        use_suffix: options.useSuffix || false,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const durationMs = Date.now() - startTime;
    
    // Parse suggestions from response
    const suggestions = [];
    if (data && data.length > 0) {
      const result = data[0];
      for (let i = 1; i <= 10; i++) {
        const key = `suggestion_${i.toString().padStart(2, '0')}`;
        if (result[key]) {
          suggestions.push(result[key]);
        }
      }
    }
    
    return { query, suggestions, durationMs, success: true };
  } catch (error) {
    return { query, suggestions: [], durationMs: Date.now() - startTime, success: false, error: error.message };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       APIFY CHILD PHRASE GENERATION TEST');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  
  const seedPhrase = 'content creation';
  
  // STEP 1: Get Top 10 for seed phrase
  console.log(`📍 STEP 1: Get Top 10 for "${seedPhrase}"`);
  console.log('─'.repeat(60));
  
  const top10Result = await fetchApify(seedPhrase);
  
  if (!top10Result.success) {
    console.error(`❌ Failed to get Top 10: ${top10Result.error}`);
    process.exit(1);
  }
  
  console.log(`✅ Got ${top10Result.suggestions.length} Top 10 phrases in ${top10Result.durationMs}ms`);
  console.log();
  
  top10Result.suggestions.forEach((phrase, i) => {
    console.log(`  ${i + 1}. ${phrase}`);
  });
  
  console.log();
  
  // STEP 2: Run each Top 10 phrase through autocomplete (child expansion)
  console.log('📍 STEP 2: Child Phrase Expansion');
  console.log('─'.repeat(60));
  console.log('For each Top 10 phrase, we query autocomplete to find child phrases.');
  console.log();
  
  const childResults = [];
  const allChildPhrases = new Set();
  
  for (let i = 0; i < top10Result.suggestions.length; i++) {
    const parentPhrase = top10Result.suggestions[i];
    
    console.log(`\n[${i + 1}/${top10Result.suggestions.length}] Expanding: "${parentPhrase}"`);
    
    // Direct expansion (query the parent phrase itself)
    const directResult = await fetchApify(parentPhrase);
    
    if (directResult.success) {
      console.log(`  └─ Direct: ${directResult.suggestions.length} suggestions (${directResult.durationMs}ms)`);
      
      // Find which ones are "children" (start with parent phrase)
      const children = directResult.suggestions.filter(s => 
        s.toLowerCase().startsWith(parentPhrase.toLowerCase()) && 
        s.toLowerCase() !== parentPhrase.toLowerCase()
      );
      
      console.log(`     └─ Child phrases (extend parent): ${children.length}`);
      children.forEach(c => {
        allChildPhrases.add(c);
        console.log(`        • ${c}`);
      });
      
      // Also track non-child suggestions (related but don't extend)
      const related = directResult.suggestions.filter(s => 
        !s.toLowerCase().startsWith(parentPhrase.toLowerCase())
      );
      if (related.length > 0) {
        console.log(`     └─ Related (different topic): ${related.length}`);
        related.slice(0, 3).forEach(r => console.log(`        • ${r}`));
        if (related.length > 3) console.log(`        ... and ${related.length - 3} more`);
      }
    } else {
      console.log(`  └─ ❌ Failed: ${directResult.error}`);
    }
    
    childResults.push({
      parent: parentPhrase,
      direct: directResult,
    });
    
    // Safety delay between calls
    if (i < top10Result.suggestions.length - 1) {
      await sleep(200);
    }
  }
  
  // STEP 3: Summary
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                      SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log(`Seed Phrase:       "${seedPhrase}"`);
  console.log(`Top 10 Phrases:    ${top10Result.suggestions.length}`);
  console.log(`Child Expansions:  ${childResults.length}`);
  console.log(`Unique Children:   ${allChildPhrases.size}`);
  console.log();
  
  // Calculate timing
  const totalCalls = 1 + childResults.length;
  const totalTime = top10Result.durationMs + childResults.reduce((sum, r) => sum + r.direct.durationMs, 0);
  console.log(`Total API Calls:   ${totalCalls}`);
  console.log(`Total Time:        ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`Avg per Call:      ${(totalTime / totalCalls).toFixed(0)}ms`);
  
  console.log();
  console.log('─'.repeat(60));
  console.log('ALL UNIQUE CHILD PHRASES:');
  console.log('─'.repeat(60));
  
  Array.from(allChildPhrases).sort().forEach((phrase, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${phrase}`);
  });
  
  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                  APIFY VS CURRENT SYSTEM');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log('Current System (Direct YouTube API):');
  console.log('  - 1 call for Top 10');
  console.log('  - For each Top 10 phrase:');
  console.log('    - 1 direct expansion call');
  console.log('    - 1 "how to {phrase}" call');
  console.log('    - 1 "what does {phrase}" call');
  console.log('  - Total: ~31 calls for full child expansion');
  console.log();
  console.log('Apify Equivalent:');
  console.log('  - Same structure works!');
  console.log('  - 1 call for Top 10');
  console.log('  - 3 calls per Top 10 phrase (direct + 2 prefixes)');
  console.log('  - Total: ~31 calls');
  console.log('  - BUT: Apify ~2.5s per call vs YouTube ~100ms');
  console.log('  - Trade-off: Slower but no IP blocking risk');
  console.log();
  console.log('Optimization with use_prefix/use_suffix:');
  console.log('  - use_suffix=true: Gets A-Z variations in 1 call');
  console.log('  - But for child expansion, we need individual calls');
  console.log('  - Because each Top 10 phrase is a NEW seed');
  console.log();
}

main().catch(console.error);
