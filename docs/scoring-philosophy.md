# Scoring Philosophy: Understanding the Metrics

## The Big Picture

SuperTopics helps YouTube creators find topics that **connect with viewers**. We measure three dimensions:

| Metric | Question It Answers | Data Source |
|--------|---------------------|-------------|
| **Demand** | How many viewers want this? | Autocomplete position & frequency |
| **Competition** | How hard is it to get discovered? | Autocomplete result analysis + anchor rarity |
| **Topic Strength** | How specific is this topic? | GPT analysis of descriptiveness |
| **Audience Fit** | Does this match their channel? | GPT comparison to channel context |

---

## Viewer Landscape Modal: Signal & SuperTopic Logic

### Signal Thresholds (Strict Mode)

The modal uses **strict signal assessment** that requires sufficient data before giving a confident "Go":

| Suggestions | Minimum for "Go" | Rationale |
|-------------|------------------|-----------|
| 0-5 | Cannot be "Go" | Insufficient data for confidence |
| 6-9 | Can be "Go" if score ≥70 | Moderate confidence |
| 10+ | Full confidence | Strong data signal |

**With < 6 suggestions:** Even if the score looks good, we show "Caution" because we don't have enough data to be confident.

### SuperTopic Designation

**SuperTopic = Score ≥85 AND 10+ suggestions AND NOT parent-informed**

A phrase can only become a SuperTopic when:
1. It scores 85 or higher
2. It has 10+ autocomplete suggestions (rich data)
3. It's scoring on its own merits (not inherited from parent)

**Parent-informed phrases cap at "Go"** - they cannot become SuperTopics because they don't have sufficient direct data.

### Display Mode by Word Count

| Words | Mode | What Shows |
|-------|------|------------|
| 2 | Discovery | Simple signal, match stats, vibes |
| 3+ | Opportunity | Full breakdown with Demand/Competition cards, score bar |

### Data Quality Assessment

| Suggestions | Quality | Scoring Method |
|-------------|---------|----------------|
| 12+ | Excellent | Scores on own merits (100% weight) |
| 9-11 | Good | Scores on own merits (85% weight) |
| 5-8 | Moderate | Scores on own merits (70% weight) |
| ≤4 | Sparse | Needs parent context or shows "Limited Data" |

### Parent-Informed Scoring (Drill-Down)

When a user drills down from a parent phrase to a child with sparse data:

1. **Demand** is inherited from the parent
2. **Position bonus** rewards being higher in autocomplete (#1 = +17, #5 = +5)
3. **Competition bonus** rewards being in a larger sibling pool (1 of 14 = +10)
4. **Final score** = (parent × 0.85) + position bonus + competition bonus
5. **Signal caps at "Go"** - cannot become SuperTopic

This reflects reality: if "YouTube topics" scores 80, and "YouTube topics that get the most views" appears as #3 of 14 suggestions, the child has proven demand through its parent.

---

## Critical Context: Search Is Just the Signal

### What We Have Access To
- YouTube autocomplete data (search suggestions)
- Position ordering (Volume proxy)
- Anchor patterns (Demand signals)

### What We're Really Trying to Understand
- What viewers **want to watch**
- What will get discovered via **browse/suggested** (60-80% of views)
- What will **connect with a human being**

### The Interpretation Gap

Search data is our **proxy** for viewer interest, not the goal itself:

```
Search autocomplete → reveals what's on viewers' minds
What's on viewers' minds → what they'll click on
What they'll click on → what YouTube recommends
What YouTube recommends → views from browse/suggested
```

**Key insight:** We're not building an SEO tool. We're using SEO data to understand human interest.

---

## The Three Core Metrics

### 1. Demand (POP Score)

**What it measures:** Raw viewer interest level

**Signals used:**
- Top 9 autocomplete position (position 1 = highest demand)
- Anchor frequency in Top 9 (repeated anchors = strong demand)
- Session-wide bigram/word frequency
- Source type (seed/top10 = high baseline)

**What it does NOT measure:**
- Competition
- Difficulty to rank
- Video quality required

**Display:** 0-100 score, higher = more demand

---

### 2. Competition (COMP Score) - Future

**What it measures:** How hard it is to get discovered

**Signals used:**
- Autocomplete result count (more = more competition)
- Topic match density (semantic variations)
- Anchor rarity (rare = less crowded)
- Phrase length/specificity

**Key insight:** Enter your phrase into autocomplete:
- 9 results → high competition
- 1-2 results → low competition
- 0 results → no demand

**Display:** 0-100 score, higher = MORE competition (harder)

---

### 3. Topic Strength (TS Score)

**What it measures:** How specific and descriptive the phrase is

**Already implemented** via GPT analysis:
- Vague phrases (2-word generics) → low score
- Specific phrases (clear topic) → high score

**Example:**
- "YouTube tips" → 30 (generic)
- "how to increase watch time on YouTube shorts" → 85 (specific)

---

### 4. Audience Fit (AF Score)

**What it measures:** How well phrase matches creator's channel

**Already implemented** via GPT analysis comparing:
- Phrase topic
- Channel description/focus
- Content style

---

## How Metrics Combine

### The Opportunity Formula

```
Opportunity = Demand × (100 - Competition) / 100
```

| Demand | Competition | Opportunity | Interpretation |
|--------|-------------|-------------|----------------|
| 90 | 90 | 9 | Hot topic, but saturated |
| 70 | 30 | 49 | Sweet spot! |
| 50 | 10 | 45 | Niche goldmine |
| 30 | 5 | 28 | Too small to matter |

### The Sweet Spot

Ideal phrases have:
- **Demand:** 50-80 (enough viewers to matter)
- **Competition:** 20-50 (room to compete)
- **Topic Strength:** 60+ (specific enough)
- **Audience Fit:** 70+ (matches channel)

---

## Page 3 (Refine) Display

### Current Column Layout

| Column | Metric | Source |
|--------|--------|--------|
| Phrase | The topic phrase | Data intake |
| Source | Where it came from | Intake categorization |
| Short | Word count category | Calculated |
| POP | Demand score | Demand algorithm |
| TS | Topic Strength | GPT scoring |
| AF | Audience Fit | GPT scoring |

### Future Addition

| Column | Metric | Source |
|--------|--------|--------|
| COMP | Competition score | Autocomplete analysis |
| OPP | Opportunity score | Demand × (100-Competition) |

---

## The User Experience Flow

### What Users See

1. **Seed at top** - Their chosen topic (high demand by definition)
2. **Top 10 below** - YouTube's suggestions (demand-ranked)
3. **Children next** - Derived phrases (still strong signals)
4. **A-Z patterns** - Completions (moderate signals)
5. **Prefix patterns** - Alternatives (discovery opportunities)

### What Users Learn

- Which phrases have the most viewer interest
- Which phrases they can realistically compete for
- Which phrases match their channel
- Where the opportunity gaps are

---

## Why This Approach Works

### We Use What We Can Access

YouTube doesn't give us:
- Actual search volume numbers
- Browse/suggested algorithm details
- Viewer behavior data

YouTube DOES give us:
- Autocomplete suggestions (ranked by volume)
- Position ordering (relative demand)
- Phrase variations (semantic patterns)

### We Interpret Thoughtfully

Autocomplete position 1 doesn't mean "rank for this." It means:
- "Many viewers are interested in this"
- "Creating content here could connect"
- "This topic is on people's minds"

### We Combine Multiple Signals

No single metric tells the whole story:
- High demand + high competition = saturated
- High demand + low competition = opportunity
- Low demand + any competition = not worth it

---

## The Long-Tail Sweet Spot Problem

### Current Algorithm Issue (December 2025)

The Viewer Landscape signal currently misinterprets long-tail phrases.

**Example: "How to introduce yourself on YouTube"**
- Exact match: 1 of 14 (7%)
- Topic match: 14 of 14 (100%)
- Current signal: "Caution - Some interest exists" ❌

**Reality:**
- Easy #1 ranking in search
- 8-10K views in first weeks
- 30K views in 10 months (still growing)
- **This was a HOME RUN, not a "caution"**

### Why the Algorithm Is Wrong

Current logic:
```
if (exactMatchRatio < 50%) → Caution or Stop
```

This punishes long-tail phrases that are actually IDEAL because:
- **Low exact match** = Few videos use this EXACT phrase = LOW COMPETITION
- **High topic match** = Many people search variations = HIGH SEMANTIC DEMAND
- **Combined** = OPPORTUNITY (not caution)

### The Correct Interpretation

| Exact Match | Topic Match | True Signal | Why |
|-------------|-------------|-------------|-----|
| High + High | 10+ matches | Competitive | Everyone's fighting for this |
| Low + High | 10+ matches | **SWEET SPOT** | Demand without saturation |
| High + Low | < 5 matches | Niche | Works if audience is there |
| Low + Low | < 5 matches | True Caution | Legitimately low demand |

### Proposed New Logic

```typescript
function getSignal(exact: number, topic: number, total: number) {
  const exactRatio = exact / total;
  const topicRatio = topic / total;
  
  // Sweet spot: Low exact + High topic = OPPORTUNITY
  if (exactRatio < 0.3 && topicRatio > 0.7) {
    return {
      signal: "Go",
      label: "Long-Term Opportunity",
      message: "High topic interest with low phrase competition. Great for evergreen content that ranks."
    };
  }
  
  // Standard high demand
  if (exactRatio > 0.6 && topicRatio > 0.7) {
    return {
      signal: "Go", 
      label: "High Demand",
      message: "Strong exact match demand. Competitive but worth pursuing."
    };
  }
  
  // True low demand
  if (topicRatio < 0.5) {
    return {
      signal: "Caution",
      label: "Limited Interest", 
      message: "Few related searches. Consider a broader angle."
    };
  }
  
  // ... etc
}
```

### Session Size as Demand Multiplier

Beyond per-phrase analysis, **session size indicates overall niche demand**:

| Session Size | Interpretation | Demand Multiplier |
|--------------|----------------|-------------------|
| < 200 phrases | Narrow niche | 0.8x |
| 200-300 phrases | Moderate demand | 1.0x |
| 300-400 phrases | Strong demand | 1.2x |
| 400-460 phrases | High demand | 1.4x |
| 460+ phrases | Extreme demand | 1.5x |

A phrase with moderate individual metrics in a 400+ phrase session should score higher than the same phrase in a 150 phrase session.

### The YouTube Reality

This scoring matters because YouTube discovery works in layers:

1. **Search (20-40% of views)** - Low exact match = easy ranking
2. **Browse/Suggested (60-80%)** - High topic match = algorithmic relevance
3. **Long-term (months/years)** - Evergreen phrases compound over time

A phrase like "how to introduce yourself on YouTube" performs across ALL layers:
- Easy search ranking (low competition)
- Algorithmic relevance (high topic match)
- Evergreen (people always search this)

**The current "Caution" label actively discourages the best opportunities.**

---

## Batch Autocomplete Scoring (December 2025 Research)

### Discovery: Batch Queries Are Cost-Effective

We can score 75 phrases for **$0.005** (half a penny) by batching:

| Approach | Cost for 75 phrases |
|----------|---------------------|
| Individual calls | $0.075 |
| Batched (15-25 per call) | $0.005 |
| **Savings** | **93%** |

**Implementation:** Apify actor accepts `{ queries: ["phrase1", "phrase2", ...] }` and returns flat array.

---

### The Three Signals Explained

When we query autocomplete for a phrase, we get up to 14 suggestions. We analyze:

| Signal | What It Measures | How We Calculate |
|--------|------------------|------------------|
| **Suggestions** | Raw demand for this topic | Count of autocomplete results (0-14) |
| **Exact Match %** | Competition for this phrase | % that START with our phrase |
| **Topic Match %** | Semantic demand for topic | % that CONTAIN our key words |

#### Signal 1: Suggestions (0-14)

YouTube returns up to 14 autocomplete suggestions. More = more search activity.

| Count | Interpretation |
|-------|----------------|
| 14 | Maximum demand - topic is hot |
| 10-13 | Strong demand |
| 5-9 | Moderate demand |
| 1-4 | Low demand |
| 0 | No demand (phrase too obscure) |

#### Signal 2: Exact Match %

How many suggestions START WITH your exact phrase?

```
Query: "AI Thumbnail"
Suggestion: "AI Thumbnail maker free" → ✅ Exact match (starts with "AI Thumbnail")
Suggestion: "how to make AI Thumbnail" → ❌ Not exact (doesn't start with it)
```

| Exact Match % | Interpretation |
|---------------|----------------|
| 80-100% | Extremely competitive - everyone targets this |
| 50-80% | Competitive |
| 20-50% | Moderate competition |
| < 20% | Low competition - opportunity zone |

#### Signal 3: Topic Match %

How many suggestions CONTAIN your key words (in any order)?

```
Query: "AI Thumbnail"
Keywords extracted: ["ai", "thumbnail"]

Suggestion: "best AI Thumbnail generator" → ✅ Topic match (contains both)
Suggestion: "AI video editor" → ❌ Not topic (missing "thumbnail")
```

| Topic Match % | Interpretation |
|---------------|----------------|
| 80-100% | Topic has strong unified demand |
| 50-80% | Topic has good demand with variations |
| 20-50% | Scattered demand - topic is fragmented |
| < 20% | No semantic coherence |

---

### The Sweet Spot Pattern

**Sweet Spot = High Suggestions + Low Exact + High Topic**

This combination means:
- ✅ People ARE searching for this topic (high suggestions)
- ✅ But NOT with these exact words (low exact = low competition)
- ✅ Yet the topic itself is in demand (high topic = semantic demand)

**Translation: Demand exists, but competition for THIS EXACT PHRASE is low.**

---

### Real-World Validation: "How to introduce yourself on YouTube"

From actual autocomplete query:
- **Suggestions**: 14 (maximum possible)
- **Exact Match**: 1 of 14 (7%)
- **Topic Match**: 14 of 14 (100%)

| Signal | Value | Grade |
|--------|-------|-------|
| Suggestions | 14 | 🟢 Maximum demand |
| Exact Match | 7% | 🟢 Almost no competition |
| Topic Match | 100% | 🟢 All about same topic |

**Actual results from this phrase:**
- Ranked #1 in search within days
- 8-10K views in first weeks
- 30K views in 10 months (still growing)
- **This was a HOME RUN**

Yet the current algorithm shows "Caution" because it only sees the 7% exact match.

---

### Batch Test Results (AI Thumbnail Session)

Tested 34 phrases from a real session. Patterns discovered:

#### By Word Count

| Words | Avg Suggestions | Avg Exact % | Avg Topic % |
|-------|-----------------|-------------|-------------|
| 2 | 14.0 | 100% | 100% |
| 3 | 10.2 | 35% | 74% |
| 4 | 6.2 | 20% | 35% |
| 5 | 5.4 | 23% | 38% |
| 6+ | 4.8 | 25% | 34% |

**Key insight:** Short phrases (2 words) max out on suggestions but also max out on competition. The sweet spot is 3-4 words.

#### Top Sweet Spots Identified

| Phrase | Sugg | Exact | Topic | Why It's Hot |
|--------|------|-------|-------|--------------|
| AI Thumbnail Kaise Banaen | 14 | 21% | 71% | Max suggestions, low exact, high topic (Hindi market) |
| AI Thumbnail Mrbeast | 10 | 10% | 80% | High demand, very low exact (niche angle) |
| AI Thumbnail Design | 9 | 22% | 67% | Strong demand, low exact (design-focused) |
| AI Thumbnail Roblox | 5 | 20% | 100% | ALL suggestions are Roblox thumbnails (tight niche) |

---

### Proposed Scoring Algorithm

#### Step 1: Calculate Raw Scores

```javascript
// Demand: How much interest exists (adjusted for word count)
const wordLengthMultiplier = {
  2: 1.0,   // Short phrases expected to have max suggestions
  3: 1.2,   // 3 words getting 10 = impressive
  4: 1.5,   // 4 words getting 6 = strong signal
  5: 1.8,   // 5+ words with suggestions = very strong
  6: 2.0
};

const demand = (suggestions / 14) * 100 * wordLengthMultiplier[wordCount];

// Competition: Based on exact match %
const competition = exactMatchPct;

// Opportunity: Topic interest with low phrase competition
const opportunity = (topicMatchPct * demand) / Math.max(competition, 10);
```

#### Step 2: Determine Signal

```javascript
function getSignal(suggestions, exactPct, topicPct) {
  // Sweet Spot: High topic, low exact = opportunity
  if (suggestions >= 10 && exactPct <= 30 && topicPct >= 60) {
    return {
      signal: "Go",
      color: "green",
      label: "Excellent Opportunity",
      message: "High demand, low phrase competition. Great for ranking."
    };
  }
  
  // Good Opportunity
  if (suggestions >= 5 && exactPct <= 40 && topicPct >= 50) {
    return {
      signal: "Go",
      color: "green", 
      label: "Good Opportunity",
      message: "Solid demand with room to compete."
    };
  }
  
  // High Competition
  if (suggestions >= 10 && exactPct > 60) {
    return {
      signal: "Caution",
      color: "yellow",
      label: "Competitive",
      message: "High demand but many creators target this exact phrase."
    };
  }
  
  // Low Demand
  if (suggestions < 5 && topicPct < 50) {
    return {
      signal: "Caution",
      color: "yellow",
      label: "Limited Interest",
      message: "Few people search for this. Consider a broader angle."
    };
  }
  
  // Very Low Demand
  if (suggestions < 3) {
    return {
      signal: "Stop",
      color: "red",
      label: "No Demand",
      message: "This phrase is too obscure. Not worth pursuing."
    };
  }
  
  // Default: Moderate
  return {
    signal: "Caution",
    color: "yellow",
    label: "Check Competition",
    message: "Moderate signals. Check YouTube manually to assess."
  };
}
```

---

### Implementation Plan

#### Phase 1: Quick Phrase Checker (Module)
- User enters up to 50 phrases
- Batch query (2-3 API calls = $0.003)
- Show Demand/Competition/Opportunity for each

#### Phase 2: Score Demand Button (Refine Page)
- Add button: "Score Demand ($0.01)" for sessions ≤ 100 phrases
- Batches all phrases (5-7 API calls)
- Updates Demand column with real autocomplete scores

#### Phase 3: Inline Scoring (Viewer Landscape Modal)
- Already queries autocomplete for seed
- Apply new signal logic
- Show corrected Go/Caution/Stop based on sweet spot detection

---

## Summary

SuperTopics scoring philosophy:

1. **Demand** = What viewers want (autocomplete signals)
2. **Competition** = How crowded the space is (autocomplete depth)
3. **Topic Strength** = How specific the topic is (GPT)
4. **Audience Fit** = How well it matches the channel (GPT)

The goal: Find topics where demand meets opportunity, filtered by channel fit.

We're not just finding keywords to rank for. We're finding **topics that connect with humans** - topics that will perform across search, browse, AND suggested.

---

## Key Insight: The Long-Tail Opportunity

The most valuable insight from this research:

> **Low Exact Match + High Topic Match = OPPORTUNITY, not caution**

When a phrase has few exact matches but high topic relevance, it means:
- The TOPIC is in demand
- But THIS PHRASE isn't saturated
- You can rank easily AND tap into related searches

This is why "How to introduce yourself on YouTube" works so well:
- Topic demand is maximum (14 suggestions, 100% topic match)
- Phrase competition is minimal (7% exact match)
- Result: #1 ranking, 30K views, still growing

**The algorithm should reward this pattern, not penalize it.**
