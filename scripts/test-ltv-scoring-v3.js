const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * LTV Scoring v3 - Focus on Top 10 "signature words"
 * 
 * Key insight: Top 10 phrases share the seed ("content creation") 
 * What makes them UNIQUE is the additional words:
 *   - "tips", "ideas", "beginners", "ai", "2025", "course", "equipment", "business"
 * 
 * These are the "signature words" - if a phrase contains them, it aligns with Top 10
 */

function calculateLTV(phrase, top10Phrases, seedWords) {
  const phraseLower = phrase.toLowerCase();
  const phraseWords = phraseLower.split(/\s+/);
  
  // Common filler words to ignore
  const fillerWords = new Set(['how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should', 'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs', 'full']);
  
  // Extract "signature words" from Top 10 (words that aren't seed or filler)
  const signatureWords = new Map(); // word -> count of Top 10 phrases containing it
  
  for (const top10 of top10Phrases) {
    const words = top10.toLowerCase().split(/\s+/);
    const meaningful = words.filter(w => 
      !seedWords.includes(w) && 
      !fillerWords.has(w) && 
      w.length > 2
    );
    meaningful.forEach(w => {
      signatureWords.set(w, (signatureWords.get(w) || 0) + 1);
    });
  }
  
  // Check for FULL Top 10 phrase match first (highest priority)
  let bestFullMatchScore = 0;
  let bestFullMatch = null;
  
  for (const top10 of top10Phrases) {
    const top10Lower = top10.toLowerCase();
    const position = phraseLower.indexOf(top10Lower);
    
    if (position !== -1) {
      const top10Words = top10Lower.split(/\s+/).length;
      const density = (top10Words / phraseWords.length) * 100;
      const densityMultiplier = Math.pow(density / 100, 0.6); // Gentler curve
      const charsBefore = position;
      const proximityScore = Math.max(10, 30 - (charsBefore * 0.6));
      
      // Base 50 for full match, scales up to ~95
      const score = 50 + (40 * densityMultiplier) + (proximityScore * 0.3);
      
      if (score > bestFullMatchScore) {
        bestFullMatchScore = score;
        bestFullMatch = top10;
      }
    }
  }
  
  if (bestFullMatchScore > 0) {
    const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const variation = (hash % 7) - 3; // -3 to +3
    return {
      score: Math.round(Math.min(98, bestFullMatchScore + variation)),
      strategy: 'FULL_MATCH',
      match: bestFullMatch
    };
  }
  
  // Check for signature word matches
  const phraseNonSeed = phraseWords.filter(w => 
    !seedWords.includes(w) && 
    !fillerWords.has(w) && 
    w.length > 2
  );
  
  let sigScore = 0;
  const matchedSigs = [];
  
  for (const word of phraseNonSeed) {
    if (signatureWords.has(word)) {
      const freq = signatureWords.get(word);
      // More frequent signature words = higher value
      sigScore += 15 + (freq * 5);
      matchedSigs.push(word);
    }
  }
  
  if (sigScore > 0) {
    // Position bonus: signature words at beginning = better
    let posBonus = 0;
    if (matchedSigs.length > 0) {
      const firstIdx = phraseWords.findIndex(w => matchedSigs.includes(w));
      if (firstIdx <= 2) posBonus = 12;
      else if (firstIdx <= 4) posBonus = 8;
      else posBonus = 4;
    }
    
    // Density bonus: more signature words relative to phrase length
    const densityBonus = Math.min(15, (matchedSigs.length / phraseWords.length) * 50);
    
    const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const variation = (hash % 9) - 4; // -4 to +4
    
    // Cap at 65 for signature matches (full match should always be higher)
    const finalScore = Math.min(65, sigScore + posBonus + densityBonus + variation);
    
    return {
      score: Math.round(Math.max(15, finalScore)), // Floor at 15
      strategy: 'SIG_MATCH',
      match: matchedSigs.join(', ')
    };
  }
  
  return { score: 0, strategy: null, match: null };
}

async function main() {
  const sessionId = '1a95a83e-a87a-46f5-85d9-a0e42b2de978';
  
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });
  
  const seedPhrase = seeds.find(s => s.generation_method === 'seed');
  const seedWords = seedPhrase ? seedPhrase.phrase.toLowerCase().split(/\s+/) : [];
  
  const top10 = seeds
    .filter(s => s.generation_method === 'top10' && s.position <= 10)
    .map(s => s.phrase);
  
  const toScore = seeds.filter(s => 
    s.generation_method !== 'top10' && 
    s.generation_method !== 'seed'
  );
  
  // Show signature words
  const fillerWords = new Set(['how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should', 'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs', 'full']);
  const signatureWords = new Map();
  for (const top10phrase of top10) {
    const words = top10phrase.toLowerCase().split(/\s+/);
    words.filter(w => !seedWords.includes(w) && !fillerWords.has(w) && w.length > 2)
      .forEach(w => signatureWords.set(w, (signatureWords.get(w) || 0) + 1));
  }
  
  console.log('=== SEED WORDS ===');
  console.log(seedWords.join(', '));
  
  console.log('\n=== TOP 10 PHRASES ===');
  top10.forEach((p, i) => console.log(`${i+1}. "${p}"`));
  
  console.log('\n=== SIGNATURE WORDS (from Top 10) ===');
  [...signatureWords.entries()].sort((a,b) => b[1] - a[1]).forEach(([w, c]) => {
    console.log(`  ${w}: appears in ${c} Top 10 phrases`);
  });
  
  // Score all
  const scored = toScore.map(s => {
    const result = calculateLTV(s.phrase, top10, seedWords);
    return {
      phrase: s.phrase,
      method: s.generation_method,
      ltv: result.score,
      strategy: result.strategy,
      match: result.match
    };
  });
  
  // Distribution
  const dist = {
    '90-98': 0, '80-89': 0, '70-79': 0, '60-69': 0, '50-59': 0,
    '40-49': 0, '30-39': 0, '20-29': 0, '15-19': 0, '0': 0
  };
  
  scored.forEach(s => {
    if (s.ltv >= 90) dist['90-98']++;
    else if (s.ltv >= 80) dist['80-89']++;
    else if (s.ltv >= 70) dist['70-79']++;
    else if (s.ltv >= 60) dist['60-69']++;
    else if (s.ltv >= 50) dist['50-59']++;
    else if (s.ltv >= 40) dist['40-49']++;
    else if (s.ltv >= 30) dist['30-39']++;
    else if (s.ltv >= 20) dist['20-29']++;
    else if (s.ltv >= 15) dist['15-19']++;
    else dist['0']++;
  });
  
  console.log('\n=== LTV DISTRIBUTION ===\n');
  const total = scored.length;
  Object.entries(dist).forEach(([range, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct / 2));
    console.log(`${range.padStart(8)}: ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  });
  
  // By method
  console.log('\n=== BY METHOD ===');
  ['child', 'az', 'prefix'].forEach(method => {
    const methodScores = scored.filter(s => s.method === method);
    const withScore = methodScores.filter(s => s.ltv > 0);
    const avg = withScore.length > 0 
      ? (withScore.reduce((sum, s) => sum + s.ltv, 0) / withScore.length).toFixed(1) 
      : 0;
    console.log(`${method.padStart(8)}: ${withScore.length}/${methodScores.length} scored, avg=${avg}`);
  });
  
  // Top scorers
  console.log('\n=== TOP 15 SCORES ===\n');
  scored.filter(s => s.ltv > 0).sort((a, b) => b.ltv - a.ltv).slice(0, 15).forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${String(s.ltv).padStart(2)} [${s.method.padEnd(6)}] "${s.phrase}"`);
    if (s.strategy === 'SIG_MATCH') console.log(`    └─ Sig words: ${s.match}`);
  });
  
  // Mid scores
  console.log('\n=== MID-RANGE SCORES (35-55) ===\n');
  scored.filter(s => s.ltv >= 35 && s.ltv <= 55).sort((a, b) => b.ltv - a.ltv).slice(0, 15).forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${String(s.ltv).padStart(2)} [${s.method.padEnd(6)}] "${s.phrase}"`);
    if (s.match) console.log(`    └─ ${s.match}`);
  });
  
  // Low scores
  console.log('\n=== LOW SCORES (15-34) ===\n');
  scored.filter(s => s.ltv >= 15 && s.ltv < 35).sort((a, b) => b.ltv - a.ltv).slice(0, 15).forEach((s, i) => {
    console.log(`${(i+1).toString().padStart(2)}. LTV=${String(s.ltv).padStart(2)} [${s.method.padEnd(6)}] "${s.phrase}"`);
  });
  
  // Summary
  const withMatch = scored.filter(s => s.ltv > 0);
  console.log('\n=== SUMMARY ===\n');
  console.log(`Total: ${total}`);
  console.log(`With LTV > 0: ${withMatch.length} (${((withMatch.length/total)*100).toFixed(1)}%)`);
  console.log(`Badge eligible (≥50): ${scored.filter(s => s.ltv >= 50).length}`);
  console.log(`Boost eligible (≥20): ${scored.filter(s => s.ltv >= 20).length}`);
}

main();
