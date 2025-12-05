import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SESSION_ID = 'ae1da68b-6604-49b4-bfc6-2d942fca5eb7';

// Stop words to exclude from anchor analysis
const STOP_WORDS = new Set([
  'how', 'to', 'the', 'a', 'an', 'in', 'on', 'for', 'is', 'are', 'and', 'or',
  'what', 'why', 'when', 'where', 'who', 'which', 'your', 'my', 'with', 'from',
  'at', 'by', 'about', 'into', 'of', 'do', 'does', 'did', 'be', 'been', 'being',
  'have', 'has', 'had', 'can', 'could', 'will', 'would', 'should', 'may', 'might',
  'i', 'you', 'we', 'they', 'he', 'she', 'it', 'me', 'us', 'them', 'this', 'that',
  'best', 'top', 'free', 'new', 'first', 'get', 'make', 'start', 'use', 'using'
]);

async function analyze() {
  console.log('='.repeat(70));
  console.log('OPPORTUNITY ANALYSIS - Content Creation Session');
  console.log('='.repeat(70));
  
  // Get all seeds (including hidden for context)
  const { data: seeds, error: e1 } = await supabase
    .from('seeds')
    .select('id, phrase, generation_method')
    .eq('session_id', SESSION_ID);
  
  if (e1 || !seeds) {
    console.error('Error fetching seeds:', e1);
    return;
  }
  
  const seedIds = seeds.map(s => s.id);
  
  // Batch fetch analyses
  let analyses = [];
  for (let i = 0; i < seedIds.length; i += 100) {
    const batch = seedIds.slice(i, i + 100);
    const { data } = await supabase
      .from('seed_analysis')
      .select('seed_id, demand, is_hidden, extra')
      .in('seed_id', batch);
    if (data) analyses.push(...data);
  }
  
  // Build lookup maps
  const phraseMap = new Map(seeds.map(s => [s.id, s.phrase]));
  const sourceMap = new Map(seeds.map(s => [s.id, s.generation_method || 'unknown']));
  const analysisMap = new Map(analyses.map(a => [a.seed_id, a]));
  
  // Get all phrases (including hidden for related phrase detection)
  const allPhrases = seeds.map(s => ({
    id: s.id,
    phrase: s.phrase.toLowerCase(),
    source: s.generation_method || 'unknown',
    analysis: analysisMap.get(s.id),
    demand: analysisMap.get(s.id)?.demand ?? null,
    isHidden: analysisMap.get(s.id)?.is_hidden ?? false
  }));
  
  // Get visible phrases with demand data
  const visible = allPhrases.filter(p => !p.isHidden && p.demand !== null);
  
  console.log(`\nTotal phrases: ${allPhrases.length}`);
  console.log(`Visible with demand: ${visible.length}`);
  
  // =========================================================================
  // ANCHOR ANALYSIS
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('1. HOT ANCHORS (words that appear in high-demand phrases)');
  console.log('='.repeat(70));
  
  const anchorStats = {};
  
  for (const p of allPhrases) {
    const words = p.phrase.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-z0-9]/g, '');
      if (cleaned.length < 2 || STOP_WORDS.has(cleaned)) continue;
      
      if (!anchorStats[cleaned]) {
        anchorStats[cleaned] = { count: 0, demands: [], sources: new Set() };
      }
      anchorStats[cleaned].count++;
      anchorStats[cleaned].sources.add(p.source);
      if (p.demand !== null) {
        anchorStats[cleaned].demands.push(p.demand);
      }
    }
  }
  
  // Calculate average demand per anchor
  const hotAnchors = Object.entries(anchorStats)
    .filter(([_, stats]) => stats.count >= 5 && stats.demands.length >= 3)
    .map(([word, stats]) => ({
      word,
      count: stats.count,
      avgDemand: Math.round(stats.demands.reduce((a, b) => a + b, 0) / stats.demands.length),
      maxDemand: Math.max(...stats.demands),
      sources: Array.from(stats.sources).join(',')
    }))
    .sort((a, b) => b.avgDemand - a.avgDemand)
    .slice(0, 20);
  
  console.log('\nWord       | Count | Avg Dem | Max Dem | Sources');
  console.log('-'.repeat(60));
  for (const a of hotAnchors) {
    console.log(
      `${a.word.padEnd(10)} | ${String(a.count).padStart(5)} | ${String(a.avgDemand).padStart(7)} | ${String(a.maxDemand).padStart(7)} | ${a.sources}`
    );
  }
  
  // =========================================================================
  // RELATED PHRASES ANALYSIS
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('2. RELATED PHRASES (shorter/longer variants)');
  console.log('='.repeat(70));
  
  // For each visible phrase, find related phrases
  const relatedAnalysis = [];
  
  for (const p of visible.slice(0, 30)) { // Limit for output
    const phrase = p.phrase;
    const words = phrase.split(/\s+/);
    
    // Find phrases that contain this phrase (longer variants)
    const longerVariants = allPhrases.filter(other => 
      other.phrase !== phrase && 
      other.phrase.includes(phrase)
    );
    
    // Find phrases that this phrase contains (shorter variants)
    const shorterVariants = allPhrases.filter(other =>
      other.phrase !== phrase &&
      phrase.includes(other.phrase) &&
      other.phrase.split(/\s+/).length >= 2
    );
    
    if (longerVariants.length > 0 || shorterVariants.length > 0) {
      relatedAnalysis.push({
        phrase: phraseMap.get(p.id),
        demand: p.demand,
        wordCount: words.length,
        longerCount: longerVariants.length,
        shorterCount: shorterVariants.length,
        shorterBestDemand: shorterVariants.length > 0 
          ? Math.max(...shorterVariants.filter(v => v.demand !== null).map(v => v.demand), 0)
          : null
      });
    }
  }
  
  console.log('\nPhrase (truncated)                    | Dem | Words | Longer | Shorter | Shorter Best');
  console.log('-'.repeat(90));
  for (const r of relatedAnalysis.slice(0, 20)) {
    const shortPhrase = r.phrase.length > 35 ? r.phrase.slice(0, 35) + '...' : r.phrase.padEnd(38);
    console.log(
      `${shortPhrase} | ${String(r.demand).padStart(3)} | ${String(r.wordCount).padStart(5)} | ${String(r.longerCount).padStart(6)} | ${String(r.shorterCount).padStart(7)} | ${r.shorterBestDemand !== null ? String(r.shorterBestDemand).padStart(12) : '           -'}`
    );
  }
  
  // =========================================================================
  // SOURCE TYPE ANALYSIS
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('3. SOURCE TYPE DISTRIBUTION');
  console.log('='.repeat(70));
  
  const sourceStats = {};
  for (const p of visible) {
    const src = p.source;
    if (!sourceStats[src]) sourceStats[src] = { count: 0, demands: [] };
    sourceStats[src].count++;
    sourceStats[src].demands.push(p.demand);
  }
  
  console.log('\nSource     | Count | Avg Dem | Min | Max');
  console.log('-'.repeat(50));
  for (const [src, stats] of Object.entries(sourceStats).sort((a, b) => b[1].count - a[1].count)) {
    const avg = Math.round(stats.demands.reduce((a, b) => a + b, 0) / stats.demands.length);
    const min = Math.min(...stats.demands);
    const max = Math.max(...stats.demands);
    console.log(`${src.padEnd(10)} | ${String(stats.count).padStart(5)} | ${String(avg).padStart(7)} | ${String(min).padStart(3)} | ${String(max).padStart(3)}`);
  }
  
  // =========================================================================
  // LOW COMP SIGNAL ANALYSIS
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('4. LOW COMP SIGNAL CANDIDATES');
  console.log('='.repeat(70));
  
  const lowCompCandidates = visible
    .filter(p => {
      const extra = p.analysis?.extra?.demand_v2;
      if (!extra) return false;
      const suggCount = extra.suggestionCount ?? 0;
      const exactCount = extra.exactMatchCount ?? 0;
      const topicCount = extra.topicMatchCount ?? 0;
      if (suggCount < 3) return false;
      const exactPct = (exactCount / suggCount) * 100;
      const topicPct = (topicCount / suggCount) * 100;
      // Low comp signal: low exact + high topic
      return exactPct <= 40 && topicPct >= 50;
    })
    .map(p => {
      const extra = p.analysis.extra.demand_v2;
      const suggCount = extra.suggestionCount;
      const exactCount = extra.exactMatchCount;
      const topicCount = extra.topicMatchCount;
      return {
        phrase: phraseMap.get(p.id),
        demand: p.demand,
        suggCount,
        exactPct: Math.round((exactCount / suggCount) * 100),
        topicPct: Math.round((topicCount / suggCount) * 100),
        source: p.source
      };
    })
    .sort((a, b) => b.demand - a.demand);
  
  console.log(`\nFound ${lowCompCandidates.length} phrases with Low Comp Signal\n`);
  console.log('Phrase (truncated)                    | Dem | Sugg | Exact% | Topic% | Source');
  console.log('-'.repeat(85));
  for (const c of lowCompCandidates.slice(0, 20)) {
    const shortPhrase = c.phrase.length > 35 ? c.phrase.slice(0, 35) + '...' : c.phrase.padEnd(38);
    console.log(
      `${shortPhrase} | ${String(c.demand).padStart(3)} | ${String(c.suggCount).padStart(4)} | ${String(c.exactPct).padStart(6)}% | ${String(c.topicPct).padStart(6)}% | ${c.source}`
    );
  }
  
  // =========================================================================
  // WORD COUNT ANALYSIS
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('5. WORD COUNT DISTRIBUTION');
  console.log('='.repeat(70));
  
  const wordCountStats = {};
  for (const p of visible) {
    const wc = p.phrase.split(/\s+/).length;
    if (!wordCountStats[wc]) wordCountStats[wc] = { count: 0, demands: [] };
    wordCountStats[wc].count++;
    wordCountStats[wc].demands.push(p.demand);
  }
  
  console.log('\nWords | Count | Avg Dem | Min | Max');
  console.log('-'.repeat(40));
  for (const wc of Object.keys(wordCountStats).sort((a, b) => a - b)) {
    const stats = wordCountStats[wc];
    const avg = Math.round(stats.demands.reduce((a, b) => a + b, 0) / stats.demands.length);
    const min = Math.min(...stats.demands);
    const max = Math.max(...stats.demands);
    console.log(`${String(wc).padStart(5)} | ${String(stats.count).padStart(5)} | ${String(avg).padStart(7)} | ${String(min).padStart(3)} | ${String(max).padStart(3)}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(70));
}

analyze().catch(console.error);
