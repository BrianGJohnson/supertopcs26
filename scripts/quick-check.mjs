import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await s.from('seed_analysis').select('demand, is_hidden').not('demand','is',null).limit(200);
const visible = data.filter(d => d.is_hidden === false || d.is_hidden === null);

console.log('Visible phrases with demand:', visible.length);
console.log('');

const dist = {};
for (let i = 0; i <= 90; i += 10) dist[i] = 0;
visible.forEach(v => { dist[Math.floor(v.demand / 10) * 10]++; });

console.log('DISTRIBUTION:');
for (let i = 90; i >= 0; i -= 10) {
  const pct = ((dist[i] / visible.length) * 100).toFixed(0);
  console.log(`${i}-${i+9}: ${dist[i]} (${pct}%)`);
}
