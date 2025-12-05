import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const sessionId = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';
  
  // First get seeds for this session
  const { data: seeds, error: seedsError } = await supabase
    .from('seeds')
    .select('id')
    .eq('session_id', sessionId);
  
  if (seedsError) {
    console.error('Error fetching seeds:', seedsError.message);
    return;
  }
  
  console.log('Seeds found:', seeds?.length || 0);
  
  if (seeds && seeds.length > 0) {
    const seedIds = seeds.map(s => s.id);
    
    // Clear the new 'demand' columns (Apify-based scoring)
    const { data, error } = await supabase
      .from('seed_analysis')
      .update({ demand: null, demand_base: null })
      .in('seed_id', seedIds)
      .select('seed_id');
    
    if (error) {
      console.error('Error clearing scores:', error.message);
    } else {
      console.log('Cleared demand scores for', data?.length || 0, 'seed_analysis records');
    }
  }
}

main();
