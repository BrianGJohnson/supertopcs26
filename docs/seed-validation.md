# Seed Validation System

> **Purpose**: Help creators understand the demand landscape before committing to a seed phrase. We analyze YouTube autocomplete suggestions to reveal who wants this content and what they're looking for.

---

## Overview

Seed Validation provides instant insight when a creator is choosing a topic to pursue. It appears in two places:

1. **Target Page** - When clicking a GPT-suggested phrase to start a session
2. **Seed Page** - When typing a custom 2-word seed phrase

Both paths lead to the same validation: we query YouTube autocomplete for the phrase and analyze what comes back.

---

## The Core Insight

YouTube autocomplete reveals **real viewer intent**. When someone types "youtube algorithm" and sees suggestions like:

- "youtube algorithm 2025"
- "youtube algorithm explained"
- "youtube algorithm sucks"
- "youtube algorithm broken"
- "youtube algorithm tips"

...these aren't random. They represent what REAL people are actively looking for. Our job is to help creators understand:

1. **Is there demand?** (How many suggestions? How signal-rich are they?)
2. **Is it focused?** (All about the same thing, or scattered?)
3. **Who are these viewers?** (Learners? Frustrated venters? Staying current?)
4. **Is there Long-Term Views potential?** (Evergreen topic with sustained interest?)

---

## Why This Matters

Most creators look at autocomplete and see "topics." We see **people**.

**Example: "youtube algorithm"**

A surface read says: "There's demand for YouTube algorithm content."

Our deeper read reveals:
- **43% are frustrated** (sucks, trash, broken) - Most creators fail on YouTube, this is a LARGE group
- **29% want to stay current** (2025, change, update) - Anxious about being left behind
- **21% want to learn** (explained, tutorial) - Actually trying to improve
- **7% want tactics** (tips, hacks) - Ready to take action

**Strategic Insight**: A drama/commentary channel would THRIVE here (huge frustrated audience). A teaching channel faces a narrower audience (only ~20% want to learn).

This is the difference between picking a topic and understanding your audience.

---

## Technical Implementation

### Signal Dictionary

We've built a comprehensive dictionary of **989 signal words + 6 regex patterns** that indicate viewer intent. These are words that appear in autocomplete suggestions when real humans are looking for content.

| Category | Word Count | Examples |
|----------|------------|----------|
| **Learning/Educational** | 157 | explained, tutorial, guide, beginner, 101, crash course, step by step |
| **Question Words** | 86 | how, why, what, when, does, should, can I |
| **Timely/Current** | 74 | 2025, update, change, new, latest, still working |
| **Emotional (Positive)** | 80 | best, amazing, love, game changer, goated, fire |
| **Emotional (Negative)** | 90 | sucks, trash, broken, hate, worst, ruined, dead |
| **Actionable** | 129 | tips, tricks, hacks, ideas, ways, strategy, steps |
| **Comparison** | 55 | vs, versus, better, which, compared, alternative |
| **Problem/Solution** | 126 | fix, solve, not working, error, help, mistake, avoid |
| **Specificity/Context** | 147 | for beginners, for youtube, on iphone, without, free |
| **Time/Duration** | 45 | in 5 minutes, quick, fast, hour, day |

**Total: 989 words + 6 regex patterns**

### Regex Patterns

Some signals are better caught with patterns:

1. **Years**: `/\b20[2-3]\d\b/` - Catches 2024, 2025, 2026, etc.
2. **Numbered lists**: `/\b\d+\s*(tips|tricks|ways|things)/i` - "5 tips", "10 ways"
3. **Duration**: `/\b\d+\s*(min|minute|hour)/i` - "5 minutes", "1 hour"
4. **Step numbers**: `/\b(step|part)\s*\d+/i` - "step 1", "part 2"
5. **Versions**: `/\b(v\d+|\d+\.\d+)/i` - "v2", "3.0"
6. **Questions**: `/\?$/` - Ends with question mark

### Scoring Algorithm (0-100)

The demand score considers:

1. **Signal Density** (30% weight)
   - How many topic signals per suggestion
   - High density = rich, intentful queries
   - Low density = generic or brand-polluted results

2. **Suggestion Count** (25% weight)
   - More suggestions = more demand
   - 10 suggestions = maximum signal

3. **Semantic Focus** (25% weight)
   - Do all suggestions relate to the same concept?
   - 100% focus = viewers know exactly what they want
   - Low focus = scattered, mixed intent

4. **Signal Variety** (20% weight)
   - Signals across multiple categories = broad interest
   - Single category = specific but narrow

### Score Tiers

| Score | Tier | Label | Meaning |
|-------|------|-------|---------|
| 80-100 | Exceptional | Exceptional Interest | Highly engaged viewers, multiple strong signals |
| 55-79 | Strong | Strong Interest | Clear viewer intent, topic resonates |
| 30-54 | Moderate | Moderate Interest | Solid interest, audience exists |
| 10-29 | Light | Light Interest | Some interest, may need specificity |
| 0-9 | Niche | Very Niche | Limited signals, could be untapped or too specialized |

---

## Intent Categories

Beyond the overall score, we categorize suggestions by **viewer intent**:

### 😤 Frustrated / Venting
**Signals**: sucks, trash, broken, hate, worst, ruined, dead, annoying, terrible
**Who they are**: Viewers experiencing pain, looking to vent or find solidarity
**Content fit**: Drama channels, commentary, "I tried X and it was terrible"

### 🔄 Staying Current
**Signals**: 2025, update, change, new, latest, still working, anymore
**Who they are**: Anxious about being left behind, want to stay informed
**Content fit**: News updates, "what changed", annual refreshes

### 📚 Learning
**Signals**: explained, tutorial, how to, guide, basics, beginner, 101
**Who they are**: Genuinely trying to understand and improve
**Content fit**: Educational content, courses, deep dives

### 💡 Taking Action
**Signals**: tips, tricks, hacks, ways, strategy, how to
**Who they are**: Ready to implement, want tactical advice
**Content fit**: Listicles, quick wins, actionable guides

### 🔍 Investigating
**Signals**: why, what happened, anomalies, weird, issue
**Who they are**: Trying to diagnose or understand a specific situation
**Content fit**: Analysis, case studies, troubleshooting

### ⚖️ Comparing
**Signals**: vs, versus, or, better, which, compared, alternative
**Who they are**: Evaluating options, ready to make a decision
**Content fit**: Comparison videos, reviews, recommendations

---

## Long-Term Views Potential

A seed has **Long-Term Views potential** when:

1. **High semantic focus** (80%+) - Viewers know exactly what they want
2. **Learning or action intent dominant** - Not just venting or trending
3. **Evergreen signals** - Not tied to a specific moment in time
4. **Strong overall score** (55+)

When these conditions are met, we show:
> "Long-Term Views — views day after day, month after month"

This indicates the topic could drive consistent views over time, not just a spike.

---

## UI Presentation Philosophy

### Just Enough, No More

We want to inform, not overwhelm. The user needs:
- A quick read on demand (score or tier)
- The key insight about WHO wants this
- Whether there's Long-Term Views potential

We don't need:
- Percentages for every category
- All 10 suggestions listed
- Technical breakdowns of signals

### Non-Scary Language

Per brand guidelines (Built for the Viewer):
- ❌ "Low competition" - We can't verify this
- ❌ "Search volume" - SEO speak
- ❌ "Ranking potential" - Algorithm gaming
- ✅ "Viewer interest" - What people want
- ✅ "Long-Term Views" - Sustained views over time
- ✅ "Focused interest" - Viewers know what they want

---

## Implementation Files

- `/src/lib/viewer-demand.ts` - Core scoring library with 989 signal words
- `/src/components/ui/SeedSignalIndicator.tsx` - UI component for display
- `/src/app/api/autocomplete/route.ts` - YouTube autocomplete API wrapper

---

## Example Outputs

### "how to introduce yourself on youtube"
```
Score: 100/100 (Exceptional)

• Exceptional viewer interest
• Focused interest — viewers know exactly what they want
• Long-Term Views — views day after day, month after month

Intent: Predominantly learning (📚) - viewers want to improve
```

### "youtube algorithm"
```
Score: 71/100 (Strong)

• Strong viewer interest
• Focused interest — viewers know exactly what they want

Intent: Mixed — 43% frustrated, 29% current, 21% learning
Insight: Most viewers are frustrated, not learning. Great for commentary.
```

### "legacy planning"
```
Score: 36/100 (Moderate)

• Moderate viewer interest
• Low signal density (mostly brand names, not viewer queries)

Intent: Limited learning signals
Insight: Consider more specific angle like "family legacy planning"
```

---

## Future Considerations

1. **Show top intent** - "Most viewers here are frustrated" vs "Most viewers want to learn"
2. **Strategic fit indicator** - Does this match the creator's channel style?
3. **Comparison mode** - Compare two seeds side by side
4. **Historical tracking** - Has demand for this seed grown/shrunk?

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-02 | 1.0 | Initial documentation - 989 signal words, 0-100 scoring, intent categories |

---

*This system embodies the "Built for the Viewer" philosophy. We're not helping creators game algorithms — we're helping them understand what real people actually want to watch.*
