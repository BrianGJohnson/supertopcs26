const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: seeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method')
    .eq('session_id', '1a95a83e-a87a-46f5-85d9-a0e42b2de978');
  
  const top10Anchors = ['tips', 'ideas', 'beginners', '2025', 'full', 'course', 'equipment', 'business', 'ai'];
  
  // Find A-Z phrases that DON'T match any anchor
  const az = seeds.filter(s => s.generation_method === 'az');
  const noMatch = az.filter(s => {
    const lower = s.phrase.toLowerCase();
    return !top10Anchors.some(a => lower.includes(a));
  });
  
  console.log('=== A-Z PHRASES WITH NO TOP 10 ANCHOR MATCH ===');
  console.log('Total A-Z:', az.length);
  console.log('No match:', noMatch.length, '(' + ((noMatch.length/az.length)*100).toFixed(0) + '%)');
  console.log('\nSample (first 40):');
  noMatch.slice(0, 40).forEach(s => console.log('  ' + s.phrase));
  
  // What words DO appear in these unmatched phrases?
  const wordFreq = new Map();
  noMatch.forEach(s => {
    const words = s.phrase.toLowerCase().split(/\s+/).filter(w => 
      !['content', 'creation', 'creator', 'the', 'a', 'an', 'to', 'for', 'in', 'on', 'of', 'and', 'or', 'vs', 'is', 'how', 'what'].includes(w) &&
      w.length > 2
    );
    words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
  });
  
  console.log('\n=== COMMON WORDS IN UNMATCHED A-Z PHRASES ===');
  [...wordFreq.entries()].sort((a,b) => b[1] - a[1]).slice(0, 20).forEach(([w, c]) => {
    console.log('  ' + w + ': ' + c);
  });
}
main();
