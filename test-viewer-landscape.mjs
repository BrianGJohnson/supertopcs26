/**
 * Quick test of viewer-landscape scoring
 */

// Simulate the core scoring logic from viewer-landscape.ts

const INTENT_ANCHORS = {
  learning: ['how to', 'how do', 'how can', 'tutorial', 'guide', 'learn', 'beginner', 'basics', 'introduction', 'intro', 'introduce', 'explained', 'tips', 'tricks'],
  buyer: ['best', 'top', 'review', 'reviews', 'vs', 'comparison', 'worth it', 'should i', 'buy', 'alternative'],
  problem: ['fix', 'solve', 'help', 'issue', 'problem', 'error', 'not working', 'broken', 'stuck'],
  discovery: ['what is', 'what are', 'meaning', 'definition', 'difference', 'why do', 'explain'],
  action: ['start', 'create', 'make', 'build', 'setup', 'install', 'use', 'grow', 'improve'],
  current: ['new', 'latest', '2024', '2025', 'now', 'today'],
  specific: ['for youtube', 'on youtube', 'youtube', 'for instagram', 'for beginners', 'free', 'fast', 'easy'],
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
  const suggestionBase = Math.min(50, Math.round((suggestionCount / 14) * 50));
  const wcMultiplier = getWordCountMultiplier(wordCount);
  const wordCountAdjusted = Math.round(suggestionBase * wcMultiplier);
  const topicPercent = suggestionCount > 0 ? topicMatchCount / suggestionCount : 0;
  const topicMatchBonus = Math.min(15, Math.round(topicPercent * 15));
  const exactMatchBonus = Math.min(25, exactMatchCount * 3);  // Increased from 2 to 3 multiplier
  const intentBonus = Math.min(10, intentMatches.reduce((sum, m) => sum + m.boost, 0));
  
  const rawScore = wordCountAdjusted + topicMatchBonus + exactMatchBonus + intentBonus;
  const score = Math.max(0, Math.min(100, rawScore));
  
  let label;
  if (score >= 85) label = 'Extreme Demand';
  else if (score >= 75) label = 'Very High Demand';
  else if (score >= 65) label = 'High Demand';
  else if (score >= 55) label = 'Strong Demand';
  else if (score >= 45) label = 'Good Demand';
  else if (score >= 35) label = 'Moderate Demand';
  else if (score >= 25) label = 'Some Interest';
  else label = 'Limited Interest';
  
  return { score, label };
}

function calculateOpportunityScore(suggestionCount, exactMatchCount, exactMatchPercent, wordCount, intentMatches, demandScore) {
  let lowCompSignal;
  if (exactMatchPercent === 0) lowCompSignal = 35;
  else if (exactMatchPercent <= 15) lowCompSignal = 30;
  else if (exactMatchPercent <= 30) lowCompSignal = 22;
  else if (exactMatchPercent <= 50) lowCompSignal = 15;
  else if (exactMatchPercent <= 70) lowCompSignal = 8;
  else lowCompSignal = 3;
  
  const longTailBonus = getLongTailBonus(wordCount);
  
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
  
  let demandValidation;
  if (suggestionCount >= 12) demandValidation = 15;
  else if (suggestionCount >= 10) demandValidation = 13;
  else if (suggestionCount >= 8) demandValidation = 11;
  else if (suggestionCount >= 6) demandValidation = 8;
  else if (suggestionCount >= 4) demandValidation = 5;
  else demandValidation = 2;
  
  const rawScore = lowCompSignal + longTailBonus + evergreenIntent + demandValidation;
  const score = Math.max(0, Math.min(100, rawScore));
  
  const isSuperTopic = demandScore >= 50 && score >= 90;
  
  let label;
  if (isSuperTopic) label = 'SuperTopic';
  else if (score >= 85) label = 'Excellent Opportunity';
  else if (score >= 75) label = 'Great Opportunity';
  else if (score >= 65) label = 'Good Opportunity';
  else if (score >= 55) label = 'Decent Opportunity';
  else if (score >= 45) label = 'Moderate Opportunity';
  else if (score >= 35) label = 'Limited Opportunity';
  else label = 'Weak Opportunity';
  
  return { score, label, isSuperTopic };
}

// =============================================================================
// NEW: Template-based message system
// =============================================================================

function getDemandSentence(demandScore) {
  if (demandScore >= 95) return 'Extreme viewer demand detected.';
  else if (demandScore >= 85) return 'Very high viewer demand for this topic.';
  else if (demandScore >= 77) return 'High viewer demand detected.';
  else if (demandScore >= 67) return 'Strong viewer interest in this topic.';
  else if (demandScore >= 57) return 'Good viewer demand detected.';
  else if (demandScore >= 47) return 'Moderate viewer interest.';
  else if (demandScore >= 37) return 'Some viewer interest detected.';
  else return 'Limited viewer interest for this phrase.';
}

function getOpportunitySentence(opportunityScore, demandScore) {
  if (opportunityScore >= 85 && demandScore < 77) {
    return 'Excellent opportunity despite moderate demand.';
  } else if (opportunityScore >= 85) {
    return 'Excellent opportunity to reach viewers.';
  } else if (opportunityScore >= 75) {
    return 'Great opportunity for viewer discovery.';
  } else if (opportunityScore >= 65) {
    return 'Good opportunity to connect with viewers.';
  } else if (opportunityScore >= 55) {
    return 'Decent opportunity, but space may be crowded.';
  } else if (opportunityScore >= 45) {
    return 'Moderate opportunity—check YouTube for similar content.';
  } else {
    if (demandScore >= 67) {
      return 'High demand but crowded space—many creators covering this.';
    }
    return null;
  }
}

function getWordCountSentence(wordCount) {
  if (wordCount === 5 || wordCount === 6) {
    return `This ${wordCount}-word phrase hits the sweet spot for discoverability.`;
  } else if (wordCount >= 7) {
    return `This ${wordCount}-word phrase is highly specific—great for targeted viewers but may have lower volume.`;
  } else if (wordCount <= 2) {
    return `This ${wordCount}-word phrase is broad—high competition expected.`;
  }
  return null;
}

// Note: In production, this function is context-aware (accepts level, opportunityScore)
// For testing, we use a simplified version
function getSuggestionCountSentence(suggestionCount) {
  if (suggestionCount >= 12) {
    return `${suggestionCount} autocomplete suggestions is a strong signal of viewer interest.`;
  } else if (suggestionCount >= 10) {
    return `${suggestionCount} autocomplete suggestions indicates solid viewer interest.`;
  } else if (suggestionCount >= 8) {
    return `${suggestionCount} suggestions shows good interest.`;
  } else if (suggestionCount >= 5) {
    return `${suggestionCount} suggestions—moderate interest.`;
  } else if (suggestionCount >= 1) {
    return `Only ${suggestionCount} suggestions found—try a broader phrase for more data.`;
  }
  return null;
}

function getActionSentence(demandScore, opportunityScore, exactMatchPercent) {
  // SuperTopic-level: data-focused, not directive
  if (opportunityScore >= 90 && demandScore >= 50) {
    return 'Worth considering for browse and search.';
  }
  // High opportunity: viewers looking + space available
  if (opportunityScore >= 75 && demandScore >= 47) {
    return 'Good potential—check YouTube for similar content.';
  }
  // Low exact match = less crowded
  if (exactMatchPercent < 15 && demandScore >= 47) {
    return 'Low competition signal—good potential for discoverability.';
  }
  // High exact match = crowded space
  if (exactMatchPercent > 50) {
    return 'Crowded space—consider a more specific variation.';
  }
  // Moderate scenario
  if (demandScore >= 37 && opportunityScore >= 45) {
    return 'Check YouTube to see what creators are making.';
  }
  // Low scores: suggest refinement
  if (demandScore < 37 || opportunityScore < 45) {
    return 'Try a different angle or more specific phrase.';
  }
  return null;
}

function hasEvergreenIntentFn(intentMatches) {
  const evergreenCategories = ['learning', 'problem', 'discovery', 'action'];
  return intentMatches.some(m => evergreenCategories.includes(m.category));
}

function buildSignalMessage(demandScore, opportunityScore, suggestionCount, wordCount, hasEvergreen, isSuperTopic, exactMatchPercent) {
  const sentences = [];

  if (isSuperTopic) {
    sentences.push('SuperTopic detected! Viewers are actively looking for this content.');
  } else {
    sentences.push(getDemandSentence(demandScore));
    const oppSentence = getOpportunitySentence(opportunityScore, demandScore);
    if (oppSentence) sentences.push(oppSentence);
  }

  const wordCountSentence = getWordCountSentence(wordCount);
  if (wordCountSentence) sentences.push(wordCountSentence);

  const suggestionSentence = getSuggestionCountSentence(suggestionCount);
  if (suggestionSentence) sentences.push(suggestionSentence);

  if (hasEvergreen && demandScore >= 47) {
    sentences.push('This topic has long-term view potential.');
  }

  const actionSentence = getActionSentence(demandScore, opportunityScore, exactMatchPercent);
  if (actionSentence) sentences.push(actionSentence);

  return sentences.join(' ');
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

function testScenario(name, seed, suggestions, expectedOppRange) {
  console.log('\n' + '='.repeat(70));
  console.log(`TEST: ${name}`);
  console.log('='.repeat(70));

  const wordCount = seed.split(/\s+/).filter(Boolean).length;
  const exactMatchCount = suggestions.filter(s => s.toLowerCase().startsWith(seed.toLowerCase())).length;
  const topicMatchCount = suggestions.length;
  const exactMatchPercent = Math.round((exactMatchCount / suggestions.length) * 100);

  console.log('Seed:', seed);
  console.log('Word count:', wordCount);
  console.log('Suggestions:', suggestions.length);
  console.log('Exact match:', exactMatchCount, `(${exactMatchPercent}%)`);
  console.log('');

  const intentMatches = detectIntentAnchors(seed);
  console.log('Intent matches:', intentMatches.map(m => `${m.anchor} (${m.category})`).join(', ') || 'none');

  const demandResult = calculateDemandScore(
    suggestions.length,
    exactMatchCount,
    topicMatchCount,
    wordCount,
    intentMatches
  );
  console.log('Demand:', demandResult.score, '-', demandResult.label);

  const oppResult = calculateOpportunityScore(
    suggestions.length,
    exactMatchCount,
    exactMatchPercent,
    wordCount,
    intentMatches,
    demandResult.score
  );
  console.log('Opportunity:', oppResult.score, '-', oppResult.label);
  console.log('SuperTopic:', oppResult.isSuperTopic);

  const hasEvergreen = hasEvergreenIntentFn(intentMatches);

  console.log('\n📝 NEW MESSAGE:');
  const message = buildSignalMessage(
    demandResult.score,
    oppResult.score,
    suggestions.length,
    wordCount,
    hasEvergreen,
    oppResult.isSuperTopic,
    exactMatchPercent
  );
  console.log(message);

  return { demandScore: demandResult.score, oppScore: oppResult.score, message };
}

// Test 1: SuperTopic scenario (user's screenshot case)
testScenario(
  'SuperTopic: High demand + 90 opportunity',
  'how to start a podcast',  // 5 words
  [
    'how to start a podcast',
    'how to start a podcast on spotify',
    'how to start a podcast for free',
    'how to start a podcast on youtube',
    'how to start a podcast equipment',
    'how to start a podcast with no audience',
    'how to start a podcast name',
    'how to start a podcast business',
    'how to start a podcast intro',
    'how to start a podcast recording',
    'how to start a podcast editing',
    'how to start a podcast marketing',
  ]
);

// Test 2: Moderate demand + high opportunity (the buggy case from screenshot)
testScenario(
  'BUG FIX: Demand 57-66 with Opp 90 should NOT say "moderate opportunity"',
  'easy podcast setup at home',  // 5 words, specific intent
  [
    'easy podcast setup at home',
    'podcast setup for beginners',
    'podcast equipment guide',
    'home podcast studio ideas',
    'podcast recording tips',
    'how to record podcast',
    'podcast microphone setup',
    'podcast room setup',
    'podcast setup cost',
    'podcast setup checklist',
  ]
);

// Test 3: Low demand scenario
testScenario(
  'Low demand: Limited interest',
  'underwater basket weaving',  // 3 words, no intent
  [
    'underwater basket weaving',
    'underwater basket weaving meme',
  ]
);

// Test 4: High demand but high competition
testScenario(
  'High demand, high competition',
  'make money online',  // 3 words
  [
    'make money online',
    'make money online fast',
    'make money online free',
    'make money online for beginners',
    'make money online 2024',
    'make money online apps',
    'make money online typing',
    'make money online videos',
    'make money online surveys',
    'make money online watching videos',
    'make money online no experience',
    'make money online side hustle',
  ]
);

// Test 5: ACTUAL SuperTopic scenario (user's screenshot case)
// Simulating: Demand ~65 ("Good Demand") + Opportunity 90+ = SuperTopic
testScenario(
  'ACTUAL SuperTopic: Good Demand (65) + Opportunity 90 = SuperTopic',
  'how to introduce yourself on youtube',  // 6 words, learning intent
  [
    'how to introduce yourself on youtube',
    'introduce yourself video ideas',
    'youtube channel introduction tips',
    'first youtube video introduction',
    'how to make intro video',
    'youtube intro for beginners',
    'introduce your channel script',
    'personal introduction video',
    'youtube channel trailer ideas',
    'self introduction for youtube',
  ]
);

console.log('\n\n✅ All test scenarios complete!');
