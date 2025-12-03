import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalizeForMatching(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
}

function phraseContains(target, search) {
  return normalizeForMatching(target).includes(normalizeForMatching(search));
}

function phraseStartsWith(target, search) {
  return normalizeForMatching(target).startsWith(normalizeForMatching(search));
}

async function check() {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, intake_stats')
    .ilike('name', '%youtube%algorithm%')
    .limit(1);
  
  const session = sessions[0];
  const top9Phrases = session.intake_stats?.top9Demand?.phrases || [];
  
  console.log('TOP 9 PHRASES:');
  top9Phrases.forEach((p, i) => console.log(`  ${i+1}. ${p}`));
  
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method')
    .eq('session_id', session.id);
  
  // Check A-Z phrases that should have a tag
  const azPhrases = seeds.filter(s => s.generation_method === 'az');
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('A-Z PHRASE TAG ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  let noTag = 0;
  let t10Child = 0;
  let t10Related = 0;
  let top10 = 0;
  
  for (const s of azPhrases) {
    const normalized = normalizeForMatching(s.phrase);
    const top9Normalized = top9Phrases.map(p => normalizeForMatching(p));
    
    let tag = 'NO_TAG';
    
    // Check if IS a Top 10
    if (top9Normalized.includes(normalized)) {
      tag = 'TOP_10';
      top10++;
    } else {
      // Check starts with
      for (const t9 of top9Phrases) {
        if (phraseStartsWith(s.phrase, t9)) {
          tag = 'T10_CHILD';
          t10Child++;
          break;
        }
      }
      // Check contains
      if (tag === 'NO_TAG') {
        for (const t9 of top9Phrases) {
          if (phraseContains(s.phrase, t9)) {
            tag = 'T10_RELATED';
            t10Related++;
            break;
          }
        }
      }
      if (tag === 'NO_TAG') noTag++;
    }
  }
  
  console.log(`\nA-Z Tag Distribution (${azPhrases.length} phrases):`);
  console.log(`  TOP_10: ${top10}`);
  console.log(`  T10_CHILD: ${t10Child}`);
  console.log(`  T10_RELATED: ${t10Related}`);
  console.log(`  NO_TAG: ${noTag} (${(noTag/azPhrases.length*100).toFixed(1)}%)`);
  
  // Show some NO_TAG examples
  console.log('\nSample NO_TAG A-Z phrases:');
  const noTagPhrases = azPhrases.filter(s => {
    const normalized = normalizeForMatching(s.phrase);
    const top9Normalized = top9Phrases.map(p => normalizeForMatching(p));
    if (top9Normalized.includes(normalized)) return false;
    for (const t9 of top9Phrases) {
      if (phraseStartsWith(s.phrase, t9)) return false;
      if (phraseContains(s.phrase, t9)) return false;
    }
    return true;
  });
  
  noTagPhrases.slice(0, 20).forEach(s => console.log(`  ${s.phrase}`));
}

check().catch(console.error);
