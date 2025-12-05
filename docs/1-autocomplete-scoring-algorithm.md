# YouTube Autocomplete Scoring Algorithm

## The SuperTopics Demand & Opportunity Framework

**Version:** 2.1  
**Last Updated:** January 2025

---

## Executive Summary

This document describes the scoring algorithm used by SuperTopics to evaluate YouTube search phrases. The system uses YouTube's autocomplete API (via Apify) as its primary data source and calculates two core metrics:

1. **Demand Score (0-99):** How much do people want this topic?
2. **Opportunity Score (0-100):** How likely are you to rank and get views?

The algorithm is built on a key insight: **YouTube's autocomplete is a real-time window into viewer intent.** Every suggestion represents actual searches, making it the most accurate demand signal available.

---

## Part 1: The Data Source

### Why YouTube Autocomplete?

YouTube's autocomplete API returns up to **14 suggestions** for any search query. These suggestions are:

- **Real-time:** Updated constantly based on actual searches
- **Intent-based:** Represents what people are actively looking for
- **Ranked:** Ordered by relevance/popularity

### Data Collection via Apify

We use an Apify actor to collect autocomplete data at scale (~$0.013 per 75 phrases).

| Data Point | Source | Purpose |
|------------|--------|---------|
| Suggestion count | Number of autocomplete results (0-14) | Demand signal |
| Exact match count | How many suggestions start with the phrase | Search volume proof |
| Topic match count | How many suggestions contain key words | Related interest |

---

## Part 2: The Demand Score (0-99)

### Philosophy

**Demand = How much do people want this topic?**

We measure demand using three signals from autocomplete data.

### The Formula

```
Raw Score = Suggestion Points (0-40) + Topic Match Points (0-30) + Exact Match Points (0-30)
Final Score = min(99, Raw Score × Session Size Multiplier)
```

**Cap at 99:** No phrase should hit exactly 100.

### Database Storage

| Column | Type | Description |
|--------|------|-------------|
| `demand` | integer | Final demand score (0-99) |
| `demand_base` | integer | Raw score before multiplier |

### Suggestion Count → Points Mapping (Max 40)

| Suggestions | Points |
|-------------|--------|
| 14 | 40 |
| 13 | 37 |
| 12 | 34 |
| 11 | 31 |
| 10 | 29 |
| 9 | 26 |
| 8 | 23 |
| 7 | 20 |
| 6 | 17 |
| 5 | 14 |
| 4 | 11 |
| 3 | 9 |
| 2 | 6 |
| 1 | 3 |
| 0 | 0 |

See [1-demand-scoring.md](/docs/1-demand-scoring.md) for full point tables.

### Demand Score Example

```
Phrase: "How to start a YouTube channel"
Suggestions: 14 → 40 points
Topic Matches: 12 → 26 points
Exact Matches: 10 → 21 points
Raw Score: 87
Session Size: 400 phrases → 1.02x
Final Score: min(99, 87 × 1.02) = 89 🔥
```

### Demand Designations

| Score | Designation | Icon | Meaning |
|-------|-------------|------|---------|
| 85-99 | Extreme Demand | 🔥 | Exceptional - top tier demand |
| 65-84 | High Demand | ⚡ | Strong - worth pursuing |
| 40-64 | Moderate Demand | 💡 | Decent - evaluate carefully |
| 0-39 | Low Demand | ❄️ | Sparse - may lack audience |

---

## Part 3: The Opportunity Score (0-100)

### Philosophy

**Opportunity = How likely are you to rank and get views?**

High demand alone isn't enough. A phrase with high demand but massive competition offers no opportunity. The Opportunity Score evaluates **ranking potential**.

### The Formula

```
Opportunity Score = Demand Base + Depth + Sweet Spot + Position + Relevancy + Long-Term
```

Each component contributes points:

| Component | Max Points | What It Measures |
|-----------|------------|------------------|
| Demand Base | 30 | Baseline opportunity from demand |
| Depth Boost | 38 | How deep you've drilled (long-tail = easier) |
| Sweet Spot | 25 | Low competition + high demand pattern |
| Position Power | 18 | Where you appeared in parent's list |
| Relevancy Boost | 18 | Ranking ladder potential |
| Long-Term Views | 14 | Evergreen topic indicators |

**Maximum theoretical score:** 143 (capped at 100)

---

## Part 4: Opportunity Components Explained

### Component 0: Demand Base (0-30 points)

**Purpose:** Give every phrase a baseline opportunity credit based on demand.

Even Level 1 phrases deserve opportunity credit. A phrase with 14 suggestions has baseline opportunity simply because demand exists.

| Suggestions | Points | Meaning |
|-------------|--------|---------|
| 12+ | 30 | Maximum baseline |
| 10-11 | 25 | Very high baseline |
| 7-9 | 18 | Good baseline |
| 5-6 | 12 | Moderate baseline |
| 3-4 | 5 | Low baseline |
| 0-2 | 0 | No baseline |

---

### Component 1: Depth Boost (0-40 points)

**Purpose:** Reward long-tail phrases that are easier to rank for.

**Core Insight:** The deeper you can drill while maintaining suggestions, the easier the phrase is to rank for. Long-tail = less competition.

#### Standard Depth Scoring

| Level | Points | Meaning |
|-------|--------|--------|
| Level 1 | 0-10 | See Level 1 Specificity below |
| Level 2 | 22 | Good depth |
| Level 3 | 30 | Great depth - easier to rank |
| Level 4+ | 35 | Maximum depth - very easy to rank |

**Sustained Demand Bonus:** +3 if parent had 10+ suggestions

#### Level 1 Specificity Boost

Some phrases arrive already specific and actionable. They don't need drilling.

**Example:** "How to introduce yourself on YouTube"
- 6 words (already long)
- Starts with "how to" (actionable)
- 11 suggestions (high demand)
- **This IS the opportunity - no drilling needed**

| Criteria | Points |
|----------|--------|
| 6+ words + strong evergreen pattern + 10+ suggestions | 10 |
| 5+ words + strong evergreen pattern + 8+ suggestions | 6 |

**Strong evergreen patterns:** `how to`, `what is`, `why`, `tutorial`, `beginner`

**Note:** These values are intentionally modest to avoid overlap with Long-Term Views boost.

#### Why Deeper = Better

```
Level 1: "YouTube video editing" (hardest to rank)
    ↓
Level 2: "YouTube video editing tips" (easier)
    ↓
Level 3: "YouTube video editing tips and tricks" (even easier)
    ↓
Level 4: "YouTube video editing tips and tricks for beginners" (easiest)
```

Each level adds specificity and reduces competition.

---

### Component 2: Sweet Spot Boost (0-25 points)

**Purpose:** Identify the "hidden opportunity" pattern.

**The Sweet Spot Pattern:**
- **Low exact match:** Few videos use these exact words
- **High topic match:** Everyone wants the same thing
- **Translation:** Demand exists, but competitors haven't found it

| Exact Match | Topic Match | Points | Meaning |
|-------------|-------------|--------|---------|
| ≤20% | ≥80% | 25 | Perfect Sweet Spot 🎯 |
| ≤30% | ≥60% | 20 | Great Sweet Spot |
| ≤40% | ≥50% | 12 | Good pattern |
| ≤50% | ≥40% | 5 | Slight pattern |

#### Example: Perfect Sweet Spot

**"How to introduce yourself on YouTube"**
- Exact match: 7% (almost no one uses these exact words)
- Topic match: 100% (all suggestions are about introductions)
- **Result:** 25 point Sweet Spot boost

This phrase has maximum demand with minimal competition. That's the Sweet Spot.

---

### Component 3: Position Power (0-18 points)

**Purpose:** Reward phrases that YouTube considers most relevant.

**What is "Position"?**

When you drill into a phrase, you click one of the suggestions. That suggestion appeared at a specific position (1st, 2nd, 3rd, etc.).

**Position 1 = YouTube thinks this is THE most relevant expansion.**

This signal is powered by:
- What people actually search for
- What gets clicks
- What leads to satisfying results

| Position | Base Points | With 10+ Siblings |
|----------|-------------|-------------------|
| #1 | 15 | +3 bonus |
| #2 | 12 | +3 bonus |
| #3-4 | 8 | - |
| #5-7 | 4 | - |
| #8+ | 0 | - |

**10+ Siblings Bonus:** If the parent had 10+ suggestions, being #1 or #2 is extra meaningful - you beat out strong competition.

#### Example

You drilled into "YouTube video editing" and clicked "YouTube video editing course" which was listed **first**.
- Position = 1 → 15 points
- Parent had 14 suggestions → +3 bonus
- **Total Position Power = 18 points**

---

### Component 4: Relevancy Boost (0-18 points)

**Purpose:** Identify "ranking ladder" potential.

**The Ranking Ladder Concept:**

When your phrase **contains** the parent phrase, ranking for the specific child often helps you rank for the broader parent.

```
"YouTube video editing course free" (easiest to rank)
        ↓ helps you rank for
"YouTube video editing course" 
        ↓ helps you rank for
"YouTube video editing" (hardest to rank)
```

| Relationship | Points |
|--------------|--------|
| Child starts with parent phrase exactly | 15 |
| Strong word overlap (not exact start) | 10 |
| Also matches grandparent (full ladder) | +3 |

#### Example: Full Ranking Ladder

- Grandparent: "YouTube video editing"
- Parent: "YouTube video editing course"
- Child: "YouTube video editing course free"

The child starts with parent exactly (+15) AND matches grandparent (+3) = **18 points**

**Why this matters:** Ranking for "YouTube video editing course free" creates a ladder up to "YouTube video editing" over time.

---

### Component 5: Long-Term Views Boost (0-14 points)

**Purpose:** Identify evergreen topics that compound over time.

Some topics drive views for years, not days. We detect these using **evergreen patterns**. The scoring is word-count based to avoid double-counting demand (which is already rewarded in the Demand Base component).

#### Evergreen Prefixes (Question Openers)

These indicate educational, how-to, or foundational content:

```
how, how to, how do, how does, how can, how should
what, what is, what are, what does, what do, what should
why, why is, why are, why does, why do, why should
when, when to, when should, when do, when does
where, where to, where can, where do
which, which is, which are
who, who is, who are, who can
can you, can i, should i, should you
is it, are there, do i, do you
learn, learn to, learn how
guide to, guide for, introduction to
ways to, steps to, ideas for
best, best way, best ways, top
improve, fix, solve
```

#### Evergreen Suffixes (Topic Indicators)

These can appear anywhere in the phrase:

```
Instructional:
  tutorial, tutorials, guide, guides, course, courses
  class, classes, lesson, lessons, training
  walkthrough, demonstration, demo

Skill Level:
  beginner, beginners, for beginners
  basics, basic, fundamentals, essentials
  advanced, intermediate, masterclass

Improvement:
  tips, tricks, tips and tricks
  hacks, secrets, techniques
  strategies, tactics, methods

Process:
  step by step, step-by-step, complete guide
  full guide, ultimate guide, explained
  introduction, intro, overview

Review/Comparison:
  review, reviews, comparison, vs

Problem Solving:
  fixed, solved, solution, solutions
  troubleshoot, troubleshooting

Learning:
  learn, learning, teach, teaching
  practice, exercises, examples
```

#### Scoring (Word-Count Based)

| Word Count | Points | Reasoning |
|------------|--------|----------|
| 6+ words | 14 | Full base for long specific phrases |
| 5 words | 13 | Good length |
| 4 words | 12 | Moderate base for shorter phrases |

**Note:** The scoring is intentionally simple and word-count based to prevent over-stacking. Demand is already rewarded in the Demand Base component, so Long-Term focuses purely on the evergreen pattern indicator value.

**Maximum: 14 points**

#### Why Evergreen Matters

| Topic Type | Lifespan | Example |
|------------|----------|---------|
| Evergreen | Years | "How to introduce yourself on YouTube" |
| News/Trending | Days/Weeks | "YouTube algorithm update December 2025" |

A video titled "How to introduce yourself on YouTube" will get views as long as people start YouTube channels. That's forever.

---

## Part 5: Complete Scoring Examples

### Example 1: Level 1 Evergreen Phrase

**Phrase:** "How To Introduce Yourself On YouTube"  
**Suggestions:** 14  
**Exact Match:** 7%  
**Topic Match:** 100%  
**Level:** 1 (no parent)

| Component | Points | Calculation |
|-----------|--------|-------------|
| Demand Base | 30 | 14 suggestions |
| Depth Boost | 10 | 6 words + "how to" + 10+ suggestions |
| Sweet Spot | 25 | 7% exact + 100% topic = perfect |
| Position | 0 | No parent |
| Relevancy | 0 | No parent |
| Long-Term | 14 | Evergreen prefix + 6 words |
| **Total** | **79** | Strong opportunity |

**Demand Score:** 50 × 2 = 100 (Extreme Demand 🔥)

### Example 2: Level 3 Long-Tail Phrase

**Phrase:** "YouTube Video Editing Tips And Tricks"  
**Suggestions:** 4  
**Exact Match:** 25%  
**Topic Match:** 100%  
**Level:** 3  
**Parent:** "YouTube video editing tips" (9 suggestions)  
**Position in parent:** #3

| Component | Points | Calculation |
|-----------|--------|-------------|
| Demand Base | 5 | 4 suggestions |
| Depth Boost | 33 | Level 3 (30) + parent had 10+ suggestions (+3) |
| Sweet Spot | 20 | 25% exact + 100% topic |
| Position | 8 | Position #3 |
| Relevancy | 18 | Full ladder to grandparent |
| Long-Term | 14 | Contains "tips" + 6 words |
| **Total** | **98** | Excellent opportunity |

**Demand Score:** 32 + 12 = 44 (Moderate Demand 💡)

### Example 3: High Demand, Low Opportunity

**Phrase:** "YouTube"  
**Suggestions:** 14  
**Exact Match:** 100%  
**Topic Match:** 100%  
**Level:** 1 (seed)

| Component | Points | Calculation |
|-----------|--------|-------------|
| Demand Base | 30 | 14 suggestions |
| Depth Boost | 0 | 1 word, not specific |
| Sweet Spot | 0 | 100% exact match (no advantage) |
| Position | 0 | No parent |
| Relevancy | 0 | No parent |
| Long-Term | 0 | No evergreen patterns |
| **Total** | **30** | Low opportunity |

**Demand Score:** 50 × 2 = 100 (Extreme Demand 🔥)

**Insight:** Maximum demand but minimal opportunity. Too broad, too competitive.

---

## Part 6: The Breadcrumb Path

### Tracking the Drill-Down Journey

As users drill through phrases, we track the full path:

```typescript
interface DrillDownContext {
  phrase: string;              // Current phrase
  position: number;            // Position in parent's list (1-14)
  parentScore: number;         // Parent's opportunity score
  parentPhrase: string;        // Parent phrase text
  siblingCount: number;        // How many siblings at this level
  parentSuggestionCount: number; // Parent's suggestion count
  level: number;               // Depth level (1, 2, 3, 4+)
  originalSeed: string;        // The starting seed phrase
  fullPath: string[];          // Complete path from seed to here
  parentDemandScore: number;   // Parent's demand score
}
```

### Example Path

```
Original Seed: "YouTube video editing"
      ↓
Level 1: "YouTube video editing course" (position #2)
      ↓
Level 2: "YouTube video editing course free" (position #1)
      ↓
Level 3: "YouTube video editing course free download" (position #3)
```

**Full Path:** 
```
["YouTube video editing", "YouTube video editing course", 
 "YouTube video editing course free", 
 "YouTube video editing course free download"]
```

This context enables:
- Accurate depth scoring
- Relevancy ladder detection
- Sustained demand tracking
- Position power calculation

---

## Part 7: Pattern Badges

The UI displays badges when patterns are detected:

### Sweet Spot Badge 🎯

Shown when:
- Exact match ≤ 30%
- Topic match ≥ 60%
- Suggestions ≥ 5

**Meaning:** Hidden opportunity - demand exists but competitors haven't found it.

### Long-Term Views Badge 📈

Shown when:
- Has evergreen prefix OR suffix
- Suggestions ≥ 8 OR has sustained demand

**Meaning:** Evergreen topic - will drive views for years.

### SuperTopic Badge 🏆

Shown when:
- Demand Score ≥ 92
- Suggestions ≥ 10
- Not parent-informed

**Meaning:** Exceptional opportunity - all signals align.

---

## Part 8: Opportunity Designations

| Score | Designation | Meaning |
|-------|-------------|---------|
| 85-100 | Excellent | Strong ranking potential - prioritize |
| 70-84 | Strong | Good opportunity - worth pursuing |
| 50-69 | Moderate | Evaluate carefully - may need more drilling |
| 30-49 | Limited | Challenging - high competition likely |
| 0-29 | Minimal | Very difficult - avoid unless niche |

---

## Part 9: Algorithm Philosophy

### 1. Demand ≠ Opportunity

High demand alone is meaningless without ranking potential. "YouTube" has maximum demand but zero opportunity for a new creator.

### 2. Deeper = Easier

Long-tail phrases have less competition. The algorithm rewards drilling.

### 3. Sweet Spots Are Golden

Low exact match + high topic match = the algorithm found something competitors missed.

### 4. Position Matters

YouTube's autocomplete ranking IS a relevance signal. Position #1 means something.

### 5. Evergreen Compounds

A video that ranks for "How to introduce yourself on YouTube" will get views forever. That's more valuable than a trending topic that dies in a week.

### 6. Context Is Everything

A phrase's opportunity depends on:
- Where it came from (parent)
- How deep we are (level)
- What it builds on (relevancy)
- Where it appeared (position)

Scoring without context is incomplete.

---

## Part 10: Technical Implementation

### Core Functions

```typescript
// Calculate demand from suggestion counts
function calculateDemandScore(
  suggestionCount: number, 
  parentSuggestionCount: number | null
): number

// Calculate opportunity from all signals
function calculateOpportunityScore(
  phrase: string,
  suggestionCount: number,
  exactMatchPercent: number,
  topicMatchPercent: number,
  context: DrillDownContext | null
): { score: number; breakdown: OpportunityBreakdown }

// Pattern detection
function isSweetSpotPattern(exact: number, topic: number, count: number): boolean
function isLongTermViewsPattern(phrase: string, count: number, context: DrillDownContext | null): boolean
```

### Data Flow

```
YouTube Autocomplete API
        ↓
  Suggestion Count (0-14)
  Exact Match %
  Topic Match %
        ↓
  calculateDemandScore()
  calculateOpportunityScore()
        ↓
  Pattern Detection
  Badge Assignment
        ↓
  UI Display
```

---

## Appendix A: Evergreen Keywords Reference

### Prefixes (30+)

| Category | Keywords |
|----------|----------|
| How | how, how to, how do, how does, how can, how should |
| What | what, what is, what are, what does, what do, what should |
| Why | why, why is, why are, why does, why do, why should |
| When | when, when to, when should, when do, when does |
| Where | where, where to, where can, where do |
| Which | which, which is, which are |
| Who | who, who is, who are, who can |
| Intent | can you, can i, should i, should you, is it, are there, do i, do you |
| Learning | learn, learn to, learn how |
| Guides | guide to, guide for, introduction to |
| Lists | ways to, steps to, ideas for |
| Comparison | best, best way, best ways, top |
| Action | improve, fix, solve |

### Suffixes (35+)

| Category | Keywords |
|----------|----------|
| Instructional | tutorial, tutorials, guide, guides, course, courses, class, classes, lesson, lessons, training, walkthrough, demonstration, demo |
| Skill Level | beginner, beginners, for beginners, basics, basic, fundamentals, essentials, advanced, intermediate, masterclass |
| Improvement | tips, tricks, tips and tricks, hacks, secrets, techniques, strategies, tactics, methods |
| Process | step by step, step-by-step, complete guide, full guide, ultimate guide, explained, introduction, intro, overview |
| Review | review, reviews, comparison, vs |
| Problem Solving | fixed, solved, solution, solutions, troubleshoot, troubleshooting |
| Learning | learn, learning, teach, teaching, practice, exercises, examples |

---

## Appendix B: Scoring Cheat Sheet

### Quick Reference

| What You Want | What To Look For |
|---------------|------------------|
| High Demand | 10+ suggestions, demand score 70+ |
| High Opportunity | Sweet spot pattern, depth level 2+, evergreen keywords |
| SuperTopic | Demand 92+, suggestions 10+, opportunity 80+ |
| Easy to Rank | Level 3-4, position #1-2, relevancy ladder |
| Long-Term Views | "how to", "tutorial", "beginner", "tips" keywords |

### Red Flags

| Signal | Meaning |
|--------|---------|
| 100% exact match | Too competitive - everyone uses these words |
| 0-2 suggestions | No demand - audience doesn't exist |
| Level 1 + no evergreen | Need to drill deeper |
| Low topic match | Fragmented intent - not a cohesive topic |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Dec 4, 2025 | Complete algorithm documentation, expanded evergreen patterns (50+), Level 1 specificity boost, "how to" bonus |
| 1.0 | Nov 2025 | Initial demand scoring implementation |

---

*This document describes the SuperTopics scoring algorithm as of December 2025. The algorithm may be refined based on real-world performance data.*
