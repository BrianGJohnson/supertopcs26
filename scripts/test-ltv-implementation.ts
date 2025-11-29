/**
 * Test script to validate the LTV implementation in data-intake.ts
 * Run with: npx tsx scripts/test-ltv-implementation.ts
 */

import {
  extractLTVAnchors,
  calculateLTV,
  getLTVBoost,
  shouldShowLTVBadge,
  calculateAllScores,
  runDataIntake,
  type LTVAnchors,
} from '../src/lib/data-intake';

// Test data based on "Content Creation" session
const seedPhrase = 'Content Creation';
const top10Phrases = [
  'Content Creation Tips',
  'Content Creation For Beginners',
  'Content Creation With AI',
  'Content Creation Full Course',
  'Content Creation Ideas',
  'Content Creation For Business',
  'Content Creation Equipment',
  'Content Creation 2025',
  'Content Creation Tips For Beginners',
  'Content Creation With AI Full Course',
];

// Test phrases from different strategies
const testPhrases = [
  // Should be FULL_TOP10 (70-95)
  { phrase: 'Content Creation Tips For Beginners Tutorial', expected: 'FULL_TOP10' },
  { phrase: 'Content Creation With AI Full Course Free', expected: 'FULL_TOP10' },
  { phrase: 'Content Creation For Beginners 2025', expected: 'FULL_TOP10' },
  { phrase: 'Content Creation 2025 Guide', expected: 'FULL_TOP10' }, // "Content Creation 2025" is in Top 10
  
  // Should be FULL_ANCHOR (55-69)
  { phrase: 'Content Creation Tools For Beginners', expected: 'FULL_ANCHOR' },
  { phrase: 'Content Creation Video Ideas', expected: 'FULL_ANCHOR' },
  
  // Should be BIGRAM (40-54)
  { phrase: 'Content Creation For Small Business', expected: 'BIGRAM' },
  { phrase: 'Content Creation With Tools', expected: 'BIGRAM' },
  
  // Should be SINGLE (20-39)
  { phrase: 'Content Creation Business Model', expected: 'SINGLE' },
  { phrase: 'Content Creation Editing Course', expected: 'SINGLE' }, // "editing" not in Top 10, only "course" matches
  
  // Should be NO_MATCH (0)
  { phrase: 'Content Creation Strategy Planning', expected: null },
  { phrase: 'Content Creation Marketing Plan', expected: null },
];

console.log('='.repeat(60));
console.log('LTV IMPLEMENTATION TEST');
console.log('='.repeat(60));
console.log();

// Step 1: Extract anchors
console.log('Step 1: Extract LTV Anchors from Top 10');
console.log('-'.repeat(40));
const anchors = extractLTVAnchors(top10Phrases, seedPhrase);

console.log(`Single anchors: ${anchors.singleAnchors.size}`);
[...anchors.singleAnchors.entries()].forEach(([word, freq]) => {
  console.log(`  "${word}" (freq: ${freq})`);
});

console.log(`\nBigram anchors: ${anchors.bigramAnchors.size}`);
[...anchors.bigramAnchors.entries()]
  .filter(([b, _]) => !b.split(' ').every(w => anchors.seedWords.has(w)))
  .slice(0, 10)
  .forEach(([bigram, freq]) => {
    console.log(`  "${bigram}" (freq: ${freq})`);
  });

console.log(`\nFull anchors: ${anchors.fullAnchors.size}`);
[...anchors.fullAnchors.entries()].forEach(([anchor, source]) => {
  console.log(`  "${anchor}" <- "${source}"`);
});

// Step 2: Test LTV calculation
console.log('\n');
console.log('Step 2: Test LTV Calculation');
console.log('-'.repeat(40));

let passed = 0;
let failed = 0;

testPhrases.forEach(({ phrase, expected }) => {
  const result = calculateLTV(phrase, anchors);
  const strategyMatch = result.strategy === expected;
  
  if (strategyMatch) {
    passed++;
    console.log(`✅ "${phrase}"`);
    console.log(`   LTV=${result.score}, Strategy=${result.strategy || 'NO_MATCH'}, Match="${result.match || 'none'}"`);
  } else {
    failed++;
    console.log(`❌ "${phrase}"`);
    console.log(`   Expected: ${expected || 'NO_MATCH'}, Got: ${result.strategy || 'NO_MATCH'}`);
    console.log(`   LTV=${result.score}, Match="${result.match || 'none'}"`);
  }
});

// Step 3: Test boost and badge functions
console.log('\n');
console.log('Step 3: Test Boost and Badge Functions');
console.log('-'.repeat(40));

const boostTests = [
  { score: 0, expectedBoost: 0, expectedBadge: false },
  { score: 15, expectedBoost: 0, expectedBadge: false },
  { score: 20, expectedBoost: 3, expectedBadge: false },
  { score: 29, expectedBoost: 3, expectedBadge: false },
  { score: 30, expectedBoost: 5, expectedBadge: false },
  { score: 39, expectedBoost: 5, expectedBadge: false },
  { score: 40, expectedBoost: 8, expectedBadge: false },
  { score: 49, expectedBoost: 8, expectedBadge: false },
  { score: 50, expectedBoost: 10, expectedBadge: true },
  { score: 75, expectedBoost: 10, expectedBadge: true },
  { score: 95, expectedBoost: 10, expectedBadge: true },
];

boostTests.forEach(({ score, expectedBoost, expectedBadge }) => {
  const boost = getLTVBoost(score);
  const badge = shouldShowLTVBadge(score);
  
  if (boost === expectedBoost && badge === expectedBadge) {
    passed++;
    console.log(`✅ LTV=${score}: boost=${boost}, badge=${badge}`);
  } else {
    failed++;
    console.log(`❌ LTV=${score}: expected boost=${expectedBoost}/badge=${expectedBadge}, got boost=${boost}/badge=${badge}`);
  }
});

// Step 4: Test full score calculation
console.log('\n');
console.log('Step 4: Test Full Score Calculation');
console.log('-'.repeat(40));

// Create a minimal intake stats for testing
const mockPhrases = [
  'Content Creation Tips',
  'Content Creation For Beginners',
  'Content Creation Ideas',
  'Content Creation Tips For Beginners Tutorial',
];
const stats = runDataIntake(mockPhrases, seedPhrase);

const fullScoreTest = 'Content Creation Tips For Beginners Tutorial';
const fullScores = calculateAllScores(fullScoreTest, seedPhrase, stats, anchors);

console.log(`Test phrase: "${fullScoreTest}"`);
console.log(`  Popularity (base): ${fullScores.popularityBase}`);
console.log(`  LTV Score: ${fullScores.ltvScore}`);
console.log(`  LTV Boost: +${fullScores.ltvBoost}`);
console.log(`  Popularity (final): ${fullScores.popularity} (base ${fullScores.popularityBase} + boost ${fullScores.ltvBoost})`);
console.log(`  Competition: ${fullScores.competition}`);
console.log(`  Spread: ${fullScores.spread}`);
console.log(`  Badge Eligible: ${fullScores.ltvBadgeEligible}`);
console.log(`  Strategy: ${fullScores.ltvStrategy}`);
console.log(`  Match: "${fullScores.ltvMatch}"`);

// Summary
console.log('\n');
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
console.log();

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
