# Page 4 Implementation Plan

> **Checklist** for building the Super Topics "Watch Page" Engine.

---

## Phase 1: Knowledge & Prompts (The Brain)

### 1. System Prompt Construction
*   [ ] Create `src/lib/prompts/super-topic-batch.ts`.
*   [ ] Embed **8 Video Formats** definitions.
*   [ ] Embed **Sub-Types** for each format.
*   [ ] Embed **Performance Bucket** definitions.
*   [ ] Embed **Viewer Intent** rules (Vent vs Learn).
*   [ ] **CRITICAL**: Read `docs/gpt5-mini-communication-guide.md` for tone.

### 2. The Batch Prompt Logic
*   [ ] Design prompt to accept 15 phrases.
*   [ ] Instruction: "Rank these 15. Return full JSON for Top 4 only."
*   [ ] Instruction: "For Thumbnail Text, give me 1-4 word punchy phrases. No 5+ words."
*   [ ] Output Format: JSON Schema matching `1-2-data-schema-super-topics.md`.

---

## Phase 2: Database & API

### 1. Schema
*   [ ] Run migration: `ALTER TABLE builder_sessions ADD COLUMN super_topic_batch_json JSONB;`

### 2. Server Action (The Gap Handler)
*   [ ] Create `actions/generate-super-topic.ts`.
*   [ ] Connect to GPT-5-mini.
*   [ ] Implement specific logic to handle the "15 -> 4" expansion.
*   [ ] **Cost Check**: Verify total input/output tokens stay under $0.08 per run.

---

## Phase 3: UI Development (The Watch Page)

### 1. Layout Components
*   [ ] `HeroSection`: The Gold "Video Player" mock (40/60 Split).
*   [ ] `CandidateCard`: Unified card for Silver/Blue tiers with Split Buttons (`[Inspect] | [Swap]`).
*   [ ] `CandidateGrid`: Grid container for Runners-up & Contenders (3-col).
*   [ ] `InspectionDrawer`: Slide-over detailed report panel.

### 2. Visual Assets
*   [ ] Create/Find icons for the 8 Formats (Wizard, Scale, Book, Beaker, Megaphone, Hug, Flame, Sparkle).
*   [ ] Design the "Thumbnail Text" overlay style (Bold, Impact font).

### 3. State Management
*   [ ] Handle "Promote to Hero" (Swap data between Winner and Runner-up state).
*   [ ] Handle "Is Trending?" toggle (Refreshes analysis with Velocity bias).

---

## Phase 4: Validation

*   [ ] **Test**: Does "YouTube Algorithm" return "Vent/Validate" goal?
*   [ ] **Test**: Does "How to bake" return "Tutorial / Learn" goal?
*   [ ] **Test**: Are thumbnail phrases consistently < 5 words?
*   [ ] **Test**: Cost audit on 10 runs.

---

*Last Updated: December 7, 2025*
