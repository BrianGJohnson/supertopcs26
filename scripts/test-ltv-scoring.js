const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Calculate LTV (Long-Term Views) score for a phrase based on Top 10 matching
 * 
 * Formula: LTV = (Base × Density Multiplier) + Proximity Score + Variation
 * - Base = 55 (credit for having ANY Top 10 match)
 * - Density Multiplier = (density / 100) ^ 0.7
 * - Proximity Score = 35 - (chars_before × 0.8), min 8
 * - Variation = 3-7 (seeded by phrase for consistency)
 */
function calculateLTV(phrase, top10Phrases) {
  const phraseLower = phrase.toLowerCase();
  
  let bestScore = 0;
  let bestMatch = null;
  let bestDetails = null;
  
  for (const top10 of top10Phrases) {
    const top10Lower = top10.toLowerCase();
    
    // Check if this Top 10 phrase appears COMPLETELY in the target phrase
    const position = phraseLower.indexOf(top10Lower);
    if (position === -1) continue;
    
    // Calculate density
    const top10Words = top10Lower.split(/\s+/).length;
    const phraseWords = phraseLower.split(/\s+/).length;
    const density = (top10Words / phraseWords) * 100;
    const densityMultiplier = Math.pow(density / 100, 0.7);
    
    // Calculate proximity (chars before the match)
    const charsBefore = position;
    const proximityScore = Math.max(8, 35 - (charsBefore * 0.8));
    
    // Variation based on phrase hash (consistent per phrase)
    const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const variation = 3 + (hash % 5); // 3-7
    
    // Combined score
    const score = Math.min(100, (55 * densityMultiplier) + proximityScore + variation);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = top10;
      bestDetails = {
        top10Words,
        phraseWords,
        density: density.toFixed(1),
        densityMultiplier: densityMultiplier.toFixed(3),
        charsBefore,
        proximityScore: proximityScore.toFixed(1),
        variation
      };
    }
  }
  
  return {
    score: Math.round(bestScore),
    match: bestMatch,
    details: bestDetails
  };
}

async function main() {
  const sessionId = '1a95a83e-a87a-46f5-85d9-a0e42b2de978';
  
  // Get ALL seeds
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });
  
  // Separate Top 10 (our gold standard)
  const top10 = seeds
    .filter(s => s.generation_method === 'top10' && s.position <= 10)
    .map(s => s.phrase);
  
  // Get all other phrases to score
  const toScore = seeds.filter(s => 
    s.generation_method !== 'top10' && 
    s.generation_method !== 'seed'
  );
  
  console.log('=== TOP 10 PHRASES (Gold Standard) ===\n');
  top10.forEach((p, i) => console.log(`${i+1}. "${p}"`));
  
  console.log('\n\n=== SCORING ALL PHRASES ===\n');
  
  // Score all phrases
  const scored = toScore.map(s => {
    const result = calculateLTV(s.phrase, top10);
    return {
      phrase: s.phrase,
      method: s.generation_method,
      ltv: result.score,
      match: result.match,
      details: result.details
    };
  });
  
  // Distribution analysis
  const distribution = {
    '90-100': 0,
    '80-89': 0,
    '70-79': 0,
    '60-69': 0,
    '50-59': 0,
    '40-49': 0,
    '30-39': 0,
    '20-29': 0,
    '10-19': 0,
    '0-9 (no match)': 0
  };
  
  scored.forEach(s => {
    if (s.ltv >= 90) distribution['90-100']++;
    else if (s.ltv >= 80) distribution['80-89']++;
    else if (s.ltv >= 70) distribution['70-79']++;
    else if (s.ltv >= 60) distribution['60-69']++;
    else if (s.ltv >= 50) distribution['50-59']++;
    else if (s.ltv >= 40) distribution['40-49']++;
    else if (s.ltv >= 30) distribution['30-39']++;
    else if (s.ltv >= 20) distribution['20-29']++;
    else if (s.ltv >= 10) distribution['10-19']++;
    else distribution['0-9 (no match)']++;
  });
  
  console.log('=== LTV DISTRIBUTION ===\n');
  const total = scored.length;
  Object.entries(distribution).forEach(([range, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`${range.padStart(15)}: ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  });
  
  // Show top scorers
  const topScorers = scored.filter(s => s.ltv > 0).sort((a, b) => b.ltv - a.ltv).slice(0, 15);
  console.log('\n\n=== TOP 15 LTV SCORES ===\n');
  topScorers.forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${s.ltv} [${s.method}] "${s.phrase}"`);
    if (s.details) {
      console.log(`    └─ Matched: "${s.match}"`);
      console.log(`       Density: ${s.details.density}% (${s.details.top10Words}/${s.details.phraseWords} words)`);
      console.log(`       Proximity: ${s.details.proximityScore} (${s.details.charsBefore} chars before)`);
    }
  });
  
  // Show some mid-range scores
  const midScorers = scored.filter(s => s.ltv >= 40 && s.ltv <= 60).slice(0, 10);
  console.log('\n\n=== MID-RANGE LTV SCORES (40-60) ===\n');
  midScorers.forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${s.ltv} [${s.method}] "${s.phrase}"`);
  });
  
  // Show low scores (but still matched)
  const lowScorers = scored.filter(s => s.ltv > 0 && s.ltv < 40).slice(0, 10);
  console.log('\n\n=== LOW LTV SCORES (1-39) ===\n');
  lowScorers.forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${s.ltv} [${s.method}] "${s.phrase}"`);
  });
  
  // Stats
  const withMatch = scored.filter(s => s.ltv > 0);
  const avgScore = withMatch.length > 0 
    ? (withMatch.reduce((sum, s) => sum + s.ltv, 0) / withMatch.length).toFixed(1)
    : 0;
  
  console.log('\n\n=== SUMMARY ===\n');
  console.log(`Total phrases scored: ${total}`);
  console.log(`Phrases with Top 10 match: ${withMatch.length} (${((withMatch.length/total)*100).toFixed(1)}%)`);
  console.log(`Phrases with NO match: ${total - withMatch.length} (${(((total-withMatch.length)/total)*100).toFixed(1)}%)`);
  console.log(`Average LTV (matched only): ${avgScore}`);
  console.log(`Badge eligible (LTV ≥ 50): ${scored.filter(s => s.ltv >= 50).length}`);
}

main();
