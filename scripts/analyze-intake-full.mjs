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
    .select('id, name, intake_stats')
    .ilike('name', '%youtube%algorithm%')
    .limit(1);
  
  const session = sessions[0];
  const stats = session.intake_stats;
  const seedWords = new Set(['youtube', 'algorithm']);
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DATA INTAKE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // 1. OPENER FREQUENCY (2-word starters)
  console.log('\n1. OPENER FREQUENCY (2-word starters):');
  console.log('   These are tracked in top9Demand.openerFrequency');
  const openers = stats.top9Demand?.openerFrequency || {};
  Object.entries(openers)
    .sort((a, b) => b[1] - a[1])
    .forEach(([opener, count]) => {
      console.log('   ' + opener.padEnd(15) + ': ' + count + 'x');
    });
  
  // 2. BIGRAM FREQUENCY (2-word pairs)
  console.log('\n2. TOP 20 BIGRAMS (2-word pairs, excluding seed-only):');
  const bigrams = stats.bigramFrequency || {};
  const filteredBigrams = Object.entries(bigrams)
    .filter(([bg]) => {
      const words = bg.split(' ');
      return !words.every(w => seedWords.has(w));
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  filteredBigrams.forEach(([bigram, count]) => {
    console.log('   ' + bigram.padEnd(35) + ': ' + count + 'x');
  });
  
  // 3. TRIGRAM FREQUENCY (3-word pairs like 'youtube algorithm 2025')
  console.log('\n3. TOP 20 TRIGRAMS (3-word combos like "youtube algorithm 2025"):');
  const trigrams = stats.trigramFrequency || {};
  Object.entries(trigrams)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([trigram, count]) => {
      console.log('   ' + trigram.padEnd(45) + ': ' + count + 'x');
    });
  
  // 4. SINGLE WORD FREQUENCY (anchors)
  console.log('\n4. TOP 20 SINGLE WORD ANCHORS (excluding seed words):');
  const words = stats.wordFrequency || {};
  Object.entries(words)
    .filter(([w]) => !seedWords.has(w) && w.length > 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([word, count]) => {
      console.log('   ' + word.padEnd(20) + ': ' + count + 'x');
    });
  
  // 5. What are anchor bonuses currently?
  console.log('\n5. CURRENT ANCHOR BONUSES (words appearing 2+ times in Top 9):');
  console.log('   These are in top9Demand.anchorBonuses');
  const anchorBonuses = stats.top9Demand?.anchorBonuses || {};
  if (Object.keys(anchorBonuses).length === 0) {
    console.log('   (none)');
  } else {
    Object.entries(anchorBonuses).forEach(([anchor, bonus]) => {
      console.log('   ' + anchor.padEnd(15) + ': +' + bonus + ' points');
    });
  }
  
  // 6. What are the Top 9 phrases?
  console.log('\n6. TOP 9 AUTOCOMPLETE PHRASES:');
  const top9 = stats.top9Demand?.phrases || [];
  top9.forEach((p, i) => console.log('   ' + (i+1) + '. ' + p));
  
  // 7. Explain what TAG means
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('WHAT IS "TAG" vs "SOURCE"?');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('SOURCE = How the phrase was GENERATED:');
  console.log('  - seed: The original seed phrase');
  console.log('  - top10: Direct autocomplete result');
  console.log('  - child: Expanded from a top10 phrase');
  console.log('  - az: A-Z letter expansion');
  console.log('  - prefix: Added opener like "how to"');
  console.log('');
  console.log('TAG = Relationship to Top 9 for SCORING:');
  console.log('  - TOP_10: Phrase IS one of the 9 autocomplete results');
  console.log('  - T10_CHILD: Phrase STARTS WITH a Top 9 phrase');
  console.log('  - T10_RELATED: Phrase CONTAINS a Top 9 phrase');
  console.log('  - NO_TAG: No relationship to any Top 9 phrase');
  console.log('');
  console.log('THE PROBLEM: Most A-Z phrases contain "youtube algorithm" but NOT');
  console.log('the full Top 9 phrase like "YouTube Algorithm 2025".');
  console.log('');
  console.log('Example:');
  console.log('  "YouTube Algorithm Gaming" contains "youtube algorithm" (seed)');
  console.log('  but does NOT contain "YouTube Algorithm 2025" (Top 9)');
  console.log('  So it gets NO_TAG despite being related to the topic.');
  
  // 8. What's different from OLD algorithm
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('OLD ALGORITHM vs CURRENT - KEY DIFFERENCES');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('OLD ALGORITHM (from docs):');
  console.log('  Base: Top-10=94, T10-Child=81, T10-Related=67.5, No-tag=52');
  console.log('  + Random variation (±2)');
  console.log('  + Opener boost (0 to +15) based on FREQUENCY');
  console.log('  + Length adjustment (-20 to +6)');
  console.log('');
  console.log('CURRENT ALGORITHM:');
  console.log('  Base: TOP_10=90, T10_CHILD=78, T10_RELATED=70, NO_TAG=62');
  console.log('  + Random variation (±2)');
  console.log('  + Opener boost (0 to +15) based on FREQUENCY ✓ (just added)');
  console.log('  + Length adjustment (-15 to +4)');
  console.log('  + NL quality adjustment (-12 to +10) - NEW');
  console.log('  + Anchor word bonus (+3 per occurrence) - small');
  console.log('');
  console.log('KEY ISSUE: The OLD algorithm used "T10-Related" for phrases');
  console.log('that contain ANY part of the seed/topic. We are checking for');
  console.log('the FULL Top 9 phrase as a substring, which is too strict.');
  console.log('');
  console.log('SOLUTION OPTIONS:');
  console.log('  1. Check if phrase contains SEED (not full Top 9)');
  console.log('  2. Use single-word anchor frequency to boost scores');
  console.log('  3. Use trigram frequency ("youtube algorithm 2025") for bonus');
}

analyze().catch(console.error);
