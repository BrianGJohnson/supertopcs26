#!/usr/bin/env node

/**
 * Demand & Competition Scoring via YouTube Autocomplete
 * 
 * This script tests our scoring methodology:
 * - Exact Match: Autocomplete results that START WITH the exact query phrase
 * - Topic Match: Results containing the majority of key words from the phrase
 * 
 * Uses direct YouTube API (client=firefox) for accurate results
 */

const YOUTUBE_API = 'https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=';

// Test phrases - mix of seed expansions
const TEST_PHRASES = [
  // Base seeds
  'youtube algorithm',
  'content creation',
  
  // A-Z suffix expansions (youtube algorithm)
  'youtube algorithm explained',
  'youtube algorithm 2024',
  'youtube algorithm 2025',
  'youtube algorithm for beginners',
  'youtube algorithm shorts',
  'youtube algorithm tips',
  'youtube algorithm hack',
  'youtube algorithm change',
  
  // Semantic prefix expansions
  'how youtube algorithm works',
  'how to beat youtube algorithm',
  'how to understand youtube algorithm',
  'why youtube algorithm is bad',
  'what is youtube algorithm',
  'best youtube algorithm tips',
  'does youtube algorithm favor longer videos',
  'does youtube algorithm favor consistency',
  
  // Content creation expansions
  'content creation tips',
  'content creation for beginners',
  'content creation ideas',
  'content creation tools',
  'content creation course',
  'content creation workflow',
  'content creation apps',
  'content creation camera',
  
  // More specific/long-tail phrases
  'how to introduce yourself on youtube',
  'what does the youtube algorithm favor',
  'youtube algorithm for small channels',
  'youtube algorithm for new channels',
  'how to grow on youtube with algorithm',
  'youtube algorithm watch time',
  'content creation without showing face',
  'content creation for introverts',
  'content creation vs content curation',
  'how to start content creation',
  'content creation on a budget',
  
  // Very specific phrases (likely low competition)
  'youtube algorithm secrets nobody talks about',
  'content creation for therapists',
  'youtube algorithm for gaming channels',
  'content creation workflow notion',
  'youtube algorithm clickthrough rate',
  'content creation equipment for beginners',
  'how does youtube algorithm work 2025',
  'youtube algorithm subscriber count',
  'content creation passive income',
  'best time to post youtube algorithm',
  'youtube algorithm first 24 hours',
  'content creation burnout',
];

async function queryYouTube(phrase) {
  const url = YOUTUBE_API + encodeURIComponent(phrase);
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data[1] || [];
  } catch (e) {
    console.error(`Error querying "${phrase}":`, e.message);
    return [];
  }
}

function scorePhrase(phrase, suggestions) {
  const phraseLower = phrase.toLowerCase().trim();
  
  // Stop words to ignore when matching topic
  const stopWords = new Set([
    'how', 'to', 'what', 'does', 'the', 'for', 'on', 'in', 'is', 'a', 'an', 
    'your', 'you', 'my', 'with', 'and', 'or', 'of', 'vs', 'be', 'do', 'why',
    'when', 'where', 'who', 'which', 'that', 'this', 'it', 'at', 'by', 'from'
  ]);
  
  // Extract key words (non-stop words, 2+ chars)
  const keyWords = phraseLower
    .split(/\s+/)
    .filter(w => w.length >= 2 && !stopWords.has(w));
  
  let exactMatch = 0;
  let topicMatch = 0;
  const exactMatches = [];
  const topicMatches = [];
  
  suggestions.forEach(s => {
    const sLower = s.toLowerCase().trim();
    
    // Exact match: result STARTS WITH the query phrase
    if (sLower.startsWith(phraseLower) || sLower === phraseLower) {
      exactMatch++;
      topicMatch++; // Exact is also topic
      exactMatches.push(s);
      topicMatches.push(s);
    } else {
      // Topic match: contains majority (50%+) of key words
      const matchedWords = keyWords.filter(w => sLower.includes(w));
      const matchRatio = matchedWords.length / keyWords.length;
      
      if (matchRatio >= 0.5) {
        topicMatch++;
        topicMatches.push(s);
      }
    }
  });
  
  return {
    phrase,
    total: suggestions.length,
    exactMatch,
    topicMatch,
    keyWords,
    exactMatches,
    topicMatches,
    suggestions
  };
}

function interpretScore(result) {
  const { exactMatch, topicMatch, total } = result;
  
  // Competition interpretation (based on exact match)
  let competition;
  if (exactMatch === 0) {
    competition = 'Not a real phrase (no autocomplete)';
  } else if (exactMatch === 1) {
    competition = 'Low Competition (unique phrase)';
  } else if (exactMatch <= 3) {
    competition = 'Moderate Competition';
  } else {
    competition = 'High Competition (crowded)';
  }
  
  // Demand interpretation (based on topic match)
  let demand;
  if (topicMatch === 0) {
    demand = 'No Demand';
  } else if (topicMatch <= 3) {
    demand = 'Low Demand';
  } else if (topicMatch <= 7) {
    demand = 'Moderate Demand';
  } else {
    demand = 'High Demand';
  }
  
  // Opportunity score
  let opportunity;
  if (exactMatch === 1 && topicMatch >= 5) {
    opportunity = '🌟 EXCELLENT - Real phrase, high demand, low competition';
  } else if (exactMatch <= 2 && topicMatch >= 3) {
    opportunity = '✅ GOOD - Low competition with decent demand';
  } else if (exactMatch >= 4 && topicMatch >= 8) {
    opportunity = '⚠️ COMPETITIVE - High demand but crowded';
  } else if (exactMatch === 0) {
    opportunity = '❌ SKIP - Not a real search phrase';
  } else {
    opportunity = '➡️ CONSIDER - Moderate opportunity';
  }
  
  return { competition, demand, opportunity };
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  DEMAND & COMPETITION SCORING TEST');
  console.log('  Using Direct YouTube Autocomplete API');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`Testing ${TEST_PHRASES.length} phrases...`);
  console.log('');
  
  const results = [];
  
  for (let i = 0; i < TEST_PHRASES.length; i++) {
    const phrase = TEST_PHRASES[i];
    process.stdout.write(`[${i + 1}/${TEST_PHRASES.length}] ${phrase.substring(0, 40).padEnd(40)} `);
    
    const suggestions = await queryYouTube(phrase);
    const score = scorePhrase(phrase, suggestions);
    const interpretation = interpretScore(score);
    
    results.push({ ...score, ...interpretation });
    
    console.log(`E:${score.exactMatch} T:${score.topicMatch}/${score.total}`);
    
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  
  // Summary
  console.log('');
  console.log('═'.repeat(70));
  console.log('  RESULTS SUMMARY');
  console.log('═'.repeat(70));
  console.log('');
  
  // Group by opportunity
  const excellent = results.filter(r => r.opportunity.includes('EXCELLENT'));
  const good = results.filter(r => r.opportunity.includes('GOOD'));
  const competitive = results.filter(r => r.opportunity.includes('COMPETITIVE'));
  const skip = results.filter(r => r.opportunity.includes('SKIP'));
  const consider = results.filter(r => r.opportunity.includes('CONSIDER'));
  
  console.log('🌟 EXCELLENT OPPORTUNITIES (' + excellent.length + '):');
  excellent.forEach(r => {
    console.log(`   "${r.phrase}" - E:${r.exactMatch} T:${r.topicMatch}`);
  });
  
  console.log('');
  console.log('✅ GOOD OPPORTUNITIES (' + good.length + '):');
  good.slice(0, 10).forEach(r => {
    console.log(`   "${r.phrase}" - E:${r.exactMatch} T:${r.topicMatch}`);
  });
  if (good.length > 10) console.log(`   ... and ${good.length - 10} more`);
  
  console.log('');
  console.log('⚠️ COMPETITIVE (' + competitive.length + '):');
  competitive.slice(0, 5).forEach(r => {
    console.log(`   "${r.phrase}" - E:${r.exactMatch} T:${r.topicMatch}`);
  });
  
  console.log('');
  console.log('❌ SKIP - Not real phrases (' + skip.length + '):');
  skip.forEach(r => {
    console.log(`   "${r.phrase}"`);
  });
  
  console.log('');
  console.log('➡️ CONSIDER (' + consider.length + ')');
  
  // Detailed examples
  console.log('');
  console.log('═'.repeat(70));
  console.log('  DETAILED EXAMPLES');
  console.log('═'.repeat(70));
  
  // Show a few detailed examples
  const examples = [
    results.find(r => r.phrase === 'how to introduce yourself on youtube'),
    results.find(r => r.phrase === 'what does the youtube algorithm favor'),
    results.find(r => r.phrase === 'youtube algorithm'),
    results.find(r => r.phrase === 'youtube algorithm for small channels'),
  ].filter(Boolean);
  
  for (const r of examples) {
    console.log('');
    console.log(`"${r.phrase}"`);
    console.log(`  Key words: [${r.keyWords.join(', ')}]`);
    console.log(`  Exact Match: ${r.exactMatch} of ${r.total}`);
    console.log(`  Topic Match: ${r.topicMatch} of ${r.total}`);
    console.log(`  ${r.opportunity}`);
    console.log('  Autocomplete results:');
    r.suggestions.forEach(s => {
      const isExact = r.exactMatches.includes(s);
      const isTopic = r.topicMatches.includes(s);
      const marker = isExact ? '✓ EXACT' : isTopic ? '○ TOPIC' : '  -';
      console.log(`    ${marker}  ${s}`);
    });
  }
}

main().catch(console.error);
