import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SESSION_ID = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';

// Point tables from demand-scoring.ts
const SUGGESTION_POINTS = { 14: 40, 13: 37, 12: 34, 11: 31, 10: 29, 9: 26, 8: 23, 7: 20, 6: 17, 5: 14, 4: 11, 3: 9, 2: 6, 1: 3, 0: 0 };
const TOPIC_MATCH_POINTS = { 14: 30, 13: 28, 12: 26, 11: 24, 10: 21, 9: 19, 8: 17, 7: 15, 6: 13, 5: 11, 4: 9, 3: 6, 2: 4, 1: 2, 0: 0 };
const EXACT_MATCH_POINTS = { 14: 30, 13: 28, 12: 26, 11: 24, 10: 21, 9: 19, 8: 17, 7: 15, 6: 13, 5: 11, 4: 9, 3: 6, 2: 4, 1: 2, 0: 0 };

// NEW ECOSYSTEM BOOSTS
const ECOSYSTEM_BOOSTS = [
  { minSuggestions: 7, boost: 30 },
  { minSuggestions: 5, boost: 25 },
  { minSuggestions: 3, boost: 20 },
  { minSuggestions: 1, boost: 15 },
];

function getBoost(suggCount, sessionSize) {
  const scale = Math.min(1.0, sessionSize / 500);
  for (const tier of ECOSYSTEM_BOOSTS) {
    if (suggCount >= tier.minSuggestions) {
      return Math.round(tier.boost * scale);
    }
  }
  return 0;
}

function getPoints(count, table) {
  if (count >= 14) return table[14];
  if (count < 0) return 0;
  return table[count] ?? 0;
}

async function simulate() {
  // Get session data
  const { data: session } = await s.from('sessions').select('*').eq('id', SESSION_ID).single();
  const seedScore = session?.seed_score ?? 96;
  const cap = seedScore - 3;
  
  // Get seeds
  const { data: seeds } = await s.from('seeds').select('id, phrase').eq('session_id', SESSION_ID);
  const seedIds = seeds.map(x => x.id);
  
  // Get analyses
  let analyses = [];
  for (let i = 0; i < seedIds.length; i += 100) {
    const batch = seedIds.slice(i, i + 100);
    const { data } = await s.from('seed_analysis').select('seed_id, demand, is_hidden, extra').in('seed_id', batch);
    if (data) analyses.push(...data);
  }
  
  const phraseMap = new Map(seeds.map(x => [x.id, x.phrase]));
  const sessionSize = analyses.length;
  
  // Get visible with existing demand scores
  const visible = analyses.filter(a => !a.is_hidden && a.extra?.demand_v2);
  
  console.log(`Session size: ${sessionSize}`);
  console.log(`Seed score: ${seedScore}, cap: ${cap}`);
  console.log(`Visible with demand_v2 data: ${visible.length}\n`);
  
  if (visible.length === 0) {
    console.log('No demand_v2 data found. Run demand scoring first.');
    return;
  }
  
  // Recalculate with new boost formula
  const newScores = [];
  for (const v of visible) {
    const d = v.extra.demand_v2;
    const suggCount = d.suggestionCount ?? 0;
    const topicMatches = d.topicMatchCount ?? 0;
    const exactMatches = d.exactMatchCount ?? 0;
    
    const suggPts = getPoints(suggCount, SUGGESTION_POINTS);
    const topicPts = getPoints(topicMatches, TOPIC_MATCH_POINTS);
    const exactPts = getPoints(exactMatches, EXACT_MATCH_POINTS);
    
    const rawScore = suggPts + topicPts + exactPts;
    const sizeMultiplier = 1.06; // 582 phrases = 1.06x
    let score = Math.round(rawScore * sizeMultiplier);
    
    // Add boost
    const boost = getBoost(suggCount, sessionSize);
    score += boost;
    
    // Apply cap
    const finalScore = Math.min(cap, Math.max(0, score));
    
    newScores.push({
      phrase: phraseMap.get(v.seed_id),
      oldScore: v.demand,
      newScore: finalScore,
      suggCount,
      rawScore,
      boost
    });
  }
  
  // Sort by new score
  newScores.sort((a, b) => b.newScore - a.newScore);
  
  console.log('=== SIMULATED SCORES WITH BOOST ===\n');
  console.log('New | Old | Sugg | Boost | Phrase');
  console.log('-'.repeat(70));
  for (const s of newScores.slice(0, 30)) {
    console.log(`${String(s.newScore).padStart(3)} | ${String(s.oldScore ?? '?').padStart(3)} | ${String(s.suggCount).padStart(4)} | ${String('+' + s.boost).padStart(5)} | ${s.phrase?.slice(0, 40)}`);
  }
  
  // Distribution
  const dist = { '90-99': 0, '80-89': 0, '70-79': 0, '60-69': 0, '50-59': 0, '40-49': 0, '30-39': 0, '20-29': 0, '10-19': 0, '0-9': 0 };
  for (const s of newScores) {
    const range = Math.floor(s.newScore / 10) * 10;
    const key = `${range}-${range + 9}`;
    if (dist[key] !== undefined) dist[key]++;
  }
  
  console.log('\n=== NEW DISTRIBUTION ===\n');
  for (const [range, count] of Object.entries(dist)) {
    const pct = Math.round(count / newScores.length * 100);
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`${range}: ${String(count).padStart(2)} (${String(pct).padStart(2)}%) ${bar}`);
  }
  
  // Count in each range
  const above50 = newScores.filter(s => s.newScore >= 50).length;
  console.log(`\nAbove 50: ${above50}/${newScores.length} (${Math.round(above50/newScores.length*100)}%)`);
}

simulate().catch(console.error);
