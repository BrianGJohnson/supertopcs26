import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Find sessions with "content creation" seed
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, created_at, intake_stats')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError);
    return;
  }

  console.log('Recent Sessions:');
  console.log('='.repeat(60));

  for (const session of sessions) {
    // Get seed count for this session
    const { count: totalCount } = await supabase
      .from('seeds')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id);

    // Get visible (non-hidden) count
    const { count: visibleCount } = await supabase
      .from('seeds')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', session.id)
      .eq('hidden', false);

    // Get the seed phrase
    const { data: seedPhrase } = await supabase
      .from('seeds')
      .select('phrase')
      .eq('session_id', session.id)
      .eq('source', 'seed')
      .single();

    const seedText = seedPhrase?.phrase || 'Unknown';
    const intakeTotal = session.intake_stats?.totalPhrases || 'N/A';

    console.log(`\nSession: ${session.id}`);
    console.log(`  Seed: "${seedText}"`);
    console.log(`  Created: ${session.created_at}`);
    console.log(`  Total phrases in DB: ${totalCount}`);
    console.log(`  Visible (not hidden): ${visibleCount}`);
    console.log(`  intake_stats.totalPhrases: ${intakeTotal}`);
  }
}

main().catch(console.error);
