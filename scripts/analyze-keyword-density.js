const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const sessionId = '1a95a83e-a87a-46f5-85d9-a0e42b2de978';
  
  // Get ALL seeds with their generation method
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });
  
  // Separate by method
  const top10 = seeds.filter(s => s.generation_method === 'top10' && s.position <= 10);
  const az = seeds.filter(s => s.generation_method === 'az');
  const prefix = seeds.filter(s => s.generation_method === 'prefix');
  
  console.log('=== TOP 10 PHRASES (The Gold Standard) ===\n');
  top10.forEach((s, i) => console.log((i+1) + '. "' + s.phrase + '"'));
  
  // Extract words from Top 10 (excluding seed words)
  const seedWords = ['content', 'creation'];
  const top10Words = new Set();
  const top10Bigrams = new Set();
  
  top10.forEach(s => {
    const words = s.phrase.toLowerCase().split(/\s+/).filter(w => !seedWords.includes(w));
    words.forEach(w => top10Words.add(w));
    
    // Extract bigrams
    const allWords = s.phrase.toLowerCase().split(/\s+/);
    for (let i = 0; i < allWords.length - 1; i++) {
      top10Bigrams.add(allWords[i] + ' ' + allWords[i+1]);
    }
  });
  
  console.log('\n=== WORDS FOUND IN TOP 10 (excluding seed) ===');
  console.log([...top10Words].join(', '));
  
  console.log('\n=== BIGRAMS FOUND IN TOP 10 ===');
  console.log([...top10Bigrams].join(' | '));
  
  // Now find A-Z phrases that share words with Top 10
  console.log('\n\n=== A-Z PHRASES WITH HIGH TOP 10 WORD OVERLAP ===\n');
  
  const azWithOverlap = az.map(s => {
    const words = s.phrase.toLowerCase().split(/\s+/).filter(w => !seedWords.includes(w));
    const matches = words.filter(w => top10Words.has(w));
    const bigramMatches = [];
    const allWords = s.phrase.toLowerCase().split(/\s+/);
    for (let i = 0; i < allWords.length - 1; i++) {
      const bigram = allWords[i] + ' ' + allWords[i+1];
      if (top10Bigrams.has(bigram)) bigramMatches.push(bigram);
    }
    return { 
      phrase: s.phrase, 
      wordMatches: matches,
      bigramMatches,
      score: matches.length * 10 + bigramMatches.length * 20
    };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  
  azWithOverlap.forEach((s, i) => {
    console.log((i+1) + '. Score=' + s.score + ' "' + s.phrase + '"');
    console.log('   Words: [' + s.wordMatches.join(', ') + ']');
    if (s.bigramMatches.length) console.log('   Bigrams: [' + s.bigramMatches.join(', ') + ']');
  });
  
  // Now find PREFIX phrases that share words with Top 10
  console.log('\n\n=== PREFIX PHRASES WITH HIGH TOP 10 WORD OVERLAP ===\n');
  
  const prefixIgnore = ['how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should', 'when', 'fix', 'improve', 'learn', 'tips'];
  
  const prefixWithOverlap = prefix.map(s => {
    const words = s.phrase.toLowerCase().split(/\s+/).filter(w => !seedWords.includes(w) && !prefixIgnore.includes(w));
    const matches = words.filter(w => top10Words.has(w));
    const bigramMatches = [];
    const allWords = s.phrase.toLowerCase().split(/\s+/);
    for (let i = 0; i < allWords.length - 1; i++) {
      const bigram = allWords[i] + ' ' + allWords[i+1];
      if (top10Bigrams.has(bigram)) bigramMatches.push(bigram);
    }
    return { 
      phrase: s.phrase, 
      wordMatches: matches,
      bigramMatches,
      score: matches.length * 10 + bigramMatches.length * 20
    };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 10);
  
  prefixWithOverlap.forEach((s, i) => {
    console.log((i+1) + '. Score=' + s.score + ' "' + s.phrase + '"');
    console.log('   Words: [' + s.wordMatches.join(', ') + ']');
    if (s.bigramMatches.length) console.log('   Bigrams: [' + s.bigramMatches.join(', ') + ']');
  });
}

main();
