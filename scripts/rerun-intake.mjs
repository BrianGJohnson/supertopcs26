/**
 * Re-run Data Intake for a Session
 * 
 * This script runs the full Data Intake algorithm and saves to database.
 * Use this to update intake_stats without navigating to Page 2.
 * 
 * What it captures:
 * - Top 9 phrases with positions
 * - Two-word starter frequencies (for stacking boost)
 * - Single-word starter frequencies (for stacking boost)
 * - Word frequency (for demand anchor boost)
 * - Bigram/trigram frequencies
 * - Seed-relative patterns
 * 
 * Usage: node scripts/rerun-intake.mjs [session-name-pattern]
 */

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

/**
 * Full Data Intake - matches src/lib/data-intake.ts
 */
function runDataIntake(phrases, seedPhrase, top9Phrases) {
  const seedLower = seedPhrase.toLowerCase();
  const seedWords = seedLower.split(' ');
  const seedNormalized = normalizeForMatching(seedPhrase);

  // Initialize frequency maps
  const wordFrequency = {};
  const bigramFrequency = {};
  const trigramFrequency = {};
  const seedPlus1 = {};
  const seedPlus2 = {};
  const prefixes = {};
  const suffixes = {};

  // Starter tracking (excluding phrases that start with seed)
  const twoWordStarters = {};
  const oneWordStarters = {};

  for (const phrase of phrases) {
    const phraseLower = phrase.toLowerCase();
    const words = phraseLower.split(/\s+/).filter(w => w.length > 0);

    // Word frequency
    for (const word of words) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }

    // Bigrams
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigramFrequency[bigram] = (bigramFrequency[bigram] || 0) + 1;
    }

    // Trigrams
    for (let i = 0; i < words.length - 2; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      trigramFrequency[trigram] = (trigramFrequency[trigram] || 0) + 1;
    }

    // Starter tracking - exclude phrases that start with seed
    if (!phraseLower.startsWith(seedNormalized)) {
      if (words[0] && words[0].length >= 2) {
        oneWordStarters[words[0]] = (oneWordStarters[words[0]] || 0) + 1;
      }
      if (words.length >= 2) {
        const twoWord = `${words[0]} ${words[1]}`;
        twoWordStarters[twoWord] = (twoWordStarters[twoWord] || 0) + 1;
      }
    }

    // Seed-relative patterns
    const seedIndex = phraseLower.indexOf(seedLower);
    if (seedIndex !== -1) {
      if (seedIndex > 0) {
        const prefix = phraseLower.substring(0, seedIndex).trim();
        if (prefix) prefixes[prefix] = (prefixes[prefix] || 0) + 1;
      }
      const afterSeed = phraseLower.substring(seedIndex + seedLower.length).trim();
      const afterWords = afterSeed.split(/\s+/).filter(w => w.length > 0);
      if (afterWords[0]) seedPlus1[afterWords[0]] = (seedPlus1[afterWords[0]] || 0) + 1;
      if (afterWords[1]) seedPlus2[afterWords[1]] = (seedPlus2[afterWords[1]] || 0) + 1;
      if (afterSeed) suffixes[afterSeed] = (suffixes[afterSeed] || 0) + 1;
    }
  }

  // Compute percentiles
  const computePercentiles = (freqMap) => {
    const entries = Object.entries(freqMap);
    if (entries.length === 0) return {};
    if (entries.length === 1) return { [entries[0][0]]: 50 };
    const sorted = entries.sort((a, b) => a[1] - b[1]);
    const percentiles = {};
    sorted.forEach(([key], index) => {
      percentiles[key] = Math.round((index / (sorted.length - 1)) * 100);
    });
    return percentiles;
  };

  // Top 9 demand data
  const FILLER_WORDS = new Set([
    'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
    'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of', 'vs'
  ]);
  const seedWordSet = new Set(seedWords);
  
  const sortedTop9 = top9Phrases
    .sort((a, b) => a.position - b.position)
    .slice(0, 9)
    .map(p => p.phrase);

  // Anchor bonuses from Top 9
  const anchorCounts = {};
  for (const phrase of sortedTop9) {
    const words = normalizeForMatching(phrase).split(' ');
    for (const word of words) {
      if (word.length >= 2 && !seedWordSet.has(word) && !FILLER_WORDS.has(word)) {
        anchorCounts[word] = (anchorCounts[word] || 0) + 1;
      }
    }
  }
  const anchorBonuses = {};
  for (const [word, count] of Object.entries(anchorCounts)) {
    if (count >= 2) anchorBonuses[word] = count;
  }

  const maxTwoWordFreq = Math.max(...Object.values(twoWordStarters), 1);
  const maxOneWordFreq = Math.max(...Object.values(oneWordStarters), 1);

  return {
    wordFrequency,
    bigramFrequency,
    trigramFrequency,
    seedPlus1,
    seedPlus2,
    prefixes,
    suffixes,
    seedPlus1Percentiles: computePercentiles(seedPlus1),
    seedPlus2Percentiles: computePercentiles(seedPlus2),
    prefixPercentiles: computePercentiles(prefixes),
    suffixPercentiles: computePercentiles(suffixes),
    seedPhrase,
    top9Demand: {
      phrases: sortedTop9,
      positionWeights: [1.00, 0.92, 0.85, 0.78, 0.72, 0.66, 0.61, 0.56, 0.52],
      anchorBonuses,
      phraseScores: {},
      bigramPercentiles: computePercentiles(bigramFrequency),
      wordPercentiles: computePercentiles(wordFrequency),
      twoWordStarters,
      oneWordStarters,
      maxTwoWordFreq,
      maxOneWordFreq,
    },
    totalPhrases: phrases.length,
    uniqueWords: Object.keys(wordFrequency).length,
    processedAt: new Date().toISOString(),
  };
}

async function main() {
  const searchPattern = process.argv[2] || 'youtube';
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DATA INTAKE - Full Re-run');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Searching for sessions matching: "${searchPattern}"`);

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, seed_phrase')
    .ilike('name', `%${searchPattern}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!sessions?.length) {
    console.log('No session found');
    return;
  }

  const session = sessions[0];
  console.log(`\nSession: ${session.name}`);
  console.log(`Seed: ${session.seed_phrase}`);
  console.log(`ID: ${session.id}`);

  // Get all phrases
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method, position')
    .eq('session_id', session.id);

  console.log(`Phrases: ${seeds.length}`);

  // Extract Top 9
  const top9Phrases = seeds
    .filter(s => s.generation_method === 'top10' && s.position !== null && s.position < 9)
    .map(s => ({ phrase: s.phrase, position: s.position }));

  console.log(`Top 9 count: ${top9Phrases.length}`);

  // Run full data intake
  const intakeStats = runDataIntake(
    seeds.map(s => s.phrase),
    session.seed_phrase,
    top9Phrases
  );

  // Save to database
  const { error } = await supabase
    .from('sessions')
    .update({ 
      intake_stats: intakeStats,
      total_phrases_generated: seeds.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id);

  if (error) {
    console.error('Failed to save:', error);
    return;
  }

  console.log('\n✅ Data Intake complete!');
  console.log('');
  console.log('Top 9 phrases:');
  intakeStats.top9Demand.phrases.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  console.log('');
  console.log('Starter frequencies:');
  console.log(`  Two-word max: ${intakeStats.top9Demand.maxTwoWordFreq}`);
  console.log(`  One-word max: ${intakeStats.top9Demand.maxOneWordFreq}`);
  console.log('  Top two-word starters:', Object.entries(intakeStats.top9Demand.twoWordStarters).sort((a,b) => b[1] - a[1]).slice(0, 5));
  console.log('  Top one-word starters:', Object.entries(intakeStats.top9Demand.oneWordStarters).sort((a,b) => b[1] - a[1]).slice(0, 5));
  console.log('');
  console.log('Now run: node scripts/analyze-pop-v2.mjs');
}

main().catch(console.error);
