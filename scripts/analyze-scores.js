const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
  // Get session
  const { data: session } = await supabase
    .from('sessions')
    .select('id, seed_phrase')
    .ilike('seed_phrase', '%youtube algorithm%')
    .single();
  
  if (!session) { 
    console.log('No session found'); 
    return; 
  }
  console.log('Session:', session.seed_phrase);
  console.log('');
  
  // Get seeds
  const { data: seeds } = await supabase
    .from('seeds')
    .select('id, phrase')
    .eq('session_id', session.id);
  
  const seedIds = seeds.map(s => s.id);
  
  // Get analysis for these seeds (scores are in seed_analysis table)
  const { data: analysis } = await supabase
    .from('seed_analysis')
    .select('seed_id, topic_strength')
    .in('seed_id', seedIds)
    .not('topic_strength', 'is', null);
  
  if (!analysis || analysis.length === 0) {
    console.log('No scores found in seed_analysis');
    return;
  }
  
  // Merge seeds with scores
  const seedMap = new Map(seeds.map(s => [s.id, s.phrase]));
  const scored = analysis.map(a => ({
    phrase: seedMap.get(a.seed_id),
    score: a.topic_strength
  })).sort((a, b) => b.score - a.score);
  
  console.log('=== SCORE DISTRIBUTION ===');
  console.log('');
  
  const decades = { 
    '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, 
    '50-59': 0, '40-49': 0, '30-39': 0, '20-29': 0, 
    '10-19': 0, '0-9': 0 
  };
  
  scored.forEach(s => {
    const score = s.score;
    if (score >= 90) decades['90-100']++;
    else if (score >= 80) decades['80-89']++;
    else if (score >= 70) decades['70-79']++;
    else if (score >= 60) decades['60-69']++;
    else if (score >= 50) decades['50-59']++;
    else if (score >= 40) decades['40-49']++;
    else if (score >= 30) decades['30-39']++;
    else if (score >= 20) decades['20-29']++;
    else if (score >= 10) decades['10-19']++;
    else decades['0-9']++;
  });
  
  const total = scored.length;
  console.log('Range      | Count | Percent | Bar');
  console.log('-----------|-------|---------|------------------------------');
  
  Object.entries(decades).forEach(([range, count]) => {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '#'.repeat(Math.round(count / total * 40));
    console.log(range.padEnd(10) + ' | ' + String(count).padStart(5) + ' | ' + pct.padStart(6) + '% | ' + bar);
  });
  
  console.log('');
  console.log('=== QUESTION vs STATEMENT ANALYSIS ===');
  console.log('');
  
  function isQuestion(p) {
    if (!p) return false;
    if (p.includes('?')) return true;
    const questionStarts = /^(how|what|why|when|where|who|can|do|does|is|are|will|should)/i;
    return questionStarts.test(p);
  }
  
  const questions = scored.filter(s => isQuestion(s.phrase));
  const statements = scored.filter(s => !isQuestion(s.phrase));
  
  const avgQ = questions.length ? (questions.reduce((sum, s) => sum + s.score, 0) / questions.length).toFixed(1) : 'N/A';
  const avgS = statements.length ? (statements.reduce((sum, s) => sum + s.score, 0) / statements.length).toFixed(1) : 'N/A';
  
  console.log('Questions:  ' + questions.length + ' phrases, avg score: ' + avgQ);
  console.log('Statements: ' + statements.length + ' phrases, avg score: ' + avgS);
  if (questions.length && statements.length) {
    const diff = (avgQ - avgS).toFixed(1);
    console.log('Difference: ' + diff + ' points (questions score ' + (diff > 0 ? 'HIGHER' : 'lower') + ')');
  }
  
  console.log('');
  console.log('=== TOP 20 HIGHEST SCORES ===');
  console.log('');
  scored.slice(0, 20).forEach((s, i) => {
    const tag = isQuestion(s.phrase) ? 'Q' : 'S';
    console.log(String(i+1).padStart(2) + '. [' + s.score + '] ' + tag + ' - ' + s.phrase);
  });
  
  console.log('');
  console.log('=== BOTTOM 15 LOWEST SCORES ===');
  console.log('');
  scored.slice(-15).reverse().forEach((s, i) => {
    const tag = isQuestion(s.phrase) ? 'Q' : 'S';
    console.log(String(i+1).padStart(2) + '. [' + s.score + '] ' + tag + ' - ' + s.phrase);
  });
  
  // Statistics
  const scores = scored.map(s => s.score);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - parseFloat(avg), 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance).toFixed(1);
  
  console.log('');
  console.log('=== STATISTICS ===');
  console.log('');
  console.log('Total scored:', total);
  console.log('Min:', Math.min(...scores), ', Max:', Math.max(...scores));
  console.log('Average:', avg);
  console.log('Median:', median);
  console.log('Std Dev:', stdDev);
  
  // Question dominance in top scores
  console.log('');
  console.log('=== QUESTION DOMINANCE IN TOP SCORES ===');
  console.log('');
  const top10 = scored.slice(0, 10);
  const top20 = scored.slice(0, 20);
  const top50 = scored.slice(0, Math.min(50, scored.length));
  const questionsInTop10 = top10.filter(s => isQuestion(s.phrase)).length;
  const questionsInTop20 = top20.filter(s => isQuestion(s.phrase)).length;
  const questionsInTop50 = top50.filter(s => isQuestion(s.phrase)).length;
  
  console.log('Top 10: ' + questionsInTop10 + '/10 are questions (' + (questionsInTop10/10*100).toFixed(0) + '%)');
  console.log('Top 20: ' + questionsInTop20 + '/20 are questions (' + (questionsInTop20/20*100).toFixed(0) + '%)');
  console.log('Top 50: ' + questionsInTop50 + '/' + top50.length + ' are questions (' + (questionsInTop50/top50.length*100).toFixed(0) + '%)');
  console.log('Overall: ' + questions.length + '/' + total + ' are questions (' + (questions.length/total*100).toFixed(0) + '%)');
}

analyze();
