#!/usr/bin/env node
/**
 * Granular score distribution analysis
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FILLER_WORDS = new Set(['how','to','what','is','the','a','for','and','in','on','of','with','your','my','you','can','do','does','are','this','that','be','it','or','as','at','by','an','if','has','have','from','not','but','was','were','been','being','get','got','will','would','could','should','may','might','must','shall','about','into','over','after','before','through','during','under','between','out','up','down','off','then','than','when','where','why','all','each','every','both','few','more','most','other','some','such','no','nor','only','own','same','so','too','very','just','also','now','new','any','here','there']);

function getLengthAdjustment(phrase) {
  const wordCount = phrase.trim().split(/\s+/).length;
  if (wordCount <= 2) return 0;
  if (wordCount === 3) return 5;
  if (wordCount === 4) return 4;
  if (wordCount === 5) return 2;
  if (wordCount === 6) return 0;
  if (wordCount === 7) return -2;
  if (wordCount === 8) return -3;
  return -4;
}

function getStarterBoost(phrase, oneWordStarters, totalPhrases) {
  if (!oneWordStarters || !totalPhrases || totalPhrases === 0) return 0;
  const words = phrase.toLowerCase().trim().split(/\s+/);
  if (!words[0]) return 0;
  const freq = oneWordStarters[words[0]] || 0;
  const pct = (freq / totalPhrases) * 100;
  if (pct >= 15) return 12;
  if (pct >= 10) return 10;
  if (pct >= 7) return 8;
  if (pct >= 4) return 5;
  if (pct >= 2) return 3;
  return 0;
}

function getDemandAnchorBoost(phrase, wordFrequency, seedPhrase) {
  if (!wordFrequency) return 0;
  const seedWords = new Set((seedPhrase || '').toLowerCase().split(/\s+/));
  const words = phrase.toLowerCase().split(/\s+/);
  let bestBoost = 0;
  for (const word of words) {
    if (word.length < 3 || seedWords.has(word) || FILLER_WORDS.has(word)) continue;
    const freq = wordFrequency[word] || 0;
    let boost = 0;
    if (freq >= 20) boost = 12;
    else if (freq >= 15) boost = 10;
    else if (freq >= 10) boost = 7;
    else if (freq >= 6) boost = 4;
    else if (freq >= 3) boost = 2;
    if (boost > bestBoost) bestBoost = boost;
  }
  return bestBoost;
}

function calculateScore(phrase, source, stats, totalPhrases, seedPhrase) {
  const top9 = (stats.top9Demand?.phrases || []).map(p => p.toLowerCase());
  const phraseLower = phrase.toLowerCase();
  
  if (source === 'seed') {
    return { score: 94, tag: 'SEED' };
  }
  
  let tag = 'NO_TAG';
  let position = -1;
  
  const top9Index = top9.findIndex(p => p === phraseLower);
  if (top9Index !== -1) {
    tag = 'TOP_10';
    position = top9Index;
  } else {
    for (let i = 0; i < top9.length; i++) {
      if (phraseLower.startsWith(top9[i] + ' ')) {
        tag = 'T10_CHILD';
        position = i;
        break;
      }
    }
    if (tag === 'NO_TAG') {
      for (let i = 0; i < top9.length; i++) {
        if (phraseLower.includes(top9[i])) {
          tag = 'T10_RELATED';
          position = i;
          break;
        }
      }
    }
  }
  
  let score = 0;
  let cap = 99;
  
  if (tag === 'TOP_10') {
    score = 87 - position;
    cap = 92;
  } else if (tag === 'T10_CHILD') {
    const parentScore = 87 - position;
    score = 70 + (12 - position);
    score += getStarterBoost(phrase, stats.top9Demand?.oneWordStarters, totalPhrases);
    score += getDemandAnchorBoost(phrase, stats.wordFrequency, seedPhrase);
    score += getLengthAdjustment(phrase);
    cap = parentScore - 1;
  } else if (tag === 'T10_RELATED') {
    const parentScore = 87 - position;
    score = 67 + (12 - position);
    score += getStarterBoost(phrase, stats.top9Demand?.oneWordStarters, totalPhrases);
    score += getDemandAnchorBoost(phrase, stats.wordFrequency, seedPhrase);
    score += getLengthAdjustment(phrase);
    cap = parentScore - 2;
  } else {
    score = 55;
    score += getStarterBoost(phrase, stats.top9Demand?.oneWordStarters, totalPhrases);
    score += getDemandAnchorBoost(phrase, stats.wordFrequency, seedPhrase);
    score += getLengthAdjustment(phrase);
    cap = 85;
  }
  
  score = Math.min(score, cap);
  score = Math.max(0, Math.min(99, score));
  
  return { score, tag };
}

async function analyze() {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, seed_phrase, intake_stats')
    .ilike('name', '%youtube%algorithm%')
    .order('created_at', { ascending: false })
    .limit(1);
  
  const session = sessions[0];
  const stats = session.intake_stats;
  
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method')
    .eq('session_id', session.id);
  
  const totalPhrases = seeds.length;
  
  const scored = seeds.map(s => {
    const result = calculateScore(s.phrase, s.generation_method, stats, totalPhrases, session.seed_phrase);
    return { phrase: s.phrase, source: s.generation_method, ...result };
  }).sort((a, b) => b.score - a.score);
  
  console.log('DISTRIBUTION BY SOURCE/GENERATION METHOD');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  // Group by source
  const sources = ['top10', 'child', 'prefix', 'a_to_z'];
  
  for (const source of sources) {
    const sourceSeeds = scored.filter(s => s.source === source);
    if (sourceSeeds.length === 0) continue;
    
    const avgScore = (sourceSeeds.reduce((sum, s) => sum + s.score, 0) / sourceSeeds.length).toFixed(1);
    const minScore = Math.min(...sourceSeeds.map(s => s.score));
    const maxScore = Math.max(...sourceSeeds.map(s => s.score));
    
    console.log(`\n${source.toUpperCase()} (${sourceSeeds.length} phrases)`);
    console.log(`  Range: ${minScore} - ${maxScore} | Avg: ${avgScore}`);
    
    // Score buckets for this source
    const buckets = {
      '85-99': sourceSeeds.filter(s => s.score >= 85).length,
      '80-84': sourceSeeds.filter(s => s.score >= 80 && s.score < 85).length,
      '75-79': sourceSeeds.filter(s => s.score >= 75 && s.score < 80).length,
      '70-74': sourceSeeds.filter(s => s.score >= 70 && s.score < 75).length,
      '65-69': sourceSeeds.filter(s => s.score >= 65 && s.score < 70).length,
      '60-64': sourceSeeds.filter(s => s.score >= 60 && s.score < 65).length,
      '<60': sourceSeeds.filter(s => s.score < 60).length,
    };
    
    console.log('  Distribution:');
    for (const [range, count] of Object.entries(buckets)) {
      if (count > 0) {
        const pct = ((count / sourceSeeds.length) * 100).toFixed(0);
        const bar = '█'.repeat(Math.round(count / 2));
        console.log(`    ${range.padStart(5)}: ${String(count).padStart(3)} (${pct.padStart(2)}%) ${bar}`);
      }
    }
    
    // Sample phrases
    console.log('  Samples:');
    const samples = [
      { label: 'Top', items: sourceSeeds.slice(0, 2) },
      { label: 'Mid', items: sourceSeeds.slice(Math.floor(sourceSeeds.length / 2), Math.floor(sourceSeeds.length / 2) + 2) },
      { label: 'Low', items: sourceSeeds.slice(-2) },
    ];
    for (const { label, items } of samples) {
      items.forEach(s => {
        console.log(`    [${s.score}] ${s.phrase}`);
      });
    }
  }
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TAG vs SOURCE BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Cross-tabulation: source vs tag
  const crossTab = {};
  for (const s of scored) {
    const key = `${s.source}|${s.tag}`;
    if (!crossTab[key]) crossTab[key] = { count: 0, scores: [] };
    crossTab[key].count++;
    crossTab[key].scores.push(s.score);
  }
  
  console.log('\nSource       | Tag          | Count | Avg Score | Range');
  console.log('-------------|--------------|-------|-----------|------');
  
  for (const [key, data] of Object.entries(crossTab).sort((a, b) => b[1].count - a[1].count)) {
    const [source, tag] = key.split('|');
    const avg = (data.scores.reduce((a, b) => a + b, 0) / data.scores.length).toFixed(0);
    const min = Math.min(...data.scores);
    const max = Math.max(...data.scores);
    console.log(`${source.padEnd(12)} | ${tag.padEnd(12)} | ${String(data.count).padStart(5)} | ${String(avg).padStart(9)} | ${min}-${max}`);
  }
  
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('WHAT WOULD CHANGE IF WE RAISE NO_TAG CAP TO 85?');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Simulate new scoring
  const noTagPhrases = scored.filter(s => s.tag === 'NO_TAG');
  const currentCap = 79;
  const newCap = 85;
  
  // Count how many are currently at the cap
  const atCap = noTagPhrases.filter(s => s.score === currentCap).length;
  console.log(`\nCurrently ${atCap} NO_TAG phrases are hitting the 79 cap`);
  
  // Recalculate with new cap
  const recalculated = noTagPhrases.map(s => {
    // Estimate uncapped score: if at 79, they could be higher
    // We need to recalculate without cap
    let uncappedScore = 55; // base
    uncappedScore += getStarterBoost(s.phrase, stats.top9Demand?.oneWordStarters, totalPhrases);
    uncappedScore += getDemandAnchorBoost(s.phrase, stats.wordFrequency, session.seed_phrase);
    uncappedScore += getLengthAdjustment(s.phrase);
    
    const newScore = Math.min(uncappedScore, newCap);
    return { ...s, uncapped: uncappedScore, newScore };
  });
  
  console.log('\nWith NO_TAG cap raised to 85:');
  const newBuckets = {
    '85+': recalculated.filter(s => s.newScore >= 85).length,
    '80-84': recalculated.filter(s => s.newScore >= 80 && s.newScore < 85).length,
    '75-79': recalculated.filter(s => s.newScore >= 75 && s.newScore < 80).length,
    '70-74': recalculated.filter(s => s.newScore >= 70 && s.newScore < 75).length,
    '<70': recalculated.filter(s => s.newScore < 70).length,
  };
  
  for (const [range, count] of Object.entries(newBuckets)) {
    const pct = ((count / noTagPhrases.length) * 100).toFixed(0);
    console.log(`  ${range.padStart(5)}: ${String(count).padStart(3)} (${pct}%)`);
  }
  
  // Show which phrases would now be in 80s
  const newlyIn80s = recalculated.filter(s => s.score < 80 && s.newScore >= 80).slice(0, 10);
  if (newlyIn80s.length > 0) {
    console.log('\nPhrases that would move INTO 80s:');
    newlyIn80s.forEach(s => {
      console.log(`  [${s.score} → ${s.newScore}] ${s.phrase}`);
    });
  }
}

analyze();
