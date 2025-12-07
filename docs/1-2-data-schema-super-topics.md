# Page 4 Data Schema: Super Topic

> **Source of Truth** for the JSON payload.

---

## 1. The Parallel Payload (Per Phrase)
Each of the 13 calls returns this structure.

```typescript
interface SuperTopicAnalysis {
  phrase: string;
  
  // 1. Strategic Context
  strategy: {
    porch_pitch: string;
    angle: string; // One sentence concept
    why_it_wins: string; // Reasoning
  };

  // 2. Classification
  classification: {
    format: string; // "The Tutorial"
    sub_type: string; // "Quick Fix"
    bucket: string; // "Evergreen Asset"
    intent: {
      goal: string; // "Learn/Solve"
      mindset: string; // "Active"
    };
  };

  // 3. Scores (For Growth Score calc)
  scores: {
    suitability: number; // 0-10
    effort: number; // 0-10 (Lower = Easier)
    ctr_potential: number; // 0-10
  };
  
  // 4. Emotional Profile
  emotion: {
    primary: string;
    secondary: string;
  };
}
```

---

## 2. Database Schema

```sql
-- New Table for individual Super Topics
CREATE TABLE super_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES builder_sessions(id),
  phrase TEXT NOT NULL,
  
  -- The Analysis Data
  analysis_json JSONB, 
  
  -- The Rank/Score
  growth_score INTEGER,
  rank_order INTEGER,
  
  -- User State
  is_winner BOOLEAN DEFAULT FALSE, -- The "Locked" Video
  
  -- Future Locks
  locked_title_angle TEXT,
  locked_thumb_concept JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

*Last Updated: December 7, 2025*
