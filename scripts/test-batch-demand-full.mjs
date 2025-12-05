/**
 * Batch Demand Analysis - Full Session Test
 * 
 * Pulls 25 diverse phrases from AI Thumbnail session,
 * runs them through autocomplete, and analyzes the patterns.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env from .env.local
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const ACTOR_NAME = process.env.APIFY_AUTOCOMPLETE_ACTOR;
const SESSION_ID = '37ef9634-961f-42bd-907c-b7fbce5f9659';

async function getSamplePhrases() {
  const { data, error } = await supabase
    .from('seeds')
    .select('phrase, generation_method')
    .eq('session_id', SESSION_ID);
  
  if (error) throw error;
  
  console.log(`Total phrases in session: ${data.length}`);
  
  // Group by source
  const bySource = {};
  data.forEach(s => {
    const src = s.generation_method;
    if (!bySource[src]) bySource[src] = [];
    bySource[src].push(s.phrase);
  });
  
  console.log('By source:');
  Object.entries(bySource).forEach(([src, phrases]) => {
    console.log(`  ${src}: ${phrases.length}`);
  });
  
  // Build diverse sample - get more phrases
  const sample = [];
  
  // Seed
  if (bySource.seed) sample.push(...bySource.seed.slice(0, 1));
  
  // Top10 - all of them
  if (bySource.top10) {
    sample.push(...bySource.top10.slice(0, 13));
  }
  
  // Child phrases - more
  if (bySource.child_phrase) {
    sample.push(...bySource.child_phrase.slice(0, 20));
  }
  
  // A-Z - sample
  if (bySource.az_expansion) {
    sample.push(...bySource.az_expansion.slice(0, 10));
  }
  
  // Prefix - sample
  if (bySource.prefix_expansion) {
    sample.push(...bySource.prefix_expansion.slice(0, 6));
  }
  
  return sample.slice(0, 50); // 50 phrases for thorough analysis
}

async function fetchAutocomplete(phrases) {
  const url = `https://api.apify.com/v2/acts/${ACTOR_NAME}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ queries: phrases })
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

function analyzeResults(rawResults) {
  // Group by seed
  const grouped = {};
  rawResults.forEach(item => {
    if (!grouped[item.seed]) grouped[item.seed] = [];
    grouped[item.seed].push(item.suggestion);
  });
  
  const analysis = [];
  
  Object.entries(grouped).forEach(([query, suggestions]) => {
    const queryLower = query.toLowerCase();
    const wordCount = query.split(' ').length;
    
    // Exact match: starts with the query
    const exact = suggestions.filter(s => 
      s.toLowerCase().startsWith(queryLower)
    );
    
    // Topic match: contains all significant words (3+ chars)
    const words = queryLower.split(' ').filter(w => w.length >= 3);
    const topic = suggestions.filter(s => {
      const sLower = s.toLowerCase();
      return words.every(w => sLower.includes(w));
    });
    
    analysis.push({
      phrase: query,
      wordCount,
      suggestions: suggestions.length,
      exactCount: exact.length,
      exactPct: suggestions.length ? Math.round(exact.length / suggestions.length * 100) : 0,
      topicCount: topic.length,
      topicPct: suggestions.length ? Math.round(topic.length / suggestions.length * 100) : 0,
    });
  });
  
  return analysis.sort((a, b) => b.suggestions - a.suggestions);
}

async function main() {
  console.log('='.repeat(80));
  console.log('BATCH DEMAND ANALYSIS - AI THUMBNAIL SESSION');
  console.log('='.repeat(80));
  console.log('');
  
  // Step 1: Get sample phrases
  console.log('Step 1: Getting sample phrases...');
  const phrases = await getSamplePhrases();
  console.log(`Selected ${phrases.length} phrases for analysis`);
  console.log('');
  
  // Step 2: Fetch autocomplete for all
  console.log('Step 2: Fetching autocomplete data (1 API call)...');
  const startTime = Date.now();
  const rawResults = await fetchAutocomplete(phrases);
  const elapsed = Date.now() - startTime;
  console.log(`Done in ${(elapsed/1000).toFixed(1)}s`);
  console.log('');
  
  // Step 3: Analyze results
  console.log('Step 3: Analyzing results...');
  const analysis = analyzeResults(rawResults);
  console.log('');
  
  // Step 4: Display results
  console.log('='.repeat(80));
  console.log('RESULTS BY SUGGESTION COUNT');
  console.log('='.repeat(80));
  console.log('');
  console.log('Words | Sugg | Exact | Topic | Phrase');
  console.log('-'.repeat(80));
  
  analysis.forEach(a => {
    const words = String(a.wordCount).padStart(5);
    const sugg = String(a.suggestions).padStart(4);
    const exact = `${a.exactCount}/${a.suggestions} (${a.exactPct}%)`.padStart(12);
    const topic = `${a.topicCount}/${a.suggestions} (${a.topicPct}%)`.padStart(12);
    console.log(`${words} | ${sugg} | ${exact} | ${topic} | ${a.phrase}`);
  });
  
  console.log('');
  console.log('='.repeat(80));
  console.log('PATTERNS BY WORD COUNT');
  console.log('='.repeat(80));
  
  // Group by word count
  const byWordCount = {};
  analysis.forEach(a => {
    if (!byWordCount[a.wordCount]) byWordCount[a.wordCount] = [];
    byWordCount[a.wordCount].push(a);
  });
  
  Object.entries(byWordCount).sort((a, b) => Number(a[0]) - Number(b[0])).forEach(([wc, items]) => {
    const avgSugg = (items.reduce((s, i) => s + i.suggestions, 0) / items.length).toFixed(1);
    const avgExact = (items.reduce((s, i) => s + i.exactPct, 0) / items.length).toFixed(0);
    const avgTopic = (items.reduce((s, i) => s + i.topicPct, 0) / items.length).toFixed(0);
    console.log(`${wc} words (${items.length} phrases): avg ${avgSugg} suggestions, ${avgExact}% exact, ${avgTopic}% topic`);
  });
  
  console.log('');
  console.log('='.repeat(80));
  console.log('KEY INSIGHTS');
  console.log('='.repeat(80));
  
  // Find patterns
  const highSugg = analysis.filter(a => a.suggestions >= 10);
  const medSugg = analysis.filter(a => a.suggestions >= 5 && a.suggestions < 10);
  const lowSugg = analysis.filter(a => a.suggestions < 5);
  
  console.log(`High suggestions (10+): ${highSugg.length} phrases`);
  console.log(`Medium suggestions (5-9): ${medSugg.length} phrases`);
  console.log(`Low suggestions (<5): ${lowSugg.length} phrases`);
  console.log('');
  
  // Sweet spots: low exact + high topic
  const sweetSpots = analysis.filter(a => a.exactPct < 40 && a.topicPct > 60 && a.suggestions >= 3);
  console.log(`Sweet spots (low exact, high topic, 3+ sugg): ${sweetSpots.length}`);
  sweetSpots.forEach(a => {
    console.log(`  → ${a.phrase} (${a.suggestions} sugg, ${a.exactPct}% exact, ${a.topicPct}% topic)`);
  });
  
  console.log('');
  console.log('='.repeat(80));
  console.log('COST: 1 API call for 25 phrases = $0.001');
  console.log('='.repeat(80));
}

main().catch(console.error);
