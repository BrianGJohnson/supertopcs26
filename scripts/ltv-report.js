const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// LTV Scoring function (same as v4)
function calculateLTV(phrase, seedWords, top10, singleAnchors, bigramAnchors, fullAnchors) {
  const phraseLower = phrase.toLowerCase();
  const phraseWords = phraseLower.split(/\s+/);
  
  for (const t10 of top10) {
    if (phraseLower.includes(t10.toLowerCase())) {
      const t10Words = t10.split(/\s+/).length;
      const density = t10Words / phraseWords.length;
      const position = phraseLower.indexOf(t10.toLowerCase());
      const posBonus = position === 0 ? 15 : position < 10 ? 10 : 5;
      const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const variation = (hash % 7) - 3;
      return { score: Math.round(Math.min(95, 70 + (density * 20) + posBonus + variation)), strategy: 'FULL_TOP10', match: t10 };
    }
  }
  
  for (const [anchor, source] of fullAnchors.entries()) {
    if (phraseLower.includes(anchor)) {
      const position = phraseLower.indexOf(anchor);
      const posBonus = position < 20 ? 8 : position < 40 ? 4 : 0;
      const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const variation = (hash % 7) - 3;
      return { score: Math.round(Math.min(69, 55 + posBonus + variation)), strategy: 'FULL_ANCHOR', match: anchor };
    }
  }
  
  for (const [bigram, freq] of bigramAnchors.entries()) {
    const bigramWords = bigram.split(' ');
    if (bigramWords.every(w => seedWords.has(w))) continue;
    if (phraseLower.includes(bigram)) {
      const freqBonus = freq * 3;
      const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const variation = (hash % 7) - 3;
      return { score: Math.round(Math.min(54, 40 + freqBonus + variation)), strategy: 'BIGRAM', match: bigram };
    }
  }
  
  let bestScore = 0, bestMatch = null;
  for (const [anchor, freq] of singleAnchors.entries()) {
    if (phraseWords.includes(anchor)) {
      const freqBonus = freq * 4;
      const posIdx = phraseWords.indexOf(anchor);
      const posBonus = posIdx <= 2 ? 8 : posIdx <= 4 ? 4 : 0;
      const score = 20 + freqBonus + posBonus;
      if (score > bestScore) { bestScore = score; bestMatch = anchor; }
    }
  }
  if (bestScore > 0) {
    const hash = phrase.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const variation = (hash % 7) - 3;
    return { score: Math.round(Math.min(39, bestScore + variation)), strategy: 'SINGLE', match: bestMatch };
  }
  
  return { score: 0, strategy: null, match: null };
}

async function main() {
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method, position')
    .eq('session_id', '1a95a83e-a87a-46f5-85d9-a0e42b2de978')
    .order('position', { ascending: true });
  
  const seedPhrase = seeds.find(s => s.generation_method === 'seed');
  const seedWords = new Set(seedPhrase.phrase.toLowerCase().split(/\s+/));
  const top10 = seeds.filter(s => s.generation_method === 'top10' && s.position <= 10).map(s => s.phrase);
  const fillerWords = new Set(['how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should', 'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs']);
  
  const singleAnchors = new Map();
  const bigramAnchors = new Map();
  const fullAnchors = new Map();
  
  for (const phrase of top10) {
    const words = phrase.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (!seedWords.has(word) && !fillerWords.has(word) && word.length >= 3) {
        singleAnchors.set(word, (singleAnchors.get(word) || 0) + 1);
      }
    }
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i+1];
      if ((!seedWords.has(words[i]) || !seedWords.has(words[i+1])) && (!fillerWords.has(words[i]) || !fillerWords.has(words[i+1]))) {
        bigramAnchors.set(bigram, (bigramAnchors.get(bigram) || 0) + 1);
      }
    }
    const seedIdx = words.findIndex((w, i) => seedWords.has(w) && seedWords.has(words[i+1]));
    if (seedIdx !== -1 && seedIdx + 2 < words.length) {
      const fullAnchor = words.slice(seedIdx + 2).join(' ');
      if (fullAnchor.length > 0) fullAnchors.set(fullAnchor, phrase);
    }
  }
  
  const allPhrases = seeds.filter(s => s.generation_method !== 'seed' && s.generation_method !== 'top10');
  const scored = allPhrases.map(s => ({
    phrase: s.phrase,
    method: s.generation_method,
    ...calculateLTV(s.phrase, seedWords, top10, singleAnchors, bigramAnchors, fullAnchors)
  }));
  
  // Report
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           LONG-TERM VIEWS (LTV) SCORING REPORT               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('BADGE ELIGIBILITY (LTV ≥ 50) BY SOURCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  ['child', 'az', 'prefix'].forEach(method => {
    const all = scored.filter(s => s.method === method);
    const eligible = all.filter(s => s.score >= 50);
    console.log('\n' + method.toUpperCase() + ':');
    console.log('  Total phrases: ' + all.length);
    console.log('  Badge eligible (LTV ≥ 50): ' + eligible.length + ' (' + ((eligible.length/all.length)*100).toFixed(1) + '%)');
  });
  
  // A-Z Complete with LTV ≥ 50
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('A-Z COMPLETE WITH LONG-TERM VIEWS BADGE (LTV ≥ 50)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const azEligible = scored.filter(s => s.method === 'az' && s.score >= 50).sort((a,b) => b.score - a.score);
  if (azEligible.length === 0) {
    console.log('  (none)');
  } else {
    azEligible.forEach((s, i) => {
      console.log('  ' + (i+1) + '. LTV=' + s.score + ' "' + s.phrase + '"');
      console.log('     └─ [' + s.strategy + '] matched: "' + s.match + '"');
    });
  }
  
  // Prefix Complete with LTV ≥ 50
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PREFIX COMPLETE WITH LONG-TERM VIEWS BADGE (LTV ≥ 50)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const prefixEligible = scored.filter(s => s.method === 'prefix' && s.score >= 50).sort((a,b) => b.score - a.score);
  if (prefixEligible.length === 0) {
    console.log('  (none)');
  } else {
    prefixEligible.forEach((s, i) => {
      console.log('  ' + (i+1) + '. LTV=' + s.score + ' "' + s.phrase + '"');
      console.log('     └─ [' + s.strategy + '] matched: "' + s.match + '"');
    });
  }
  
  // Child TOP 5
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CHILD PHRASES - TOP 5 (Highest LTV)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const childAll = scored.filter(s => s.method === 'child').sort((a,b) => b.score - a.score);
  childAll.slice(0, 5).forEach((s, i) => {
    console.log('  ' + (i+1) + '. LTV=' + s.score + ' "' + s.phrase + '"');
    console.log('     └─ matched: "' + s.match + '"');
  });
  
  // Child BOTTOM 5 (with score > 0)
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CHILD PHRASES - BOTTOM 5 (Lowest LTV with score > 0)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const childWithScore = childAll.filter(s => s.score > 0);
  childWithScore.slice(-5).forEach((s, i) => {
    console.log('  ' + (i+1) + '. LTV=' + s.score + ' "' + s.phrase + '"');
    console.log('     └─ [' + s.strategy + '] matched: "' + s.match + '"');
  });
  
  // Child with NO LTV
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CHILD PHRASES WITH LTV = 0 (No Top 10 alignment)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const childZero = childAll.filter(s => s.score === 0);
  console.log('  Count: ' + childZero.length + ' out of ' + childAll.length + ' child phrases');
  if (childZero.length > 0) {
    console.log('  Examples:');
    childZero.slice(0, 5).forEach((s, i) => {
      console.log('    ' + (i+1) + '. "' + s.phrase + '"');
    });
  }
  
  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const total = scored.length;
  const withLTV = scored.filter(s => s.score > 0).length;
  const badgeEligible = scored.filter(s => s.score >= 50).length;
  console.log('  Total phrases scored: ' + total);
  console.log('  Phrases with LTV > 0: ' + withLTV + ' (' + ((withLTV/total)*100).toFixed(1) + '%)');
  console.log('  Badge eligible (≥50): ' + badgeEligible + ' (' + ((badgeEligible/total)*100).toFixed(1) + '%)');
  console.log('');
  console.log('  By source:');
  console.log('    Child:  ' + scored.filter(s => s.method === 'child' && s.score >= 50).length + ' badges');
  console.log('    A-Z:    ' + scored.filter(s => s.method === 'az' && s.score >= 50).length + ' badges');
  console.log('    Prefix: ' + scored.filter(s => s.method === 'prefix' && s.score >= 50).length + ' badges');
}
main();
