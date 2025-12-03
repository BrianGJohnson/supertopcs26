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

## Summary

SuperTopics scoring philosophy:

1. **Demand** = What viewers want (autocomplete signals)
2. **Competition** = How crowded the space is (autocomplete depth)
3. **Topic Strength** = How specific the topic is (GPT)
4. **Audience Fit** = How well it matches the channel (GPT)

The goal: Find topics where demand meets opportunity, filtered by channel fit.

We're not just finding keywords to rank for. We're finding **topics that connect with humans** - topics that will perform across search, browse, AND suggested.
