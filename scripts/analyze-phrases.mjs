import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SESSION_ID = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';

async function analyze() {
  // Get seeds with analysis
  const { data: seeds, error: e1 } = await s.from('seeds').select('id, phrase').eq('session_id', SESSION_ID);
  if (e1 || !seeds) { console.log('Error:', e1); return; }
  
  const seedIds = seeds.map(x => x.id);
  
  // Batch the query to avoid header overflow
  let analyses = [];
  for (let i = 0; i < seedIds.length; i += 100) {
    const batch = seedIds.slice(i, i + 100);
    const { data } = await s.from('seed_analysis').select('seed_id, demand, is_hidden, extra').in('seed_id', batch);
    if (data) analyses.push(...data);
  }
  
  const phraseMap = new Map(seeds.map(x => [x.id, x.phrase]));
  
  // Get visible phrases with demand
  const visible = analyses.filter(a => !a.is_hidden && a.demand != null);
  
  console.log('=== ALL VISIBLE PHRASES WITH DEMAND ===\n');
  
  // Sort by demand descending
  visible.sort((a, b) => b.demand - a.demand);
  
  for (const v of visible) {
    const phrase = phraseMap.get(v.seed_id);
    const extra = v.extra?.demand_v2 || {};
    const sugg = extra.suggestionCount ?? '?';
    console.log(`${String(v.demand).padStart(2)} | sugg:${String(sugg).padStart(2)} | ${phrase}`);
  }
  
  // Look for patterns
  console.log('\n=== ANCHOR ANALYSIS ===\n');
  
  const anchors = {};
  for (const v of visible) {
    const phrase = phraseMap.get(v.seed_id).toLowerCase();
    const words = phrase.split(/\s+/);
    for (const word of words) {
      if (word.length >= 3 && !['the','and','for','how','with','your','what','this','that','content','creation'].includes(word)) {
        if (!anchors[word]) anchors[word] = { count: 0, scores: [], phrases: [] };
        anchors[word].count++;
        anchors[word].scores.push(v.demand);
        anchors[word].phrases.push(phraseMap.get(v.seed_id));
      }
    }
  }
  
  // Sort by frequency
  const sorted = Object.entries(anchors).sort((a, b) => b[1].count - a[1].count).slice(0, 15);
  
  for (const [word, data] of sorted) {
    const avg = (data.scores.reduce((a,b) => a+b, 0) / data.scores.length).toFixed(0);
    const min = Math.min(...data.scores);
    const max = Math.max(...data.scores);
    console.log(`"${word}" appears ${data.count}x | avg:${avg} | range:${min}-${max}`);
  }
  
  // Phrases with 0 suggestions
  console.log('\n=== PHRASES WITH 0 SUGGESTIONS ===\n');
  const zeroSugg = visible.filter(v => (v.extra?.demand_v2?.suggestionCount ?? 0) === 0);
  for (const v of zeroSugg.slice(0, 10)) {
    console.log(`${v.demand}: ${phraseMap.get(v.seed_id)}`);
  }
  console.log(`Total with 0 suggestions: ${zeroSugg.length} of ${visible.length}`);
}

analyze().catch(console.error);
