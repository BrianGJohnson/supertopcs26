import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Get the YouTube Algorithm session
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, seed_phrase')
    .ilike('name', '%youtube%algorithm%')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (!sessions || sessions.length === 0) {
    console.log('No session found');
    return;
  }
  
  const session = sessions[0];
  console.log('Session:', session.name);
  console.log('Seed phrase:', session.seed_phrase);
  console.log('');
  
  // Check for seed in seeds table
  const { data: seeds } = await supabase
    .from('seeds')
    .select('id, phrase, generation_method')
    .eq('session_id', session.id)
    .eq('generation_method', 'seed');
  
  console.log('Seeds with generation_method=seed:');
  if (seeds && seeds.length > 0) {
    seeds.forEach(s => console.log('  -', s.phrase));
  } else {
    console.log('  NONE FOUND!');
  }
  
  // Also check what phrases exist
  const { data: allSeeds } = await supabase
    .from('seeds')
    .select('phrase, generation_method')
    .eq('session_id', session.id)
    .limit(10);
  
  console.log('');
  console.log('First 10 phrases in session:');
  allSeeds?.forEach(s => console.log('  -', s.phrase, '(' + s.generation_method + ')'));
}

check();
