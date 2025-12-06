#!/usr/bin/env node
/**
 * Test Dual Scoring Calibration
 * 
 * Verifies the new dual scoring system with example phrases.
 * Target: "how to introduce yourself on youtube" should score ~64 Demand, ~90 Opportunity
 */

// Simulated INTENT_ANCHORS for testing
const INTENT_ANCHORS = {
  learning: [
    'how to', 'how do', 'how can', 'how does', 'how is',
    'tutorial', 'tutorials', 'guide', 'guides', 'learn', 'learning',
    'beginner', 'beginners', "beginner's", 'basics', 'basic',
    'introduction', 'intro', 'introduce', 'explained', 'explanation',
    'tips', 'tricks', 'course', 'class', 'lesson', 'lessons',
    'step by step', 'steps', 'for beginners', 'for dummies',
    'made easy', 'made simple', 'complete guide', 'ultimate guide',
    'masterclass', 'master', 'training', 'train',
  ],
  buyer: [
    'best', 'top', 'top 10', 'top 5', 'review', 'reviews',
    'vs', 'versus', 'or', 'comparison', 'compare',
    'worth it', 'worth buying', 'should i', 'should you',
    'buy', 'buying', 'purchase', 'cheap', 'affordable', 'budget',
    'premium', 'professional', 'pro', 'alternative', 'alternatives',
    'recommendation', 'recommendations', 'recommend',
  ],
  problem: [
    'fix', 'fixed', 'fixing', 'solve', 'solved', 'solving', 'solution',
    'help', 'helping', 'issue', 'issues', 'problem', 'problems',
    'error', 'errors', 'not working', "doesn't work", "won't work",
    'broken', 'broke', 'stuck', "can't",
    'trouble', 'troubleshoot', 'troubleshooting',
    'why is', 'why does', "why won't", "why can't", 'stop', 'prevent', 'avoid',
  ],
  discovery: [
    'what is', 'what are', 'what does', 'meaning', 'definition', 'define',
    'difference between', 'difference', 'why do', 'why does', 'why is',
    'who is', 'who are', 'when to', 'when should',
    'where to', 'where can', 'which', 'which is better',
    'explain', 'understand', 'understanding',
  ],
  action: [
    'start', 'starting', 'get started', 'getting started',
    'create', 'creating', 'creation', 'make', 'making',
    'build', 'building', 'setup', 'set up', 'setting up',
    'install', 'installing', 'installation',
    'download', 'downloading', 'use', 'using', 'how to use',
    'grow', 'growing', 'growth', 'improve', 'improving', 'improvement',
    'increase', 'boost', 'maximize', 'optimize', 'optimizing',
  ],
  current: [
    'new', 'latest', 'newest', 'update', 'updated', 'updates',
    '2024', '2025', '2026', 'now', 'today', 'still', 'anymore',
    'recently', 'recent',
  ],
  specific: [
    'for youtube', 'on youtube', 'youtube',
    'for instagram', 'on instagram', 'instagram',
    'for tiktok', 'on tiktok', 'tiktok',
    'for facebook', 'on facebook',
    'for beginners', 'for experts', 'for pros',
    'at home', 'from home', 'without', 'with no',
    'free', 'paid', 'fast', 'quick', 'quickly',
    'easy', 'simple', 'easily', 'simply',
    'online', 'offline', 'mobile', 'desktop', 'first time', 'first',
  ],
};

const INTENT_BOOSTS = {
  learning: 8,
  buyer: 6,
  problem: 7,
  discovery: 4,
  action: 6,
  current: 3,
  specific: 5,
};

function detectIntentAnchors(phrase) {
  const phraseLower = phrase.toLowerCase();
  const matches = [];
  const seenCategories = new Set();
  
  for (const [category, anchors] of Object.entries(INTENT_ANCHORS)) {
    for (const anchor of anchors) {
      if (phraseLower.includes(anchor) && !seenCategories.has(category)) {
        matches.push({
          category,
          anchor,
          boost: INTENT_BOOSTS[category],
        });
        seenCategories.add(category);
        break;
      }
    }
  }
  
  return matches;
}

function getWordCountMultiplier(wordCount) {
  switch (wordCount) {
    case 1: return 0.7;
    case 2: return 0.8;
    case 3: return 0.9;
    case 4: return 1.0;
    case 5: return 1.1;
    case 6: return 1.1;
    case 7: return 1.0;
    case 8: return 0.95;
    default: return wordCount > 8 ? 0.9 : 0.7;
  }
}

function getLongTailBonus(wordCount) {
  switch (wordCount) {
    case 1: return 0;
    case 2: return 0;
    case 3: return 5;
    case 4: return 12;
    case 5: return 20;
    case 6: return 22;
    case 7: return 18;
    case 8: return 15;
    default: return wordCount > 8 ? 12 : 0;
  }
}

function calculateDemandScore(suggestionCount, exactMatchCount, topicMatchCount, wordCount, intentMatches) {
  // Suggestion Base (0-50 points)
  const suggestionBase = Math.min(50, Math.round((suggestionCount / 14) * 50));
  
  // Word count multiplier
  const wcMultiplier = getWordCountMultiplier(wordCount);
  const wordCountAdjusted = Math.round(suggestionBase * wcMultiplier);
  
  // Topic Match Bonus (0-15 points)
  const topicPercent = suggestionCount > 0 ? topicMatchCount / suggestionCount : 0;
  const topicMatchBonus = Math.min(15, Math.round(topicPercent * 15));
  
  // Exact Match Bonus (0-15 points)
  const exactMatchBonus = Math.min(15, exactMatchCount * 2);
  
  // Intent Anchor Bonus (0-10 points)
  const intentBonus = Math.min(10, intentMatches.reduce((sum, m) => sum + m.boost, 0));
  
  // Calculate total
  const rawScore = wordCountAdjusted + topicMatchBonus + exactMatchBonus + intentBonus;
  const score = Math.max(0, Math.min(100, rawScore));
  
  // Determine label
  let label;
  if (score >= 85) label = 'Extreme Demand';
  else if (score >= 75) label = 'Very High Demand';
  else if (score >= 65) label = 'High Demand';
  else if (score >= 55) label = 'Strong Demand';
  else if (score >= 45) label = 'Good Demand';
  else if (score >= 35) label = 'Moderate Demand';
  else if (score >= 25) label = 'Some Interest';
  else label = 'Limited Interest';
  
  return {
    score,
    label,
    breakdown: {
      suggestionBase,
      wcMultiplier,
      wordCountAdjusted,
      topicMatchBonus,
      exactMatchBonus,
      intentBonus,
    },
  };
}

function calculateOpportunityScore(suggestionCount, exactMatchCount, exactMatchPercent, wordCount, intentMatches, demandScore) {
  // Low Competition Signal (0-35 points)
  let lowCompSignal;
  if (exactMatchPercent === 0) lowCompSignal = 35;
  else if (exactMatchPercent <= 15) lowCompSignal = 30;
  else if (exactMatchPercent <= 30) lowCompSignal = 22;
  else if (exactMatchPercent <= 50) lowCompSignal = 15;
  else if (exactMatchPercent <= 70) lowCompSignal = 8;
  else lowCompSignal = 3;
  
  // Long-Tail Bonus (0-22 points)
  const longTailBonus = getLongTailBonus(wordCount);
  
  // Evergreen Intent Bonus (0-25 points)
  let evergreenIntent = 0;
  for (const match of intentMatches) {
    if (match.category === 'learning') evergreenIntent += 14;
    else if (match.category === 'problem') evergreenIntent += 12;
    else if (match.category === 'action') evergreenIntent += 10;
    else if (match.category === 'discovery') evergreenIntent += 8;
    else if (match.category === 'specific') evergreenIntent += 6;
    else if (match.category === 'buyer') evergreenIntent += 5;
  }
  evergreenIntent = Math.min(25, evergreenIntent);
  
  // Demand Validation (0-15 points)
  let demandValidation;
  if (suggestionCount >= 12) demandValidation = 15;
  else if (suggestionCount >= 10) demandValidation = 13;
  else if (suggestionCount >= 8) demandValidation = 11;
  else if (suggestionCount >= 6) demandValidation = 8;
  else if (suggestionCount >= 4) demandValidation = 5;
  else demandValidation = 2;
  
  // Calculate total
  const rawScore = lowCompSignal + longTailBonus + evergreenIntent + demandValidation;
  const score = Math.max(0, Math.min(100, rawScore));
  
  // SuperTopic: Demand ≥ 50 AND Opportunity ≥ 90
  const isSuperTopic = demandScore >= 50 && score >= 90;
  
  // Determine label
  let label;
  if (isSuperTopic) label = 'SuperTopic';
  else if (score >= 85) label = 'Excellent Opportunity';
  else if (score >= 75) label = 'Great Opportunity';
  else if (score >= 65) label = 'Good Opportunity';
  else if (score >= 55) label = 'Decent Opportunity';
  else if (score >= 45) label = 'Moderate Opportunity';
  else if (score >= 35) label = 'Limited Opportunity';
  else label = 'Weak Opportunity';
  
  return {
    score,
    label,
    isSuperTopic,
    breakdown: {
      lowCompSignal,
      longTailBonus,
      evergreenIntent,
      demandValidation,
    },
  };
}

// Test cases
const testCases = [
  {
    phrase: 'how to introduce yourself on youtube',
    suggestionCount: 12,
    exactMatchCount: 1,
    topicMatchCount: 10,
    exactMatchPercent: 8,
    targetDemand: 64,
    targetOpportunity: 90,
  },
  {
    phrase: 'video topics',
    suggestionCount: 5,
    exactMatchCount: 2,
    topicMatchCount: 3,
    exactMatchPercent: 40,
    targetDemand: 'low',  // Should be much lower
    targetOpportunity: 'moderate',
  },
  {
    phrase: 'how to start a youtube channel',
    suggestionCount: 14,
    exactMatchCount: 3,
    topicMatchCount: 12,
    exactMatchPercent: 21,
    targetDemand: 'high',
    targetOpportunity: 'high',
  },
  {
    phrase: 'best camera for youtube beginners',
    suggestionCount: 10,
    exactMatchCount: 0,
    topicMatchCount: 8,
    exactMatchPercent: 0,
    targetDemand: 'good',
    targetOpportunity: 'excellent',
  },
];

console.log('\n=== DUAL SCORING CALIBRATION TEST ===\n');

for (const test of testCases) {
  const wordCount = test.phrase.split(/\s+/).filter(Boolean).length;
  const intentMatches = detectIntentAnchors(test.phrase);
  
  const demandResult = calculateDemandScore(
    test.suggestionCount,
    test.exactMatchCount,
    test.topicMatchCount,
    wordCount,
    intentMatches
  );
  
  const oppResult = calculateOpportunityScore(
    test.suggestionCount,
    test.exactMatchCount,
    test.exactMatchPercent,
    wordCount,
    intentMatches,
    demandResult.score
  );
  
  console.log(`📝 "${test.phrase}"`);
  console.log(`   Words: ${wordCount}, Suggestions: ${test.suggestionCount}`);
  console.log(`   Intent anchors: ${intentMatches.map(m => `${m.anchor} (${m.category})`).join(', ') || 'none'}`);
  console.log(`   DEMAND: ${demandResult.score} - ${demandResult.label}`);
  console.log(`     └─ base:${demandResult.breakdown.suggestionBase} × wc:${demandResult.breakdown.wcMultiplier}=${demandResult.breakdown.wordCountAdjusted} + topic:${demandResult.breakdown.topicMatchBonus} + exact:${demandResult.breakdown.exactMatchBonus} + intent:${demandResult.breakdown.intentBonus}`);
  console.log(`   OPPORTUNITY: ${oppResult.score} - ${oppResult.label}`);
  console.log(`     └─ lowComp:${oppResult.breakdown.lowCompSignal} + longTail:${oppResult.breakdown.longTailBonus} + evergreen:${oppResult.breakdown.evergreenIntent} + demand:${oppResult.breakdown.demandValidation}`);
  if (oppResult.isSuperTopic) {
    console.log(`   ⭐ SUPERTOPIC!`);
  }
  console.log('');
}
