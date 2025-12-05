/**
 * Test script for Gemini Demand Scoring API
 * 
 * This script tests the full integration by calling the API endpoint.
 * Run with: node scripts/test-gemini-api.mjs
 * 
 * Prerequisites:
 * - Development server running (npm run dev)
 * - Valid session with phrases in database
 */

const API_BASE = 'http://localhost:3000';

async function main() {
  console.log('='.repeat(60));
  console.log('GEMINI DEMAND SCORING - API Integration Test');
  console.log('='.repeat(60));
  
  // You'll need to replace this with an actual session ID from your database
  const testSessionId = process.argv[2];
  
  if (!testSessionId) {
    console.log('\n❌ Usage: node scripts/test-gemini-api.mjs <sessionId>');
    console.log('\nTo find a session ID, check your database or use:');
    console.log('  SELECT id FROM sessions LIMIT 1;');
    process.exit(1);
  }
  
  console.log(`\n📋 Testing session: ${testSessionId}`);
  
  try {
    // First, get some seed IDs from this session
    console.log('\n1️⃣ Fetching seed IDs from session...');
    
    // We'll use the Supabase REST API directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('   ⚠️  Supabase env vars not found. Using mock data for testing.');
      console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to test with real data.');
      
      // Show what the API expects
      console.log('\n📝 API Request Format:');
      console.log(`   POST ${API_BASE}/api/sessions/{sessionId}/score-demand-gemini`);
      console.log('   Body: { "seedIds": ["uuid1", "uuid2", ...] }');
      
      console.log('\n📝 Expected Response:');
      console.log(`   {
     "success": true,
     "totalScored": 50,
     "sessionSize": 400,
     "ecosystemScore": 24,
     "seedScore": 72,
     "distribution": {
       "extreme": 0,
       "high": 15,
       "moderate": 30,
       "low": 5,
       "veryLow": 0
     },
     "results": [...]
   }`);
      
      return;
    }
    
    // Fetch seeds from session
    const seedsResponse = await fetch(
      `${supabaseUrl}/rest/v1/seeds?session_id=eq.${testSessionId}&select=id,phrase,source&limit=75`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );
    
    if (!seedsResponse.ok) {
      throw new Error(`Failed to fetch seeds: ${seedsResponse.statusText}`);
    }
    
    const seeds = await seedsResponse.json();
    console.log(`   Found ${seeds.length} seeds`);
    
    if (seeds.length === 0) {
      console.log('   ❌ No seeds found in this session');
      process.exit(1);
    }
    
    // Show breakdown by source
    const bySource = {};
    for (const s of seeds) {
      bySource[s.source || 'unknown'] = (bySource[s.source || 'unknown'] || 0) + 1;
    }
    console.log('   Sources:', bySource);
    
    // Call the Gemini scoring API
    console.log('\n2️⃣ Calling Gemini scoring API...');
    
    const seedIds = seeds.map(s => s.id);
    
    const scoringResponse = await fetch(
      `${API_BASE}/api/sessions/${testSessionId}/score-demand-gemini`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ seedIds }),
      }
    );
    
    if (!scoringResponse.ok) {
      const errorText = await scoringResponse.text();
      throw new Error(`API error: ${scoringResponse.status} - ${errorText}`);
    }
    
    const result = await scoringResponse.json();
    
    console.log('\n✅ Scoring complete!');
    console.log('─'.repeat(40));
    console.log(`   Total scored: ${result.totalScored}`);
    console.log(`   API calls: ${result.totalApiCalls}`);
    console.log(`   Duration: ${result.durationMs}ms`);
    console.log(`   Est. cost: $${result.estimatedCostUsd.toFixed(4)}`);
    console.log('');
    console.log(`   Session size: ${result.sessionSize}`);
    console.log(`   Ecosystem score: ${result.ecosystemScore}`);
    console.log(`   Seed score: ${result.seedScore}`);
    console.log('');
    console.log('   Distribution:');
    console.log(`     🔥 Extreme (85-99): ${result.distribution.extreme}`);
    console.log(`     ⚡ High (65-84):    ${result.distribution.high}`);
    console.log(`     💡 Moderate (40-64): ${result.distribution.moderate}`);
    console.log(`     ❄️  Low (20-39):     ${result.distribution.low}`);
    console.log(`     ⛔ Very Low (0-19): ${result.distribution.veryLow}`);
    
    // Show some sample results
    console.log('\n📊 Sample results:');
    const samples = result.results.slice(0, 5);
    for (const r of samples) {
      const seed = seeds.find(s => s.id === r.seedId);
      console.log(`\n   "${seed?.phrase || r.seedId}"`);
      console.log(`     Score: ${r.score} | Eco: ${r.ecosystemScore} | Density: ${r.densityScore} | Rel: ${r.relevancyScore}`);
      if (r.parentPhrase) {
        console.log(`     Inherits from: "${r.parentPhrase}" (${r.matchStrength})`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
