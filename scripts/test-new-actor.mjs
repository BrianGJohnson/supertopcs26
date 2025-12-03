#!/usr/bin/env node
/**
 * Test script for the new Apify actor (forward_flight~my-actor)
 * 
 * This tests the batch API format with {queries: []}
 * 
 * Usage: node scripts/test-new-actor.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const ACTOR_ID = 'forward_flight~my-actor';
const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

if (!APIFY_TOKEN) {
  console.error('Missing APIFY_API_TOKEN in .env.local');
  process.exit(1);
}

async function testSingleQuery() {
  console.log('\n=== TEST 1: Single Query ===');
  const start = Date.now();
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: ['youtube algorithm'] }),
    }
  );
  
  const data = await response.json();
  const duration = Date.now() - start;
  
  console.log(`Time: ${(duration / 1000).toFixed(1)}s`);
  console.log(`Results: ${data.length}`);
  console.log('Sample:', data.slice(0, 3).map(r => r.suggestion).join(' | '));
  
  return data;
}

async function testBatchQueries() {
  console.log('\n=== TEST 2: Batch A-Z Queries ===');
  const seed = 'youtube algorithm';
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const queries = letters.map(l => `${seed} ${l}`);
  
  const start = Date.now();
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries, language: 'en', country: 'US' }),
    }
  );
  
  const data = await response.json();
  const duration = Date.now() - start;
  
  // Group by seed
  const grouped = {};
  for (const item of data) {
    if (!grouped[item.seed]) grouped[item.seed] = [];
    grouped[item.seed].push(item.suggestion);
  }
  
  console.log(`Time: ${(duration / 1000).toFixed(1)}s`);
  console.log(`Total results: ${data.length}`);
  console.log(`Unique seeds: ${Object.keys(grouped).length}`);
  console.log('Results per letter:', Object.values(grouped).map(arr => arr.length).join(', '));
  
  return data;
}

async function testChildExpansion() {
  console.log('\n=== TEST 3: Child Expansion ===');
  const parents = [
    'youtube algorithm',
    'youtube algorithm 2024',
    'youtube algorithm explained',
    'how to beat youtube algorithm',
    'youtube algorithm tips',
  ];
  
  const prefixes = ['how to', 'what is', 'best', 'why does', ''];
  const queries = [];
  for (const parent of parents) {
    for (const prefix of prefixes) {
      queries.push(prefix ? `${prefix} ${parent}` : parent);
    }
  }
  
  const start = Date.now();
  
  const response = await fetch(
    `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries }),
    }
  );
  
  const data = await response.json();
  const duration = Date.now() - start;
  
  console.log(`Time: ${(duration / 1000).toFixed(1)}s`);
  console.log(`Queries sent: ${queries.length}`);
  console.log(`Total results: ${data.length}`);
  
  return data;
}

async function main() {
  console.log('Testing new Apify actor: forward_flight~my-actor');
  console.log('=' .repeat(50));
  
  try {
    await testSingleQuery();
    await testBatchQueries();
    await testChildExpansion();
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
