import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIntake() {
  // Find YouTube Algorithm session
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, intake_stats')
    .ilike('name', '%youtube%algorithm%')
    .limit(1);
  
  if (!sessions?.length) {
    console.log('No YouTube Algorithm session found');
    return;
  }
  
  const session = sessions[0];
  console.log('Session:', session.name);
  console.log('Has intake_stats:', !!session.intake_stats);
  console.log('');
  
  if (session.intake_stats?.top9Demand) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('TOP 9 DEMAND DATA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Phrases:', JSON.stringify(session.intake_stats.top9Demand.phrases, null, 2));
    console.log('');
    console.log('Anchor Bonuses:', JSON.stringify(session.intake_stats.top9Demand.anchorBonuses, null, 2));
  } else {
    console.log('NO top9Demand in intake_stats!');
    console.log('intake_stats keys:', Object.keys(session.intake_stats || {}));
    console.log('');
    console.log('Full intake_stats:', JSON.stringify(session.intake_stats, null, 2).slice(0, 1000));
  }
}

checkIntake().catch(console.error);
