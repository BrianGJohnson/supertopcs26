/**
 * Test Gemini Demand Scoring on Content Creation session
 * 
 * Run with: node scripts/test-content-creation-gemini.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SESSION_ID = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';
const API_BASE = 'http://localhost:3000';

async function main() {
  console.log('='.repeat(60));
  console.log('GEMINI DEMAND SCORING - Content Creation Session');
  console.log('='.repeat(60));
  console.log(`\nSession ID: ${SESSION_ID}`);

  // Get a sample of phrases to score (max 75)
  // Include: seed, all top10, and a mix of others
  const { data: allSeeds, error } = await supabase
    .from('seeds')
    .select('id, phrase, generation_method')
    .eq('session_id', SESSION_ID)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching seeds:', error);
    return;
  }

  console.log(`\n📊 Total phrases in session: ${allSeeds.length}`);

  // Build our sample: seed + top10 + sample of each type
  const seed = allSeeds.filter(s => s.generation_method === 'seed');
  const top10 = allSeeds.filter(s => s.generation_method === 'top10');
  const az = allSeeds.filter(s => s.generation_method === 'az').slice(0, 25);
  const prefix = allSeeds.filter(s => s.generation_method === 'prefix').slice(0, 20);
  const child = allSeeds.filter(s => s.generation_method === 'child_phrase').slice(0, 15);

  const sample = [...seed, ...top10, ...az, ...prefix, ...child];
  const seedIds = sample.map(s => s.id);

  console.log(`\n📋 Scoring sample of ${sample.length} phrases:`);
  console.log(`   - seed: ${seed.length}`);
  console.log(`   - top10: ${top10.length}`);
  console.log(`   - az: ${az.length}`);
  console.log(`   - prefix: ${prefix.length}`);
  console.log(`   - child_phrase: ${child.length}`);

  console.log('\n⏳ Calling Gemini scoring API...');
  console.log('   (This may take 30-60 seconds due to API rate limiting)\n');

  try {
    const response = await fetch(
      `${API_BASE}/api/sessions/${SESSION_ID}/score-demand-gemini`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seedIds }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();

    console.log('✅ Scoring complete!');
    console.log('─'.repeat(50));
    console.log(`   Total scored: ${result.totalScored}`);
    console.log(`   API calls: ${result.totalApiCalls}`);
    console.log(`   Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
    console.log(`   Est. cost: $${result.estimatedCostUsd.toFixed(4)}`);
    console.log('');
    console.log(`   📈 Session size: ${result.sessionSize}`);
    console.log(`   📈 Ecosystem score: ${result.ecosystemScore}/30`);
    console.log(`   📈 Seed score (ceiling): ${result.seedScore}`);
    console.log('');
    console.log('   📊 Score Distribution:');
    console.log(`      🔥 Extreme (85-99): ${result.distribution.extreme} (${(result.distribution.extreme/result.totalScored*100).toFixed(0)}%)`);
    console.log(`      ⚡ High (65-84):    ${result.distribution.high} (${(result.distribution.high/result.totalScored*100).toFixed(0)}%)`);
    console.log(`      💡 Moderate (40-64): ${result.distribution.moderate} (${(result.distribution.moderate/result.totalScored*100).toFixed(0)}%)`);
    console.log(`      ❄️  Low (20-39):     ${result.distribution.low} (${(result.distribution.low/result.totalScored*100).toFixed(0)}%)`);
    console.log(`      ⛔ Very Low (0-19): ${result.distribution.veryLow} (${(result.distribution.veryLow/result.totalScored*100).toFixed(0)}%)`);

    // Show top 10 highest scoring phrases
    const sorted = result.results.sort((a, b) => b.score - a.score);
    console.log('\n   🏆 Top 10 Highest Scores:');
    for (let i = 0; i < Math.min(10, sorted.length); i++) {
      const r = sorted[i];
      const phrase = sample.find(s => s.id === r.seedId)?.phrase || 'Unknown';
      const truncated = phrase.length > 40 ? phrase.slice(0, 40) + '...' : phrase;
      console.log(`      ${i+1}. ${r.score.toString().padStart(2)} | ${truncated}`);
      if (r.parentPhrase) {
        console.log(`         └─ inherits from "${r.parentPhrase}" (${r.matchStrength})`);
      }
    }

    // Show breakdown for seed and first few top10
    console.log('\n   📊 Scoring Breakdown (Seed + Top 10):');
    const breakdownPhrases = [...seed, ...top10.slice(0, 5)];
    for (const s of breakdownPhrases) {
      const r = result.results.find(r => r.seedId === s.id);
      if (r) {
        const truncated = s.phrase.length > 35 ? s.phrase.slice(0, 35) + '...' : s.phrase;
        console.log(`\n      "${truncated}"`);
        console.log(`         Eco: ${r.ecosystemScore} | Den: ${r.densityScore} | Rel: ${r.relevancyScore} | Inh: ${r.inheritanceBonus} → ${r.score}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main().catch(console.error);
