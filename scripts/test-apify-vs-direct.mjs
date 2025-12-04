/**
 * Test script to compare Apify autocomplete vs Direct YouTube API
 * 
 * Tests:
 * 1. Top-10 results for "make money"
 * 2. Child phrase generation for those Top-10 results
 */

import 'dotenv/config';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR = process.env.APIFY_AUTOCOMPLETE_ACTOR;

// Direct YouTube API endpoint
const YOUTUBE_API_URL = 'https://suggestqueries.google.com/complete/search';

/**
 * Fetch from Direct YouTube API
 */
async function fetchDirectYouTube(query) {
  const url = `${YOUTUBE_API_URL}?client=firefox&ds=yt&q=${encodeURIComponent(query)}&hl=en&gl=US`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`Direct API error: ${response.status}`);
      return [];
    }
    
    const text = await response.text();
    
    // Parse JSONP/JSON response
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        data = JSON.parse(match[0]);
      }
    }
    
    // Extract suggestions from nested array format [query, [suggestions], ...]
    if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
      return data[1].map(item => {
        if (typeof item === 'string') return item;
        if (Array.isArray(item) && item[0]) return item[0];
        return null;
      }).filter(Boolean);
    }
    
    return [];
  } catch (error) {
    console.error(`Direct API error for "${query}":`, error.message);
    return [];
  }
}

/**
 * Fetch from Apify Actor
 */
async function fetchApify(queries) {
  const queriesArray = Array.isArray(queries) ? queries : [queries];
  
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: queriesArray,
        language: 'en',
        country: 'US'
      })
    });
    
    if (!response.ok) {
      console.error(`Apify error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    // Return grouped by seed for child expansion testing
    const grouped = {};
    for (const item of data) {
      if (!item.seed || !item.suggestion) continue;
      if (!grouped[item.seed]) grouped[item.seed] = [];
      grouped[item.seed].push(item.suggestion);
    }
    
    return grouped;
  } catch (error) {
    console.error(`Apify error:`, error.message);
    return {};
  }
}

/**
 * Compare two arrays and report differences
 */
function compareResults(label, directResults, apifyResults) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${label}`);
  console.log(`${'='.repeat(60)}`);
  
  console.log(`\nDirect YouTube API (${directResults.length} results):`);
  directResults.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  
  console.log(`\nApify Actor (${apifyResults.length} results):`);
  apifyResults.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  
  // Calculate overlap
  const directSet = new Set(directResults.map(r => r.toLowerCase().trim()));
  const apifySet = new Set(apifyResults.map(r => r.toLowerCase().trim()));
  
  const onlyInDirect = directResults.filter(r => !apifySet.has(r.toLowerCase().trim()));
  const onlyInApify = apifyResults.filter(r => !directSet.has(r.toLowerCase().trim()));
  const inBoth = directResults.filter(r => apifySet.has(r.toLowerCase().trim()));
  
  console.log(`\n📊 Comparison:`);
  console.log(`  ✓ In Both: ${inBoth.length}`);
  console.log(`  ○ Only in Direct: ${onlyInDirect.length}`);
  console.log(`  ○ Only in Apify: ${onlyInApify.length}`);
  
  if (onlyInDirect.length > 0) {
    console.log(`\n  Only in Direct:`);
    onlyInDirect.forEach(r => console.log(`    - ${r}`));
  }
  
  if (onlyInApify.length > 0) {
    console.log(`\n  Only in Apify:`);
    onlyInApify.forEach(r => console.log(`    - ${r}`));
  }
  
  const matchPercent = directResults.length > 0 
    ? Math.round((inBoth.length / directResults.length) * 100) 
    : 0;
  console.log(`\n  Match Rate: ${matchPercent}%`);
  
  return { inBoth, onlyInDirect, onlyInApify, matchPercent };
}

async function main() {
  console.log('🧪 Testing Apify vs Direct YouTube API\n');
  console.log(`Apify Actor: ${APIFY_ACTOR}`);
  console.log(`Test Seed: "make money"\n`);
  
  // ============================================
  // TEST 1: Top-10 for "make money"
  // ============================================
  console.log('\n📋 TEST 1: Top-10 Results for "make money"');
  
  // Direct API
  console.log('\nFetching from Direct YouTube API...');
  const directTop10 = await fetchDirectYouTube('make money');
  
  // Small delay between APIs
  await new Promise(r => setTimeout(r, 500));
  
  // Apify
  console.log('Fetching from Apify Actor...');
  const apifyGrouped = await fetchApify(['make money']);
  const apifyTop10 = apifyGrouped['make money'] || [];
  
  const top10Comparison = compareResults('TOP-10 COMPARISON', directTop10, apifyTop10);
  
  // ============================================
  // TEST 2: Child phrases for first 3 Top-10 results
  // ============================================
  console.log('\n\n📋 TEST 2: Child Phrases (testing first 3 Top-10 results)');
  
  // Take first 3 from direct results (or apify if direct is empty)
  const parentPhrases = (directTop10.length > 0 ? directTop10 : apifyTop10).slice(0, 3);
  
  if (parentPhrases.length === 0) {
    console.log('No parent phrases to test child expansion!');
    return;
  }
  
  console.log(`\nParent phrases for child expansion:`);
  parentPhrases.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  
  // Fetch children from Direct API (one at a time)
  console.log('\nFetching children from Direct YouTube API...');
  const directChildren = {};
  for (const parent of parentPhrases) {
    directChildren[parent] = await fetchDirectYouTube(parent);
    await new Promise(r => setTimeout(r, 300)); // Small delay between requests
  }
  
  // Fetch children from Apify (batch)
  console.log('Fetching children from Apify Actor...');
  const apifyChildren = await fetchApify(parentPhrases);
  
  // Compare for each parent
  let totalDirectChildren = 0;
  let totalApifyChildren = 0;
  let totalMatches = 0;
  
  for (const parent of parentPhrases) {
    const direct = directChildren[parent] || [];
    const apify = apifyChildren[parent] || [];
    
    totalDirectChildren += direct.length;
    totalApifyChildren += apify.length;
    
    const result = compareResults(`CHILD PHRASES for "${parent}"`, direct, apify);
    totalMatches += result.inBoth.length;
  }
  
  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 OVERALL SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTop-10 Match Rate: ${top10Comparison.matchPercent}%`);
  console.log(`\nChild Phrases:`);
  console.log(`  Total Direct: ${totalDirectChildren}`);
  console.log(`  Total Apify: ${totalApifyChildren}`);
  console.log(`  Total Matches: ${totalMatches}`);
  
  if (top10Comparison.matchPercent >= 90) {
    console.log('\n✅ PASS: Apify results closely match Direct API');
  } else if (top10Comparison.matchPercent >= 70) {
    console.log('\n⚠️  WARNING: Some differences between Apify and Direct API');
  } else {
    console.log('\n❌ FAIL: Significant differences between Apify and Direct API');
  }
}

main().catch(console.error);
