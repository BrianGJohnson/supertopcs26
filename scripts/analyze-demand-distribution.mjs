import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
  const sessionId = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';
  
  // Fetch all analysis records with demand (new Apify-based column)
  const { data: analysis, error: e2 } = await supabase
    .from('seed_analysis')
    .select('seed_id, demand, demand_base, seeds!inner(phrase, session_id)')
    .eq('seeds.session_id', sessionId)
    .not('demand', 'is', null);
  
  if (e2) { console.log('Analysis error:', e2); return; }
  if (!analysis || analysis.length === 0) { console.log('No scores found'); return; }
  
  console.log('Total scored:', analysis.length);
  
  const scores = analysis.map(a => a.demand);
  
  // Distribution
  const ranges = ['100', '90-99', '80-89', '70-79', '60-69', '50-59', '40-49', '30-39', '20-29', '10-19', '0-9'];
  const dist = Object.fromEntries(ranges.map(r => [r, 0]));
  
  scores.forEach(s => {
    if (s === 100) dist['100']++;
    else if (s >= 90) dist['90-99']++;
    else if (s >= 80) dist['80-89']++;
    else if (s >= 70) dist['70-79']++;
    else if (s >= 60) dist['60-69']++;
    else if (s >= 50) dist['50-59']++;
    else if (s >= 40) dist['40-49']++;
    else if (s >= 30) dist['30-39']++;
    else if (s >= 20) dist['20-29']++;
    else if (s >= 10) dist['10-19']++;
    else dist['0-9']++;
  });
  
  console.log('\nDistribution:');
  ranges.forEach(range => {
    const count = dist[range];
    const pct = ((count / analysis.length) * 100).toFixed(1);
    const bar = '#'.repeat(Math.ceil(count / 1));
    console.log(`${range.padStart(6)}: ${String(count).padStart(3)} (${pct.padStart(5)}%) ${bar}`);
  });
  
  console.log('\nStats:');
  console.log('Min:', Math.min(...scores));
  console.log('Max:', Math.max(...scores));
  console.log('Avg:', Math.round(scores.reduce((a,b) => a+b, 0) / scores.length));
  const sorted = [...scores].sort((a,b) => a-b);
  console.log('Median:', sorted[Math.floor(sorted.length/2)]);
  
  // Show 100s with their base scores
  const hundreds = analysis.filter(a => a.demand === 100);
  console.log('\n=== Phrases at 100 (' + hundreds.length + ') ===');
  hundreds.forEach(h => {
    console.log(`  Base=${h.demand_base} -> "${h.seeds?.phrase}"`);
  });
  
  // Show 90s 
  const nineties = analysis.filter(a => a.demand >= 90 && a.demand < 100);
  console.log('\n=== Sample 90s (' + nineties.length + ') ===');
  nineties.slice(0, 8).forEach(h => {
    console.log(`  ${h.demand} (base=${h.demand_base}) -> "${h.seeds?.phrase}"`);
  });
  
  // Show some lows
  const lows = analysis.filter(a => a.demand < 40);
  console.log('\n=== Sample Lows <40 (' + lows.length + ') ===');
  lows.slice(0, 5).forEach(h => {
    console.log(`  ${h.demand} (base=${h.demand_base}) -> "${h.seeds?.phrase}"`);
  });
}

analyze();
