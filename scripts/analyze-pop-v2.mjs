/**
 * Popularity Algorithm V2 Analysis Script
 * 
 * Implements the FULL algorithm from /docs/popularity-algorithm-v2.md:
 * - TAG determination (TOP_10, T10_CHILD, T10_RELATED, NO_TAG)
 * - TOP_10: Base 79-87 by position, ONLY anchor bonus (+3/+5), NO other bonuses
 * - T10_RELATED: Position-based boost (+4 to +12)
 * - Starter Boost: ONE boost based on % of session (max +12)
 * - Demand Anchor Boost (0 to +12 based on word frequency)
 * - Length Adjustment (-15 to +4)
 * - Natural Language Adjustment (-12 to +10)
 * - Micro Variation (±2)
 * 
 * Usage: node scripts/analyze-pop-v2.mjs [session-name-pattern]
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================
// CONSTANTS FROM popularity-algorithm-v2.md
// ============================================================

// TOP_10 base scores by position (position 1 = 87, decay by 1)
const TOP_10_BASE_BY_POSITION = [87, 86, 85, 84, 83, 82, 81, 80, 79];

// TOP_10 anchor bonus (the ONLY boost for TOP_10)
const TOP_10_ANCHOR_BONUS = {
  TWO_TIMES: 3,   // Anchor appears 2x in Top 9 -> +3
  THREE_PLUS: 5,  // Anchor appears 3+ times -> +5 (max)
};

// T10_RELATED position-based boost
const T10_RELATED_BOOST = [12, 11, 10, 9, 8, 7, 6, 5, 4];

const TAG_BASE_SCORES = {
  T10_CHILD: 70,   // Child phrases
  T10_RELATED: 55, // Base before position-based boost
  NO_TAG: 55,      // A-Z, Prefix, unrelated
};

const FILLER_WORDS = new Set([
  'how', 'to', 'what', 'is', 'why', 'does', 'can', 'best', 'will', 'should',
  'when', 'for', 'the', 'a', 'an', 'with', 'and', 'or', 'in', 'on', 'at', 'of',
  'vs', 'your', 'you', 'my', 'i', 'it', 'be', 'do', 'are', 'this', 'that',
  'from', 'by', 'not', 'if', 'but', 'about', 'get', 'make', 'like', 'just'
]);

const FOREIGN_LANGUAGE_PATTERNS = [
  /\b(hindi|tamil|telugu|malayalam|kannada|bengali|marathi|gujarati|punjabi)\b/i,
  /\b(uzbek|amharic|bangla|urdu|arabic|español|portuguese|français|deutsch|russian|indonesia|filipino|tagalog|vietnamese|thai|korean|japanese|chinese|mandarin)\b/i,
  /\b(en español|em português|auf deutsch|kaise kare|ka tarika|in telugu|in tamil|in hindi)\b/i,
];

// REMOVED: YouTuber name patterns - not scalable

// Date/time patterns: -12 penalty
// Months and days of week are almost never good video topics
const DATE_TIME_PATTERNS = [
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
];

const LOW_QUALITY_PATTERNS = [
  /\b(be like|meme|reaction|cringe|rant|exposed|drama|beef)\b/i,
  /(.)\1{3,}/,
];

const HIGH_QUALITY_PATTERNS = [
  /\b(secret|hack|trick|tip|strategy|guide|tutorial|explained|update|2024|2025)\b/i,
  /\b(fix|solve|beat|crack|master|improve|boost|grow|monetize)\b/i,
  /\b(new|latest|complete|ultimate|beginner|advanced|pro)\b/i,
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function normalizeForMatching(str) {
  return str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
}

function phraseContains(targetPhrase, searchPhrase) {
  return normalizeForMatching(targetPhrase).includes(normalizeForMatching(searchPhrase));
}

function phraseStartsWith(targetPhrase, searchPhrase) {
  return normalizeForMatching(targetPhrase).startsWith(normalizeForMatching(searchPhrase));
}

function getPhraseVariation(phrase) {
  let hash = 0;
  for (let i = 0; i < phrase.length; i++) {
    hash = ((hash << 5) - hash) + phrase.charCodeAt(i);
    hash = hash & hash;
  }
  return (Math.abs(hash) % 5) - 2; // -2 to +2
}

// ============================================================
// SCORING COMPONENTS
// ============================================================

/**
 * Length Adjustment: -15 to +4
 */
function getLengthAdjustment(phrase) {
  const wordCount = phrase.trim().split(/\s+/).length;
  if (wordCount <= 2) return 0;   // No adjustment for short phrases
  if (wordCount === 3) return 5;  // Sweet spot - specific but concise
  if (wordCount === 4) return 4;  // Still great
  if (wordCount === 5) return 2;  // Good specificity
  if (wordCount === 6) return 0;  // Neutral
  if (wordCount === 7) return -2; // Getting long
  if (wordCount === 8) return -3; // Too wordy
  return -4;                      // 9+ words: too verbose
}

/**
 * Starter Boost: ONE boost based on % of session (max +12)
 * Uses first word frequency as percentage of total phrases
 */
function getStarterBoost(phrase, oneWordStarters, totalPhrases) {
  if (!oneWordStarters || !totalPhrases || totalPhrases === 0) return 0;
  
  const lowerPhrase = phrase.toLowerCase().trim();
  const words = lowerPhrase.split(/\s+/);
  if (!words[0]) return 0;
  
  const freq = oneWordStarters[words[0]] || 0;
  if (freq === 0) return 0;
  
  // Calculate percentage of session
  const percentage = (freq / totalPhrases) * 100;
  
  // Apply boost based on percentage thresholds
  if (percentage >= 15) return 12;
  if (percentage >= 10) return 10;
  if (percentage >= 7) return 8;
  if (percentage >= 4) return 5;
  if (percentage >= 2) return 3;
  return 0;
}

/**
 * Demand Anchor Boost: 0 to +12
 * Based on session-wide word frequency (absolute thresholds)
 */
function getDemandAnchorBoost(phrase, wordFrequency, seedPhrase) {
  const seedWords = new Set((seedPhrase || '').toLowerCase().split(/\s+/));
  const phraseWords = phrase.toLowerCase().split(/\s+/);
  let bestBoost = 0;

  for (const word of phraseWords) {
    if (word.length < 3) continue;
    if (seedWords.has(word)) continue;
    if (FILLER_WORDS.has(word)) continue;

    const frequency = wordFrequency[word] || 0;
    let boost = 0;
    if (frequency >= 20) boost = 12;      // High demand
    else if (frequency >= 15) boost = 10; // Strong demand
    else if (frequency >= 10) boost = 7;  // Good demand
    else if (frequency >= 6) boost = 4;   // Moderate demand
    else if (frequency >= 3) boost = 2;   // Weak signal

    if (boost > bestBoost) bestBoost = boost;
  }

  return bestBoost;
}

/**
 * Natural Language Adjustment: -12 to +10
 * IMPORTANT: Penalties are NOT offset by bonuses. 
 * If a phrase gets penalized, it does NOT get high quality bonuses.
 */
function getNaturalLanguageAdjustment(phrase) {
  let penalty = 0;

  for (const pattern of FOREIGN_LANGUAGE_PATTERNS) {
    if (pattern.test(phrase)) { penalty = -12; break; }
  }
  if (penalty === 0) {
    for (const pattern of DATE_TIME_PATTERNS) {
      if (pattern.test(phrase)) { penalty = -10; break; }
    }
  }
  if (penalty === 0) {
    for (const pattern of LOW_QUALITY_PATTERNS) {
      if (pattern.test(phrase)) { penalty = -5; break; }
    }
  }
  
  // Only give high quality bonus if NO penalty was applied
  if (penalty < 0) {
    return penalty;
  }

  let qualityBonus = 0;
  for (const pattern of HIGH_QUALITY_PATTERNS) {
    if (pattern.test(phrase)) {
      qualityBonus += 5;
      if (qualityBonus >= 10) break;
    }
  }
  return Math.min(qualityBonus, 10);
}

// ============================================================
// MAIN SCORING FUNCTION - FULL V2 ALGORITHM
// ============================================================

function calculatePopularityV2(phrase, source, stats, totalPhrases) {
  const variation = getPhraseVariation(phrase);
  const normalizedPhrase = normalizeForMatching(phrase);
  const top9Phrases = stats.top9Demand?.phrases || [];
  const top9Normalized = top9Phrases.map(p => normalizeForMatching(p));

  // STEP 1: Determine TAG
  let tag = 'NO_TAG';
  let positionIndex = -1;

  positionIndex = top9Normalized.indexOf(normalizedPhrase);
  if (positionIndex >= 0) {
    tag = 'TOP_10';
  } else {
    for (let i = 0; i < top9Phrases.length; i++) {
      if (phraseStartsWith(phrase, top9Phrases[i])) {
        tag = 'T10_CHILD';
        positionIndex = i;
        break;
      }
    }
    if (tag === 'NO_TAG') {
      for (let i = 0; i < top9Phrases.length; i++) {
        if (phraseContains(phrase, top9Phrases[i])) {
          tag = 'T10_RELATED';
          positionIndex = i;
          break;
        }
      }
    }
  }

  // STEP 2: Base score from TAG
  let baseScore;
  let anchorBonus = 0;
  
  switch (tag) {
    case 'TOP_10':
      // Position 1 = 87, decay by 1 per position down to 79
      baseScore = TOP_10_BASE_BY_POSITION[positionIndex] || 87;
      
      // TOP_10 ONLY gets anchor bonus - check if any word appears 2+ times in Top 9
      if (stats.top9Demand?.anchorBonuses) {
        const phraseWords = normalizedPhrase.split(' ');
        for (const word of phraseWords) {
          const bonusValue = stats.top9Demand.anchorBonuses[word];
          if (bonusValue) {
            // anchorBonuses stores (count - 1) * 3
            // If >= 6, that means 3+ occurrences -> +5
            // If >= 3, that means 2 occurrences -> +3
            if (bonusValue >= 6) {
              anchorBonus = Math.max(anchorBonus, TOP_10_ANCHOR_BONUS.THREE_PLUS);
            } else if (bonusValue >= 3) {
              anchorBonus = Math.max(anchorBonus, TOP_10_ANCHOR_BONUS.TWO_TIMES);
            }
          }
        }
      }
      baseScore += anchorBonus;
      break;
      
    case 'T10_CHILD':
      // Base 70 + position-based boost (same as T10_RELATED)
      baseScore = TAG_BASE_SCORES.T10_CHILD;
      if (positionIndex >= 0 && positionIndex < 9) {
        baseScore += T10_RELATED_BOOST[positionIndex] || 0;
      }
      break;
      
    case 'T10_RELATED':
      // Base 55 + position-based boost (+12 for #1, +4 for #9)
      baseScore = TAG_BASE_SCORES.T10_RELATED;
      if (positionIndex >= 0 && positionIndex < 9) {
        baseScore += T10_RELATED_BOOST[positionIndex] || 0;
      }
      break;
      
    default:
      baseScore = TAG_BASE_SCORES.NO_TAG;
  }

  // STEP 3: Bonuses and Adjustments
  // IMPORTANT: TOP_10 does NOT get these bonuses
  let starterBoost = 0;
  let demandAnchorBoost = 0;
  let lengthAdjustment = 0;
  let nlAdjustment = 0;
  
  if (tag !== 'TOP_10') {
    starterBoost = getStarterBoost(
      phrase,
      stats.top9Demand?.oneWordStarters,
      totalPhrases
    );
    
    demandAnchorBoost = getDemandAnchorBoost(
      phrase,
      stats.wordFrequency || {},
      stats.seedPhrase || ''
    );
    
    lengthAdjustment = getLengthAdjustment(phrase);
    nlAdjustment = getNaturalLanguageAdjustment(phrase);
  }

  // STEP 4: Calculate score with cap, then apply NL penalties
  // Separate positive bonuses from negative penalties
  const nlPenalty = Math.min(0, nlAdjustment);  // Only negatives
  const nlBonus = Math.max(0, nlAdjustment);    // Only positives
  
  // First: base + positive bonuses + NL bonus
  let finalScore = baseScore + starterBoost + demandAnchorBoost + lengthAdjustment + nlBonus + variation;
  
  // Apply caps based on tag
  let cap = 99;
  if (tag === 'TOP_10') {
    cap = 92;
  } else if (tag === 'T10_CHILD') {
    const parentScore = TOP_10_BASE_BY_POSITION[positionIndex] || 87;
    cap = parentScore - 1;
  } else if (tag === 'T10_RELATED') {
    const matchingScore = TOP_10_BASE_BY_POSITION[positionIndex] || 87;
    cap = matchingScore - 2;
  } else {
    cap = 85;
  }
  
  finalScore = Math.min(finalScore, cap);
  
  // THEN apply NL penalties (so bad phrases drop below cap)
  finalScore += nlPenalty;

  return {
    score: Math.round(Math.max(0, Math.min(99, finalScore))),
    tag,
    baseScore,
    anchorBonus,
    starterBoost,
    demandAnchorBoost,
    lengthAdjustment,
    nlAdjustment,
    variation,
    cap,
  };
}

// ============================================================
// MAIN SCRIPT
// ============================================================

async function analyze() {
  const searchPattern = process.argv[2] || 'youtube';
  
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, seed_phrase, intake_stats')
    .ilike('name', `%${searchPattern}%`)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!sessions?.length) {
    console.log('No session found matching:', searchPattern);
    return;
  }

  const session = sessions[0];
  const stats = session.intake_stats;

  if (!stats) {
    console.log('No intake_stats found. Run: node scripts/rerun-intake.mjs');
    return;
  }

  // Get all phrases
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method')
    .eq('session_id', session.id);

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('POPULARITY ALGORITHM V2 ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Session: ${session.name}`);
  console.log(`Seed: ${session.seed_phrase}`);
  console.log(`Phrases: ${seeds.length}`);
  console.log('');

  // Show Top 9
  console.log('TOP 9 AUTOCOMPLETE PHRASES:');
  (stats.top9Demand?.phrases || []).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p}`);
  });
  console.log('');

  // Show Starter Frequencies
  console.log('STARTER FREQUENCIES (% of session -> boost):');
  const oneWord = stats.top9Demand?.oneWordStarters || {};
  const totalPhrases = seeds.length;
  
  console.log('  Single-word starters (0-12 based on %):');
  Object.entries(oneWord).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([s, f]) => {
    const pct = ((f / totalPhrases) * 100).toFixed(1);
    let boost = 0;
    if (pct >= 15) boost = 12;
    else if (pct >= 10) boost = 10;
    else if (pct >= 7) boost = 8;
    else if (pct >= 4) boost = 5;
    else if (pct >= 2) boost = 3;
    console.log(`    "${s}": ${f}x (${pct}%) -> +${boost}`);
  });
  console.log('');

  // Show top demand anchors
  console.log('TOP DEMAND ANCHORS (0-12 boost based on word frequency):');
  const seedWords = new Set((session.seed_phrase || '').toLowerCase().split(/\s+/));
  const meaningfulWords = Object.entries(stats.wordFrequency || {})
    .filter(([w]) => w.length >= 3 && !seedWords.has(w) && !FILLER_WORDS.has(w))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  meaningfulWords.forEach(([word, freq]) => {
    let boost = 0;
    if (freq >= 20) boost = 12;
    else if (freq >= 15) boost = 10;
    else if (freq >= 10) boost = 7;
    else if (freq >= 6) boost = 4;
    else if (freq >= 3) boost = 2;
    console.log(`  ${word}: ${freq}x -> +${boost}`);
  });
  console.log('');

  // Score all phrases
  const scoredPhrases = seeds.map(s => {
    const result = calculatePopularityV2(s.phrase, s.generation_method, stats, totalPhrases);
    return { phrase: s.phrase, source: s.generation_method, ...result };
  });

  scoredPhrases.sort((a, b) => b.score - a.score);

  // Distribution
  const ranges = [
    { min: 90, max: 99, label: '90-99' },
    { min: 80, max: 89, label: '80-89' },
    { min: 70, max: 79, label: '70-79' },
    { min: 60, max: 69, label: '60-69' },
    { min: 50, max: 59, label: '50-59' },
    { min: 40, max: 49, label: '40-49' },
    { min: 0, max: 39, label: ' 0-39' },
  ];

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SCORE DISTRIBUTION');
  console.log('═══════════════════════════════════════════════════════════════');

  for (const range of ranges) {
    const inRange = scoredPhrases.filter(s => s.score >= range.min && s.score <= range.max);
    const pct = ((inRange.length / scoredPhrases.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(parseFloat(pct) / 2));
    console.log(`${range.label}: ${String(inRange.length).padStart(3)} (${pct.padStart(5)}%) ${bar}`);
  }

  const avg = scoredPhrases.reduce((a, b) => a + b.score, 0) / scoredPhrases.length;
  console.log(`\nTotal: ${scoredPhrases.length} | Average: ${avg.toFixed(1)}`);

  // Tag distribution
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('TAG DISTRIBUTION');
  console.log('═══════════════════════════════════════════════════════════════');

  const tagCounts = { TOP_10: 0, T10_CHILD: 0, T10_RELATED: 0, NO_TAG: 0 };
  for (const s of scoredPhrases) tagCounts[s.tag]++;

  for (const [tag, count] of Object.entries(tagCounts)) {
    const pct = ((count / scoredPhrases.length) * 100).toFixed(1);
    console.log(`${tag.padEnd(12)}: ${String(count).padStart(3)} (${pct.padStart(5)}%)`);
  }

  // Top 20
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('TOP 20 PHRASES');
  console.log('═══════════════════════════════════════════════════════════════');

  scoredPhrases.slice(0, 20).forEach((s, i) => {
    let breakdown;
    if (s.tag === 'TOP_10') {
      breakdown = `base:${s.baseScore - s.anchorBonus} +anchor:${s.anchorBonus} +var:${s.variation} cap:${s.cap}`;
    } else {
      breakdown = `base:${s.baseScore} +start:${s.starterBoost} +anchor:${s.demandAnchorBoost} +len:${s.lengthAdjustment} +nl:${s.nlAdjustment} cap:${s.cap}`;
    }
    console.log(`${String(i + 1).padStart(2)}. [${s.score}] ${s.phrase}`);
    console.log(`    ${s.tag} | ${breakdown}`);
  });

  // Bottom 10
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('BOTTOM 10 PHRASES');
  console.log('═══════════════════════════════════════════════════════════════');

  scoredPhrases.slice(-10).forEach(s => {
    console.log(`[${s.score}] ${s.phrase} (${s.tag})`);
  });
}

analyze().catch(console.error);
