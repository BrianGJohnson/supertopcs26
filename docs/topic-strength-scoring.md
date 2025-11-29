# Topic Strength Scoring System

## Overview

Topic Strength is the **first scoring round** in the Refine phase (Page 2). It evaluates how specific, descriptive, and search-worthy each keyword phrase is using GPT-5 Mini.

**Purpose**: Help users identify weak/generic phrases to DELETE, keeping only strong topic opportunities.

**Key Principle**: Scores are **session-relative only**. A score of 75 in one session cannot be compared to 75 in another session. Each session is scored independently.

---

## Bell Curve Distribution Target

The scoring system aims for a **left-skewed distribution** where most phrases score in the moderate-to-low range. This makes it easier to identify truly exceptional phrases.

| Score Range | Target % | Description |
|-------------|----------|-------------|
| 90-98 | 8-9% | Exceptional - highly specific, emotional, analytical |
| 80-89 | 15-23% | Strong - good specificity and intent signals |
| 60-79 | 30-39% | Moderate - decent clarity, some generic elements |
| 40-59 | 20-25% | Below Average - lacks specificity or depth |
| 20-39 | 10-15% | Weak - generic, vague, or poorly formed |
| 0-19 | 3-5% | Very Weak - extremely generic or nonsensical |

**Key Goals:**
- **Never 99 or 100** - Maximum score is 98
- **Significant low scores** - Want to see scores in the 50s, 40s, 30s, and 20s
- **Help users DELETE** - The purpose is to identify weak phrases to remove
- **Session-relative** - Scores cannot be compared across sessions

**Note**: Scores should NEVER reach 99 or 100. Maximum is 98.

---

## GPT-5 Mini API Configuration (LOCKED)

These settings are **locked** and should not be modified without extensive testing.

```typescript
const MODEL_CONFIG = {
  model: "gpt-5-mini",
  temperature: 1,
  top_p: 1,
  max_completion_tokens: 1500,
  reasoning_effort: "minimal",
  response_format: { type: "json_object" }
};
```

### Why These Settings?
- **temperature: 1** - Full creativity for nuanced scoring
- **reasoning_effort: minimal** - Faster response, fewer tokens
- **response_format: json_object** - Ensures parseable JSON array output

---

## Batching Configuration (LOCKED)

```typescript
const BATCH_CONFIG = {
  minBatchSize: 25,
  maxBatchSize: 40,
  defaultBatchSize: 40,
  interBatchDelayMs: 150
};
```

### Example: 377 Phrases
- Batch size: 40
- Total batches: 10 (9 full + 1 partial of 17)
- Estimated time: 50-80 seconds

---

## System Prompt

```text
You are a precise evaluator of how specific and descriptive each keyword phrase is as a topic.
Your task is to score each phrase from 0–98 and return exactly N integers in a bare JSON array (no text, comments, or keys).

───────────────────────────────
SCORING PHILOSOPHY
───────────────────────────────
Your goal is to create a LEFT-SKEWED distribution where most phrases score in the moderate-to-low range.
This helps users identify which phrases to DELETE.

Target Distribution:
• 8-9% score 90-98 (exceptional)
• 15-23% score 80-89 (strong)
• 30-39% score 60-79 (moderate)
• 20-25% score 40-59 (below average)
• 10-15% score 20-39 (weak)
• 3-5% score 0-19 (very weak)

───────────────────────────────
BASE SCORING CRITERIA
───────────────────────────────
Judge how descriptive, detailed, and information-rich each phrase is:
- How much does it reveal about what the viewer is interested in?
- Does it specify who, what, when, where, why, or how?
- Does it show viewer curiosity or problem-solving intent?

HIGH SCORES (80-98):
• Contains concrete details, analytical depth, or strong intent cues
• Explores insight, discovery, or cause/effect
• Natural question structures (who, what, when, where, why, how)
• Emotional triggers: frustration, curiosity, fear, desire
• Analytical language: what, why, how, reason, cause, impact, discover, reveal

MODERATE SCORES (60-79):
• Some specificity but missing depth
• Decent clarity but generic elements
• Common topic without unique angle

LOW SCORES (20-59):
• Vague or overly broad topics
• Missing actionable context
• Generic phrases anyone might search

VERY LOW SCORES (0-19):
• Extremely generic single words or short phrases
• Nonsensical or malformed
• No clear topic intent

───────────────────────────────
PENALTIES
───────────────────────────────
Apply these score reductions:
• Unnatural word order → -5 to -10
• Redundant/repeated words → -5 to -8
• 2+ connectors (and, with, plus, in, for, using) → -6
• Phrase length > 9 words → additional -4
• Both connector AND length penalties → -10 total (cap)

───────────────────────────────
GUIDELINES
───────────────────────────────
• NEVER output 99 or 100
• Maximum score is 98
• Be harsh on generic phrases - they should score 40-60, not 70+
• Reserve 90+ for truly exceptional, specific, analytical phrases
• Always output a bare JSON array: [90, 45, 72, 38, ...]

───────────────────────────────
EXAMPLES
───────────────────────────────
• "Halloween costume" → 45 (generic)
• "Halloween candy-cane witch costume" → 85 (specific)
• "Why garden soil loses nutrients over time" → 92 (analytical, specific)
• "Fix broken sprinkler system in spring" → 78 (problem-solving but common)
• "youtube" → 12 (too generic)
• "content creation" → 38 (broad category)
• "content creation tips for beginners 2025" → 76 (decent specificity)
• "why my youtube videos get no views" → 88 (emotional, analytical, specific)

Example output for 5 phrases: [45, 85, 92, 78, 12]
```

---

## User Prompt Format

```typescript
const userPrompt = `COUNT: There are ${batch.length} phrases.

${batch.map((phrase, i) => `${i + 1}) ${phrase}`).join('\n\n')}`;
```

### Example User Prompt
```
COUNT: There are 5 phrases.

1) content creation tips for beginners

2) youtube algorithm explained 2025

3) how to grow a youtube channel

4) video editing software

5) why videos fail to get views
```

---

## Response Format

### Expected Response
```json
[76, 82, 68, 42, 88]
```

### Parsing Logic
```typescript
function parseTopicScoreResponse(content: string, batchSize: number) {
  const scores = JSON.parse(content);
  
  if (!Array.isArray(scores)) {
    throw new Error('Response is not an array');
  }
  
  if (scores.length !== batchSize) {
    throw new Error(`Expected ${batchSize} scores, got ${scores.length}`);
  }
  
  // Validate each score
  for (const score of scores) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error(`Invalid score: ${score}`);
    }
  }
  
  return scores;
}
```

---

## Database Schema

### Seeds Table - Topic Score Field

```sql
ALTER TABLE seeds ADD COLUMN topic_score INTEGER;
```

The `topic_score` field stores the 0-100 integer score from GPT-5 Mini.

### Upsert Logic
```typescript
await supabase
  .from('seeds')
  .update({ topic_score: score })
  .eq('id', seedId);
```

---

## API Endpoint

### POST /api/sessions/[sessionId]/score-topic

**Request**: No body required (sessionId in URL)

**Response**:
```json
{
  "success": true,
  "totalScored": 377,
  "batchCount": 10,
  "duration": 65000,
  "distribution": {
    "90-98": 32,
    "80-89": 68,
    "60-79": 128,
    "40-59": 94,
    "20-39": 45,
    "0-19": 10
  }
}
```

---

## Error Handling

### Retry Strategy
1. **Attempt 1**: Standard request with JSON mode
2. **Attempt 2**: Retry same parameters
3. **Attempt 3**: Remove JSON mode, parse manually
4. **Attempt 4**: Split batch in half, process separately

### Empty Response Handling
If GPT returns empty content, retry without `response_format` constraint.

---

## Rate Limiting

### Daily Quota
- Standard users: 200 GPT calls/day
- Admin users: 10,000 GPT calls/day
- Warning at 80% usage

### Quota Logging
Each successful batch is logged for quota tracking.

---

## UI Integration

### Trigger
"Run Analysis" dropdown → "1. Topic Strength" (only option initially illuminated)

### Loading State
Show progress: "Scoring batch 3 of 10..."

### Completion
- Refresh table with scores
- Show distribution summary toast
- Enable sorting by Topic column

---

## Files

| File | Purpose |
|------|---------|
| `/src/lib/topic-scoring.ts` | GPT integration, batching, parsing |
| `/src/app/api/sessions/[sessionId]/score-topic/route.ts` | API endpoint |
| `/src/app/members/build/refine/_components/ActionToolbar.tsx` | UI trigger |
| `/docs/topic-strength-scoring.md` | This documentation |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-29 | Initial implementation |
