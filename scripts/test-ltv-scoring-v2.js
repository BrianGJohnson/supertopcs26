const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Calculate LTV (Long-Term Views) score using multiple matching strategies
 * 
 * Strategy 1: Full Top 10 Match (highest value)
 *   - The entire Top 10 phrase appears in the target
 *   - Score: 70-100 range
 * 
 * Strategy 2: Significant Word Overlap (medium value)
 *   - Target shares 60%+ meaningful words with a Top 10 phrase
 *   - Score: 40-69 range
 * 
 * Strategy 3: Moderate Word Overlap (low value)
 *   - Target shares 40-59% meaningful words with a Top 10 phrase
 *   - Score: 20-39 range
 */
function calculateLTV(phrase, top10Phrases, seedWords) {
  const phraseLower = phrase.toLowerCase();
  const phraseWords = phraseLower.split(/\s+/);
  
  // Filter out seed words and common prefixes for meaningful comparison
  const commonWords = new Set(['how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should', 'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', ...seedWords]);
  
  const meaningfulPhraseWords = phraseWords.filter(w => !commonWords.has(w) && w.length > 2);
  
  let bestScore = 0;
  let bestMatch = null;
  let bestStrategy = null;
  let bestDetails = null;
  
  for (const top10 of top10Phrases) {
    const top10Lower = top10.toLowerCase();
    const top10Words = top10Lower.split(/\s+/);
    const meaningfulTop10Words = top10Words.filter(w => !commonWords.has(w) && w.length > 2);
    
    // Strategy 1: Full phrase match
    const position = phraseLower.indexOf(top10Lower);
    if (position !== -1) {
      const density = (top10Words.length / phraseWords.length) * 100;
      const densityMultiplier = Math.pow(density / 100, 0.7);
      const charsBefore = position;
      const proximityScore = Math.max(8, 35 - (charsBefore * 0.8));
      const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const variation = 3 + (hash % 5);
      
      // Full match gets base of 55
      const score = Math.min(100, (55 * densityMultiplier) + proximityScore + variation);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = top10;
        bestStrategy = 'FULL_MATCH';
        bestDetails = { density: density.toFixed(1), proximity: proximityScore.toFixed(1) };
      }
    }
    
    // Strategy 2 & 3: Word overlap (only if no full match yet or overlap is better)
    if (meaningfulTop10Words.length > 0 && meaningfulPhraseWords.length > 0) {
      // Count how many meaningful Top 10 words appear in the phrase
      const matchingWords = meaningfulTop10Words.filter(w => meaningfulPhraseWords.includes(w));
      const overlapPct = (matchingWords.length / meaningfulTop10Words.length) * 100;
      
      // Also check for word position (beginning = better)
      let positionBonus = 0;
      if (matchingWords.length > 0) {
        const firstMatchIdx = phraseWords.findIndex(w => matchingWords.includes(w));
        if (firstMatchIdx === 0) positionBonus = 15;
        else if (firstMatchIdx <= 2) positionBonus = 10;
        else if (firstMatchIdx <= 4) positionBonus = 5;
      }
      
      // Hash for variation
      const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const variation = (hash % 8) - 4; // -4 to +4 for more spread
      
      let score = 0;
      let strategy = null;
      
      if (overlapPct >= 80) {
        // Near-complete word overlap: 50-65 range
        score = 50 + (overlapPct - 80) * 0.5 + positionBonus + variation;
        strategy = 'HIGH_OVERLAP';
      } else if (overlapPct >= 60) {
        // Strong overlap: 35-50 range
        score = 35 + (overlapPct - 60) * 0.75 + positionBonus * 0.7 + variation;
        strategy = 'MEDIUM_OVERLAP';
      } else if (overlapPct >= 40) {
        // Moderate overlap: 20-35 range
        score = 20 + (overlapPct - 40) * 0.75 + positionBonus * 0.5 + variation;
        strategy = 'LOW_OVERLAP';
      }
      
      if (score > bestScore) {
        bestScore = Math.max(0, Math.min(100, score));
        bestMatch = top10;
        bestStrategy = strategy;
        bestDetails = { 
          overlap: overlapPct.toFixed(0) + '%',
          matchingWords: matchingWords.join(', '),
          positionBonus
        };
      }
    }
  }
  
  return {
    score: Math.round(bestScore),
    match: bestMatch,
    strategy: bestStrategy,
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
  
  // Get the seed phrase to extract seed words
  const seedPhrase = seeds.find(s => s.generation_method === 'seed');
  const seedWords = seedPhrase ? seedPhrase.phrase.toLowerCase().split(/\s+/) : [];
  
  // Separate Top 10 (our gold standard)
  const top10 = seeds
    .filter(s => s.generation_method === 'top10' && s.position <= 10)
    .map(s => s.phrase);
  
  // Get all other phrases to score
  const toScore = seeds.filter(s => 
    s.generation_method !== 'top10' && 
    s.generation_method !== 'seed'
  );
  
  console.log('=== SEED WORDS ===');
  console.log(seedWords.join(', '));
  
  console.log('\n=== TOP 10 PHRASES (Gold Standard) ===\n');
  top10.forEach((p, i) => console.log(`${i+1}. "${p}"`));
  
  console.log('\n\n=== SCORING ALL PHRASES ===\n');
  
  // Score all phrases
  const scored = toScore.map(s => {
    const result = calculateLTV(s.phrase, top10, seedWords);
    return {
      phrase: s.phrase,
      method: s.generation_method,
      ltv: result.score,
      match: result.match,
      strategy: result.strategy,
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
    '1-9': 0,
    '0 (no match)': 0
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
    else if (s.ltv >= 1) distribution['1-9']++;
    else distribution['0 (no match)']++;
  });
  
  console.log('=== LTV DISTRIBUTION ===\n');
  const total = scored.length;
  Object.entries(distribution).forEach(([range, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`${range.padStart(15)}: ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  });
  
  // Show by strategy
  const byStrategy = {
    'FULL_MATCH': scored.filter(s => s.strategy === 'FULL_MATCH').length,
    'HIGH_OVERLAP': scored.filter(s => s.strategy === 'HIGH_OVERLAP').length,
    'MEDIUM_OVERLAP': scored.filter(s => s.strategy === 'MEDIUM_OVERLAP').length,
    'LOW_OVERLAP': scored.filter(s => s.strategy === 'LOW_OVERLAP').length,
    'NO_MATCH': scored.filter(s => !s.strategy).length
  };
  console.log('\n=== BY STRATEGY ===\n');
  Object.entries(byStrategy).forEach(([strat, count]) => {
    console.log(`${strat.padStart(15)}: ${count}`);
  });
  
  // Show top scorers
  const topScorers = scored.filter(s => s.ltv > 0).sort((a, b) => b.ltv - a.ltv).slice(0, 10);
  console.log('\n\n=== TOP 10 LTV SCORES ===\n');
  topScorers.forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${String(s.ltv).padStart(2)} [${s.method.padEnd(6)}] [${s.strategy}] "${s.phrase}"`);
  });
  
  // Show mid-range
  const midScorers = scored.filter(s => s.ltv >= 35 && s.ltv <= 55).sort((a, b) => b.ltv - a.ltv).slice(0, 10);
  console.log('\n\n=== MID-RANGE LTV SCORES (35-55) ===\n');
  midScorers.forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${String(s.ltv).padStart(2)} [${s.method.padEnd(6)}] "${s.phrase}"`);
    if (s.details?.matchingWords) console.log(`    └─ Matched words: ${s.details.matchingWords}`);
  });
  
  // Show low range
  const lowScorers = scored.filter(s => s.ltv >= 15 && s.ltv < 35).sort((a, b) => b.ltv - a.ltv).slice(0, 10);
  console.log('\n\n=== LOW LTV SCORES (15-35) ===\n');
  lowScorers.forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${String(s.ltv).padStart(2)} [${s.method.padEnd(6)}] "${s.phrase}"`);
  });
  
  // Stats
  const withMatch = scored.filter(s => s.ltv > 0);
  const avgScore = withMatch.length > 0 
    ? (withMatch.reduce((sum, s) => sum + s.ltv, 0) / withMatch.length).toFixed(1)
    : 0;
  
  console.log('\n\n=== SUMMARY ===\n');
  console.log(`Total phrases scored: ${total}`);
  console.log(`Phrases with LTV > 0: ${withMatch.length} (${((withMatch.length/total)*100).toFixed(1)}%)`);
  console.log(`Phrases with NO match: ${total - withMatch.length} (${(((total-withMatch.length)/total)*100).toFixed(1)}%)`);
  console.log(`Average LTV (matched only): ${avgScore}`);
  console.log(`Badge eligible (LTV ≥ 50): ${scored.filter(s => s.ltv >= 50).length}`);
  console.log(`Popularity boost eligible (LTV ≥ 20): ${scored.filter(s => s.ltv >= 20).length}`);
}

main();
