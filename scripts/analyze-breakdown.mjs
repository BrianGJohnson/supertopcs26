/**
 * Comprehensive Score Breakdown Script
 * Shows distribution by range, tag, and source (generation_method)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Constants from popularity-algorithm-v2.md
const TOP_10_BASE = [87, 86, 85, 84, 83, 82, 81, 80, 79];
const T10_RELATED_BOOST = [12, 11, 10, 9, 8, 7, 6, 5, 4];
const TAG_BASE = { T10_CHILD: 70, T10_RELATED: 55, NO_TAG: 55 };

const FILLER = new Set([
  'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
  'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of',
  'vs', 'your', 'you', 'my', 'i', 'it', 'be', 'do', 'are', 'this', 'that',
  'from', 'by', 'not', 'if', 'but', 'about', 'get', 'make', 'like', 'just'
]);

function normalize(s) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
}

function contains(t, s) {
  return normalize(t).includes(normalize(s));
}

function startsWith(t, s) {
  return normalize(t).startsWith(normalize(s));
}

function variation(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) {
    h = ((h << 5) - h) + p.charCodeAt(i);
    h = h & h;
  }
  return (Math.abs(h) % 5) - 2;
}

function getStarterBoost(phrase, starters, total) {
  if (!starters || !total) return 0;
  const word = phrase.toLowerCase().trim().split(/\s+/)[0];
  const freq = starters[word] || 0;
  const pct = (freq / total) * 100;
  if (pct >= 15) return 12;
  if (pct >= 10) return 10;
  if (pct >= 7) return 8;
  if (pct >= 4) return 5;
  if (pct >= 2) return 3;
  return 0;
}

function getAnchorBoost(phrase, wordFreq, seed) {
  const seedWords = new Set(seed.toLowerCase().split(/\s+/));
  const words = phrase.toLowerCase().split(/\s+/);
  let best = 0;
  for (const w of words) {
    if (w.length < 3 || seedWords.has(w) || FILLER.has(w)) continue;
    const f = wordFreq[w] || 0;
    let b = 0;
    if (f >= 20) b = 12;
    else if (f >= 15) b = 10;
    else if (f >= 10) b = 7;
    else if (f >= 6) b = 4;
    else if (f >= 3) b = 2;
    if (b > best) best = b;
  }
  return best;
}

function getLength(phrase) {
  const c = phrase.trim().split(/\s+/).length;
  if (c === 1) return -15;
  if (c === 2) return -4;
  if (c >= 3 && c <= 6) return 4;
  if (c >= 7 && c <= 8) return 1;
  if (c === 9) return -3;
  return -8;
}

function getNL(phrase) {
  let a = 0;
  if (/\b(hindi|tamil|telugu|malayalam|kannada|bengali|bangla|amharic|urdu)\b/i.test(phrase)) a -= 12;
  if (/\b(decodingyt|\w+yt)\b/i.test(phrase)) a -= 8;
  if (/\b(reaction|meme|cringe)\b/i.test(phrase)) a -= 5;
  if (/\b(2025|explained|tutorial|guide|tips|trick|hack)\b/i.test(phrase)) a += 5;
  if (/\b(beat|crack|master|fix|grow|monetize)\b/i.test(phrase)) a += 5;
  return Math.max(-12, Math.min(10, a));
}

async function run() {
  const searchPattern = process.argv[2] || 'youtube';

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, seed_phrase, intake_stats')
    .ilike('name', `%${searchPattern}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!sessions?.length) {
    console.log('No session found');
    return;
  }

  const session = sessions[0];
  const stats = session.intake_stats;
  const top9 = stats.top9Demand?.phrases || [];
  const top9Norm = top9.map(p => normalize(p));

  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method')
    .eq('session_id', session.id);

  const total = seeds.length;
  const results = [];

  for (const s of seeds) {
    const phrase = s.phrase;
    const source = s.generation_method;
    const norm = normalize(phrase);

    let tag = 'NO_TAG';
    let posIdx = -1;

    const exactIdx = top9Norm.indexOf(norm);
    if (exactIdx >= 0) {
      tag = 'TOP_10';
      posIdx = exactIdx;
    } else {
      for (let i = 0; i < top9.length; i++) {
        if (startsWith(phrase, top9[i])) {
          tag = 'T10_CHILD';
          posIdx = i;
          break;
        }
      }
      if (tag === 'NO_TAG') {
        for (let i = 0; i < top9.length; i++) {
          if (contains(phrase, top9[i])) {
            tag = 'T10_RELATED';
            posIdx = i;
            break;
          }
        }
      }
    }

    let base, anchorBonus = 0;
    if (tag === 'TOP_10') {
      base = TOP_10_BASE[posIdx] || 87;
      if (stats.top9Demand?.anchorBonuses) {
        for (const w of norm.split(' ')) {
          const b = stats.top9Demand.anchorBonuses[w];
          if (b >= 6) anchorBonus = Math.max(anchorBonus, 5);
          else if (b >= 3) anchorBonus = Math.max(anchorBonus, 3);
        }
      }
      base += anchorBonus;
    } else if (tag === 'T10_CHILD') {
      base = TAG_BASE.T10_CHILD + (T10_RELATED_BOOST[posIdx] || 0);
    } else if (tag === 'T10_RELATED') {
      base = TAG_BASE.T10_RELATED + (T10_RELATED_BOOST[posIdx] || 0);
    } else {
      base = TAG_BASE.NO_TAG;
    }

    let starter = 0, anchor = 0, len = 0, nl = 0;
    if (tag !== 'TOP_10') {
      starter = getStarterBoost(phrase, stats.top9Demand?.oneWordStarters, total);
      anchor = getAnchorBoost(phrase, stats.wordFrequency || {}, session.seed_phrase);
      len = getLength(phrase);
      nl = getNL(phrase);
    }

    const v = variation(phrase);
    let score = base + starter + anchor + len + nl + v;

    let cap = 99;
    if (tag === 'TOP_10') cap = 92;
    else if (tag === 'T10_CHILD') cap = (TOP_10_BASE[posIdx] || 87) - 1;
    else if (tag === 'T10_RELATED') cap = (TOP_10_BASE[posIdx] || 87) - 2;
    else cap = 79;

    score = Math.min(score, cap);
    score = Math.max(0, Math.min(99, Math.round(score)));

    results.push({ phrase, source, tag, score });
  }

  results.sort((a, b) => b.score - a.score);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`SESSION: ${session.name} (${total} phrases)`);
  console.log('═══════════════════════════════════════════════════════════════');

  console.log('\n📊 SCORE DISTRIBUTION (Bell Curve)');
  console.log('───────────────────────────────────────────────────────────────');

  const ranges = [
    { min: 90, max: 99, label: '90-99' },
    { min: 80, max: 89, label: '80-89' },
    { min: 70, max: 79, label: '70-79' },
    { min: 60, max: 69, label: '60-69' },
    { min: 50, max: 59, label: '50-59' },
    { min: 40, max: 49, label: '40-49' },
    { min: 30, max: 39, label: '30-39' },
    { min: 20, max: 29, label: '20-29' },
    { min: 10, max: 19, label: '10-19' },
    { min: 0, max: 9, label: ' 0-9 ' },
  ];

  for (const r of ranges) {
    const inRange = results.filter(x => x.score >= r.min && x.score <= r.max);
    const pct = ((inRange.length / results.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(parseFloat(pct) / 2));
    console.log(`${r.label}: ${String(inRange.length).padStart(3)} (${pct.padStart(5)}%) ${bar}`);
  }

  const avg = results.reduce((a, b) => a + b.score, 0) / results.length;
  console.log(`\nTotal: ${results.length} | Average: ${avg.toFixed(1)}`);

  console.log('\n📋 BREAKDOWN BY TAG');
  console.log('───────────────────────────────────────────────────────────────');

  const tags = ['TOP_10', 'T10_CHILD', 'T10_RELATED', 'NO_TAG'];
  for (const tag of tags) {
    const tagged = results.filter(x => x.tag === tag);
    if (tagged.length === 0) continue;
    const scores = tagged.map(x => x.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const tavg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    console.log(`\n${tag} (${tagged.length} phrases): range ${min}-${max}, avg ${tavg}`);

    for (const r of ranges) {
      const inRange = tagged.filter(x => x.score >= r.min && x.score <= r.max);
      if (inRange.length > 0) {
        const pct = ((inRange.length / tagged.length) * 100).toFixed(0);
        console.log(`  ${r.label}: ${String(inRange.length).padStart(3)} (${pct}%)`);
      }
    }
  }

  console.log('\n📂 BREAKDOWN BY SOURCE (generation_method)');
  console.log('───────────────────────────────────────────────────────────────');

  const sources = [...new Set(results.map(x => x.source))].sort();
  for (const src of sources) {
    const sourced = results.filter(x => x.source === src);
    if (sourced.length === 0) continue;
    const scores = sourced.map(x => x.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const savg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    console.log(`\n${src || 'unknown'} (${sourced.length} phrases): range ${min}-${max}, avg ${savg}`);

    for (const r of ranges) {
      const inRange = sourced.filter(x => x.score >= r.min && x.score <= r.max);
      if (inRange.length > 0) {
        const pct = ((inRange.length / sourced.length) * 100).toFixed(0);
        console.log(`  ${r.label}: ${String(inRange.length).padStart(3)} (${pct}%)`);
      }
    }
  }

  console.log('\n🔍 SAMPLE PHRASES BY SOURCE (top 5 each)');
  console.log('───────────────────────────────────────────────────────────────');

  for (const src of ['top10', 'child', 'az', 'prefix']) {
    const sourced = results.filter(x => x.source === src);
    if (sourced.length > 0) {
      console.log(`\n${src.toUpperCase()}:`);
      sourced.slice(0, 5).forEach(x => console.log(`  [${x.score}] ${x.phrase} (${x.tag})`));
      if (sourced.length > 5) {
        console.log(`  ... and ${sourced.length - 5} more`);
      }
    }
  }
}

run().catch(console.error);
