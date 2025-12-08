# Page 4 Implementation Plan: Super Topics

> **Checklist** for building the Super Topics page with GPT-5 mini integration.

---

## ✅ Phase 1: Knowledge & Taxonomy (Complete)

- [x] Define 7 primary format buckets with 38 sub-formats
- [x] Define 8 emotions for Format Feeling
- [x] Define 4 mindsets
- [x] Define 14 algorithm targets with primary metrics
- [x] Create GPT-5 mini prompt structure (`1-6-gpt-mini-super-topics.md`)
- [x] Create taxonomy reference (`1-7-video-format-taxonomy.md`)
- [x] Define 17 output fields per phrase
- [x] Establish readability rules (8th grade reading, 6th-7th vocabulary)

---

## 🔲 Phase 2: UI Development (In Progress)

### Current State
- [x] Basic top tile layout (thumbnail + info panel)
- [x] Pills row (format + algorithm targets)
- [x] Scores row (emotion, intent, clickability)
- [x] Action buttons (Lock, Report, YouTube)

### Remaining UI Work
- [ ] Add 3 text sections with mini-headings:
  - [ ] Section 1: "Viewer Goal" (2-3 sentences)
  - [ ] Section 2: "Why This Could Work" (2-3 sentences)
  - [ ] Section 3: "Algorithm Angle" (2-3 sentences)
- [ ] Improve spacing and padding throughout
- [ ] Format pill styling (distinguish from algorithm targets)
- [ ] Mobile responsiveness

---

## 🔲 Phase 3: Database Schema

### New Fields to Store (per phrase)
```sql
-- Scores
growth_fit_score INTEGER,
clickability_score INTEGER,
intent_score INTEGER,

-- Video Format
primary_bucket TEXT,
sub_format TEXT,
alternate_formats TEXT[],

-- Emotional Format
primary_emotion TEXT,
secondary_emotion TEXT,
mindset TEXT,

-- Algorithm Targets
algorithm_targets TEXT[],

-- Core Content
viewer_goal TEXT,
viewer_angle TEXT,
porch_talk TEXT,
hook TEXT,

-- Text Sections
viewer_goal_description TEXT,
why_this_could_work TEXT,
algorithm_angle_description TEXT
```

- [ ] Design table structure (extend `builder_sessions` or new `super_topic_candidates` table?)
- [ ] Run migration
- [ ] Create TypeScript types matching schema

---

## 🔲 Phase 4: API & GPT Integration

### Server Action
- [ ] Create `actions/generate-super-topic.ts`
- [ ] Build prompt from onboarding data + phrase
- [ ] Connect to GPT-5 mini with `reasoning_effort: "medium"`
- [ ] Parse JSON response
- [ ] Store in database
- [ ] Handle errors gracefully

### Testing
- [ ] Test with different reasoning levels (minimal, low, medium, high)
- [ ] Measure latency for each
- [ ] Cost audit (target: under $0.05 for 13 phrases)

---

## 🔲 Phase 5: Integration & Polish

- [ ] Wire UI to real data (replace mock data)
- [ ] Loading states while GPT generates
- [ ] Error handling in UI
- [ ] Lock/save functionality
- [ ] Report generation

---

## Recommended Order

1. **UI Text Sections** — Add the 3 sections with mock data
2. **Database Schema** — Design and migrate
3. **API Integration** — Connect GPT-5 mini
4. **Wire It Up** — Replace mock data with real
5. **Polish** — Loading states, errors, mobile

---

*Last Updated: December 8, 2025*
