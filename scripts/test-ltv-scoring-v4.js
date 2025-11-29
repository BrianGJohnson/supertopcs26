const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * LTV Scoring v4 - Anchor-based matching
 * 
 * Step 1: Extract ANCHORS from Top 10 (the unique parts beyond the seed)
 *   - Single words: "equipment", "tips", "beginners"
 *   - Bigrams: "for beginners", "with ai", "full course"
 *   - Trigrams: "for business owners"
 * 
 * Step 2: Find ALL phrases containing these anchors
 * 
 * Step 3: Score based on:
 *   - Number of anchor matches
 *   - Anchor frequency in Top 10 (more common = higher value)
 *   - Position of anchor in phrase
 *   - Full Top 10 match vs partial anchor match
 */

async function main() {
  const sessionId = '1a95a83e-a87a-46f5-85d9-a0e42b2de978';
  
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });
  
  const seedPhrase = seeds.find(s => s.generation_method === 'seed');
  const seedWords = new Set(seedPhrase.phrase.toLowerCase().split(/\s+/));
  
  const top10 = seeds
    .filter(s => s.generation_method === 'top10' && s.position <= 10)
    .map(s => s.phrase);
  
  const allPhrases = seeds.filter(s => s.generation_method !== 'seed');
  
  console.log('=== SEED ===');
  console.log(seedPhrase.phrase);
  console.log('Seed words:', [...seedWords].join(', '));
  
  console.log('\n=== TOP 10 PHRASES ===\n');
  top10.forEach((p, i) => console.log(`${i+1}. "${p}"`));
  
  // Step 1: Extract all anchors from Top 10
  const fillerWords = new Set(['how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should', 'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs']);
  
  // Single word anchors
  const singleAnchors = new Map();
  // Bigram anchors  
  const bigramAnchors = new Map();
  // Full non-seed portion
  const fullAnchors = new Map();
  
  for (const phrase of top10) {
    const words = phrase.toLowerCase().split(/\s+/);
    
    // Extract single anchors (non-seed, non-filler, 3+ chars)
    for (const word of words) {
      if (!seedWords.has(word) && !fillerWords.has(word) && word.length >= 3) {
        singleAnchors.set(word, (singleAnchors.get(word) || 0) + 1);
      }
    }
    
    // Extract bigrams that don't start with seed words
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i+1];
      // At least one non-seed, non-filler word
      if ((!seedWords.has(words[i]) || !seedWords.has(words[i+1])) &&
          (!fillerWords.has(words[i]) || !fillerWords.has(words[i+1]))) {
        bigramAnchors.set(bigram, (bigramAnchors.get(bigram) || 0) + 1);
      }
    }
    
    // Full anchor = everything after the seed
    const seedIdx = words.findIndex((w, i) => 
      seedWords.has(w) && seedWords.has(words[i+1])
    );
    if (seedIdx !== -1 && seedIdx + 2 < words.length) {
      const fullAnchor = words.slice(seedIdx + 2).join(' ');
      if (fullAnchor.length > 0) {
        fullAnchors.set(fullAnchor, phrase);
      }
    }
  }
  
  console.log('\n=== SINGLE WORD ANCHORS (from Top 10) ===');
  [...singleAnchors.entries()].sort((a,b) => b[1] - a[1]).forEach(([w, c]) => {
    console.log(`  "${w}" - appears in ${c} Top 10 phrases`);
  });
  
  console.log('\n=== BIGRAM ANCHORS (from Top 10) ===');
  [...bigramAnchors.entries()]
    .filter(([b, c]) => !b.split(' ').every(w => seedWords.has(w)))
    .sort((a,b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([b, c]) => {
      console.log(`  "${b}" - appears in ${c} Top 10 phrases`);
    });
  
  console.log('\n=== FULL ANCHORS (non-seed portion of Top 10) ===');
  [...fullAnchors.entries()].forEach(([anchor, source]) => {
    console.log(`  "${anchor}" <- from "${source}"`);
  });
  
  // Step 2: Now let's see how many phrases match each single anchor
  console.log('\n\n========================================');
  console.log('=== PHRASE MATCHES BY SINGLE ANCHOR ===');
  console.log('========================================\n');
  
  const anchorMatches = new Map();
  
  for (const [anchor, freq] of singleAnchors.entries()) {
    const matches = {
      child: [],
      az: [],
      prefix: []
    };
    
    for (const s of allPhrases) {
      if (s.generation_method === 'top10') continue;
      const phraseLower = s.phrase.toLowerCase();
      
      // Check if phrase contains this anchor word
      const words = phraseLower.split(/\s+/);
      if (words.includes(anchor)) {
        matches[s.generation_method]?.push(s.phrase);
      }
    }
    
    anchorMatches.set(anchor, matches);
    
    const total = matches.child.length + matches.az.length + matches.prefix.length;
    console.log(`\n"${anchor}" (in ${freq} Top 10 phrases) - ${total} total matches:`);
    console.log(`  Child:  ${matches.child.length}`);
    console.log(`  A-Z:    ${matches.az.length}`);
    console.log(`  Prefix: ${matches.prefix.length}`);
    
    // Show some examples
    if (matches.az.length > 0) {
      console.log(`  A-Z examples: ${matches.az.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
    }
    if (matches.prefix.length > 0) {
      console.log(`  Prefix examples: ${matches.prefix.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
    }
  }
  
  // Step 3: Calculate LTV scores
  console.log('\n\n========================================');
  console.log('=== LTV SCORING ===');
  console.log('========================================\n');
  
  function calculateLTV(phrase, seedWords, top10, singleAnchors, bigramAnchors, fullAnchors) {
    const phraseLower = phrase.toLowerCase();
    const phraseWords = phraseLower.split(/\s+/);
    
    // Priority 1: Full Top 10 match (70-95)
    for (const t10 of top10) {
      if (phraseLower.includes(t10.toLowerCase())) {
        const t10Words = t10.split(/\s+/).length;
        const density = t10Words / phraseWords.length;
        const position = phraseLower.indexOf(t10.toLowerCase());
        const posBonus = position === 0 ? 15 : position < 10 ? 10 : 5;
        
        const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const variation = (hash % 7) - 3;
        
        return {
          score: Math.round(Math.min(95, 70 + (density * 20) + posBonus + variation)),
          strategy: 'FULL_TOP10',
          match: t10
        };
      }
    }
    
    // Priority 2: Full anchor match (55-69)
    for (const [anchor, source] of fullAnchors.entries()) {
      if (phraseLower.includes(anchor)) {
        const position = phraseLower.indexOf(anchor);
        const posBonus = position < 20 ? 8 : position < 40 ? 4 : 0;
        
        const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const variation = (hash % 7) - 3;
        
        return {
          score: Math.round(Math.min(69, 55 + posBonus + variation)),
          strategy: 'FULL_ANCHOR',
          match: anchor
        };
      }
    }
    
    // Priority 3: Bigram anchor match (40-54)
    for (const [bigram, freq] of bigramAnchors.entries()) {
      // Skip if bigram is just seed words
      const bigramWords = bigram.split(' ');
      if (bigramWords.every(w => seedWords.has(w))) continue;
      
      if (phraseLower.includes(bigram)) {
        const freqBonus = freq * 3;
        const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const variation = (hash % 7) - 3;
        
        return {
          score: Math.round(Math.min(54, 40 + freqBonus + variation)),
          strategy: 'BIGRAM',
          match: bigram
        };
      }
    }
    
    // Priority 4: Single anchor match (20-39)
    let bestSingleScore = 0;
    let bestSingleMatch = null;
    
    for (const [anchor, freq] of singleAnchors.entries()) {
      if (phraseWords.includes(anchor)) {
        const freqBonus = freq * 4;
        const posIdx = phraseWords.indexOf(anchor);
        const posBonus = posIdx <= 2 ? 8 : posIdx <= 4 ? 4 : 0;
        
        const score = 20 + freqBonus + posBonus;
        if (score > bestSingleScore) {
          bestSingleScore = score;
          bestSingleMatch = anchor;
        }
      }
    }
    
    if (bestSingleScore > 0) {
      const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const variation = (hash % 7) - 3;
      
      return {
        score: Math.round(Math.min(39, bestSingleScore + variation)),
        strategy: 'SINGLE',
        match: bestSingleMatch
      };
    }
    
    return { score: 0, strategy: null, match: null };
  }
  
  // Score all phrases
  const scored = allPhrases
    .filter(s => s.generation_method !== 'top10')
    .map(s => {
      const result = calculateLTV(s.phrase, seedWords, top10, singleAnchors, bigramAnchors, fullAnchors);
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
    '90-95': 0, '80-89': 0, '70-79': 0, '60-69': 0, '55-59': 0,
    '50-54': 0, '45-49': 0, '40-44': 0, '35-39': 0, '30-34': 0,
    '25-29': 0, '20-24': 0, '0': 0
  };
  
  scored.forEach(s => {
    if (s.ltv >= 90) dist['90-95']++;
    else if (s.ltv >= 80) dist['80-89']++;
    else if (s.ltv >= 70) dist['70-79']++;
    else if (s.ltv >= 60) dist['60-69']++;
    else if (s.ltv >= 55) dist['55-59']++;
    else if (s.ltv >= 50) dist['50-54']++;
    else if (s.ltv >= 45) dist['45-49']++;
    else if (s.ltv >= 40) dist['40-44']++;
    else if (s.ltv >= 35) dist['35-39']++;
    else if (s.ltv >= 30) dist['30-34']++;
    else if (s.ltv >= 25) dist['25-29']++;
    else if (s.ltv >= 20) dist['20-24']++;
    else dist['0']++;
  });
  
  console.log('=== LTV DISTRIBUTION ===\n');
  const total = scored.length;
  Object.entries(dist).forEach(([range, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(pct));
    console.log(`${range.padStart(8)}: ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  });
  
  // By strategy
  console.log('\n=== BY STRATEGY ===');
  const strategies = ['FULL_TOP10', 'FULL_ANCHOR', 'BIGRAM', 'SINGLE', null];
  strategies.forEach(strat => {
    const count = scored.filter(s => s.strategy === strat).length;
    const name = strat || 'NO_MATCH';
    console.log(`${name.padStart(12)}: ${count}`);
  });
  
  // By method
  console.log('\n=== BY SOURCE METHOD ===');
  ['child', 'az', 'prefix'].forEach(method => {
    const methodScores = scored.filter(s => s.method === method);
    const withScore = methodScores.filter(s => s.ltv > 0);
    const avg = withScore.length > 0 
      ? (withScore.reduce((sum, s) => sum + s.ltv, 0) / withScore.length).toFixed(1) 
      : 0;
    console.log(`${method.padStart(8)}: ${withScore.length}/${methodScores.length} scored (${((withScore.length/methodScores.length)*100).toFixed(0)}%), avg LTV=${avg}`);
  });
  
  // Show examples from each tier
  console.log('\n=== TOP SCORERS (70+) ===');
  scored.filter(s => s.ltv >= 70).sort((a,b) => b.ltv - a.ltv).slice(0, 8).forEach(s => {
    console.log(`  LTV=${s.ltv} [${s.method}] "${s.phrase}"`);
  });
  
  console.log('\n=== MID-HIGH (50-69) ===');
  scored.filter(s => s.ltv >= 50 && s.ltv < 70).sort((a,b) => b.ltv - a.ltv).slice(0, 8).forEach(s => {
    console.log(`  LTV=${s.ltv} [${s.method}] [${s.strategy}] "${s.phrase}" <- "${s.match}"`);
  });
  
  console.log('\n=== MID (35-49) ===');
  scored.filter(s => s.ltv >= 35 && s.ltv < 50).sort((a,b) => b.ltv - a.ltv).slice(0, 8).forEach(s => {
    console.log(`  LTV=${s.ltv} [${s.method}] [${s.strategy}] "${s.phrase}" <- "${s.match}"`);
  });
  
  console.log('\n=== LOW (20-34) ===');
  scored.filter(s => s.ltv >= 20 && s.ltv < 35).sort((a,b) => b.ltv - a.ltv).slice(0, 8).forEach(s => {
    console.log(`  LTV=${s.ltv} [${s.method}] [${s.strategy}] "${s.phrase}" <- "${s.match}"`);
  });
  
  // Summary
  const withMatch = scored.filter(s => s.ltv > 0);
  console.log('\n=== SUMMARY ===\n');
  console.log(`Total phrases: ${total}`);
  console.log(`With LTV > 0: ${withMatch.length} (${((withMatch.length/total)*100).toFixed(1)}%)`);
  console.log(`Badge eligible (≥50): ${scored.filter(s => s.ltv >= 50).length}`);
  console.log(`Boost eligible (≥20): ${scored.filter(s => s.ltv >= 20).length}`);
}

main();
