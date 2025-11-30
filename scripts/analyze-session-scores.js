const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
  // Find the YouTube Algorithm session
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name')
    .ilike('name', '%youtube algorithm%')
    .limit(1);
  
  if (!sessions || sessions.length === 0) {
    console.log('No YouTube Algorithm session found');
    return;
  }
  
  const session = sessions[0];
  console.log('Session:', session.name, '(', session.id, ')');
  console.log('');
  
  // Get all scored phrases
  const { data: seeds } = await supabase
    .from('seeds')
    .select('id, phrase, seed_analysis(topic_strength)')
    .eq('session_id', session.id)
    .order('phrase');
  
  const scored = seeds.filter(s => s.seed_analysis && s.seed_analysis.topic_strength != null);
  const scores = scored.map(s => ({ 
    phrase: s.phrase, 
    score: s.seed_analysis.topic_strength 
  }));
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DISTRIBUTION ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const ranges = [
    { min: 90, max: 98, label: '90-98' },
    { min: 80, max: 89, label: '80-89' },
    { min: 70, max: 79, label: '70-79' },
    { min: 60, max: 69, label: '60-69' },
    { min: 50, max: 59, label: '50-59' },
    { min: 40, max: 49, label: '40-49' },
    { min: 30, max: 39, label: '30-39' },
    { min: 20, max: 29, label: '20-29' },
    { min: 0, max: 19, label: '0-19' }
  ];
  
  for (const range of ranges) {
    const inRange = scores.filter(s => s.score >= range.min && s.score <= range.max);
    const pct = ((inRange.length / scores.length) * 100).toFixed(1);
    console.log(`${range.label}: ${inRange.length} phrases (${pct}%)`);
  }
  
  console.log('');
  console.log('Total scored:', scores.length);
  console.log('Average:', (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1));
  console.log('Median:', scores[Math.floor(scores.length / 2)].score);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TOP 30 PHRASES (highest scores)');
  console.log('═══════════════════════════════════════════════════════════════');
  scores.slice(0, 30).forEach((s, i) => console.log(`${s.score} | ${s.phrase}`));
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('80-89 RANGE (Strong phrases)');
  console.log('═══════════════════════════════════════════════════════════════');
  const strong = scores.filter(s => s.score >= 80 && s.score < 90).slice(0, 25);
  strong.forEach(s => console.log(`${s.score} | ${s.phrase}`));
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('QUESTIONS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════════');
  const questions = scores.filter(s => 
    s.phrase.toLowerCase().startsWith('how ') ||
    s.phrase.toLowerCase().startsWith('why ') ||
    s.phrase.toLowerCase().startsWith('what ') ||
    s.phrase.toLowerCase().startsWith('when ') ||
    s.phrase.toLowerCase().startsWith('who ') ||
    s.phrase.toLowerCase().startsWith('is ') ||
    s.phrase.toLowerCase().startsWith('does ') ||
    s.phrase.toLowerCase().startsWith('can ') ||
    s.phrase.toLowerCase().startsWith('do ')
  );
  const nonQuestions = scores.filter(s => !questions.includes(s));
  
  console.log(`Questions: ${questions.length} (${((questions.length/scores.length)*100).toFixed(1)}%)`);
  console.log(`Non-Questions: ${nonQuestions.length} (${((nonQuestions.length/scores.length)*100).toFixed(1)}%)`);
  console.log('');
  console.log('Avg Question Score:', (questions.reduce((a, b) => a + b.score, 0) / questions.length).toFixed(1));
  console.log('Avg Non-Question Score:', (nonQuestions.reduce((a, b) => a + b.score, 0) / nonQuestions.length).toFixed(1));
  console.log('');
  console.log('Top 15 Questions:');
  questions.slice(0, 15).forEach(s => console.log(`  ${s.score} | ${s.phrase}`));
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('EMOTIONAL PHRASES');
  console.log('═══════════════════════════════════════════════════════════════');
  const emotionalWords = ['sucks', 'trash', 'broken', 'hate', 'worst', 'terrible', 'awful', 'dead', 'dying', 'ruined', 'destroyed', 'killing', 'failing', 'scam', 'lie', 'fake', 'annoying', 'useless', 'garbage', 'bad', 'horrible', 'stupid', 'dumb', 'ridiculous', 'pathetic', 'love', 'amazing', 'insane', 'incredible', 'best', 'secret', 'hack', 'perfect', 'ultimate'];
  const emotional = scores.filter(s => emotionalWords.some(w => s.phrase.toLowerCase().includes(w)));
  console.log(`Emotional phrases: ${emotional.length}`);
  if (emotional.length > 0) {
    console.log('Avg Emotional Score:', (emotional.reduce((a, b) => a + b.score, 0) / emotional.length).toFixed(1));
    console.log('');
    emotional.sort((a, b) => b.score - a.score);
    emotional.slice(0, 20).forEach(s => console.log(`  ${s.score} | ${s.phrase}`));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('5-6 WORD NON-QUESTION PHRASES');
  console.log('═══════════════════════════════════════════════════════════════');
  const fiveSix = nonQuestions.filter(s => {
    const words = s.phrase.split(' ').length;
    return words >= 5 && words <= 6;
  });
  console.log(`5-6 word non-question phrases: ${fiveSix.length}`);
  if (fiveSix.length > 0) {
    console.log('Avg Score:', (fiveSix.reduce((a, b) => a + b.score, 0) / fiveSix.length).toFixed(1));
    console.log('');
    fiveSix.slice(0, 20).forEach(s => console.log(`  ${s.score} | ${s.phrase}`));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DISCOVERY/INSIGHT PHRASES');
  console.log('═══════════════════════════════════════════════════════════════');
  const discoveryWords = ['favor', 'prefer', 'prioritize', 'reward', 'decide', 'determine', 'rank', 'choose', 'push', 'boost', 'recommend', 'show', 'promote', 'suppress', 'hide', 'work', 'change'];
  const discovery = scores.filter(s => discoveryWords.some(w => s.phrase.toLowerCase().includes(w)));
  console.log(`Discovery phrases: ${discovery.length}`);
  if (discovery.length > 0) {
    console.log('Avg Discovery Score:', (discovery.reduce((a, b) => a + b.score, 0) / discovery.length).toFixed(1));
    console.log('');
    discovery.sort((a, b) => b.score - a.score);
    discovery.slice(0, 20).forEach(s => console.log(`  ${s.score} | ${s.phrase}`));
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('70-79 RANGE (Good phrases)');
  console.log('═══════════════════════════════════════════════════════════════');
  const good = scores.filter(s => s.score >= 70 && s.score < 80).slice(0, 25);
  good.forEach(s => console.log(`${s.score} | ${s.phrase}`));
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('60-69 RANGE (Average phrases)');
  console.log('═══════════════════════════════════════════════════════════════');
  const average = scores.filter(s => s.score >= 60 && s.score < 70).slice(0, 25);
  average.forEach(s => console.log(`${s.score} | ${s.phrase}`));
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('BOTTOM 25 (Lowest scores)');
  console.log('═══════════════════════════════════════════════════════════════');
  scores.slice(-25).reverse().forEach(s => console.log(`${s.score} | ${s.phrase}`));
}

analyze().catch(console.error);
