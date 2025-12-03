#!/usr/bin/env node

/**
 * Test phrase scoring: Exact Match vs Topic Match
 * 
 * Exact Match = autocomplete results that START WITH the exact phrase
 * Topic Match = results containing KEY WORDS from the phrase
 */

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const url = `https://api.apify.com/v2/acts/scraper-mind~youtube-autocomplete-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

if (!APIFY_TOKEN) {
  console.error('❌ APIFY_API_TOKEN not set');
  process.exit(1);
}

async function queryPhrase(phrase) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: phrase, use_prefix: false, use_suffix: false })
  });
  const data = await res.json();
  const suggestions = [];
  if (data[0]) {
    for (let i = 1; i <= 10; i++) {
      const key = `suggestion_${i < 10 ? '0' + i : i}`;
      if (data[0][key]) suggestions.push(data[0][key]);
    }
  }
  return suggestions;
}

function scorePhrase(phrase, suggestions) {
  const phraseLower = phrase.toLowerCase();
  
  // Stop words to ignore
  const stopWords = ['how', 'to', 'what', 'does', 'the', 'for', 'on', 'in', 'is', 'a', 'an', 'your', 'you', 'my'];
  
  // Extract key words (non-stop words, 3+ chars)
  const keyWords = phraseLower
    .split(' ')
    .filter(w => w.length >= 3 && !stopWords.includes(w));
  
  let exactMatch = 0;
  let topicMatch = 0;
  
  const exactMatches = [];
  const topicMatches = [];
  
  suggestions.forEach(s => {
    const sLower = s.toLowerCase();
    
    // Exact match: starts with the phrase
    if (sLower.startsWith(phraseLower) || sLower === phraseLower) {
      exactMatch++;
      topicMatch++;
      exactMatches.push(s);
      topicMatches.push(s);
    } else {
      // Topic match: contains 50%+ of key words
      const matchCount = keyWords.filter(w => sLower.includes(w)).length;
      if (matchCount >= Math.ceil(keyWords.length * 0.5)) {
        topicMatch++;
        topicMatches.push(s);
      }
    }
  });
  
  return { 
    exactMatch, 
    topicMatch, 
    total: suggestions.length,
    keyWords,
    exactMatches,
    topicMatches
  };
}

async function main() {
  console.log('=== PHRASE SCORING TEST ===');
  console.log('');
  console.log('Exact Match = Results that START WITH the exact phrase');
  console.log('Topic Match = Results containing KEY WORDS from the phrase');
  console.log('');
  
  const testPhrases = [
    'how to introduce yourself on youtube',
    'what does the youtube algorithm favor',
    'youtube algorithm',
    'content creation tips',
    'how to grow on youtube'
  ];
  
  for (const phrase of testPhrases) {
    console.log('━'.repeat(60));
    console.log(`"${phrase}"`);
    console.log('');
    
    const suggestions = await queryPhrase(phrase);
    const score = scorePhrase(phrase, suggestions);
    
    console.log(`  Key words: [${score.keyWords.join(', ')}]`);
    console.log(`  Exact Match: ${score.exactMatch} of ${score.total}`);
    console.log(`  Topic Match: ${score.topicMatch} of ${score.total}`);
    console.log('');
    console.log('  All results:');
    suggestions.forEach((s, i) => {
      const isExact = score.exactMatches.includes(s);
      const isTopic = score.topicMatches.includes(s);
      const marker = isExact ? '✓ EXACT' : isTopic ? '○ TOPIC' : '  -';
      console.log(`    ${marker}  ${s}`);
    });
    console.log('');
  }
}

main();
