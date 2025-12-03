import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, seed_phrase, intake_stats')
    .ilike('name', '%youtube%algorithm%')
    .limit(1);
  
  if (!sessions || sessions.length === 0) {
    console.log('No session found');
    return;
  }
  
  const session = sessions[0];
  const seedPhrase = session.seed_phrase || 'youtube algorithm';
  const seedWords = new Set(seedPhrase.toLowerCase().split(/\s+/));
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEMAND ANCHOR ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Session:', session.name);
  console.log('Seed:', seedPhrase);
  console.log('Seed words to exclude:', [...seedWords].join(', '));
  console.log('');
  
  const wordFrequency = session.intake_stats?.wordFrequency || {};
  
  // Filler words to exclude
  const FILLER_WORDS = new Set([
    'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
    'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of',
    'vs', 'your', 'you', 'my', 'i', 'it', 'be', 'do', 'are', 'this', 'that',
    'from', 'by', 'not', 'if', 'but', 'about', 'get', 'make', 'like', 'just'
  ]);
  
  // Get meaningful anchors (exclude seed, fillers, short words)
  const meaningfulAnchors = Object.entries(wordFrequency)
    .filter(([word, freq]) => {
      if (word.length < 3) return false;
      if (seedWords.has(word)) return false;
      if (FILLER_WORDS.has(word)) return false;
      return true;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);
  
  console.log('TOP DEMAND ANCHORS (with boosts):');
  console.log('');
  for (const [word, freq] of meaningfulAnchors) {
    let boost = 0;
    if (freq >= 20) boost = 12;
    else if (freq >= 15) boost = 10;
    else if (freq >= 10) boost = 7;
    else if (freq >= 6) boost = 4;
    else if (freq >= 3) boost = 2;
    
    const boostStr = boost > 0 ? '+' + String(boost).padStart(2) : '  0';
    console.log('  ' + word.padEnd(20) + ': ' + String(freq).padStart(3) + 'x -> ' + boostStr + ' boost');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('BOOST THRESHOLDS:');
  console.log('  20+ occurrences = +12 (High demand)');
  console.log('  15-19           = +10 (Strong demand)');
  console.log('  10-14           = +7  (Good demand)');
  console.log('  6-9             = +4  (Moderate demand)');
  console.log('  3-5             = +2  (Weak signal)');
  console.log('  1-2             = +0  (Too rare)');
}

analyze();
