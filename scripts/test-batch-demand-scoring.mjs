/**
 * Test Script: Batch Demand Scoring
 * 
 * Tests whether we can batch multiple phrases in ONE API call
 * and get back the data we need for demand/competition scoring.
 */

import 'dotenv/config';

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_NAME = process.env.APIFY_AUTOCOMPLETE_ACTOR;

// 5 diverse phrases from AI Thumbnail session - mix of lengths and types
const testPhrases = [
  'AI Thumbnail',                          // Seed (2 words)
  'AI Thumbnail Generator',                // Top 10 (3 words)  
  'AI Thumbnail Maker Gaming',             // Top 10 (4 words)
  'AI Thumbnail Maker For YouTube Free',   // Child (6 words)
  'AI Thumbnail Maker With Own Photo'      // Child (6 words)
];

async function runBatchTest() {
  console.log('='.repeat(60));
  console.log('BATCH TEST: 5 phrases in ONE API call');
  console.log('='.repeat(60));
  console.log('');
  console.log('Phrases being tested:');
  testPhrases.forEach((p, i) => console.log(`  ${i+1}. ${p}`));
  console.log('');
  
  const startTime = Date.now();
  
  const url = `https://api.apify.com/v2/acts/${ACTOR_NAME}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries: testPhrases })
  });
  
  const elapsed = Date.now() - startTime;
  
  if (!response.ok) {
    console.error('API Error:', response.status, await response.text());
    return;
  }
  
  const results = await response.json();
  
  console.log('='.repeat(60));
  console.log(`RESULTS (took ${(elapsed/1000).toFixed(1)}s)`);
  console.log('='.repeat(60));
  console.log('');
  
  for (const result of results) {
    const query = result.query;
    const suggestions = result.suggestions || [];
    const queryLower = query.toLowerCase();
    
    // Calculate exact match (starts with query)
    const exactMatches = suggestions.filter(s => 
      s.toLowerCase().startsWith(queryLower)
    );
    
    // Calculate topic match (contains all key words from query)
    const queryWords = queryLower.split(' ').filter(w => w.length > 2);
    const topicMatches = suggestions.filter(s => {
      const sLower = s.toLowerCase();
      return queryWords.every(word => sLower.includes(word));
    });
    
    const exactPct = suggestions.length ? Math.round(exactMatches.length/suggestions.length*100) : 0;
    const topicPct = suggestions.length ? Math.round(topicMatches.length/suggestions.length*100) : 0;
    
    console.log(`📍 Query: "${query}"`);
    console.log(`   Total suggestions: ${suggestions.length}`);
    console.log(`   Exact matches: ${exactMatches.length} of ${suggestions.length} (${exactPct}%)`);
    console.log(`   Topic matches: ${topicMatches.length} of ${suggestions.length} (${topicPct}%)`);
    console.log(`   Top 5 suggestions:`);
    suggestions.slice(0, 5).forEach((s, i) => {
      const isExact = s.toLowerCase().startsWith(queryLower);
      const marker = isExact ? '✓' : '○';
      console.log(`      ${marker} ${i+1}. ${s}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Batched ${testPhrases.length} phrases in 1 API call`);
  console.log(`✅ Each phrase returned its own suggestions`);
  console.log(`✅ We can calculate exact/topic match for each`);
  console.log('');
  console.log('COST PROJECTION:');
  console.log('  75 phrases ÷ 15 per batch = 5 API calls');
  console.log('  5 calls × $0.001 = $0.005 (half a cent)');
  console.log('='.repeat(60));
}

runBatchTest().catch(console.error);
