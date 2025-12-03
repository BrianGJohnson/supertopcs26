import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bnnxevktccmqfdpsptkq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubnhldmt0Y2NtcWZkcHNwdGtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYzOTY1OCwiZXhwIjoyMDc5MjE1NjU4fQ.jUwaCIxkRPkp-AvybeJKsnv51SyB0mPI39bMDOCPWgo'
);

async function main() {
  const sessionId = '531728e1-19a0-444e-abe2-1a40860c502c';
  
  // Get all seeds with their analysis scores
  const { data: seeds, error } = await supabase
    .from('seeds')
    .select('phrase, seed_analysis(audience_fit)')
    .eq('session_id', sessionId)
    .order('phrase');
  
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  if (!seeds || seeds.length === 0) {
    console.log('No seeds found');
    return;
  }
  
  // Build distribution
  const dist = { 
    '90-100': [], 
    '80-89': [], 
    '70-79': [], 
    '60-69': [], 
    '50-59': [], 
    '40-49': [], 
    '30-39': [], 
    '20-29': [], 
    '10-19': [], 
    '0-9': [], 
    'null': [] 
  };
  
  seeds.forEach(s => {
    const analysis = s.seed_analysis;
    const score = Array.isArray(analysis) && analysis.length > 0 ? analysis[0].audience_fit : null;
    const phrase = s.phrase;
    
    if (score === null || score === undefined) dist['null'].push(phrase);
    else if (score >= 90) dist['90-100'].push({ phrase, score });
    else if (score >= 80) dist['80-89'].push({ phrase, score });
    else if (score >= 70) dist['70-79'].push({ phrase, score });
    else if (score >= 60) dist['60-69'].push({ phrase, score });
    else if (score >= 50) dist['50-59'].push({ phrase, score });
    else if (score >= 40) dist['40-49'].push({ phrase, score });
    else if (score >= 30) dist['30-39'].push({ phrase, score });
    else if (score >= 20) dist['20-29'].push({ phrase, score });
    else if (score >= 10) dist['10-19'].push({ phrase, score });
    else dist['0-9'].push({ phrase, score });
  });
  
  const scored = seeds.length - dist['null'].length;
  
  console.log('=== AUDIENCE FIT SCORE DISTRIBUTION ===');
  console.log('Total scored:', scored, '/', seeds.length);
  console.log('');
  
  ['90-100', '80-89', '70-79', '60-69', '50-59', '40-49', '30-39', '20-29', '10-19', '0-9'].forEach(range => {
    const count = dist[range].length;
    const pct = scored > 0 ? ((count / scored) * 100).toFixed(1) : 0;
    console.log(range + ': ' + count + ' (' + pct + '%)');
  });
  
  console.log('');
  console.log('=== TOP 90+ SCORES ===');
  dist['90-100'].sort((a,b) => b.score - a.score).slice(0, 20).forEach(item => {
    console.log('  [' + item.score + '] ' + item.phrase);
  });
  
  console.log('');
  console.log('=== SAMPLE 80-89 ===');
  dist['80-89'].slice(0, 12).forEach(item => {
    console.log('  [' + item.score + '] ' + item.phrase);
  });
  
  console.log('');
  console.log('=== SAMPLE 60-79 ===');
  [...dist['70-79'], ...dist['60-69']].slice(0, 12).forEach(item => {
    console.log('  [' + item.score + '] ' + item.phrase);
  });
  
  console.log('');
  console.log('=== LOW SCORES (under 50) ===');
  [...dist['40-49'], ...dist['30-39'], ...dist['20-29'], ...dist['10-19'], ...dist['0-9']].slice(0, 15).forEach(item => {
    console.log('  [' + item.score + '] ' + item.phrase);
  });
  
  // Look for shorts-related phrases (only scored)
  console.log('');
  console.log('=== SHORTS-RELATED PHRASES (SCORED) ===');
  seeds.forEach(s => {
    const analysis = s.seed_analysis;
    const score = Array.isArray(analysis) && analysis.length > 0 ? analysis[0].audience_fit : null;
    if (score !== null && s.phrase.toLowerCase().includes('short')) {
      console.log('  [' + score + '] ' + s.phrase);
    }
  });
  
  // Look for algorithm-related phrases  
  console.log('');
  console.log('=== ALGORITHM-RELATED PHRASES (TOP 20 SCORED) ===');
  const algoScored = seeds.filter(s => {
    const analysis = s.seed_analysis;
    const score = Array.isArray(analysis) && analysis.length > 0 ? analysis[0].audience_fit : null;
    return score !== null && s.phrase.toLowerCase().includes('algorithm');
  }).map(s => ({
    phrase: s.phrase,
    score: s.seed_analysis[0].audience_fit
  })).sort((a,b) => b.score - a.score);
  
  algoScored.slice(0, 20).forEach(item => {
    console.log('  [' + item.score + '] ' + item.phrase);
  });
}

main();
