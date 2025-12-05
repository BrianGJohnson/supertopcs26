import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SESSION_ID = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';

async function analyze() {
  // Get all seeds for this session
  const { data: seeds, error: seedErr } = await supabase
    .from('seeds')
    .select('id, phrase')
    .eq('session_id', SESSION_ID);
  
  if (seedErr || !seeds) {
    console.log('Error fetching seeds:', seedErr);
    return;
  }
  
  const seedIds = seeds.map(s => s.id);
  
  // Get all analyses
  const { data: analyses, error: analysisErr } = await supabase
    .from('seed_analysis')
    .select('seed_id, demand, is_hidden, created_at')
    .in('seed_id', seedIds);
    
  if (analysisErr) {
    console.log('Error fetching analyses:', analysisErr);
    return;
  }
  
  const analysisMap = new Map((analyses || []).map(a => [a.seed_id, a]));
  
  // Count status
  let visible = 0, hidden = 0, withDemand = 0, visibleWithDemand = 0;
  const visiblePhrases = [];
  
  for (const seed of seeds) {
    const a = analysisMap.get(seed.id);
    const isHidden = a && a.is_hidden;
    const hasDemand = a && a.demand != null;
    
    if (isHidden) {
      hidden++;
    } else {
      visible++;
      if (hasDemand) {
        visibleWithDemand++;
        visiblePhrases.push({ phrase: seed.phrase, demand: a.demand });
      }
    }
    if (hasDemand) withDemand++;
  }
  
  console.log('\n=== SESSION STATUS ===');
  console.log('Total phrases:', seeds.length);
  console.log('Visible (not hidden):', visible);
  console.log('Hidden:', hidden);
  console.log('With demand score:', withDemand);
  console.log('Visible WITH demand:', visibleWithDemand);
  
  if (visibleWithDemand === 0) {
    console.log('\nNo visible phrases have demand scores yet.');
    return;
  }
  
  // Filter to just visible with demand
  const scoredVisible = analyses.filter(a => {
    const isHidden = a.is_hidden;
    return !isHidden && a.demand != null;
  });
  
  if (scoredVisible.length === 0) {
    console.log('\nNo visible phrases with demand scores.');
    return;
  }
  
  // Timing - use created_at since we have it
  const times = scoredVisible.map(a => new Date(a.created_at).getTime());
  const earliest = new Date(Math.min(...times));
  const latest = new Date(Math.max(...times));
  const duration = (latest - earliest) / 1000 / 60;
  
  console.log('\n=== TIMING (for visible phrases only) ===');
  console.log('Started:', earliest.toLocaleTimeString());
  console.log('Finished:', latest.toLocaleTimeString());
  console.log('Duration:', duration.toFixed(1), 'minutes');
  
  // Distribution by 10s (visible only)
  const dist = {};
  for (let i = 0; i <= 90; i += 10) dist[i] = 0;
  
  for (const a of scoredVisible) {
    const bucket = Math.floor(a.demand / 10) * 10;
    dist[bucket] = (dist[bucket] || 0) + 1;
  }
  
  console.log('\n=== SCORE DISTRIBUTION (visible phrases only) ===');
  for (let i = 90; i >= 0; i -= 10) {
    const count = dist[i] || 0;
    const pct = ((count / scoredVisible.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 3));
    console.log(`${i}-${i+9}:`.padEnd(7), String(count).padStart(4), `(${pct}%)`.padStart(8), bar);
  }
  
  // Top scores
  visiblePhrases.sort((a, b) => b.demand - a.demand);
  console.log('\n=== TOP 10 VISIBLE ===');
  for (let i = 0; i < Math.min(10, visiblePhrases.length); i++) {
    console.log(`${visiblePhrases[i].demand}: ${visiblePhrases[i].phrase}`);
  }
  
  // Bottom 5
  console.log('\n=== BOTTOM 5 VISIBLE ===');
  for (let i = visiblePhrases.length - 1; i >= Math.max(0, visiblePhrases.length - 5); i--) {
    console.log(`${visiblePhrases[i].demand}: ${visiblePhrases[i].phrase}`);
  }
}

analyze().catch(console.error);