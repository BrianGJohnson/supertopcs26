import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  // Get one seed to see its columns
  const { data: seed, error } = await supabase
    .from('seeds')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Seeds table columns:');
  console.log(Object.keys(seed));
  console.log('\nSample seed:');
  console.log(JSON.stringify(seed, null, 2));
}

checkSchema().catch(console.error);
