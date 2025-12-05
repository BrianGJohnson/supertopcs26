/**
 * Run the clean break migration using direct PostgreSQL connection
 * 
 * Usage: node scripts/run-migration.mjs
 */

import pg from 'pg';
import { config } from 'dotenv';

const { Client } = pg;

// Load environment variables
config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Running clean break migration...\n');
  console.log('📦 Connecting to database...');
  
  const client = new Client({
    connectionString: databaseUrl,
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Execute each ALTER TABLE statement
    const migrations = [
      // SEED_ANALYSIS - Drop legacy columns
      "ALTER TABLE seed_analysis DROP COLUMN IF EXISTS popularity",
      "ALTER TABLE seed_analysis DROP COLUMN IF EXISTS popularity_base", 
      "ALTER TABLE seed_analysis DROP COLUMN IF EXISTS popularity_reason",
      "ALTER TABLE seed_analysis DROP COLUMN IF EXISTS competition",
      "ALTER TABLE seed_analysis DROP COLUMN IF EXISTS competition_reason",
      // SEED_ANALYSIS - Add opportunity
      "ALTER TABLE seed_analysis ADD COLUMN IF NOT EXISTS opportunity INTEGER",
      
      // SUPER_TOPICS - Drop legacy columns
      "ALTER TABLE super_topics DROP COLUMN IF EXISTS popularity",
      "ALTER TABLE super_topics DROP COLUMN IF EXISTS popularity_base",
      "ALTER TABLE super_topics DROP COLUMN IF EXISTS competition",
      // SUPER_TOPICS - Add opportunity  
      "ALTER TABLE super_topics ADD COLUMN IF NOT EXISTS opportunity INTEGER",
    ];
    
    for (const sql of migrations) {
      const shortSql = sql.substring(0, 70);
      try {
        await client.query(sql);
        console.log(`✅ ${shortSql}...`);
      } catch (err) {
        console.log(`⚠️  ${shortSql}...`);
        console.log(`   Error: ${err.message}`);
      }
    }
    
    // Verify seed_analysis columns
    console.log('\n🔍 Verifying seed_analysis columns...');
    const seedResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'seed_analysis' 
      ORDER BY ordinal_position
    `);
    const seedCols = seedResult.rows.map(r => r.column_name);
    console.log('   Columns:', seedCols.join(', '));
    
    // Check for legacy columns
    const legacyCols = ['popularity', 'popularity_base', 'popularity_reason', 'competition', 'competition_reason'];
    const remainingLegacy = legacyCols.filter(c => seedCols.includes(c));
    
    if (remainingLegacy.length > 0) {
      console.log(`\n⚠️  Warning: Legacy columns still exist: ${remainingLegacy.join(', ')}`);
    } else {
      console.log('\n✅ All legacy columns removed from seed_analysis!');
    }
    
    // Check for new columns
    const hasOpportunity = seedCols.includes('opportunity');
    const hasDemand = seedCols.includes('demand');
    
    console.log(`   demand: ${hasDemand ? '✅' : '❌'}`);
    console.log(`   opportunity: ${hasOpportunity ? '✅' : '❌'}`);
    
    // Verify super_topics columns
    console.log('\n🔍 Verifying super_topics columns...');
    const superResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'super_topics' 
      ORDER BY ordinal_position
    `);
    const superCols = superResult.rows.map(r => r.column_name);
    console.log('   Columns:', superCols.join(', '));
    
    console.log('\n✨ Migration complete!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
