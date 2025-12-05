import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SESSION_ID = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';

async function checkCurrentDemand() {
  console.log('============================================================');
  console.log('CURRENT DEMAND VALUES IN DATABASE');
  console.log('Content Creation Session');
  console.log('============================================================\n');

  // Get seeds with their analysis via join
  const { data: seeds, error: seedError } = await supabase
    .from('seeds')
    .select('id, phrase, generation_method')
    .eq('session_id', SESSION_ID)
    .order('phrase');

  if (seedError) {
    console.error('Seed Error:', seedError);
    return;
  }

  console.log(`📊 Total phrases: ${seeds.length}\n`);

  // Get analysis in batches
  const batchSize = 100;
  const analyses = [];
  const seedIds = seeds.map(s => s.id);
  
  for (let i = 0; i < seedIds.length; i += batchSize) {
    const batch = seedIds.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('seed_analysis')
      .select('seed_id, demand, popularity')
      .in('seed_id', batch);
    
    if (error) {
      console.error(`Batch ${i/batchSize + 1} error:`, error);
      continue;
    }
    analyses.push(...(data || []));
  }

  console.log(`📊 Total with analysis: ${analyses.length}\n`);

  // Create lookup
  const analysisMap = new Map();
  analyses.forEach(a => analysisMap.set(a.seed_id, a));

  // Combine
  const combined = seeds.map(seed => ({
    ...seed,
    analysis: analysisMap.get(seed.id)
  }));

  // Separate by type
  const bySeedMethod = {};
  for (const item of combined) {
    const method = item.generation_method || 'unknown';
    if (!bySeedMethod[method]) bySeedMethod[method] = [];
    bySeedMethod[method].push(item);
  }

  console.log('📋 Sample of current DEM values by type:\n');

  for (const [method, items] of Object.entries(bySeedMethod)) {
    console.log(`\n--- ${method.toUpperCase()} (${items.length} phrases) ---`);
    
    const sample = items.slice(0, 5);
    for (const item of sample) {
      const demand = item.analysis?.demand ?? 'NULL';
      const pop = item.analysis?.popularity ?? '-';
      console.log(`  DEM: ${String(demand).padStart(4)} | POP: ${String(pop).padStart(3)} | ${item.phrase}`);
    }
  }

  // Count scores
  const withDemand = combined.filter(s => s.analysis?.demand != null);
  const withPop = combined.filter(s => s.analysis?.popularity != null);
  
  console.log('\n============================================================');
  console.log('📊 SUMMARY');
  console.log('============================================================');
  console.log(`Total phrases: ${seeds.length}`);
  console.log(`With demand score: ${withDemand.length}`);
  console.log(`With popularity score: ${withPop.length}`);
  
  if (withDemand.length === 0) {
    console.log('\n⚠️  NO DEMAND SCORES IN DATABASE');
    console.log('The DEM column on the website is showing either:');
    console.log('  - popularity scores (old system)');
    console.log('  - NULL values');
    console.log('\n👉 NEXT STEP: Run the Gemini scoring to populate ALL 582 phrases with new demand scores');
    return;
  }
  
  // Distribution
  const distribution = { extreme: 0, high: 0, moderate: 0, low: 0, veryLow: 0 };

  for (const item of withDemand) {
    const score = item.analysis.demand;
    if (score >= 85) distribution.extreme++;
    else if (score >= 65) distribution.high++;
    else if (score >= 40) distribution.moderate++;
    else if (score >= 20) distribution.low++;
    else distribution.veryLow++;
  }

  console.log('\n📊 Current Demand Score Distribution:');
  console.log(`   🔥 Extreme (85-99): ${distribution.extreme} (${Math.round(distribution.extreme/withDemand.length*100)}%)`);
  console.log(`   ⚡ High (65-84):    ${distribution.high} (${Math.round(distribution.high/withDemand.length*100)}%)`);
  console.log(`   💡 Moderate (40-64): ${distribution.moderate} (${Math.round(distribution.moderate/withDemand.length*100)}%)`);
  console.log(`   ❄️  Low (20-39):     ${distribution.low} (${Math.round(distribution.low/withDemand.length*100)}%)`);
  console.log(`   ⛔ Very Low (0-19): ${distribution.veryLow} (${Math.round(distribution.veryLow/withDemand.length*100)}%)`);

  // Top 10
  const sorted = withDemand.sort((a, b) => b.analysis.demand - a.analysis.demand);

  console.log('\n🏆 Top 10 Current DEM Scores:');
  for (let i = 0; i < 10 && i < sorted.length; i++) {
    const item = sorted[i];
    console.log(`   ${i+1}. ${item.analysis.demand} | ${item.phrase}`);
  }

  // Lowest 5
  console.log('\n📉 Lowest 5 Current DEM Scores:');
  for (let i = 0; i < 5 && i < sorted.length; i++) {
    const item = sorted[sorted.length - 1 - i];
    console.log(`   ${sorted.length - i}. ${item.analysis.demand} | ${item.phrase}`);
  }
}

checkCurrentDemand().catch(console.error);
